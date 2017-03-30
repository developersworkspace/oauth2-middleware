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
    }
    saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope, state) {
        this.authorizeInformation.push({
            id: id,
            responseType: responseType,
            clientId: clientId,
            redirectUri: redirectUri,
            state: state
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
    saveCode(id, code, clientId, username) {
        this.codes.push({
            id: id,
            code: code,
            clientId: clientId,
            username: username
        });
        return Promise.resolve(true);
    }
    saveAccessToken(code, accessToken, expiryTimestamp, scope, username) {
        return Promise.resolve(true);
    }
    findCodeByCode(code) {
        let result = this.codes.find(x => x.code == code);
        return Promise.resolve(result);
    }
}
exports.MockRepository = MockRepository;
