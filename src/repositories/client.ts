export interface IClientRepository {
    findClientByClientId(clientId: string): Promise<any>;
}