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

let port = 3000;
let api = new WebApi(express(), port);
api.run();
