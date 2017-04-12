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
  // if a set of hosts was configured, use the hapi host name to get the env for that host:
  server.route({
    path: '/robots.txt',
    method: 'GET',
    config: {
      auth: false
    },
    handler: (request, reply) => {
      if (pluginOptions.hosts !== undefined) {
        pluginOptions.envs = pluginOptions.hosts[request.info.host].envs;
      }
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
