'use strict';
const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hapi = require('hapi');
const robotModule = require('../index.js');
const fs = require('fs');

lab.experiment('hapi-robots', () => {
  let server;

  lab.beforeEach(async() => {
    server = new Hapi.Server();
    await server.start();
  });

  lab.afterEach(async() => {
    await server.stop();
  });

  lab.test('disallows everything if env is not recognized', async() => {
    await server.register({
      plugin: robotModule,
      options: {
        env: 'totally random'
      }
    });
    const response = await server.inject({
      method: 'get',
      url: '/robots.txt'
    });
    Code.expect(response.statusCode).to.equal(200);
    const str = fs.readFileSync('./test/expectedOutputs/disallowAll.txt').toString();
    Code.expect(response.payload).to.equal(str);
    Code.expect(response.headers['content-type']).to.include('text/plain');
  });

  lab.test('allows everything if env is production mode', async() => {
    await server.register({
      plugin: robotModule,
      options: {
        env: 'production'
      }
    });
    const response = await server.inject({
      method: 'get',
      url: '/robots.txt'
    });
    Code.expect(response.statusCode).to.equal(200);
    const str = fs.readFileSync('./test/expectedOutputs/allowAll.txt').toString();
    Code.expect(response.payload).to.equal(str);
  });

  lab.test('allows options for different environments', async() => {
    await server.register({
      plugin: robotModule,
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
    });
    const response = await server.inject({
      method: 'get',
      url: '/robots.txt'
    });
    Code.expect(response.statusCode).to.equal(200);
    const str = fs.readFileSync('./test/expectedOutputs/production.txt').toString();
    Code.expect(response.payload).to.equal(str);
  });

  lab.test('will allow all for a specific robot, if specified', async() => {
    await server.register({
      plugin: robotModule,
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
    });
    const response = await server.inject({
      method: 'get',
      url: '/robots.txt'
    });
    Code.expect(response.statusCode).to.equal(200);
    const str = fs.readFileSync('./test/expectedOutputs/fred.txt').toString();
    Code.expect(response.payload).to.equal(str);
  });

  lab.test('options support multiple hosts as well', async() => {
    const options = {
      verbose: true,
      env: 'staging',
      hosts: {
        letterman: {
          // nobody has access:
          '*': ['/']
        },
        martha: {
          // nobody has access:
          '*': ['/'],
          // except for Fred, Fred has access to everything:
          Fred: []
        }
      }
    };
    await server.register({
      plugin: robotModule,
      options
    });
    const response = await server.inject({
      method: 'get',
      url: '/robots.txt',
      headers: {
        host: 'martha'
      }
    });
    Code.expect(response.statusCode).to.equal(200);
    const str = fs.readFileSync('./test/expectedOutputs/fred.txt').toString();
    Code.expect(response.payload).to.equal(str);
  });

  lab.test('fallback if host not specified to default env', async() => {
    const options = {
      verbose: true,
      env: 'staging',
      hosts: {
        letterman: {
          // nobody has access:
          '*': ['/']
        },
        martha: {
          // nobody has access:
          '*': ['/'],
          // except for Fred, Fred has access to everything:
          Fred: []
        }
      }
    };
    await server.register({
      plugin: robotModule,
      options
    });
    const response = await server.inject({
      method: 'get',
      url: '/robots.txt',
      headers: {
        host: 'leno'
      }
    });
    Code.expect(response.statusCode).to.equal(200);
    const str = fs.readFileSync('./test/expectedOutputs/disallowAll.txt').toString();
    Code.expect(response.payload).to.equal(str);
    Code.expect(response.headers['content-type']).to.include('text/plain');
  });

  lab.test('will default to disallow all', async() => {
    await server.register({
      plugin: robotModule,
      options: {
        verbose: true,
        envs: {
          production: {
            '*': '/'
          }
        }
      }
    });
    const response = await server.inject({
      method: 'get',
      url: '/robots.txt'
    });
    Code.expect(response.statusCode).to.equal(200);
    const str = fs.readFileSync('./test/expectedOutputs/disallowAll.txt').toString();
    Code.expect(response.payload).to.equal(str);
    Code.expect(response.headers['content-type']).to.include('text/plain');
  });

  lab.test('supports sitemap as abolute path string', async() => {
    await server.register({
      plugin: robotModule,
      options: {
        verbose: true,
        sitemap: 'http://somewhere.com/sitemap.xml'
      }
    });
    const response = await server.inject({
      method: 'get',
      url: '/robots.txt'
    });
    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.payload.includes('Sitemap: http://somewhere.com/sitemap.xml')).to.equal(true);
  });

  lab.test('supports sitemap as relative path string', async() => {
    await server.register({
      plugin: robotModule,
      options: {
        verbose: true,
        sitemap: '/sitemap.xml'
      }
    });
    let hostname = '';
    server.route({
      path: '/gethost',
      method: 'GET',
      handler: (request, h) => {
        hostname = request.info.host;
      }
    });
    await server.inject({
      method: 'get',
      url: '/gethost'
    });
    const response = await server.inject({
      method: 'get',
      url: '/robots.txt'
    });
    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.payload.includes(`Sitemap: ${hostname}/sitemap.xml`)).to.equal(true);
  });

  lab.test('supports sitemap as array of strings', async() => {
    await server.register({
      plugin: robotModule,
      options: {
        verbose: true,
        sitemap: ['http://somewhere.com/sitemap.xml', 'https://somewhere.com/sitemap-categories.xml']
      }
    });
    const response = await server.inject({
      method: 'get',
      url: '/robots.txt'
    });
    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.payload.includes('Sitemap: http://somewhere.com/sitemap.xml')).to.equal(true);
    Code.expect(response.payload.includes('Sitemap: https://somewhere.com/sitemap-categories.xml')).to.equal(true);
  });

  lab.test('supports forceHttps', async() => {
    await server.register({
      plugin: robotModule,
      options: {
        verbose: true,
        forceHttps: true,
        sitemap: ['http://somewhere.com/sitemap.xml', 'http://somewhere.com/sitemap-categories.xml', '/sitemap.xml']
      }
    });
    const response = await server.inject({
      method: 'get',
      url: '/robots.txt'
    });
    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.payload.includes('Sitemap: https://somewhere.com/sitemap.xml')).to.equal(true);
    Code.expect(response.payload.includes('Sitemap: https://somewhere.com/sitemap-categories.xml')).to.equal(true);
    Code.expect(response.payload.includes('Sitemap: https://somewhere.com/sitemap-categories.xml')).to.equal(true);
  });

  lab.test('returns https if server host is set to do that', async() => {
    await server.register({
      plugin: robotModule,
      options: {
        verbose: true,
        sitemap: ['http://somewhere.com/sitemap.xml', 'http://somewhere.com/sitemap-categories.xml', '/sitemap.xml']
      }
    });
    server.info.protocol = 'https';
    // set up a route to get the request hostname
    let hostname = '';
    server.route({
      path: '/gethost',
      method: 'GET',
      handler: (request, h) => {
        hostname = request.info.host;
      }
    });
    await server.inject({
      method: 'get',
      url: '/gethost'
    });
    const response = await server.inject({
      method: 'get',
      url: '/robots.txt'
    });
    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.payload.includes('Sitemap: https://somewhere.com/sitemap.xml')).to.equal(true);
    Code.expect(response.payload.includes('Sitemap: https://somewhere.com/sitemap-categories.xml')).to.equal(true);
    Code.expect(response.payload.includes(`Sitemap: ${hostname.replace('http', 'https')}/sitemap.xml`)).to.equal(true);
  });
});
