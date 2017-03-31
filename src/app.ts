// Imports
import express = require("express");


// Imports middleware
import { OAuth2Middleware } from './index';
import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');

// Imports repositories
import { Repository, IRepository } from './repositories/repository';
import { MockRepository } from './repositories/mock-repository';

export class WebApi {

    constructor(private app: express.Express, private port: number, private repository: IRepository, private validateCredentialsFn: Function, private idExpiryMiliseconds, private codeExpiryMiliseconds, private accessTokenExpiryMiliseconds) {

        if (this.repository == null) {
            this.repository = new Repository('mongodb://localhost/oauth2_middleware');
        }

        this.configureMiddleware(app);
        this.configureRoutes(app);
    }

    private configureMiddleware(app: express.Express) {
        app.use(cookieParser())
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
    }

    private configureRoutes(app: express.Express) {
        app.use("/auth", new OAuth2Middleware(this.validateCredentialsFn, this.repository, this.idExpiryMiliseconds, this.codeExpiryMiliseconds, this.accessTokenExpiryMiliseconds).router);
    }

    public getApp() {
        return this.app;
    }

    public run() {
        this.app.listen(this.port);
    }
}



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

function validateCredentialsFn(clientId, username: string, password: string): Promise<Boolean> {
    if (username == 'demousername' && password == 'demopassword') {
        return Promise.resolve(true);
    } else {
        return Promise.resolve(false);
    }
}

if (require.main === module) {
    let port = 3000;
    let api = new WebApi(express(), port, new MockRepository(), validateCredentialsFn, 120000, 30000, 1800000);
    api.run();
}


