import 'mocha';
import { expect } from 'chai';
import * as request from 'supertest';
import express = require("express");

import { WebApi } from './app';

let api = new WebApi(express(), 8000);

let validClientId = '1234567890';
let validResponseType = 'code';
let validRedirectUri = 'http://demo1.local/callback';
let validScope = 'read';

let invalidResponseType = 'invalid';

describe('GET /auth/authorize', () => {
  it('should respond with status code 400 given no query parameters', (done) =>  {
    request(api.getApp())
      .get('/auth/authorize')
      .expect(400, done);
  });

  it('should respond with status code 400 given invalid response type', (done) =>  {
    request(api.getApp())
      .get(`/auth/authorize?response_type=${invalidResponseType}&client_id=${validClientId}&redirect_uri=${validRedirectUri}&scope=${validScope}`)
      .expect(400, done);
  });

  it('should respond with status code 302 given valid parameters', (done) =>  {
    request(api.getApp())
      .get(`/auth/authorize?response_type=${validResponseType}&client_id=${validClientId}&redirect_uri=${validRedirectUri}&scope=${validScope}`)
      .expect('Location', /login\?id=[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/)
      .expect(302, done);
  });
});