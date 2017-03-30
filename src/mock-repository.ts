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

    private codes = [];

    constructor() {

    }

    public saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string, state: string): Promise<Boolean> {

        this.authorizeInformation.push({
            id: id,
            responseType: responseType,
            clientId: clientId,
            redirectUri: redirectUri,
            state: state
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

    public saveCode(id: string, code: string, clientId: string, username: string): Promise<Boolean> {
        this.codes.push({
            id: id,
            code: code,
            clientId: clientId,
            username: username
        });

        return Promise.resolve(true);
    }


    public saveAccessToken(code: string, accessToken: string, expiryTimestamp: number, scope: string, username: string): Promise<Boolean> {
        return Promise.resolve(true);
    }

    public findCodeByCode(code: string): Promise<any> {
        let result = this.codes.find(x => x.code == code);

        return Promise.resolve(result);
    }

}
