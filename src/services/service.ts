// Imports
import * as uuid from 'uuid';

// Imports repositories
import { IRepository } from './../repositories/repository';

export class Service {

    constructor(private validateCredentialsFn: Function, private repository: IRepository, private idExpiryMiliseconds, private codeExpiryMiliseconds, private accessTokenExpiryMiliseconds) {

    }

    validateCode(clientId: string, clientSecret: string, code: string, redirectUri: string): Promise<Boolean> {
        return this.repository.findCodeByCode(code).then((findCodeByCodeResult: any) => {
            if (findCodeByCodeResult == null) {
                return null;
            }

            if (findCodeByCodeResult.expiryTimestamp < new Date().getTime()) {
                return null;
            }

            return this.findAuthorizeInformationById(findCodeByCodeResult.id);
        }).then((findAuthorizeInformationByIdResult: any) => {
            if (findAuthorizeInformationByIdResult == null) {
                return null;
            }

            if (findAuthorizeInformationByIdResult.clientId != clientId) {
                return null;
            }

            if (findAuthorizeInformationByIdResult.redirectUri != redirectUri) {
                return null;
            }


            return this.repository.findClientByClientId(clientId);
        }).then((findClientByClientIdResult: any) => {
            if (findClientByClientIdResult == null) {
                return false;
            }

            if (findClientByClientIdResult.clientSecret != clientSecret) {
                return false;
            }

            return true;
        })
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

    findUsernameByCode(code: string): Promise<string> {
        return this.repository.findCodeByCode(code).then((findCodeByCodeResult: any) => {
            if (findCodeByCodeResult == null) {
                return null;
            }

            return findCodeByCodeResult.username;
        });
    }

    validateCredentials(clientId: string, username: string, password: string): Promise<Boolean> {
        return this.validateCredentialsFn(clientId, username, password);
    }

    findAuthorizeInformationById(id: string): Promise<any> {
        return this.repository.findAuthorizeInformationById(id);
    }

    findNameByClientId(clientId: string): Promise<string> {
        return this.repository.findClientByClientId(clientId).then((findClientByClientIdResult: any) => {
            return findClientByClientIdResult.name;
        });
    }

    validateClientId(clientId: string, redirectUri: string): Promise<Boolean> {
        return this.repository.findClientByClientId(clientId).then((findClientByClientIdResult: any) => {
            if (findClientByClientIdResult == null) {
                return false;
            }

            if (findClientByClientIdResult.redirectUris.indexOf(redirectUri) == -1) {
                return false;
            }
            return true;
        });
    }

    saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string, state: string): Promise<Boolean> {
        let expiryTimestamp = new Date().getTime() + this.idExpiryMiliseconds;
        return this.repository.saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope, state, expiryTimestamp);
    }

    saveSession(sessionId: string, username: string, clientId: string): Promise<Boolean> {
        return this.repository.saveSession(sessionId, username, clientId);
    }

    validateSessionId(sessionId: string): Promise<Boolean> {
        return this.repository.findSessionBySessionId(sessionId)
            .then((findSessionBySessionIdResult: any) => {
                if (findSessionBySessionIdResult == null) {
                    return false;
                }

                return true;
            });
    }

    findSessionBySessionId(sessionId: string): Promise<string> {
        return this.repository.findSessionBySessionId(sessionId)
            .then((findSessionBySessionIdResult: any) => {
                if (findSessionBySessionIdResult == null) {
                    return null;
                }

                return findSessionBySessionIdResult;
            });
    }

    isEmptyOrSpace(str) {
        return str == undefined || str === null || str.match(/^ *$/) !== null;
    }
}