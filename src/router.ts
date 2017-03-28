// Imports
import { Express, Request, Response } from "express";
import * as express from 'express';
import * as uuid from 'uuid';
import * as fs from 'graceful-fs';
import * as Handlebars from 'handlebars';

let router = express.Router();

router.get('/authorize', (req: Request, res: Response, next: Function) => {
    let id = uuid.v4();
    let responseType = req.query.response_type;
    let clientId = req.query.client_id;
    let redirectUri = req.query.redirect_uri;
    let scope = req.query.scope;

    // TODO: Save detail with id


    res.redirect(`login?id=${id}`);
});


router.get('/login', (req: Request, res: Response, next: Function) => {
    renderPage(res, 'login.html');
});


function renderPage(res: Response, htmlFile: string) {

    fs.readFile(`${__dirname}/${htmlFile}`, 'utf8', (err: Error, html: string) => {
        if (err) {
            return;
        }

        let template = Handlebars.compile(html);

        let data = {
            name: 'World of Rations'
        };

        let result = template(data);

        res.send(result);

    });
}

export = router;
