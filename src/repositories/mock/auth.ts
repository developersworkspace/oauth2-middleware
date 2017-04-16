// Imports interfaces
import { IAuthRepository } from './../auth';

// Imports models
import { Auth } from './../../models/auth';

export class AuthRepository implements IAuthRepository {
    
    saveAuthorizeInformation(auth: Auth): Promise<boolean> {
        return Promise.resolve(true);
    }
    
    findById(id: string): Promise<Auth> {
        return null;
    }

    findByCode(code: string): Promise<Auth> {
        return null;
    }

    findByAccessToken(accessToken: string): Promise<Auth> {
        return null;
    }

}
