'use strict';
const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hapi = require('hapi');
const robotModule = require('../index.js');

lab.experiment('hapi-redirect', () => {
  let server;

  lab.beforeEach((done) => {
    server = new Hapi.Server();
    server.connection();
    server.start(done);
  });

  lab.afterEach((done) => {
    server.stop(done);
  });

  lab.test('will disallow all if not in production mode', (done) => {
    console.log('--------------------')
    console.log('--------------------')
    console.log('--------------------')
    server.register({
      register: robotModule,
      options: {
        disallowList: ['R2D2', 'Hel']
      }
    },
    () => {
      server.inject({
        method: 'get',
        url: '/robots.txt'
      }, (response) => {
        console.log(response)
        Code.expect(response.statusCode).to.equal(200);
        console.log(Object.keys(response))
        Code.expect(response.headers.location).to.equal('/it/works');
      });
    });
  });
});
