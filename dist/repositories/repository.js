"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Imports
const mongo = require("mongodb");
class Repository {
    constructor(uri) {
        this.uri = uri;
        this.mongoClient = mongo.MongoClient;
    }
    saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope, state, expiryTimestamp) {
        return this.mongoClient.connect(this.uri).then((db) => {
            let collection = db.collection('authorize_infomation');
            return collection.insert({
                id: id,
                responseType: responseType,
                clientId: clientId,
                redirectUri: redirectUri,
                state: state,
                expiryTimestamp: expiryTimestamp
            });
        }).then((result) => {
            return true;
        });
    }
    findAuthorizeInformationById(id) {
        return this.mongoClient.connect(this.uri).then((db) => {
            let collection = db.collection('authorize_infomation');
            return collection.findOne({
                id: id
            });
        }).then((result) => {
            if (result == null) {
                return null;
            }
            return {
                id: result.id,
                responseType: result.responseType,
                clientId: result.clientId,
                redirectUri: result.redirectUri
            };
        });
    }
    findClientByClientId(clientId) {
        return this.mongoClient.connect(this.uri).then((db) => {
            let collection = db.collection('clients');
            return collection.findOne({
                clientId: clientId
            });
        }).then((result) => {
            if (result) {
                return null;
            }
            return {
                name: result.name,
                clientId: result.clientId,
                clientSecret: result.clientSecret,
                redirectUris: result.redirectUris
            };
        });
    }
    saveCode(id, code, clientId, username, expiryTimestamp) {
        return this.mongoClient.connect(this.uri).then((db) => {
            let collection = db.collection('codes');
            return collection.insert({
                id: id,
                code: code,
                clientId: clientId,
                username: username,
                expiryTimestamp: expiryTimestamp
            });
        }).then((result) => {
            return true;
        });
    }
    saveAccessToken(code, accessToken, expiryTimestamp, scope, username) {
        return this.mongoClient.connect(this.uri).then((db) => {
            let collection = db.collection('access_tokens');
            return collection.insert({
                code: code,
                accessToken: accessToken,
                expiryTimestamp: expiryTimestamp,
                scope: scope,
                username: username
            });
        }).then((result) => {
            return true;
        });
    }
    findCodeByCode(code) {
        return this.mongoClient.connect(this.uri).then((db) => {
            let collection = db.collection('codes');
            return collection.findOne({
                code: code
            });
        }).then((result) => {
            if (result) {
                return null;
            }
            return {
                id: result.id,
                code: code,
                clientId: result.clientId,
                username: result.username
            };
        });
    }
    saveSession(sessionId, username, clientId) {
        return this.mongoClient.connect(this.uri).then((db) => {
            let collection = db.collection('sessions');
            return collection.insert({
                sessionId: sessionId,
                username: username,
                clientId: clientId
            });
        }).then((result) => {
            return true;
        });
    }
    findSessionBySessionId(sessionId) {
        return this.mongoClient.connect(this.uri).then((db) => {
            let collection = db.collection('sessions');
            return collection.findOne({
                sessionId: sessionId
            });
        }).then((result) => {
            if (result) {
                return null;
            }
            return {
                sessionId: result.sessionId,
                username: result.username,
                clientId: result.clientId
            };
        });
    }
    findAccessTokenByAccessToken(accessToken) {
        return this.mongoClient.connect(this.uri).then((db) => {
            let collection = db.collection('access_tokens');
            return collection.findOne({
                accessToken: accessToken
            });
        }).then((result) => {
            if (result) {
                return null;
            }
            return {
                access_token: accessToken,
                token_type: "bearer",
                expires_in: result.expiryTimestamp - new Date().getTime(),
                scope: result.scope,
                info: {
                    username: result.username
                }
            };
        });
    }
}
exports.Repository = Repository;
