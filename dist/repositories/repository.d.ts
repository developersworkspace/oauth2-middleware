export declare class Repository implements IRepository {
    private uri;
    private mongoClient;
    constructor(uri: string);
    saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string, state: string, expiryTimestamp: number): Promise<Boolean>;
    findAuthorizeInformationById(id: string): Promise<any>;
    findClientByClientId(clientId: string): Promise<any>;
    saveCode(id: string, code: string, clientId: string, username: string, expiryTimestamp: number): Promise<Boolean>;
    saveAccessToken(code: string, accessToken: string, expiryTimestamp: number, scope: string, username: string): Promise<Boolean>;
    findCodeByCode(code: string): Promise<any>;
    saveSession(sessionId: string, username: string, clientId: string): Promise<Boolean>;
    findSessionBySessionId(sessionId: string): Promise<any>;
}
export interface IRepository {
    saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string, state: string, expiryTimestamp: number): Promise<Boolean>;
    findAuthorizeInformationById(id: string): Promise<any>;
    findClientByClientId(clientId: string): Promise<any>;
    saveCode(id: string, code: string, clientId: string, username: string, expiryTimestamp: number): Promise<Boolean>;
    findCodeByCode(code: string): Promise<any>;
    saveAccessToken(code: string, accessToken: string, expiryTimestamp: number, scope: string, username: string): Promise<Boolean>;
    saveSession(sessionId: string, username: string, clientId: string): Promise<Boolean>;
    findSessionBySessionId(sessionId: string): Promise<any>;
}
