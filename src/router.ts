// Imports
import { Express, Request, Response, Router } from "express";
import * as express from 'express';
import * as uuid from 'uuid';
import * as fs from 'graceful-fs';
import * as Handlebars from 'handlebars';

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
    }

    private login(req: Request, res: Response, next: Function) {

        let id = req.query.id;

        if (this.service.isEmptyOrSpace(id)) {
            res.status(400).send('Invalid parameters provided');
            return;
        }

        this.service.findAuthorizeInformationById(id).then((result: any) => {
            if (result == null) {
                return null;
            }

            if (result.expiryTimestamp < new Date().getTime()) {
                return null;
            }

            return this.service.findNameByClientId(result.clientId);
        }).then((findNameByClientIdResult: string) => {

            if (findNameByClientIdResult == null) {
                res.status(400).send('Invalid parameters provided');
                return;
            }

            this.renderPage(res, 'login.html', {
                id: id,
                name: findNameByClientIdResult,
                message: null
            }, 200);
        });

    }

    private submitLogin(req: Request, res: Response, next: Function) {

        let username = req.body.username;
        let password = req.body.password;
        let id = req.query.id;

        this.service.findAuthorizeInformationById(id).then((findAuthorizeInformationByIdResult: any) => {
            if (findAuthorizeInformationByIdResult == null) {
                return null;
            }

            if (findAuthorizeInformationByIdResult.expiryTimestamp < new Date().getTime()) {
                return null;
            }

            return Promise.all([
                findAuthorizeInformationByIdResult,
                this.service.findNameByClientId(findAuthorizeInformationByIdResult.clientId),
                this.service.validateCredentials(findAuthorizeInformationByIdResult.clientId, username, password),
                this.service.generateCode(id, findAuthorizeInformationByIdResult.clientId, username)
            ]);
        }).then((results: any[]) => {
            
            let findAuthorizeInformationByIdResult: any = results == null? null : results[0];
            let findNameByClientIdResult: string = results == null? null : results[1];
            let validateCredentialsResult: Boolean = results == null? null : results[2];
            let generateCodeResult: string = results == null? null : results[3];

            if (findAuthorizeInformationByIdResult == null || findNameByClientIdResult == null || !validateCredentialsResult || generateCodeResult == null) {
                this.renderPage(res, 'login.html', {
                    id: id,
                    name: findNameByClientIdResult,
                    message: 'Invalid username or password'
                }, 401);
            } else {
                res.redirect(`${findAuthorizeInformationByIdResult.redirectUri}?token=${generateCodeResult}&state=${findAuthorizeInformationByIdResult.state}`);
            }
        });
    }

    private authorize(req: Request, res: Response, next: Function) {
        let id = uuid.v4();
        let responseType = req.query.response_type;
        let clientId = req.query.client_id;
        let redirectUri = req.query.redirect_uri;
        let scope = req.query.scope;
        let state = req.query.state;

        let oauth2_session_id = req.cookies == undefined ? null : (req.cookies.oauth2_session_id == undefined ? null : req.cookies.oauth2_session_id);

        if (oauth2_session_id == null) {
            oauth2_session_id = uuid.v4();
        }

        if (this.service.isEmptyOrSpace(responseType) || this.service.isEmptyOrSpace(clientId) || this.service.isEmptyOrSpace(redirectUri) || this.service.isEmptyOrSpace(scope)) {
            res.status(400).send('Invalid parameters provided');
            return;
        }

        if (responseType != 'code') {
            res.status(400).send('Invalid response_type provided');
            return;
        }

        Promise.all([
            this.service.validateClientId(clientId, redirectUri),
            this.service.saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope, state)
        ]).then((results: any[]) => {

            let validateClientIdResult: Boolean = results[0];
            let saveAuthorizeInformationResult: Boolean = results[1];

            if (validateClientIdResult && saveAuthorizeInformationResult) {
                res.cookie('oauth2_session_id', id, { maxAge: this.idExpiryMiliseconds, });
                res.redirect(`login?id=${id}`);
            } else {
                res.status(401).end();
            }
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

        this.service.validateCode(clientId, clientSecret, code, redirectUri).then((validateCodeResult: Boolean) => {
            if (validateCodeResult) {
                return this.service.findUsernameByCode(code);
            }

            return null;
        }).then((findUsernameByCodeResult: string) => {
            if (findUsernameByCodeResult == null) {
                return null;
            }

            return this.service.generateAccessTokenObject(code, clientId, findUsernameByCodeResult, 'read');
        }).then((generateAccessTokenObjectResult: any) => {
            if (generateAccessTokenObjectResult == null) {
                res.status(401).end();
            }
            else {
                res.json(generateAccessTokenObjectResult);
            }

        });
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