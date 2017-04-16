// Imports models
import { Auth } from './../models/auth';

export interface IAuthRepository {

    saveAuthorizeInformation(auth: Auth): Promise<boolean>;
    
    findById(id: string): Promise<Auth>;
    findByCode(code: string): Promise<Auth>;
    findByAccessToken(accessToken: string): Promise<Auth>;

    // saveSession(sessionId: string, username: string, clientId: string): Promise<Boolean>;
    // findSessionBySessionId(sessionId: string): Promise<any>;
    
}
