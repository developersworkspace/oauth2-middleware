// Imports
import * as co from 'co';
import { Express, Request, Response, Router } from "express";
import * as express from 'express';
import * as fs from 'graceful-fs';
import * as Handlebars from 'handlebars';
import * as uuid from 'uuid';

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

        const id = req.query.id;

        if (this.service.isEmptyOrSpace(id)) {
            res.status(400).send('Invalid parameters provided');
            return;
        }

        const self = this;

        co(function*() {
            const findAuthorizeInformationByIdResult = yield self.service.findAuthorizeInformationById(id);
            const findNameByClientIdResult = yield self.service.findNameByClientId(findAuthorizeInformationByIdResult.clientId);

            self.renderPage(res, 'login.html', {
                id,
                name: findNameByClientIdResult,
                message: null,
            }, 200);
        }).catch((err: Error) => {
            res.status(400).send(err.message);
        });

    }

    private submitLogin(req: Request, res: Response, next: Function) {

        const username = req.body.username;
        const password = req.body.password;
        const id = req.query.id;

        const oauth2_session_id = uuid.v4();

        const self = this;
        let name = null;

        co(function*() {
            const findAuthorizeInformationByIdResult = yield self.service.findAuthorizeInformationById(id);
            const findNameByClientIdResult = yield self.service.findNameByClientId(findAuthorizeInformationByIdResult.clientId);
            const validateCredentialsResult = yield self.service.validateCredentials(findAuthorizeInformationByIdResult.clientId, username, password);

            name = findNameByClientIdResult.name;

            if (findNameByClientIdResult == null) {
                throw new Error('Invalid client id provided');
            }

            if (!validateCredentialsResult) {
                throw new Error('Invalid credentials provided');
            }

            const generateCodeResult = yield self.service.generateCode(id, findAuthorizeInformationByIdResult.clientId, username);

            if (generateCodeResult == null) {
                throw Error('Failed to generate code');
            }

            const saveSessionResult = yield self.service.saveSession(oauth2_session_id, username, findAuthorizeInformationByIdResult.clientId);

            if (!saveSessionResult) {
                throw new Error('Failed to save session');
            }

            res.cookie(`oauth2_session_id_${findAuthorizeInformationByIdResult.clientId}`, oauth2_session_id, { maxAge: 1800 });
            res.redirect(`${findAuthorizeInformationByIdResult.redirectUri}?token=${generateCodeResult}&state=${findAuthorizeInformationByIdResult.state}`);

        }).catch((err: Error) => {
            self.renderPage(res, 'login.html', {
                id,
                name,
                message: err.message,
            }, 401);
        });
    }

    private authorize(req: Request, res: Response, next: Function) {
        const id = uuid.v4();
        const responseType = req.query.response_type;
        const clientId = req.query.client_id;
        const redirectUri = req.query.redirect_uri;
        const scope = req.query.scope;
        const state = req.query.state;

        const oauth2_session_id = req.cookies == undefined ? null : (req.cookies[`oauth2_session_id_${clientId}`] == undefined ? null : req.cookies[`oauth2_session_id_${clientId}`]);

        if (this.service.isEmptyOrSpace(responseType) || this.service.isEmptyOrSpace(clientId) || this.service.isEmptyOrSpace(redirectUri) || this.service.isEmptyOrSpace(scope)) {
            res.status(400).send('Invalid parameters provided');
            return;
        }

        if (responseType != 'code') {
            res.status(400).send('Invalid response_type provided');
            return;
        }

        const self = this;

        co(function*() {
            const findClientByClientIdResult = yield self.service.findClientByClientId(clientId, redirectUri);

            const saveAuthorizeInformationResult = yield self.service.saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope, state);

            if (!saveAuthorizeInformationResult) {
                throw new Error('Failed to save authorize information');
            }

            if (oauth2_session_id == null) {
                res.redirect(`login?id=${id}`);
                return;
            }

            const findSessionBySessionIdResult = yield self.service.findSessionBySessionId(oauth2_session_id, clientId).catch((err: Error) => {
                return null;
            });

            if (findSessionBySessionIdResult == null) {
                res.redirect(`login?id=${id}`);
                return;
            }

            const generateCodeResult = yield self.service.generateCode(id, clientId, findSessionBySessionIdResult.username);

            res.redirect(`${redirectUri}?token=${generateCodeResult}&state=${state}`);

        }).catch((err: Error) => {
            res.status(400).send(err.message);
        });
    }

    private token(req: Request, res: Response, next: Function) {
        const clientId = req.query.client_id;
        const clientSecret = req.query.client_secret;
        const grantType = req.query.grant_type;
        const code = req.query.code;
        const redirectUri = req.query.redirect_uri;
        if (this.service.isEmptyOrSpace(clientId) || this.service.isEmptyOrSpace(clientSecret) || this.service.isEmptyOrSpace(grantType) || this.service.isEmptyOrSpace(code) || this.service.isEmptyOrSpace(redirectUri)) {
            res.status(400).send('Invalid parameters provided');
            return;
        }

        if (grantType != 'authorization_code') {
            res.status(400).send('Invalid grant_type provided');
            return;
        }

        const self = this;

        co(function*() {
            const findCodeByCodeResult = yield self.service.findCodeByCode(clientId, clientSecret, code, redirectUri);

            const generateAccessTokenObjectResult = yield self.service.generateAccessTokenObject(code, clientId, findCodeByCodeResult.username, 'read');

            if (generateAccessTokenObjectResult == null) {
                throw new Error('Failed to generate access token object');
            }

            res.json(generateAccessTokenObjectResult);
        }).catch((err: Error) => {
            res.status(400).send(err.message);
        });
    }

    private getUser(req: Request, res: Response, next: Function) {
        if (req.get('Authorization') == null) {
            res.status(400).send('No access token provided');
            return;
        }

        this.service.findAccessTokenByAccessToken(req.get('Authorization').split(' ')[1]).then((findAccessTokenByAccessTokenResult: any) => {
            res.json(findAccessTokenByAccessTokenResult);
        }).catch((err: Error) => {
            res.status(400).send(err.message);
        });
    }

    private renderPage(res: Response, htmlFile: string, data: any, status: number) {

        fs.readFile(`${__dirname}/${htmlFile}`, 'utf8', (err: Error, html: string) => {
            if (err) {
                return;
            }

            const template = Handlebars.compile(html);

            const result = template(data);

            res.status(status).send(result);

        });
    }
}
