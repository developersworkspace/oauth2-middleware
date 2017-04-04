import { IRepository } from './../repositories/repository';
export declare class Service {
    private validateCredentialsFn;
    private repository;
    private idExpiryMiliseconds;
    private codeExpiryMiliseconds;
    private accessTokenExpiryMiliseconds;
    constructor(validateCredentialsFn: Function, repository: IRepository, idExpiryMiliseconds: any, codeExpiryMiliseconds: any, accessTokenExpiryMiliseconds: any);
    generateCode(id: string, clientId: string, username: string): Promise<string>;
    generateAccessTokenObject(code: string, clientId: string, username: string, scope: string): Promise<any>;
    findCodeByCode(clientId: string, clientSecret: string, code: string, redirectUri: string): Promise<any>;
    validateCredentials(clientId: string, username: string, password: string): Promise<Boolean>;
    findAuthorizeInformationById(id: string): Promise<any>;
    findNameByClientId(clientId: string): Promise<string>;
    findClientByClientId(clientId: string, redirectUri: string): Promise<Boolean>;
    saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string, state: string): Promise<Boolean>;
    saveSession(sessionId: string, username: string, clientId: string): Promise<Boolean>;
    findSessionBySessionId(sessionId: string, clientId: string): Promise<string>;
    findAccessTokenByAccessToken(accessToken: string): Promise<any>;
    isEmptyOrSpace(str: any): boolean;
}
