/// <reference types="express" />
import express = require("express");
import { IRepository } from './repository';
export declare class WebApi {
    private app;
    private port;
    private repository;
    private validateCredentialsFn;
    constructor(app: express.Express, port: number, repository: IRepository, validateCredentialsFn: Function);
    private configureMiddleware(app);
    private configureRoutes(app);
    getApp(): express.Express;
    run(): void;
}
