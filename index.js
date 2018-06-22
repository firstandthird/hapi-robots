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

const register = (server, options) => {
  const pluginOptions = _.defaultsDeep(options, defaults);
  // get the appropriate robot environment for an incoming HTTP request:
  const getEnv = (request) => {
    // if they defined a set of 'hosts', try to find a match for the host that sent this request:
    if (pluginOptions.hosts !== undefined) {
      if (pluginOptions.hosts[request.info.host] !== undefined) {
        return pluginOptions.hosts[request.info.host];
      }
    }
    // if no envs list was defined or this env doesn't exist, use the '*' wildcard env:
    if (pluginOptions.envs === undefined || pluginOptions.envs[pluginOptions.env] === undefined) {
      return pluginOptions.envs['*'];
    }
    // return the env we found:
    return pluginOptions.envs[pluginOptions.env];
  };

  server.route({
    path: '/robots.txt',
    method: 'GET',
    config: {
      auth: false
    },
    handler: (request, h) => {
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
      // sitemap should be at bottom
      if (options.sitemap) {
        options.sitemap = Array.isArray(options.sitemap) ? options.sitemap : [options.sitemap];
        robotText += os.EOL;
        options.sitemap.forEach(sitemap => {
          if (!sitemap.startsWith('http://') && !sitemap.startsWith('https://')) {
            sitemap = `${server.info.uri}${sitemap}`;
          }
          robotText += `Sitemap: ${sitemap}${os.EOL}`;
        });
      }
      if (pluginOptions.verbose) {
        server.log(['hapi-robots', 'info'], {
          message: 'robots.txt queried',
          userAgent: request.headers['user-agent'],
          host: request.info.host,
          robots: robotText });
      }
      return h.response(robotText).type('text/plain');
    }
  });
};

exports.plugin = {
  name: 'hapi-robots',
  register,
  once: true,
  pkg: require('./package.json')
};
