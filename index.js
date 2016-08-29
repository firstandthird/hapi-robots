'use strict';
const _ = require('lodash');

const defaults = {
  // if set to true, will disallow everyone:
  blockAll: true,
  disallowList: [
  ]
};

exports.register = (server, options, next) => {
  const pluginOptions = _.defaults(defaults, options);
  // if not in production mode, nobody is allowed:
  if (process.env.NODE_ENV !== 'production') {
    pluginOptions.blockAll = true;
  }
  const robotText = `User-agent: *`;
  // disallow all:
  if (pluginOptions.blockAll) {
    robotText = '\nDisallow: /';
  // allow all:
} else if (pluginOptions.disallowList.length === 0) {
    robotText = '\nDisallow: ';
  // enumerate disallow list:
  } else {
    pluginOptions.robotText.forEach((rule) => {
      robotText += `\nDisallow: ${rule}`;
    });
  }
  pluginOptions.crawlingEnabled = process.env.NODE_ENV === 'production';
  if (!pluginOptions.crawlingEnabled) {
    server.route({
      path: 'robots.txt',
      method: 'GET',
      handler: (request, reply) => {
        reply(robotText);
      }
    });
  }
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
