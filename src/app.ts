// Imports
import express = require("express");
import bodyParser = require('body-parser');

import { OAuth2Middleware } from './router';

export class WebApi {

    constructor(private app: express.Express, private port: number) {
        this.configureMiddleware(app);
        this.configureRoutes(app);
    }

    private configureMiddleware(app: express.Express) {
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
    }

    private configureRoutes(app: express.Express) {
        app.use("/auth", new OAuth2Middleware(new TestFn()).router);
    }

    public getApp() {
        return this.app;
    }

    public run() {
        this.app.listen(this.port);
    }
}

class TestFn {

}

import * as mongo from 'mongodb';
import { Db } from 'mongodb';

let mongoClient: mongo.MongoClient = mongo.MongoClient;
let uri = 'mongodb://localhost/oauth2_middleware';

mongoClient.connect(uri).then((db: Db) => {
    let collection = db.collection('clients');
    return collection.insert({
        name: 'Demo App',
        clientId: '1234567890',
        clientSecret: '0987654321',
        redirectUris: [
            'http://demo1.local/callback',
            'http://demo2.local/callback'
        ]
    });
}).then((result: any) => {
    console.log('DONE');
    return true;
});

let port = 3000;
let api = new WebApi(express(), port);
api.run();
