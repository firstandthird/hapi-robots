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
        Code.expect(response.statusCode).to.equal(200);
        Code.expect(response.payload).to.include('User-agent: *');
        Code.expect(response.payload).to.include('Disallow: /');
        done();
      });
    });
  });
  lab.test('will allow options if in production mode', (done) => {
    process.env.NODE_ENV = 'production';
    server.register({
      register: robotModule,
      options: {
        userAgents: {
          R2D2: ['/droid/discrimination/policies'],
          Hel: ['/class/revolt/'],
          Pris: ['/five/years/', '/harrison/ford']
        }
      }
    },
    () => {
      server.inject({
        method: 'get',
        url: '/robots.txt'
      }, (response) => {
        Code.expect(response.statusCode).to.equal(200);
        Code.expect(response.payload).to.include('User-agent: Hel');
        Code.expect(response.payload).to.include('Disallow: /five/years');
        done();
      });
    });
  });
  lab.test('will allow all for a specific robot, if specified', (done) => {
    process.env.NODE_ENV = 'production';
    server.register({
      register: robotModule,
      options: {
        userAgents: {
          // nobody has access:
          '*': ['/'],
          // except for Fred, Fred has access to everything:
          Fred: []
        }
      }
    },
    () => {
      server.inject({
        method: 'get',
        url: '/robots.txt'
      }, (response) => {
        Code.expect(response.statusCode).to.equal(200);
        Code.expect(response.payload).to.include('User-agent: *\nDisallow: /\n');
        Code.expect(response.payload).to.include('User-agent: Fred\nDisallow:');
        done();
      });
    });
  });
});
