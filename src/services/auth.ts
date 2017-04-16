// Imports interfaces
import { IAuthRepository } from './../repositories/auth';

// Imports models
import { Auth } from './../models/auth';
import { AccessToken } from './../models/access-token';

export class AuthService {

    constructor(private authRepository: IAuthRepository) {

    }

    public generateCode(id: string, clientId: string, username: string): Promise<string> {
        return null;
    }

    public findAuthByAccessToken(accessToken: string): Promise<Auth> { 
        return null;
    }

    public findAuthByCode(clientId: string, clientSecret: string, code: string, redirectUri: string): Promise<Auth> {
        return null;
    }

    public findAuthById(id: string): Promise<Auth> {
        return null;
    }

    public saveAuth(id: string, responseType: string, clientId: string, redirectUri: string, scope: string, state: string): Promise<boolean> {
        return null;
    }

    public validateCredentials(clientId: string, username: string, password: string): Promise<boolean> {
        return null;
    }

    // TODO: Needs to be moved to client service
    public findNameByClientId(clientId: string): Promise<string> {
        return null;
    }

    // TODO: Needs to be moved to client service
    public findClientByClientId(clientId: string, redirectUri: string): Promise<any> {
        return null;
    }

    // TODO: Needs to be moved to session service
    public saveSession(sessionId: string, username: string, clientId: string): Promise<boolean> {
        return null;
    }

    // TODO: Needs to be moved to session service
    public findSessionBySessionId(sessionId: string, clientId: string): Promise<any> {
        return null;
    }

}