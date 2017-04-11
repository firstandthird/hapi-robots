'use strict';
const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hapi = require('hapi');
const robotModule = require('../index.js');
const fs = require('fs');

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

  lab.test('disallows everything if env is not recognized', (done) => {
    server.register({
      register: robotModule,
      options: {
        env: 'totally random'
      }
    },
    () => {
      server.inject({
        method: 'get',
        url: '/robots.txt'
      }, (response) => {
        Code.expect(response.statusCode).to.equal(200);
        const str = fs.readFileSync('./test/expectedOutputs/disallowAll.txt').toString();
        Code.expect(response.payload).to.equal(str);
        Code.expect(response.headers['content-type']).to.include('text/plain');
        done();
      });
    });
  });
  lab.test('allows everything if env is production mode', (done) => {
    server.register({
      register: robotModule,
      options: {
        env: 'production'
      }
    },
    () => {
      server.inject({
        method: 'get',
        url: '/robots.txt'
      }, (response) => {
        Code.expect(response.statusCode).to.equal(200);
        const str = fs.readFileSync('./test/expectedOutputs/allowAll.txt').toString();
        Code.expect(response.payload).to.equal(str);
        done();
      });
    });
  });
  lab.test('allows options for different environments', (done) => {
    server.register({
      register: robotModule,
      options: {
        verbose: true,
        envs: {
          staging: {
            R2D2: ['/droid/discrimination/policies'],
            Hel: ['/class/revolt/'],
            Pris: ['/five/years/', '/harrison/ford']
          }
        },
        env: 'staging'
      }
    },
    () => {
      server.inject({
        method: 'get',
        url: '/robots.txt'
      }, (response) => {
        Code.expect(response.statusCode).to.equal(200);
        const str = fs.readFileSync('./test/expectedOutputs/production.txt').toString();
        Code.expect(response.payload).to.equal(str);
        done();
      });
    });
  });
  lab.test('will allow all for a specific robot, if specified', (done) => {
    server.register({
      register: robotModule,
      options: {
        verbose: true,
        envs: {
          production: {
          },
          staging: {
            // nobody has access:
            '*': ['/'],
            // except for Fred, Fred has access to everything:
            Fred: []
          }
        },
        env: 'staging'
      }
    },
    () => {
      server.inject({
        method: 'get',
        url: '/robots.txt'
      }, (response) => {
        Code.expect(response.statusCode).to.equal(200);
        const str = fs.readFileSync('./test/expectedOutputs/fred.txt').toString();
        Code.expect(response.payload).to.equal(str);
        done();
      });
    });
  });

  lab.test('options support multiple hosts as well', (done) => {
    const options = {
      verbose: true,
      env: 'staging',
      hosts: {
        letterman: {
          env: 'production',
          envs: {
            production: {
            },
            staging: {
              // nobody has access:
              '*': ['/']
            }
          }
        },
        martha: {
          envs: {
            staging: {
              // nobody has access:
              '*': ['/'],
              // except for Fred, Fred has access to everything:
              Fred: []
            }
          }
        }
      }
    };
    server.register({
      register: robotModule,
      options
    }, () => {
      server.inject({
        method: 'get',
        url: '/robots.txt',
        headers: {
          host: 'martha'
        }
      }, (response) => {
        Code.expect(response.statusCode).to.equal(200);
        const str = fs.readFileSync('./test/expectedOutputs/fred.txt').toString();
        Code.expect(response.payload).to.equal(str);
        done();
      });
    });
  });

  lab.test('will default to disallow all', (done) => {
    server.register({
      register: robotModule,
      options: {
        verbose: true,
        envs: {
          production: {
            '*': '/'
          }
        }
      }
    },
    () => {
      server.inject({
        method: 'get',
        url: '/robots.txt'
      }, (response) => {
        Code.expect(response.statusCode).to.equal(200);
        const str = fs.readFileSync('./test/expectedOutputs/disallowAll.txt').toString();
        Code.expect(response.payload).to.equal(str);
        Code.expect(response.headers['content-type']).to.include('text/plain');
        done();
      });
    });
  });
});
