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

    public saveToken(id: string, token: string, clientId: string, username: string): Promise<Boolean> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            let collection = db.collection('tokens');
            return collection.insert({
                id: id,
                token: token,
                clientId: clientId,
                username: username
            });
        }).then((result: any) => {
            return true;
        });
    }


    public findTokenByToken(token: string): Promise<any> {
        return this.mongoClient.connect(this.uri).then((db: Db) => {
            let collection = db.collection('tokens');
            return collection.findOne({
                token: token
            })
        });
    }

}

export interface IRepository {
    
    saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string): Promise<Boolean>;
    findAuthorizeInformationById(id: string): Promise<any>;
    findClientByClientId(clientId: string): Promise<any>;
    saveToken(id: string, token: string, clientId: string, username: string): Promise<Boolean>;
    findTokenByToken(token: string): Promise<any>;
}