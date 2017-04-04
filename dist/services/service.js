"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Imports
const uuid = require("uuid");
const co = require("co");
class Service {
    constructor(validateCredentialsFn, repository, idExpiryMiliseconds, codeExpiryMiliseconds, accessTokenExpiryMiliseconds) {
        this.validateCredentialsFn = validateCredentialsFn;
        this.repository = repository;
        this.idExpiryMiliseconds = idExpiryMiliseconds;
        this.codeExpiryMiliseconds = codeExpiryMiliseconds;
        this.accessTokenExpiryMiliseconds = accessTokenExpiryMiliseconds;
    }
    generateCode(id, clientId, username) {
        let code = uuid.v4();
        return this.repository.saveCode(id, code, clientId, username, new Date().getTime() + this.codeExpiryMiliseconds).then((result) => {
            return code;
        });
    }
    generateAccessTokenObject(code, clientId, username, scope) {
        let accessToken = uuid.v4();
        let expiresIn = this.accessTokenExpiryMiliseconds;
        let expiryTimestamp = new Date().getTime() + expiresIn;
        return this.repository.saveAccessToken(code, accessToken, expiryTimestamp, scope, username).then((saveAccessTokenResult) => {
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
    findCodeByCode(clientId, clientSecret, code, redirectUri) {
        let self = this;
        return co(function* () {
            let findCodeByCodeResult = yield self.repository.findCodeByCode(code);
            if (findCodeByCodeResult == null) {
                throw new Error('Invalid code provided');
            }
            if (findCodeByCodeResult.expiryTimestamp < new Date().getTime()) {
                throw new Error('Expired code provided');
            }
            let findAuthorizeInformationByIdResult = yield self.findAuthorizeInformationById(findCodeByCodeResult.id);
            if (findAuthorizeInformationByIdResult == null) {
                throw new Error('Invalid id attached to code provided');
            }
            if (findAuthorizeInformationByIdResult.clientId != clientId) {
                throw new Error('Invalid client id provided');
            }
            if (findAuthorizeInformationByIdResult.redirectUri != redirectUri) {
                throw new Error('Invalid redirect uri provided');
            }
            let findClientByClientIdResult = yield self.repository.findClientByClientId(clientId);
            if (findClientByClientIdResult == null) {
                throw new Error('Invalid client id provided');
            }
            if (findClientByClientIdResult.clientSecret != clientSecret) {
                throw new Error('Invalid client secret provided');
            }
            return findCodeByCodeResult;
        });
    }
    validateCredentials(clientId, username, password) {
        return this.validateCredentialsFn(clientId, username, password);
    }
    findAuthorizeInformationById(id) {
        return this.repository.findAuthorizeInformationById(id).then((findAuthorizeInformationByIdResult) => {
            if (findAuthorizeInformationByIdResult == null) {
                throw new Error('Invalid id provided');
            }
            if (findAuthorizeInformationByIdResult.expiryTimestamp < new Date().getTime()) {
                throw new Error('Expired id provided');
            }
            return findAuthorizeInformationByIdResult;
        });
    }
    findNameByClientId(clientId) {
        return this.repository.findClientByClientId(clientId).then((findClientByClientIdResult) => {
            return findClientByClientIdResult.name;
        });
    }
    findClientByClientId(clientId, redirectUri) {
        return this.repository.findClientByClientId(clientId).then((findClientByClientIdResult) => {
            if (findClientByClientIdResult == null) {
                throw new Error('Invalid client id provided');
            }
            if (findClientByClientIdResult.redirectUris.indexOf(redirectUri) == -1) {
                throw new Error('Invalid redirect uri provided');
            }
            return findClientByClientIdResult;
        });
    }
    saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope, state) {
        let expiryTimestamp = new Date().getTime() + this.idExpiryMiliseconds;
        return this.repository.saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope, state, expiryTimestamp);
    }
    saveSession(sessionId, username, clientId) {
        return this.repository.saveSession(sessionId, username, clientId);
    }
    findSessionBySessionId(sessionId, clientId) {
        return this.repository.findSessionBySessionId(sessionId)
            .then((findSessionBySessionIdResult) => {
            if (findSessionBySessionIdResult == null) {
                throw new Error('Invalid session id provided');
            }
            if (findSessionBySessionIdResult.clientId != clientId) {
                throw new Error('Invalid session id provided');
            }
            return findSessionBySessionIdResult;
        });
    }
    findAccessTokenByAccessToken(accessToken) {
        let self = this;
        return co(function* () {
            let findAccessTokenByAccessTokenResult = yield self.repository.findAccessTokenByAccessToken(accessToken);
            if (findAccessTokenByAccessTokenResult == null) {
                throw new Error('Invalid access token provided');
            }
            if (findAccessTokenByAccessTokenResult.expiresIn <= 0) {
                throw new Error('Expired access token provided');
            }
            return findAccessTokenByAccessTokenResult;
        });
    }
    isEmptyOrSpace(str) {
        return str == undefined || str === null || str.match(/^ *$/) !== null;
    }
}
exports.Service = Service;
