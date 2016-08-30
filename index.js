'use strict';
const _ = require('lodash');

// object representing a robots.txt that blocks everything:
const disallowAll = {
  '*': ['/']
};

const defaults = {
  debug: true,
  envs: {
    production: disallowAll
  },
  env: 'production'
};

exports.register = (server, options, next) => {
  const pluginOptions = _.defaults(options, defaults);
  // render the robot.txt:
  let first = true;
  let robotText = _.reduce(pluginOptions.envs[options.env], (memo, disallowList, userAgent) => {
    memo += `${first ? '' : '\r\n'}User-agent: ${userAgent}`;
    first = false;
    if (typeof disallowList === 'string') {
      memo += `\r\nDisallow: ${disallowList}`;
      return memo;
    }
    if (disallowList.length === 0) {
        memo += `\r\nDisallow:`;
        return memo;
    }
    _.each(disallowList, (disallowPath) => {
      memo += `\r\nDisallow: ${disallowPath}`;
    });
    return memo;
  }, '');
  robotText += '\r\n';
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
