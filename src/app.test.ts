// Imports
import 'mocha';
import { expect } from 'chai';
import * as request from 'supertest';
import express = require("express");

// Imports app
import { WebApi } from './app';

// Imports repositories
import { MockRepository } from './mock-repository';

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


function validateCredentialsFn(clientId, username: string, password: string): Promise<Boolean> {
  if (username == 'demousername' && password == 'demopassword') {
    return Promise.resolve(true);
  } else {
    return Promise.resolve(false);
  }
}
let repository = new MockRepository();
let api = new WebApi(express(), 8000, repository, validateCredentialsFn);

describe('GET /auth/authorize', () => {
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

  it('should respond with status code 401 given invalid client id', (done) => {
    request(api.getApp())
      .get(`/auth/authorize?response_type=${validResponseType}&client_id=${invalidClientId}&redirect_uri=${validRedirectUri}&scope=${validScope}`)
      .expect(401, done);
  });

  it('should respond with status code 401 given invalid redirect uri', (done) => {
    request(api.getApp())
      .get(`/auth/authorize?response_type=${validResponseType}&client_id=${validClientId}&redirect_uri=${invalidRedirectUri}&scope=${validScope}`)
      .expect(401, done);
  });


  it('should respond with status code 302 given valid parameters', (done) => {
    request(api.getApp())
      .get(`/auth/authorize?response_type=${validResponseType}&client_id=${validClientId}&redirect_uri=${validRedirectUri}&scope=${validScope}`)
      .expect('Location', /login\?id=[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/)
      .expect(302, done);
  });
});


describe('GET /auth/login', () => {

  beforeEach((done: Function) => {

    let p1 = repository.saveAuthorizeInformation(validId, validResponseType, validClientId, validRedirectUri, validScope);

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
});

describe('POST /auth/login', () => {

  beforeEach((done: Function) => {

    let p1 = repository.saveAuthorizeInformation(validId, validResponseType, validClientId, validRedirectUri, validScope);
    let p2 = repository.saveCode(validId, validCode, validClientId, validUsername);

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

  it('should respond with status code 302 given valid id, invalid username, invalid password', (done) => {
    request(api.getApp())
      .post(`/auth/login?id=${validId}`)
      .send({
        username: validUsername,
        password: validPassword
      })
      .expect('Location', /.*\?token=[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/)
      .expect(302, done);
  });
});

describe('GET /auth/token', () => {

  beforeEach((done: Function) => {

    let p1 = repository.saveAuthorizeInformation(validId, validResponseType, validClientId, validRedirectUri, validScope);
    let p2 = repository.saveCode(validId, validCode, validClientId, validUsername);

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
      .expect(401, done);
  });

  it('should respond with status code 401 given invalid client secret', (done) => {
    request(api.getApp())
      .get(`/auth/token?client_id=${validClientId}&client_secret=${invalidClientSecret}&grant_type=${validGrantType}&code=${validCode}&redirect_uri=${validRedirectUri}`)
      .expect(401, done);
  });

  it('should respond with status code 401 given invalid redirect uri', (done) => {
    request(api.getApp())
      .get(`/auth/token?client_id=${validClientId}&client_secret=${validClientSecret}&grant_type=${validGrantType}&code=${validCode}&redirect_uri=${invalidRedirectUri}`)
      .expect(401, done);
  });

  it('should respond with status code 401 given invalid token', (done) => {
    request(api.getApp())
      .get(`/auth/token?client_id=${validClientId}&client_secret=${validClientSecret}&grant_type=${validGrantType}&code=${invalidCode}&redirect_uri=${validRedirectUri}`)
      .expect(401, done);
  });

  it('should respond with status code 401 given valid parameters', (done) => {
    request(api.getApp())
      .get(`/auth/token?client_id=${validClientId}&client_secret=${validClientSecret}&grant_type=${validGrantType}&code=${validCode}&redirect_uri=${validRedirectUri}`)
      .expect(200, done);
  });
});