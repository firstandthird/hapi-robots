'use strict';
const _ = require('lodash');
const os = require('os');
// object representing a robots.txt that blocks everything:
const disallowAll = {
  '*': ['/']
};
// object representing a robots.txt that allows everything:
const allowAll = {
  '*': []
};

const defaults = {
  debug: true,
  envs: {
    production: allowAll,
    '*': disallowAll
  },
  env: process.env.NODE_ENV
};

exports.register = (server, options, next) => {
  const pluginOptions = _.defaults(options, defaults);
  // render the robot.txt:
  let first = true;
  // if env not found, use wildcard env:
  if (!pluginOptions.envs[pluginOptions.env]) {
    pluginOptions.env = '*';
  }
  let robotText = _.reduce(pluginOptions.envs[options.env], (memo, disallowList, userAgent) => {
    memo += `${first ? '' : os.EOL}User-agent: ${userAgent}`;
    first = false;
    if (typeof disallowList === 'string') {
      memo += `${os.EOL}Disallow: ${disallowList}`;
      return memo;
    }
    if (disallowList.length === 0) {
        memo += `${os.EOL}Disallow:`;
        return memo;
    }
    _.each(disallowList, (disallowPath) => {
      memo += `${os.EOL}Disallow: ${disallowPath}`;
    });
    return memo;
  }, '');
  robotText += os.EOL;
  if (pluginOptions.debug) {
    server.log(['hapi-robots', 'debug'], robotText);
  }
  server.route({
    path: '/robots.txt',
    method: 'GET',
    handler: (request, reply) => {
      if (pluginOptions.debug) {
        server.log(['hapi-robots', 'debug'], `robots.txt queried by ${request.userAgent}`);
      }
      reply(robotText);
    }
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
