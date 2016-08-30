'use strict';
const _ = require('lodash');

// object representing a robots.txt that blocks everything:
const disallowAll = {
  '*': ['/']
};

const defaults = {
  // can be over-ridden by plugin users:
  userAgents: disallowAll,
  // will print out debug info:
  debug: true
};

exports.register = (server, options, next) => {
  const pluginOptions = _.defaults(options, defaults);
  // if not in production mode, nobody is allowed:
  if (process.env.NODE_ENV !== 'production') {
    pluginOptions.userAgents = disallowAll;
  }
  // render the robot.txt:
  let robotText = _.reduce(pluginOptions.userAgents, (memo, disallowList, userAgent) => {
    memo += `\nUser-agent: ${userAgent}`;
    if (typeof disallowList === 'string') {
      memo += `\nDisallow: ${disallowList}`;
      return memo;
    }
    if (disallowList.length === 0) {
        memo += `\nDisallow:`;
        return memo;
    }
    _.each(disallowList, (disallowPath) => {
      memo += `\nDisallow: ${disallowPath}`;
    });
    return memo;
  }, '');
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
