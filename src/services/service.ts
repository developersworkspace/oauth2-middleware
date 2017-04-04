// Imports
import * as uuid from 'uuid';
import * as co from 'co';

// Imports repositories
import { IRepository } from './../repositories/repository';


export class Service {

    constructor(private validateCredentialsFn: Function, private repository: IRepository, private idExpiryMiliseconds, private codeExpiryMiliseconds, private accessTokenExpiryMiliseconds) {

    }

    generateCode(id: string, clientId: string, username: string): Promise<string> {
        let code = uuid.v4();
        return this.repository.saveCode(id, code, clientId, username, new Date().getTime() + this.codeExpiryMiliseconds).then((result: Boolean) => {
            return code;
        });
    }

    generateAccessTokenObject(code: string, clientId: string, username: string, scope: string): Promise<any> {

        let accessToken = uuid.v4();
        let expiresIn = this.accessTokenExpiryMiliseconds;
        let expiryTimestamp = new Date().getTime() + expiresIn;

        return this.repository.saveAccessToken(code, accessToken, expiryTimestamp, scope, username).then((saveAccessTokenResult: Boolean) => {
            return Promise.resolve({
                access_token: accessToken,
                token_type: "bearer",
                expires_in: expiresIn,
                scope: scope,
                info: {
                    username: username
                }
            });
        });
    }


    findCodeByCode(clientId: string, clientSecret: string, code: string, redirectUri: string): Promise<any> {

        let self = this;
        return co(function* () {
            let findCodeByCodeResult = yield self.repository.findCodeByCode(code);

            if (findCodeByCodeResult == null) {
                throw new Error('Invalid code provided');
            }

            if (findCodeByCodeResult.expiryTimestamp < new Date().getTime()) {
                throw new Error('Expired code provided');
            }

            let findAuthorizeInformationByIdResult = yield self.findAuthorizeInformationById(findCodeByCodeResult.id);

            if (findAuthorizeInformationByIdResult == null) {
                throw new Error('Invalid id attached to code provided');
            }

            if (findAuthorizeInformationByIdResult.clientId != clientId) {
                throw new Error('Invalid client id provided');
            }

            if (findAuthorizeInformationByIdResult.redirectUri != redirectUri) {
                throw new Error('Invalid redirect uri provided');
            }

            let findClientByClientIdResult = yield self.repository.findClientByClientId(clientId);

            if (findClientByClientIdResult == null) {
                throw new Error('Invalid client id provided');
            }

            if (findClientByClientIdResult.clientSecret != clientSecret) {
                throw new Error('Invalid client secret provided');
            }

            return findCodeByCodeResult;
        });

    }

    validateCredentials(clientId: string, username: string, password: string): Promise<Boolean> {
        return this.validateCredentialsFn(clientId, username, password);
    }

    findAuthorizeInformationById(id: string): Promise<any> {
        return this.repository.findAuthorizeInformationById(id).then((findAuthorizeInformationByIdResult: any) => {
            if (findAuthorizeInformationByIdResult == null) {
                throw new Error('Invalid id provided');
            }

            if (findAuthorizeInformationByIdResult.expiryTimestamp < new Date().getTime()) {
                throw new Error('Expired id provided');
            }

            return findAuthorizeInformationByIdResult;
        });
    }

    findNameByClientId(clientId: string): Promise<string> {
        return this.repository.findClientByClientId(clientId).then((findClientByClientIdResult: any) => {
            return findClientByClientIdResult.name;
        });
    }

    findClientByClientId(clientId: string, redirectUri: string): Promise<Boolean> {
        return this.repository.findClientByClientId(clientId).then((findClientByClientIdResult: any) => {
            if (findClientByClientIdResult == null) {
                throw new Error('Invalid client id provided');
            }

            if (findClientByClientIdResult.redirectUris.indexOf(redirectUri) == -1) {
                throw new Error('Invalid redirect uri provided');
            }
            return findClientByClientIdResult;
        });
    }

    saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string, state: string): Promise<Boolean> {
        let expiryTimestamp = new Date().getTime() + this.idExpiryMiliseconds;
        return this.repository.saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope, state, expiryTimestamp);
    }

    saveSession(sessionId: string, username: string, clientId: string): Promise<Boolean> {
        return this.repository.saveSession(sessionId, username, clientId);
    }

    findSessionBySessionId(sessionId: string, clientId: string): Promise<string> {
        return this.repository.findSessionBySessionId(sessionId)
            .then((findSessionBySessionIdResult: any) => {
                if (findSessionBySessionIdResult == null) {
                    throw new Error('Invalid session id provided');
                }

                if (findSessionBySessionIdResult.clientId != clientId) {
                    throw new Error('Invalid session id provided');
                }

                return findSessionBySessionIdResult;
            });
    }

    findAccessTokenByAccessToken(accessToken: string): Promise<any> {

        let self = this;
        return co(function* () {
            let findAccessTokenByAccessTokenResult = yield self.repository.findAccessTokenByAccessToken(accessToken);

            if (findAccessTokenByAccessTokenResult == null) {
                throw new Error('Invalid access token provided');
            }


            if (findAccessTokenByAccessTokenResult.expiresIn <= 0) {
                throw new Error('Expired access token provided');
            }

            return findAccessTokenByAccessTokenResult;

        });

    }

    isEmptyOrSpace(str) {
        return str == undefined || str === null || str.match(/^ *$/) !== null;
    }
}