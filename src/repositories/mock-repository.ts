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

    private sessions = [];

    private accessTokens = [];

    constructor() {

    }

    public saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string, state: string, expiryTimestamp: number): Promise<Boolean> {

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

    public findAuthorizeInformationById(id: string): Promise<any> {
        let result = this.authorizeInformation.find(x => x.id == id);

        return Promise.resolve(result);
    }

    public findClientByClientId(clientId: string): Promise<any> {
        let result = this.clients.find(x => x.clientId == clientId);

        return Promise.resolve(result);
    }

    public saveCode(id: string, code: string, clientId: string, username: string, expiryTimestamp: number): Promise<Boolean> {
        this.codes.push({
            id: id,
            code: code,
            clientId: clientId,
            username: username,
            expiryTimestamp: expiryTimestamp
        });

        return Promise.resolve(true);
    }


    public saveAccessToken(code: string, accessToken: string, expiryTimestamp: number, scope: string, username: string): Promise<Boolean> {
        this.accessTokens.push({
            code: code,
            accessToken: accessToken,
            expiryTimestamp: expiryTimestamp,
            scope: scope,
            username: username
        });

        return Promise.resolve(true);
    }

    public findCodeByCode(code: string): Promise<any> {
        let result = this.codes.find(x => x.code == code);

        return Promise.resolve(result);
    }

    public saveSession(sessionId: string, username: string, clientId: string): Promise<Boolean> {
        this.sessions.push({
            sessionId: sessionId,
            username: username,
            clientId: clientId
        });

        return Promise.resolve(true);
    }

    public findSessionBySessionId(sessionId: string): Promise<any> {
        let result = this.sessions.find(x => x.sessionId == sessionId);

        return Promise.resolve(result);
    }

    findAccessTokenByAccessToken(accessToken: string): Promise<any> {
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
