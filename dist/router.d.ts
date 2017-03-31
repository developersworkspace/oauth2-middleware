/// <reference types="express" />
import { Router } from "express";
import { IRepository } from './repositories/repository';
export declare class OAuth2Middleware {
    private validateCredentialsFn;
    private repository;
    private idExpiryMiliseconds;
    private codeExpiryMiliseconds;
    private accessTokenExpiryMiliseconds;
    router: Router;
    private service;
    constructor(validateCredentialsFn: Function, repository: IRepository, idExpiryMiliseconds: any, codeExpiryMiliseconds: any, accessTokenExpiryMiliseconds: any);
    private login(req, res, next);
    private submitLogin(req, res, next);
    private authorize(req, res, next);
    private token(req, res, next);
    private renderPage(res, htmlFile, data, status);
}
