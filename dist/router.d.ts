/// <reference types="express" />
import { Router } from "express";
import { IRepository } from './repository';
export declare class OAuth2Middleware {
    private validateCredentialsFn;
    private repository;
    router: Router;
    constructor(validateCredentialsFn: Function, repository: IRepository);
    private login(req, res, next);
    private submitLogin(req, res, next);
    private authorize(req, res, next);
    private token(req, res, next);
    private renderPage(res, htmlFile, data, status);
    private validateCode(clientId, clientSecret, code, redirectUri);
    private generateCode(id, clientId, username);
    private generateAccessTokenObject(code, clientId, username, scope);
    private findUsernameByCode(code);
    private validateCredentials(clientId, username, password);
    private findAuthorizeInformationById(id);
    private findNameByClientId(clientId);
    private validateClientId(clientId, redirectUri);
    private saveAuthorizeInformation(id, responseType, clientId, redirectUri, scope);
    private isEmptyOrSpace(str);
}
