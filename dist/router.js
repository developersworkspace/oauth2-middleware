"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const uuid = require("uuid");
const fs = require("graceful-fs");
const Handlebars = require("handlebars");
class OAuth2Middleware {
    constructor(validateCredentialsFn, repository) {
        this.validateCredentialsFn = validateCredentialsFn;
        this.repository = repository;
        this.router = express.Router();
        this.router.get('/login', (req, res, next) => { this.login(req, res, next); });
        this.router.post('/login', (req, res, next) => { this.submitLogin(req, res, next); });
        this.router.get('/authorize', (req, res, next) => { this.authorize(req, res, next); });
        this.router.get('/token', (req, res, next) => { this.token(req, res, next); });
    }
    login(req, res, next) {
        let id = req.query.id;
        if (this.isEmptyOrSpace(id)) {
            res.status(400).send('Invalid parameters provided');
            return;
        }
        this.findAuthorizeInformationById(id).then((result) => {
            if (result == null) {
                return null;
            }
            return this.findNameByClientId(result.clientId);
        }).then((result) => {
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
    submitLogin(req, res, next) {
        let username = req.body.username;
        let password = req.body.password;
        let id = req.query.id;
        let authorizeInformation = null;
        this.findAuthorizeInformationById(id).then((result) => {
            authorizeInformation = result;
            if (authorizeInformation == null) {
                return false;
            }
            return this.validateCredentials(authorizeInformation.clientId, username, password);
        }).then((result) => {
            if (result) {
                return this.generateCode(id, authorizeInformation.clientId, username);
            }
            return null;
        }).then((result) => {
            if (result == null) {
                this.renderPage(res, 'login.html', {
                    id: id,
                    name: result,
                    message: 'Invalid username or password'
                }, 401);
            }
            else {
                res.redirect(`${authorizeInformation.redirectUri}?token=${result}`);
            }
        });
    }
    authorize(req, res, next) {
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
        this.validateClientId(clientId, redirectUri).then((result) => {
            if (!result) {
                return false;
            }
            return this.saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope);
        }).then((result) => {
            if (result) {
                res.redirect(`login?id=${id}`);
            }
            else {
                res.status(401).end();
            }
        });
    }
    token(req, res, next) {
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
        this.validateCode(clientId, clientSecret, code, redirectUri).then((result) => {
            if (result) {
                return this.findUsernameByCode(code);
            }
            return null;
        }).then((result) => {
            if (result == null) {
                return null;
            }
            return this.generateAccessTokenObject(code, clientId, result, 'read');
        }).then((result) => {
            if (result == null) {
                res.status(401).end();
            }
            else {
                res.json(result);
            }
        });
    }
    renderPage(res, htmlFile, data, status) {
        fs.readFile(`${__dirname}/${htmlFile}`, 'utf8', (err, html) => {
            if (err) {
                return;
            }
            let template = Handlebars.compile(html);
            let result = template(data);
            res.status(status).send(result);
        });
    }
    validateCode(clientId, clientSecret, code, redirectUri) {
        return this.repository.findCodeByCode(code).then((result) => {
            if (result == null) {
                return null;
            }
            return this.findAuthorizeInformationById(result.id);
        }).then((result) => {
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
        }).then((result) => {
            if (result == null) {
                return false;
            }
            if (result.clientSecret != clientSecret) {
                return false;
            }
            return true;
        });
    }
    generateCode(id, clientId, username) {
        let code = uuid.v4();
        return this.repository.saveCode(id, code, clientId, username).then((result) => {
            return code;
        });
    }
    generateAccessTokenObject(code, clientId, username, scope) {
        let accessToken = uuid.v4();
        let expiresIn = 1800000;
        let expiryTimestamp = new Date().getTime() + expiresIn;
        return this.repository.saveAccessToken(code, accessToken, expiryTimestamp, scope, username).then((result) => {
            return Promise.resolve({
                access_token: accessToken,
                token_type: "bearer",
                expires_in: expiresIn,
                scope: scope,
                info: {
                    username: username
                }
            });
        });
    }
    findUsernameByCode(code) {
        return this.repository.findCodeByCode(code).then((result) => {
            if (result == null) {
                return null;
            }
            return result.username;
        });
    }
    validateCredentials(clientId, username, password) {
        return this.validateCredentialsFn(clientId, username, password);
    }
    findAuthorizeInformationById(id) {
        return this.repository.findAuthorizeInformationById(id);
    }
    findNameByClientId(clientId) {
        return this.repository.findClientByClientId(clientId).then((result) => {
            return result.name;
        });
    }
    validateClientId(clientId, redirectUri) {
        return this.repository.findClientByClientId(clientId).then((result) => {
            if (result == null) {
                return false;
            }
            if (result.redirectUris.indexOf(redirectUri) == -1) {
                return false;
            }
            return true;
        });
    }
    saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope) {
        return this.repository.saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope);
    }
    isEmptyOrSpace(str) {
        return str == undefined || str === null || str.match(/^ *$/) !== null;
    }
}
exports.OAuth2Middleware = OAuth2Middleware;
// http://localhost:3000/auth/authorize?response_type=code&client_id=1234567890&redirect_uri=http://demo1.local/callback&scope=read
// http://localhost:3000/auth/token?client_id=CLIENT_ID&client_secret=CLIENT_SECRET&grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=CALLBACK_URL
// http://localhost:3000/auth/token?client_id=1234567890&client_secret=0987654321&grant_type=authorization_code&code=32efbb19-9451-44d5-8d83-eb9cee0edc77&redirect_uri=http://demo2.local/callback