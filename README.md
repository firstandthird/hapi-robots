# hapi-robots
Hapi plugin for serving up robots.txt

## installation

'npm install hapi-robots'

## usage

```
const Hapi = require('hapi');
const hapiRobots = require('hapi-robots');

server = new Hapi.Server();
server.connection();
server.register({
  register: hapiRobots,
  options: {
    .........
  }
});
```

where ```options``` is an object of the form:

```
{
  // set to true to use server.log to report info about robots.txt and remote attempts to access it:
  debug: false,
  envs: {
    production: {
      // will disallow *all* robots from the path '/noDroidsAllowed':
      '*': ['/noDroidsAllowed'],
      // will disallow robot 'R2D2' from the indicated paths:
      'R2D2': ['/noDroidsAllowed', '/noR2D2Here']
    },
    stage: {
      // will disallow everyone from every path:
      '*': ['/'],
      // except for chuck, chuck is awesome:
      'chuck': []
    },
    // use '*' to match match any other env that isn't listed above:
    '*': ['/']
  },
  // tell hapi-robots which of the above envs to use:
  env: 'production'
}
```

see folder `/test` for more examples
