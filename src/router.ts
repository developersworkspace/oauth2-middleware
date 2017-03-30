// Imports
import { Express, Request, Response, Router } from "express";
import * as express from 'express';
import * as uuid from 'uuid';
import * as fs from 'graceful-fs';
import * as Handlebars from 'handlebars';

// Imports repositories
import { IRepository } from './repository';

export class OAuth2Middleware {

    router: Router;

    constructor(private validateCredentialsFn: Function, private repository: IRepository) {

        this.router = express.Router();

        this.router.get('/login', (req: Request, res: Response, next: Function) => { this.login(req, res, next); });
        this.router.post('/login', (req: Request, res: Response, next: Function) => { this.submitLogin(req, res, next); });
        this.router.get('/authorize', (req: Request, res: Response, next: Function) => { this.authorize(req, res, next); });
        this.router.get('/token', (req: Request, res: Response, next: Function) => { this.token(req, res, next); });
    }

    private login(req: Request, res: Response, next: Function) {

        let id = req.query.id;

        if (this.isEmptyOrSpace(id)) {
            res.status(400).send('Invalid parameters provided');
            return;
        }

        this.findAuthorizeInformationById(id).then((result: any) => {
            if (result == null) {
                return null;
            }
            return this.findNameByClientId(result.clientId);
        }).then((result: string) => {

            if (result == null) {
                res.status(400).send('Invalid parameters provided');
                return;
            }

            this.renderPage(res, 'login.html', {
                id: id,
                name: result,
                message: null
            }, 200);
        });

    }

    private submitLogin(req: Request, res: Response, next: Function) {

        let username = req.body.username;
        let password = req.body.password;
        let id = req.query.id;

        let authorizeInformation = null;

        this.findAuthorizeInformationById(id).then((result: any) => {
            authorizeInformation = result;

            if (authorizeInformation == null) {
                return false;
            }

            return this.validateCredentials(authorizeInformation.clientId, username, password);
        }).then((result: Boolean) => {
            if (result) {
                return this.generateToken(id, authorizeInformation.clientId, username);
            }

            return null;
        }).then((result: string) => {
            if (result == null) {
                this.renderPage(res, 'login.html', {
                    id: id,
                    name: result,
                    message: 'Invalid username or password'
                }, 401);
            } else {
                res.redirect(`${authorizeInformation.redirectUri}?token=${result}`);
            }
        });
    }

    private authorize(req: Request, res: Response, next: Function) {
        let id = uuid.v4();
        let responseType = req.query.response_type;
        let clientId = req.query.client_id;
        let redirectUri = req.query.redirect_uri;
        let scope = req.query.scope;

        if (this.isEmptyOrSpace(responseType) || this.isEmptyOrSpace(clientId) || this.isEmptyOrSpace(redirectUri) || this.isEmptyOrSpace(scope)) {
            res.status(400).send('Invalid parameters provided');
            return;
        }

        if (responseType != 'code') {
            res.status(400).send('Invalid response_type provided');
            return;
        }

        this.validateClientId(clientId, redirectUri).then((result: Boolean) => {
            if (!result) {
                return false;
            }
            return this.saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope);
        }).then((result: Boolean) => {
            if (result) {
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
        if (this.isEmptyOrSpace(clientId) || this.isEmptyOrSpace(clientSecret) || this.isEmptyOrSpace(grantType) || this.isEmptyOrSpace(code) || this.isEmptyOrSpace(redirectUri)) {
            res.status(400).send('Invalid parameters provided');
            return;
        }

        if (grantType != 'authorization_code') {
            res.status(400).send('Invalid grant_type provided');
            return;
        }

        this.validateToken(clientId, clientSecret, code, redirectUri).then((result: Boolean) => {
            if (result) {
                return this.findUsernameByToken(code);
            }

            return null;
        }).then((result: string) => {
            if (result == null) {
                return null;
            }

            return this.generateAccessTokenObject(code, clientId, result, 'read');
        }).then((result: any) => {
            if (result == null) {
                res.status(401).end();
            }
            else {
                res.json(result);
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

    private validateToken(clientId: string, clientSecret: string, token: string, redirectUri: string): Promise<Boolean> {
        return this.repository.findTokenByToken(token).then((result: any) => {
            if (result == null) {
                return null;
            }
            return this.findAuthorizeInformationById(result.id);
        }).then((result: any) => {
            if (result == null) {
                return null;
            }

            if (result.clientId != clientId) {
                return null;
            }

            if (result.redirectUri != redirectUri) {
                return null;
            }


            return this.repository.findClientByClientId(clientId);
        }).then((result: any) => {
            if (result == null) {
                return false;
            }

            if (result.clientSecret != clientSecret) {
                return false;
            }

            return true;
        })
    }

    private generateToken(id: string, clientId: string, username: string): Promise<string> {
        let token = uuid.v4();
        return this.repository.saveToken(id, token, clientId, username).then((result: Boolean) => {
            return token;
        });
    }

    private generateAccessTokenObject(token: string, clientId: string, username: string, scope: string): Promise<any> {

        let accessToken = uuid.v4();
        let expiresIn = 2592000;

        return Promise.resolve({
            access_token: accessToken,
            token_type: "bearer",
            expires_in: expiresIn,
            scope: scope,
            info: {
                username: username
            }
        });
    }

    private findUsernameByToken(token: string): Promise<string> {
        return this.repository.findTokenByToken(token).then((result: any) => {
            if (result == null) {
                return null;
            }

            return result.username;
        });
    }

    private validateCredentials(clientId: string, username: string, password: string): Promise<Boolean> {
        return this.validateCredentialsFn(clientId, username, password);
    }

    private findAuthorizeInformationById(id: string): Promise<any> {
        return this.repository.findAuthorizeInformationById(id);
    }

    private findNameByClientId(clientId: string): Promise<string> {
        return this.repository.findClientByClientId(clientId).then((result: any) => {
            return result.name;
        });
    }

    private validateClientId(clientId: string, redirectUri: string): Promise<Boolean> {
        return this.repository.findClientByClientId(clientId).then((result: any) => {
            if (result == null) {
                return false;
            }

            if (result.redirectUris.indexOf(redirectUri) == -1) {
                return false;
            }
            return true;
        });
    }

    private saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string): Promise<Boolean> {
        return this.repository.saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope);
    }

    private isEmptyOrSpace(str) {
        return str == undefined || str === null || str.match(/^ *$/) !== null;
    }

}

// http://localhost:3000/auth/authorize?response_type=code&client_id=1234567890&redirect_uri=http://demo1.local/callback&scope=read
// http://localhost:3000/auth/token?client_id=CLIENT_ID&client_secret=CLIENT_SECRET&grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=CALLBACK_URL



// http://localhost:3000/auth/token?client_id=1234567890&client_secret=0987654321&grant_type=authorization_code&code=32efbb19-9451-44d5-8d83-eb9cee0edc77&redirect_uri=http://demo2.local/callback

