"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Imports
const uuid = require("uuid");
class Service {
    constructor(validateCredentialsFn, repository, idExpiryMiliseconds, codeExpiryMiliseconds, accessTokenExpiryMiliseconds) {
        this.validateCredentialsFn = validateCredentialsFn;
        this.repository = repository;
        this.idExpiryMiliseconds = idExpiryMiliseconds;
        this.codeExpiryMiliseconds = codeExpiryMiliseconds;
        this.accessTokenExpiryMiliseconds = accessTokenExpiryMiliseconds;
    }
    validateCode(clientId, clientSecret, code, redirectUri) {
        return this.repository.findCodeByCode(code).then((findCodeByCodeResult) => {
            if (findCodeByCodeResult == null) {
                return null;
            }
            if (findCodeByCodeResult.expiryTimestamp < new Date().getTime()) {
                return null;
            }
            return this.findAuthorizeInformationById(findCodeByCodeResult.id);
        }).then((findAuthorizeInformationByIdResult) => {
            if (findAuthorizeInformationByIdResult == null) {
                return null;
            }
            if (findAuthorizeInformationByIdResult.clientId != clientId) {
                return null;
            }
            if (findAuthorizeInformationByIdResult.redirectUri != redirectUri) {
                return null;
            }
            return this.repository.findClientByClientId(clientId);
        }).then((findClientByClientIdResult) => {
            if (findClientByClientIdResult == null) {
                return false;
            }
            if (findClientByClientIdResult.clientSecret != clientSecret) {
                return false;
            }
            return true;
        });
    }
    generateCode(id, clientId, username) {
        let code = uuid.v4();
        return this.repository.saveCode(id, code, clientId, username, 2000).then((result) => {
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
    findUsernameByCode(code) {
        return this.repository.findCodeByCode(code).then((findCodeByCodeResult) => {
            if (findCodeByCodeResult == null) {
                return null;
            }
            return findCodeByCodeResult.username;
        });
    }
    validateCredentials(clientId, username, password) {
        return this.validateCredentialsFn(clientId, username, password);
    }
    findAuthorizeInformationById(id) {
        return this.repository.findAuthorizeInformationById(id);
    }
    findNameByClientId(clientId) {
        return this.repository.findClientByClientId(clientId).then((findClientByClientIdResult) => {
            return findClientByClientIdResult.name;
        });
    }
    validateClientId(clientId, redirectUri) {
        return this.repository.findClientByClientId(clientId).then((findClientByClientIdResult) => {
            if (findClientByClientIdResult == null) {
                return false;
            }
            if (findClientByClientIdResult.redirectUris.indexOf(redirectUri) == -1) {
                return false;
            }
            return true;
        });
    }
    saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope, state) {
        let expiryTimestamp = new Date().getTime() + this.idExpiryMiliseconds;
        return this.repository.saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope, state, expiryTimestamp);
    }
    saveSession(sessionId, username, clientId) {
        return this.repository.saveSession(sessionId, username, clientId);
    }
    validateSessionId(sessionId) {
        return this.repository.findSessionBySessionId(sessionId)
            .then((findSessionBySessionIdResult) => {
            if (findSessionBySessionIdResult == null) {
                return false;
            }
            return true;
        });
    }
    findSessionBySessionId(sessionId) {
        return this.repository.findSessionBySessionId(sessionId)
            .then((findSessionBySessionIdResult) => {
            if (findSessionBySessionIdResult == null) {
                return null;
            }
            return findSessionBySessionIdResult;
        });
    }
    isEmptyOrSpace(str) {
        return str == undefined || str === null || str.match(/^ *$/) !== null;
    }
}
exports.Service = Service;
