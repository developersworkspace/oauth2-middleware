"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MockRepository {
    constructor() {
        this.authorizeInformation = [];
        this.clients = [
            {
                name: 'Demo App',
                clientId: '1234567890',
                clientSecret: '0987654321',
                redirectUris: [
                    'http://demo1.local/callback',
                    'http://demo2.local/callback'
                ]
            }
        ];
        this.codes = [];
        this.sessions = [];
        this.accessTokens = [];
    }
    saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope, state, expiryTimestamp) {
        this.authorizeInformation.push({
            id: id,
            responseType: responseType,
            clientId: clientId,
            redirectUri: redirectUri,
            state: state,
            expiryTimestamp: expiryTimestamp
        });
        return Promise.resolve(true);
    }
    findAuthorizeInformationById(id) {
        let result = this.authorizeInformation.find(x => x.id == id);
        return Promise.resolve(result);
    }
    findClientByClientId(clientId) {
        let result = this.clients.find(x => x.clientId == clientId);
        return Promise.resolve(result);
    }
    saveCode(id, code, clientId, username, expiryTimestamp) {
        this.codes.push({
            id: id,
            code: code,
            clientId: clientId,
            username: username,
            expiryTimestamp: expiryTimestamp
        });
        return Promise.resolve(true);
    }
    saveAccessToken(code, accessToken, expiryTimestamp, scope, username) {
        this.accessTokens.push({
            code: code,
            accessToken: accessToken,
            expiryTimestamp: expiryTimestamp,
            scope: scope,
            username: username
        });
        return Promise.resolve(true);
    }
    findCodeByCode(code) {
        let result = this.codes.find(x => x.code == code);
        return Promise.resolve(result);
    }
    saveSession(sessionId, username, clientId) {
        this.sessions.push({
            sessionId: sessionId,
            username: username,
            clientId: clientId
        });
        return Promise.resolve(true);
    }
    findSessionBySessionId(sessionId) {
        let result = this.sessions.find(x => x.sessionId == sessionId);
        return Promise.resolve(result);
    }
    findAccessTokenByAccessToken(accessToken) {
        let result = this.accessTokens.find(x => x.accessToken == accessToken);
        if (result == null) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            access_token: accessToken,
            token_type: "bearer",
            expires_in: result.expiryTimestamp - new Date().getTime(),
            scope: result.scope,
            info: {
                username: result.username
            }
        });
    }
}
exports.MockRepository = MockRepository;
