"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Imports
const mongo = require("mongodb");
class Repository {
    constructor(uri) {
        this.uri = uri;
        this.mongoClient = mongo.MongoClient;
    }
    saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope, state) {
        return this.mongoClient.connect(this.uri).then((db) => {
            let collection = db.collection('authorize_infomation');
            return collection.insert({
                id: id,
                responseType: responseType,
                clientId: clientId,
                redirectUri: redirectUri,
                state: state
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
        });
    }
    saveCode(id, code, clientId, username) {
        return this.mongoClient.connect(this.uri).then((db) => {
            let collection = db.collection('codes');
            return collection.insert({
                id: id,
                code: code,
                clientId: clientId,
                username: username
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
        });
    }
}
exports.Repository = Repository;
