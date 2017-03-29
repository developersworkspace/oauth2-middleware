import 'mocha';
import { expect } from 'chai';
import * as request from 'supertest';
import express = require("express");

import { WebApi } from './app';

import { Repository } from './repository';

let api = new WebApi(express(), 8000);

let validClientId = '1234567890';
let validResponseType = 'code';
let validRedirectUri = 'http://demo1.local/callback';
let validScope = 'read';

let validId = 'fe6c6cd5-3d3f-49ed-838b-52f3383cb733';

let invalidId = 'fakeid';

let validUsername = 'demousername';
let validPassword = 'demopassword';

let invalidUsername = 'fakeusername';
let invalidPassword = 'fakepassword';

let invalidResponseType = 'fakeresponsetype';

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

  it('should respond with status code 302 given valid parameters', (done) => {
    request(api.getApp())
      .get(`/auth/authorize?response_type=${validResponseType}&client_id=${validClientId}&redirect_uri=${validRedirectUri}&scope=${validScope}`)
      .expect('Location', /login\?id=[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/)
      .expect(302, done);
  });
});

describe('POST /auth/login', () => {

   beforeEach((done: Function) => {

     let repository = new Repository();

     let p1 = repository.saveAuthorizeInformation(validId, validResponseType, validClientId, validRedirectUri, validScope);

     Promise.all([
       p1
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