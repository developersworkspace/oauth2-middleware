"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Imports
require("mocha");
const request = require("supertest");
const express = require("express");
// Imports app
const app_1 = require("./app");
// Imports repositories
const mock_repository_1 = require("./repositories/mock-repository");
let validClientId = '1234567890';
let invalidClientId = 'fakeclientid';
let validClientSecret = '0987654321';
let invalidClientSecret = 'fakeclientsecret';
let validRedirectUri = 'http://demo1.local/callback';
let invalidRedirectUri = 'fakeredirecturi';
let validScope = 'read';
let validId = 'fe6c6cd5-3d3f-49ed-838b-52f3383cb733';
let invalidId = 'fakeid';
let validUsername = 'demousername';
let invalidUsername = 'fakeusername';
let validPassword = 'demopassword';
let invalidPassword = 'fakepassword';
let validResponseType = 'code';
let invalidResponseType = 'fakeresponsetype';
let validCode = '9ec40cd1-2750-41aa-b9ca-39dd8da9835d';
let invalidCode = 'fakecode';
let validGrantType = 'authorization_code';
let invalidGrantType = 'fakegranttype';
let validSessionId = '123';
let validSessionId2 = '456';
let invalidSessionId = 'fakesessionid';
let validAccessToken = '123';
let invalidAccessToken = 'fakeaccesstoken';
function validateCredentialsFn(clientId, username, password) {
    if (username == 'demousername' && password == 'demopassword') {
        return Promise.resolve(true);
    }
    else {
        return Promise.resolve(false);
    }
}
let repository;
let api;
describe('GET /auth/authorize', () => {
    beforeEach((done) => {
        repository = new mock_repository_1.MockRepository();
        api = new app_1.WebApi(express(), 8000, repository, validateCredentialsFn, 2000, 2000, 2000);
        let p1 = repository.saveSession(validSessionId, validUsername, validClientId);
        let p2 = repository.saveSession(validSessionId2, validUsername, invalidClientId);
        Promise.all([
            p1,
            p2
        ]).then((result) => {
            done();
        });
    });
    it('should respond with status code 400 given no query parameters', (done) => {
        request(api.getApp())
            .get('/auth/authorize')
            .expect(400, done);
    });
    it('should respond with status code 400 given invalid response type', (done) => {
        request(api.getApp())
            .get(`/auth/authorize?response_type=${invalidResponseType}&client_id=${validClientId}&redirect_uri=${validRedirectUri}&scope=${validScope}`)
            .expect(400, done);
    });
    it('should respond with status code 400 given invalid client id', (done) => {
        request(api.getApp())
            .get(`/auth/authorize?response_type=${validResponseType}&client_id=${invalidClientId}&redirect_uri=${validRedirectUri}&scope=${validScope}`)
            .expect(400, done);
    });
    it('should respond with status code 400 given invalid redirect uri', (done) => {
        request(api.getApp())
            .get(`/auth/authorize?response_type=${validResponseType}&client_id=${validClientId}&redirect_uri=${invalidRedirectUri}&scope=${validScope}`)
            .expect(400, done);
    });
    it('should respond with status code 302 given valid parameters', (done) => {
        request(api.getApp())
            .get(`/auth/authorize?response_type=${validResponseType}&client_id=${validClientId}&redirect_uri=${validRedirectUri}&scope=${validScope}`)
            .expect('Location', /login\?id=[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/)
            .expect(302, done);
    });
    it('should respond with status code 302 given valid parameters and valid session id', (done) => {
        request(api.getApp())
            .get(`/auth/authorize?response_type=${validResponseType}&client_id=${validClientId}&redirect_uri=${validRedirectUri}&scope=${validScope}`)
            .set('Cookie', [`oauth2_session_id_${validClientId}=${validSessionId}`])
            .expect('Location', /.*\?token=[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/)
            .expect(302, done);
    });
    it('should respond with status code 302 given valid parameters and invalid session id', (done) => {
        request(api.getApp())
            .get(`/auth/authorize?response_type=${validResponseType}&client_id=${validClientId}&redirect_uri=${validRedirectUri}&scope=${validScope}`)
            .set('Cookie', [`oauth2_session_id_${validClientId}=${invalidSessionId}`])
            .expect('Location', /login\?id=[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/)
            .expect(302, done);
    });
    it('should respond with status code 302 given valid parameters but incorrect client id and valid session id', (done) => {
        request(api.getApp())
            .get(`/auth/authorize?response_type=${validResponseType}&client_id=${validClientId}&redirect_uri=${validRedirectUri}&scope=${validScope}`)
            .set('Cookie', [`oauth2_session_id_${validClientId}=${validSessionId2}`])
            .expect('Location', /login\?id=[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/)
            .expect(302, done);
    });
});
describe('GET /auth/login', () => {
    beforeEach((done) => {
        repository = new mock_repository_1.MockRepository();
        api = new app_1.WebApi(express(), 8000, repository, validateCredentialsFn, 2000, 2000, 2000);
        let p1 = repository.saveAuthorizeInformation(validId, validResponseType, validClientId, validRedirectUri, validScope, null, new Date().getTime() + 2000);
        Promise.all([
            p1
        ]).then((result) => {
            done();
        });
    });
    it('should respond with status code 200 given valid id', (done) => {
        request(api.getApp())
            .get(`/auth/login?id=${validId}`)
            .expect(200, done);
    });
    it('should respond with status code 400 given invalid id', (done) => {
        request(api.getApp())
            .get(`/auth/login?id=${invalidId}`)
            .expect(400, done);
    });
    it('should respond with status code 400 given no query parameters', (done) => {
        request(api.getApp())
            .get(`/auth/login`)
            .expect(400, done);
    });
    it('should respond with status code 200 given valid id which expired', (done) => {
        wait(4000).then((result) => {
            request(api.getApp())
                .get(`/auth/login?id=${validId}`)
                .expect(400, done);
        });
    });
});
describe('POST /auth/login', () => {
    beforeEach((done) => {
        repository = new mock_repository_1.MockRepository();
        api = new app_1.WebApi(express(), 8000, repository, validateCredentialsFn, 2000, 2000, 2000);
        let p1 = repository.saveAuthorizeInformation(validId, validResponseType, validClientId, validRedirectUri, validScope, null, new Date().getTime() + 2000);
        let p2 = repository.saveCode(validId, validCode, validClientId, validUsername, 2000);
        Promise.all([
            p1,
            p2
        ]).then((result) => {
            done();
        });
    });
    it('should respond with status code 401 given invalid id, invalid username, invalid password', (done) => {
        request(api.getApp())
            .post(`/auth/login?id=${invalidId}`)
            .send({
            username: invalidUsername,
            password: invalidPassword
        })
            .expect(401, done);
    });
    it('should respond with status code 401 given valid id, invalid username, invalid password', (done) => {
        request(api.getApp())
            .post(`/auth/login?id=${validId}`)
            .send({
            username: invalidUsername,
            password: invalidPassword
        })
            .expect(401, done);
    });
    it('should respond with status code 401 given valid id, valid username, invalid password', (done) => {
        request(api.getApp())
            .post(`/auth/login?id=${validId}`)
            .send({
            username: validUsername,
            password: invalidPassword
        })
            .expect(401, done);
    });
    it('should respond with status code 302 given valid id, valid username, valid password', (done) => {
        request(api.getApp())
            .post(`/auth/login?id=${validId}`)
            .send({
            username: validUsername,
            password: validPassword
        })
            .expect('Location', /.*\?token=[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/)
            .expect(302, done);
    });
    it('should respond with status code 302 given valid id which expired, valid username, valid password', (done) => {
        wait(4000).then((result) => {
            request(api.getApp())
                .post(`/auth/login?id=${validId}`)
                .send({
                username: validUsername,
                password: validPassword
            })
                .expect(401, done);
        });
    });
});
describe('GET /auth/token', () => {
    beforeEach((done) => {
        repository = new mock_repository_1.MockRepository();
        api = new app_1.WebApi(express(), 8000, repository, validateCredentialsFn, 2000, 2000, 2000);
        let p1 = repository.saveAuthorizeInformation(validId, validResponseType, validClientId, validRedirectUri, validScope, null, new Date().getTime() + 2000);
        let p2 = repository.saveCode(validId, validCode, validClientId, validUsername, new Date().getTime() + 2000);
        Promise.all([
            p1,
            p2
        ]).then((result) => {
            done();
        });
    });
    it('should respond with status code 400 given no query parameters', (done) => {
        request(api.getApp())
            .get('/auth/token')
            .expect(400, done);
    });
    it('should respond with status code 400 given invalid grant type', (done) => {
        request(api.getApp())
            .get(`/auth/token?client_id=${validClientId}&client_secret=${validClientSecret}&grant_type=${invalidGrantType}&code=${validCode}&redirect_uri=${validRedirectUri}`)
            .expect(400, done);
    });
    it('should respond with status code 401 given invalid client id', (done) => {
        request(api.getApp())
            .get(`/auth/token?client_id=${invalidClientId}&client_secret=${validClientSecret}&grant_type=${validGrantType}&code=${validCode}&redirect_uri=${validRedirectUri}`)
            .expect(400, done);
    });
    it('should respond with status code 401 given invalid client secret', (done) => {
        request(api.getApp())
            .get(`/auth/token?client_id=${validClientId}&client_secret=${invalidClientSecret}&grant_type=${validGrantType}&code=${validCode}&redirect_uri=${validRedirectUri}`)
            .expect(400, done);
    });
    it('should respond with status code 401 given invalid redirect uri', (done) => {
        request(api.getApp())
            .get(`/auth/token?client_id=${validClientId}&client_secret=${validClientSecret}&grant_type=${validGrantType}&code=${validCode}&redirect_uri=${invalidRedirectUri}`)
            .expect(400, done);
    });
    it('should respond with status code 401 given invalid token', (done) => {
        request(api.getApp())
            .get(`/auth/token?client_id=${validClientId}&client_secret=${validClientSecret}&grant_type=${validGrantType}&code=${invalidCode}&redirect_uri=${validRedirectUri}`)
            .expect(400, done);
    });
    it('should respond with status code 200 given valid parameters', (done) => {
        request(api.getApp())
            .get(`/auth/token?client_id=${validClientId}&client_secret=${validClientSecret}&grant_type=${validGrantType}&code=${validCode}&redirect_uri=${validRedirectUri}`)
            .expect(200, done);
    });
    it('should respond with status code 401 given valid code which expired', (done) => {
        wait(4000).then((result) => {
            request(api.getApp())
                .get(`/auth/token?client_id=${validClientId}&client_secret=${validClientSecret}&grant_type=${validGrantType}&code=${validCode}&redirect_uri=${validRedirectUri}`)
                .expect(400, done);
        });
    });
});
describe('GET /auth/getuser', () => {
    beforeEach((done) => {
        repository = new mock_repository_1.MockRepository();
        api = new app_1.WebApi(express(), 8000, repository, validateCredentialsFn, 2000, 2000, 2000);
        let p1 = repository.saveAccessToken(validCode, validAccessToken, new Date().getTime() + 2000, validScope, validUsername);
        Promise.all([
            p1
        ]).then((result) => {
            done();
        });
    });
    it('should respond with status code 200 given valid access token in header', (done) => {
        request(api.getApp())
            .get('/auth/getuser')
            .set('Authorization', `Bearer ${validAccessToken}`)
            .expect(200, done);
    });
    it('should respond with status code 400 given invalid access token in header', (done) => {
        request(api.getApp())
            .get('/auth/getuser')
            .set('Authorization', `Bearer ${invalidAccessToken}`)
            .expect(400, done);
    });
    it('should respond with status code 400 given no access token in header', (done) => {
        request(api.getApp())
            .get('/auth/getuser')
            .expect(400, done);
    });
    it('should respond with status code 400 given expired access token in header', (done) => {
        wait(4000).then((result) => {
            request(api.getApp())
                .get('/auth/getuser')
                .set('Authorization', `Bearer ${validAccessToken}`)
                .expect(400, done);
        });
    });
});
function wait(miliSeconds) {
    return new Promise(function (resolve, reject) {
        setTimeout(() => {
            resolve();
        }, miliSeconds);
    });
}
