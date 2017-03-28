// Imports
import { Express, Request, Response, Router } from "express";
import * as express from 'express';
import * as uuid from 'uuid';
import * as fs from 'graceful-fs';
import * as Handlebars from 'handlebars';

export class OAuth2Middleware {

    router: Router;

    constructor(private fn: any) {
        this.router = express.Router();

        this.router.get('/login', (req: Request, res: Response, next: Function) => { this.login(req, res, next); });
        this.router.post('/login', (req: Request, res: Response, next: Function) => { this.submitLogin(req, res, next); });
        this.router.get('/authorize', (req: Request, res: Response, next: Function) => { this.authorize(req, res, next); });
        this.router.get('/token', (req: Request, res: Response, next: Function) => { this.token(req, res, next); });
    }

    private login(req: Request, res: Response, next: Function) {

        let id = req.query.id;

        this.findAuthorizeInformationById(id).then((result: any) => {
            return this.findNameByClientId(result.clientId);
        }).then((result: string) => {
            this.renderPage(res, 'login.html', {
                id: id,
                name: result,
                message: null
            });
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
                return this.generateToken(authorizeInformation.clientId, username);
            }

            return null;
        }).then((result: string) => {
            if (result == null) {
                this.renderPage(res, 'login.html', {
                    id: id,
                    name: result,
                    message: 'Invalid username or password'
                });
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


        this.validateClientId(clientId, redirectUri).then((result: Boolean) => {
            if (result) {
                return false;
            }
            return this.saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope);
        }).then((result: Boolean) => {

            if (result) {
                res.status(500).send('ERROR!!');
            } else {
                res.redirect(`login?id=${id}`);
            }
        });
    }

    private token(req: Request, res: Response, next: Function) {
        let clientId = req.query.client_id;
        let clientSecret = req.query.client_secret;
        let grantType = req.query.grant_type;
        let code = req.query.code;
        let redirectUri = req.query.redirect_uri;
    }

    private renderPage(res: Response, htmlFile: string, data: any) {

        fs.readFile(`${__dirname}/${htmlFile}`, 'utf8', (err: Error, html: string) => {
            if (err) {
                return;
            }

            let template = Handlebars.compile(html);

            let result = template(data);

            res.send(result);

        });
    }

    private generateToken(clientId: string, username: string): Promise<string> {
        return Promise.resolve('123');
    }

    private validateCredentials(clientId: string, username: string, password: string): Promise<Boolean> {
        return Promise.resolve(true);
    }

    private findAuthorizeInformationById(id: string): Promise<any> {
        return Promise.resolve({
            clientId: '1234',
            redirectUri: 'http://worldofrations.local/login'
        });
    }

    private findNameByClientId(clientId: string): Promise<string> {
        return Promise.resolve('World of Rations');
    }

    private validateClientId(clientId: string, redirectUri: string): Promise<Boolean> {
        return Promise.resolve(true);
    }

    private saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string): Promise<Boolean> {
        return Promise.resolve(true);
    }

}

// http://localhost:3000/auth/authorize?response_type=code&client_id=CLIENT_ID&redirect_uri=CALLBACK_URL&scope=read


