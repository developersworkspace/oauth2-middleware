export declare class Repository implements IRepository {
    private uri;
    private mongoClient;
    constructor(uri: string);
    saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string): Promise<Boolean>;
    findAuthorizeInformationById(id: string): Promise<any>;
    findClientByClientId(clientId: string): Promise<any>;
    saveCode(id: string, code: string, clientId: string, username: string): Promise<Boolean>;
    saveAccessToken(code: string, accessToken: string, expiryTimestamp: number, scope: string, username: string): Promise<Boolean>;
    findCodeByCode(code: string): Promise<any>;
}
export interface IRepository {
    saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string): Promise<Boolean>;
    findAuthorizeInformationById(id: string): Promise<any>;
    findClientByClientId(clientId: string): Promise<any>;
    saveCode(id: string, code: string, clientId: string, username: string): Promise<Boolean>;
    findCodeByCode(code: string): Promise<any>;
    saveAccessToken(code: string, accessToken: string, expiryTimestamp: number, scope: string, username: string): Promise<Boolean>;
}
