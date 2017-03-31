"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Imports
const express = require("express");
// Imports middleware
const index_1 = require("./index");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
// Imports repositories
const repository_1 = require("./repositories/repository");
const mock_repository_1 = require("./repositories/mock-repository");
class WebApi {
    constructor(app, port, repository, validateCredentialsFn, idExpiryMiliseconds, codeExpiryMiliseconds, accessTokenExpiryMiliseconds) {
        this.app = app;
        this.port = port;
        this.repository = repository;
        this.validateCredentialsFn = validateCredentialsFn;
        this.idExpiryMiliseconds = idExpiryMiliseconds;
        this.codeExpiryMiliseconds = codeExpiryMiliseconds;
        this.accessTokenExpiryMiliseconds = accessTokenExpiryMiliseconds;
        if (this.repository == null) {
            this.repository = new repository_1.Repository('mongodb://localhost/oauth2_middleware');
        }
        this.configureMiddleware(app);
        this.configureRoutes(app);
    }
    configureMiddleware(app) {
        app.use(cookieParser());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
    }
    configureRoutes(app) {
        app.use("/auth", new index_1.OAuth2Middleware(this.validateCredentialsFn, this.repository, this.idExpiryMiliseconds, this.codeExpiryMiliseconds, this.accessTokenExpiryMiliseconds).router);
    }
    getApp() {
        return this.app;
    }
    run() {
        this.app.listen(this.port);
    }
}
exports.WebApi = WebApi;
// import * as mongo from 'mongodb';
// import { Db } from 'mongodb';
// let mongoClient: mongo.MongoClient = mongo.MongoClient;
// let uri = 'mongodb://localhost/oauth2_middleware';
// mongoClient.connect(uri).then((db: Db) => {
//     let collection = db.collection('clients');
//     return collection.insert({
//         name: 'Demo App',
//         clientId: '1234567890',
//         clientSecret: '0987654321',
//         redirectUris: [
//             'http://demo1.local/callback',
//             'http://demo2.local/callback'
//         ]
//     });
// }).then((result: any) => {
//     console.log('DONE');
//     return true;
// });
function validateCredentialsFn(clientId, username, password) {
    if (username == 'demousername' && password == 'demopassword') {
        return Promise.resolve(true);
    }
    else {
        return Promise.resolve(false);
    }
}
if (require.main === module) {
    let port = 3000;
    let api = new WebApi(express(), port, new mock_repository_1.MockRepository(), validateCredentialsFn, 120000, 30000, 1800000);
    api.run();
}
