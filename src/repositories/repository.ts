// Imports
import * as mongo from 'mongodb';
import { Db } from 'mongodb';

export class Repository implements IRepository {

    private mongoClient: mongo.MongoClient;

    constructor(private uri: string) {
        this.mongoClient = mongo.MongoClient;
    }

    public saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string, state: string, expiryTimestamp: number): Promise<Boolean> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            const collection = db.collection('authorize_infomation');
            return collection.insert({
                id,
                responseType,
                clientId,
                redirectUri,
                state,
                expiryTimestamp,
            });
        }).then((result: any) => {
            return true;
        });
    }

    public findAuthorizeInformationById(id: string): Promise<any> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            const collection = db.collection('authorize_infomation');
            return collection.findOne({
                id,
            });
        }).then((result: any) => {
            if (result == null) {
                return null;
            }

            return {
                id: result.id,
                responseType: result.responseType,
                clientId: result.clientId,
                redirectUri: result.redirectUri,
            };
        });
    }

    public findClientByClientId(clientId: string): Promise<any> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            const collection = db.collection('clients');
            return collection.findOne({
                clientId,
            });
        }).then((result: any) => {
            if (result) {
                return null;
            }

            return {
                name: result.name,
                clientId: result.clientId,
                clientSecret: result.clientSecret,
                redirectUris: result.redirectUris,
            };
        });
    }

    public saveCode(id: string, code: string, clientId: string, username: string, expiryTimestamp: number): Promise<Boolean> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            const collection = db.collection('codes');
            return collection.insert({
                id,
                code,
                clientId,
                username,
                expiryTimestamp,
            });
        }).then((result: any) => {
            return true;
        });
    }

    public saveAccessToken(code: string, accessToken: string, expiryTimestamp: number, scope: string, username: string): Promise<Boolean> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            const collection = db.collection('access_tokens');
            return collection.insert({
                code,
                accessToken,
                expiryTimestamp,
                scope,
                username,
            });
        }).then((result: any) => {
            return true;
        });
    }

    public findCodeByCode(code: string): Promise<any> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            const collection = db.collection('codes');
            return collection.findOne({
                code,
            });
        }).then((result: any) => {
            if (result) {
                return null;
            }

            return {
                id: result.id,
                code,
                clientId: result.clientId,
                username: result.username,
            };
        });
    }

    public saveSession(sessionId: string, username: string, clientId: string): Promise<Boolean> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            const collection = db.collection('sessions');
            return collection.insert({
                sessionId,
                username,
                clientId,
            });
        }).then((result: any) => {
            return true;
        });
    }

    public findSessionBySessionId(sessionId: string): Promise<any> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            const collection = db.collection('sessions');
            return collection.findOne({
                sessionId,
            });
        }).then((result: any) => {
            if (result) {
                return null;
            }

            return {
                sessionId: result.sessionId,
                username: result.username,
                clientId: result.clientId,
            };
        });
    }

    findAccessTokenByAccessToken(accessToken: string): Promise<any> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            const collection = db.collection('access_tokens');
            return collection.findOne({
                accessToken,
            });
        }).then((result: any) => {
            if (result) {
                return null;
            }

            return {
                access_token: accessToken,
                token_type: "bearer",
                expires_in: result.expiryTimestamp - new Date().getTime(),
                scope: result.scope,
                info: {
                    username: result.username,
                },
            };
        });
    }

}

export interface IRepository {

    saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string, state: string, expiryTimestamp: number): Promise<Boolean>;
    findAuthorizeInformationById(id: string): Promise<any>;
    findClientByClientId(clientId: string): Promise<any>;
    saveCode(id: string, code: string, clientId: string, username: string, expiryTimestamp: number): Promise<Boolean>;
    findCodeByCode(code: string): Promise<any>;
    saveAccessToken(code: string, accessToken: string, expiryTimestamp: number, scope: string, username: string): Promise<Boolean>;
    saveSession(sessionId: string, username: string, clientId: string): Promise<Boolean>;
    findSessionBySessionId(sessionId: string): Promise<any>;
    findAccessTokenByAccessToken(accessToken: string): Promise<any>;
}
