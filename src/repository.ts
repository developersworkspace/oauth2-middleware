// Imports
import * as mongo from 'mongodb';
import { Db } from 'mongodb';

export class Repository implements IRepository {

    private mongoClient: mongo.MongoClient;

    constructor(private uri: string) {
        this.mongoClient = mongo.MongoClient;
    }

    public saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string): Promise<Boolean> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            let collection = db.collection('authorize_infomation');
            return collection.insert({
                id: id,
                responseType: responseType,
                clientId: clientId,
                redirectUri: redirectUri
            });
        }).then((result: any) => {
            return true;
        });
    }

    public findAuthorizeInformationById(id: string): Promise<any> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            let collection = db.collection('authorize_infomation');
            return collection.findOne({
                id: id
            });
        }).then((result: any) => {
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

    public findClientByClientId(clientId: string): Promise<any> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            let collection = db.collection('clients');
            return collection.findOne({
                clientId: clientId
            })
        });
    }

    public saveCode(id: string, code: string, clientId: string, username: string): Promise<Boolean> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            let collection = db.collection('codes');
            return collection.insert({
                id: id,
                code: code,
                clientId: clientId,
                username: username
            });
        }).then((result: any) => {
            return true;
        });
    }

    public saveAccessToken(code: string, accessToken: string, expiryTimestamp: number, scope: string, username: string): Promise<Boolean> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            let collection = db.collection('access_tokens');
            return collection.insert({
                code: code,
                accessToken: accessToken,
                expiryTimestamp: expiryTimestamp,
                scope: scope,
                username: username
            });
        }).then((result: any) => {
            return true;
        });
    }


    public findCodeByCode(code: string): Promise<any> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            let collection = db.collection('codes');
            return collection.findOne({
                code: code
            })
        });
    }

}

export interface IRepository {

    saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string): Promise<Boolean>;
    findAuthorizeInformationById(id: string): Promise<any>;
    findClientByClientId(clientId: string): Promise<any>;
    saveCode(id: string, code: string, clientId: string, username: string): Promise<Boolean>;
    findCodeByCode(code: string): Promise<any>;
    saveAccessToken(code: string, accessToken: string, expiryTimestamp: number, scope: string, username: string): Promise<Boolean>;
}