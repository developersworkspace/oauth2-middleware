"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const uuid = require("uuid");
const fs = require("graceful-fs");
const Handlebars = require("handlebars");
// Imports services
const service_1 = require("./services/service");
class OAuth2Middleware {
    constructor(validateCredentialsFn, repository, idExpiryMiliseconds, codeExpiryMiliseconds, accessTokenExpiryMiliseconds) {
        this.validateCredentialsFn = validateCredentialsFn;
        this.repository = repository;
        this.idExpiryMiliseconds = idExpiryMiliseconds;
        this.codeExpiryMiliseconds = codeExpiryMiliseconds;
        this.accessTokenExpiryMiliseconds = accessTokenExpiryMiliseconds;
        this.service = new service_1.Service(validateCredentialsFn, repository, idExpiryMiliseconds, codeExpiryMiliseconds, accessTokenExpiryMiliseconds);
        this.router = express.Router();
        this.router.get('/login', (req, res, next) => { this.login(req, res, next); });
        this.router.post('/login', (req, res, next) => { this.submitLogin(req, res, next); });
        this.router.get('/authorize', (req, res, next) => { this.authorize(req, res, next); });
        this.router.get('/token', (req, res, next) => { this.token(req, res, next); });
    }
    login(req, res, next) {
        let id = req.query.id;
        if (this.service.isEmptyOrSpace(id)) {
            res.status(400).send('Invalid parameters provided');
            return;
        }
        this.service.findAuthorizeInformationById(id).then((findAuthorizeInformationByIdResult) => {
            if (findAuthorizeInformationByIdResult == null) {
                throw new Error('Invalid id provided');
            }
            if (findAuthorizeInformationByIdResult.expiryTimestamp < new Date().getTime()) {
                throw new Error('Expired id provided');
            }
            return this.service.findNameByClientId(findAuthorizeInformationByIdResult.clientId);
        }).then((findNameByClientIdResult) => {
            this.renderPage(res, 'login.html', {
                id: id,
                name: findNameByClientIdResult,
                message: null
            }, 200);
        }).catch((err) => {
            res.status(400).send(err.message);
        });
    }
    submitLogin(req, res, next) {
        let username = req.body.username;
        let password = req.body.password;
        let id = req.query.id;
        let oauth2_session_id = uuid.v4();
        let temp_findNameByClientIdResult = null;
        return this.service.findAuthorizeInformationById(id).then((findAuthorizeInformationByIdResult) => {
            if (findAuthorizeInformationByIdResult == null) {
                throw new Error('Invalid id provided');
            }
            if (findAuthorizeInformationByIdResult.expiryTimestamp < new Date().getTime()) {
                throw new Error('Expired id provided');
            }
            return Promise.all([
                findAuthorizeInformationByIdResult,
                this.service.findNameByClientId(findAuthorizeInformationByIdResult.clientId),
                this.service.validateCredentials(findAuthorizeInformationByIdResult.clientId, username, password)
            ]);
        }).then((results) => {
            let findAuthorizeInformationByIdResult = results == null ? null : results[0];
            let findNameByClientIdResult = results == null ? null : results[1];
            let validateCredentialsResult = results == null ? null : results[2];
            temp_findNameByClientIdResult = findNameByClientIdResult;
            if (findNameByClientIdResult == null) {
                throw new Error('Invalid client id provided');
            }
            else if (!validateCredentialsResult) {
                throw new Error('Invalid credentials provided');
            }
            else {
                return Promise.all([
                    findAuthorizeInformationByIdResult,
                    findNameByClientIdResult,
                    this.service.generateCode(id, findAuthorizeInformationByIdResult.clientId, username)
                ]);
            }
        }).then((results) => {
            let findAuthorizeInformationByIdResult = results == null ? null : results[0];
            let findNameByClientIdResult = results == null ? null : results[1];
            let generateCodeResult = results == null ? null : results[2];
            if (generateCodeResult == null) {
                throw Error('Failed to generate code');
            }
            return Promise.all([
                findAuthorizeInformationByIdResult,
                generateCodeResult,
                this.service.saveSession(oauth2_session_id, username, findAuthorizeInformationByIdResult.clientId)
            ]);
        }).then((results) => {
            let findAuthorizeInformationByIdResult = results == null ? null : results[0];
            let generateCodeResult = results == null ? null : results[1];
            let saveSessionResult = results == null ? null : results[2];
            if (!saveSessionResult) {
                throw new Error('Failed to save session');
            }
            res.cookie(`oauth2_session_id_${findAuthorizeInformationByIdResult.clientId}`, oauth2_session_id, { maxAge: 1800, });
            res.redirect(`${findAuthorizeInformationByIdResult.redirectUri}?token=${generateCodeResult}&state=${findAuthorizeInformationByIdResult.state}`);
        }).catch((err) => {
            this.renderPage(res, 'login.html', {
                id: id,
                name: temp_findNameByClientIdResult,
                message: err.message
            }, 401);
        });
    }
    authorize(req, res, next) {
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
        this.service.validateClientId(clientId, redirectUri).then((validateClientIdResult) => {
            if (!validateClientIdResult) {
                throw new Error('Invalid client id provided');
            }
            return this.service.saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope, state);
        }).then((saveAuthorizeInformationResult) => {
            if (!saveAuthorizeInformationResult) {
                throw new Error('Failed to save authorize information');
            }
            if (oauth2_session_id == null) {
                return null;
            }
            return this.service.validateSessionId(oauth2_session_id);
        }).then((validateSessionIdResult) => {
            if (!validateSessionIdResult) {
                return null;
            }
            else {
                return this.service.findSessionBySessionId(oauth2_session_id);
            }
        }).then((findSessionBySessionIdResult) => {
            if (findSessionBySessionIdResult == null) {
                return null;
            }
            if (findSessionBySessionIdResult.clientId != clientId) {
                return null;
            }
            return this.service.generateCode(id, clientId, findSessionBySessionIdResult.username);
        }).then((generateCodeResult) => {
            if (generateCodeResult == null) {
                res.redirect(`login?id=${id}`);
            }
            else {
                res.redirect(`${redirectUri}?token=${generateCodeResult}&state=${state}`);
            }
        })
            .catch((err) => {
            res.status(400).send(err.message);
        });
    }
    token(req, res, next) {
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
        this.service.validateCode(clientId, clientSecret, code, redirectUri).then((validateCodeResult) => {
            if (validateCodeResult) {
                return this.service.findUsernameByCode(code);
            }
            throw new Error('Invalid code provided');
        }).then((findUsernameByCodeResult) => {
            return this.service.generateAccessTokenObject(code, clientId, findUsernameByCodeResult, 'read');
        }).then((generateAccessTokenObjectResult) => {
            if (generateAccessTokenObjectResult == null) {
                throw new Error('Failed to generate access token object');
            }
            res.json(generateAccessTokenObjectResult);
        }).catch((err) => {
            res.status(400).send(err.message);
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
}
exports.OAuth2Middleware = OAuth2Middleware;
// http://localhost:3000/auth/authorize?response_type=code&client_id=1234567890&redirect_uri=http://demo1.local/callback&scope=read
// http://localhost:3000/auth/token?client_id=CLIENT_ID&client_secret=CLIENT_SECRET&grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=CALLBACK_URL
// http://localhost:3000/auth/token?client_id=1234567890&client_secret=0987654321&grant_type=authorization_code&code=32efbb19-9451-44d5-8d83-eb9cee0edc77&redirect_uri=http://demo2.local/callback
// http://localhost:3000/auth/authorize?response_type=code&client_id=8d851ff6-9571-4a29-acaf-5d1ec8979cb5&redirect_uri=http://localhost:3000/callback&scope=read&state=40335 
