import { IRepository } from './../repositories/repository';
export declare class Service {
    private validateCredentialsFn;
    private repository;
    private idExpiryMiliseconds;
    private codeExpiryMiliseconds;
    private accessTokenExpiryMiliseconds;
    constructor(validateCredentialsFn: Function, repository: IRepository, idExpiryMiliseconds: any, codeExpiryMiliseconds: any, accessTokenExpiryMiliseconds: any);
    validateCode(clientId: string, clientSecret: string, code: string, redirectUri: string): Promise<Boolean>;
    generateCode(id: string, clientId: string, username: string): Promise<string>;
    generateAccessTokenObject(code: string, clientId: string, username: string, scope: string): Promise<any>;
    findUsernameByCode(code: string): Promise<string>;
    validateCredentials(clientId: string, username: string, password: string): Promise<Boolean>;
    findAuthorizeInformationById(id: string): Promise<any>;
    findNameByClientId(clientId: string): Promise<string>;
    validateClientId(clientId: string, redirectUri: string): Promise<Boolean>;
    saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string, state: string): Promise<Boolean>;
    saveSession(sessionId: string, username: string, clientId: string): Promise<Boolean>;
    validateSessionId(sessionId: string): Promise<Boolean>;
    findSessionBySessionId(sessionId: string): Promise<string>;
    isEmptyOrSpace(str: any): boolean;
}
