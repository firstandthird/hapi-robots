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
  verbose: true,
  envs: {
    production: allowAll,
    '*': disallowAll
  },
  env: process.env.NODE_ENV ? process.env.NODE_ENV : '*'
};

exports.register = (server, options, next) => {
  const pluginOptions = _.defaultsDeep(options, defaults);
  // get the appropriate robot environment for an incoming HTTP request:
  const getEnv = (request) => {
    let envs = pluginOptions.envs;
    // if they defined a set of 'hosts', try to find a match for the host that sent this request:
    if (pluginOptions.hosts !== undefined) {
      if (pluginOptions.hosts[request.info.host] !== undefined) {
        envs = pluginOptions.hosts[request.info.host].envs;
        // otherwise just use the '*' wildcard host:
      } else if (pluginOptions.hosts['*'] !== undefined) {
        envs = pluginOptions.hosts['*'].envs;
      }
    }
    // if no envs list was defined or this env doesn't exist, use the '*' wildcard env:
    if (envs === undefined || envs[pluginOptions.env] === undefined) {
      return envs['*'];
    }
    // return the env we found:
    return envs[pluginOptions.env];
  };

  server.route({
    path: '/robots.txt',
    method: 'GET',
    config: {
      auth: false
    },
    handler: (request, reply) => {
      // render the robot.txt:
      let first = true;
      let robotText = _.reduce(getEnv(request), (memo, disallowList, userAgent) => {
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
      if (pluginOptions.verbose) {
        server.log(['hapi-robots', 'info'], {
          message: 'robots.txt queried',
          userAgent: request.headers['user-agent'],
          host: request.info.host,
          robots: robotText });
      }
      reply(robotText).type('text/plain');
    }
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
