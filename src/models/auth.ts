// Imports models
import { AccessToken } from './access-token';

export class Auth {
    constructor(
        public id: string,
        public responseType: string,
        public clientId: string,
        public redirectUri: string,
        public scope: string,
        public state: string,
        public idExpiryTimestamp: number,
        public code: string,
        public codeExpiryTimestamp: number,
        public accessToken: string,
        public accessTokenExpiryTimestamp: number,
        public username: string) {

    }

    public ToAccessToken(info: any): AccessToken {
        return new AccessToken(this.accessToken, 'bearer', this.accessTokenExpiryTimestamp - new Date().getTime(), this.scope, info);
    }
}
