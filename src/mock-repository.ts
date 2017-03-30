// Imports repositories
import { IRepository } from './repository';

export class MockRepository implements IRepository {

    private authorizeInformation = [];

    private clients = [
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

    private tokens = [];

    constructor() {

    }

    public saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string): Promise<Boolean> {

        this.authorizeInformation.push({
            id: id,
            responseType: responseType,
            clientId: clientId,
            redirectUri: redirectUri
        });

        return Promise.resolve(true);
    }

    public findAuthorizeInformationById(id: string): Promise<any> {
        let result = this.authorizeInformation.find(x => x.id == id);
        
        return Promise.resolve(result);
    }

    public findClientByClientId(clientId: string): Promise<any> {
        let result = this.clients.find(x => x.clientId == clientId);
        
        return Promise.resolve(result);
    }

    public saveCode(id: string, token: string, clientId: string, username: string): Promise<Boolean> {
        this.tokens.push({
            id: id,
            token: token,
            clientId: clientId,
            username: username
        });

        return Promise.resolve(true);
    }


    public findCodeByCode(token: string): Promise<any> {
        let result = this.tokens.find(x => x.token == token);

        return Promise.resolve(result);
    }

}
