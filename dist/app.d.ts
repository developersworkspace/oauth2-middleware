/// <reference types="express" />
import express = require("express");
import { IRepository } from './repositories/repository';
export declare class WebApi {
    private app;
    private port;
    private repository;
    private validateCredentialsFn;
    private idExpiryMiliseconds;
    private codeExpiryMiliseconds;
    private accessTokenExpiryMiliseconds;
    constructor(app: express.Express, port: number, repository: IRepository, validateCredentialsFn: Function, idExpiryMiliseconds: any, codeExpiryMiliseconds: any, accessTokenExpiryMiliseconds: any);
    private configureMiddleware(app);
    private configureRoutes(app);
    getApp(): express.Express;
    run(): void;
}
