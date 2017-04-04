// Imports
import { Express, Request, Response, Router } from "express";
import * as express from 'express';
import * as uuid from 'uuid';
import * as fs from 'graceful-fs';
import * as Handlebars from 'handlebars';
import * as co from 'co';

// Imports repositories
import { IRepository } from './repositories/repository';

// Imports services
import { Service } from './services/service';

export class OAuth2Middleware {

    router: Router;

    private service: Service;

    constructor(private validateCredentialsFn: Function, private repository: IRepository, private idExpiryMiliseconds, private codeExpiryMiliseconds, private accessTokenExpiryMiliseconds) {
        this.service = new Service(validateCredentialsFn, repository, idExpiryMiliseconds, codeExpiryMiliseconds, accessTokenExpiryMiliseconds);

        this.router = express.Router();

        this.router.get('/login', (req: Request, res: Response, next: Function) => { this.login(req, res, next); });
        this.router.post('/login', (req: Request, res: Response, next: Function) => { this.submitLogin(req, res, next); });
        this.router.get('/authorize', (req: Request, res: Response, next: Function) => { this.authorize(req, res, next); });
        this.router.get('/token', (req: Request, res: Response, next: Function) => { this.token(req, res, next); });
        this.router.get('/getuser', (req: Request, res: Response, next: Function) => { this.getUser(req, res, next); });
    }

    private login(req: Request, res: Response, next: Function) {

        let id = req.query.id;

        if (this.service.isEmptyOrSpace(id)) {
            res.status(400).send('Invalid parameters provided');
            return;
        }

        let self = this;

        co(function* () {
            let findAuthorizeInformationByIdResult = yield self.service.findAuthorizeInformationById(id);
            let findNameByClientIdResult = yield self.service.findNameByClientId(findAuthorizeInformationByIdResult.clientId);

            self.renderPage(res, 'login.html', {
                id: id,
                name: findNameByClientIdResult,
                message: null
            }, 200);
        }).catch((err: Error) => {
            res.status(400).send(err.message);
        });

    }

    private submitLogin(req: Request, res: Response, next: Function) {

        let username = req.body.username;
        let password = req.body.password;
        let id = req.query.id;

        let oauth2_session_id = uuid.v4();


        let self = this;
        let name = null;

        co(function* () {
            let findAuthorizeInformationByIdResult = yield self.service.findAuthorizeInformationById(id);
            let findNameByClientIdResult = yield self.service.findNameByClientId(findAuthorizeInformationByIdResult.clientId);
            let validateCredentialsResult = yield self.service.validateCredentials(findAuthorizeInformationByIdResult.clientId, username, password);

            name = findNameByClientIdResult.name;

            if (findNameByClientIdResult == null) {
                throw new Error('Invalid client id provided');
            }

            if (!validateCredentialsResult) {
                throw new Error('Invalid credentials provided');
            }

            let generateCodeResult = yield self.service.generateCode(id, findAuthorizeInformationByIdResult.clientId, username);

            if (generateCodeResult == null) {
                throw Error('Failed to generate code');
            }

            let saveSessionResult = yield self.service.saveSession(oauth2_session_id, username, findAuthorizeInformationByIdResult.clientId);

            if (!saveSessionResult) {
                throw new Error('Failed to save session');
            }

            res.cookie(`oauth2_session_id_${findAuthorizeInformationByIdResult.clientId}`, oauth2_session_id, { maxAge: 1800, });
            res.redirect(`${findAuthorizeInformationByIdResult.redirectUri}?token=${generateCodeResult}&state=${findAuthorizeInformationByIdResult.state}`);

        }).catch((err: Error) => {
            self.renderPage(res, 'login.html', {
                id: id,
                name: name,
                message: err.message
            }, 401);
        });
    }

    private authorize(req: Request, res: Response, next: Function) {
        let id = uuid.v4();
        let responseType = req.query.response_type;
        let clientId = req.query.client_id;
        let redirectUri = req.query.redirect_uri;
        let scope = req.query.scope;
        let state = req.query.state;

        let oauth2_session_id = req.cookies == undefined ? null : (req.cookies[`oauth2_session_id_${clientId}`] == undefined ? null : req.cookies[`oauth2_session_id_${clientId}`]);

        if (this.service.isEmptyOrSpace(responseType) || this.service.isEmptyOrSpace(clientId) || this.service.isEmptyOrSpace(redirectUri) || this.service.isEmptyOrSpace(scope)) {
            res.status(400).send('Invalid parameters provided');
            return;
        }

        if (responseType != 'code') {
            res.status(400).send('Invalid response_type provided');
            return;
        }


        let self = this;

        co(function* () {
            let findClientByClientIdResult = yield self.service.findClientByClientId(clientId, redirectUri);

            let saveAuthorizeInformationResult = yield self.service.saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope, state);

            if (!saveAuthorizeInformationResult) {
                throw new Error('Failed to save authorize information');
            }

            if (oauth2_session_id == null) {
                res.redirect(`login?id=${id}`);
                return;
            }

            let findSessionBySessionIdResult = yield self.service.findSessionBySessionId(oauth2_session_id).catch((err: Error) => {
                return null;
            });

            if (findSessionBySessionIdResult == null) {
                res.redirect(`login?id=${id}`);
                return;
            }

            if (findSessionBySessionIdResult.clientId != clientId) {
                res.redirect(`login?id=${id}`);
                return;
            }

            let generateCodeResult = yield self.service.generateCode(id, clientId, findSessionBySessionIdResult.username);

            res.redirect(`${redirectUri}?token=${generateCodeResult}&state=${state}`);

        }).catch((err: Error) => {
            res.status(400).send(err.message);
        });
    }

    private token(req: Request, res: Response, next: Function) {
        let clientId = req.query.client_id;
        let clientSecret = req.query.client_secret;
        let grantType = req.query.grant_type;
        let code = req.query.code;
        let redirectUri = req.query.redirect_uri;
        if (this.service.isEmptyOrSpace(clientId) || this.service.isEmptyOrSpace(clientSecret) || this.service.isEmptyOrSpace(grantType) || this.service.isEmptyOrSpace(code) || this.service.isEmptyOrSpace(redirectUri)) {
            res.status(400).send('Invalid parameters provided');
            return;
        }

        if (grantType != 'authorization_code') {
            res.status(400).send('Invalid grant_type provided');
            return;
        }

        this.service.findCodeByCode(clientId, clientSecret, code, redirectUri).then((findCodeByCodeResult: any) => {
            return this.service.generateAccessTokenObject(code, clientId, findCodeByCodeResult.username, 'read');
        }).then((generateAccessTokenObjectResult: any) => {
            if (generateAccessTokenObjectResult == null) {
                throw new Error('Failed to generate access token object');
            }

            res.json(generateAccessTokenObjectResult);
        }).catch((err: Error) => {
            res.status(400).send(err.message);
        });
    }

    private getUser(req: Request, res: Response, next: Function) {
        // req.json();
    }

    private renderPage(res: Response, htmlFile: string, data: any, status: number) {

        fs.readFile(`${__dirname}/${htmlFile}`, 'utf8', (err: Error, html: string) => {
            if (err) {
                return;
            }

            let template = Handlebars.compile(html);

            let result = template(data);

            res.status(status).send(result);

        });
    }
}

// http://localhost:3000/auth/authorize?response_type=code&client_id=1234567890&redirect_uri=http://demo1.local/callback&scope=read
// http://localhost:3000/auth/token?client_id=CLIENT_ID&client_secret=CLIENT_SECRET&grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=CALLBACK_URL



// http://localhost:3000/auth/token?client_id=1234567890&client_secret=0987654321&grant_type=authorization_code&code=32efbb19-9451-44d5-8d83-eb9cee0edc77&redirect_uri=http://demo2.local/callback



// http://localhost:3000/auth/authorize?response_type=code&client_id=8d851ff6-9571-4a29-acaf-5d1ec8979cb5&redirect_uri=http://localhost:3000/callback&scope=read&state=40335