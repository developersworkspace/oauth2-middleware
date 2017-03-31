import { IRepository } from './repository';
export declare class MockRepository implements IRepository {
    private authorizeInformation;
    private clients;
    private codes;
    private sessions;
    constructor();
    saveAuthorizeInformation(id: string, responseType: string, clientId: string, redirectUri: string, scope: string, state: string, expiryTimestamp: number): Promise<Boolean>;
    findAuthorizeInformationById(id: string): Promise<any>;
    findClientByClientId(clientId: string): Promise<any>;
    saveCode(id: string, code: string, clientId: string, username: string, expiryTimestamp: number): Promise<Boolean>;
    saveAccessToken(code: string, accessToken: string, expiryTimestamp: number, scope: string, username: string): Promise<Boolean>;
    findCodeByCode(code: string): Promise<any>;
    saveSession(sessionId: string, username: string, clientId: string): Promise<Boolean>;
    findSessionBySessionId(sessionId: string): Promise<any>;
}
