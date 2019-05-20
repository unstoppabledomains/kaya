const initArgv = require('./argv');
let argv;
if (process.env.NODE_ENV !== 'test') {
  argv = initArgv(yargs).argv;
} else {
  console.log('-------- TEST MODE -------------');
  argv = config.testconfigs.args;
}


if (argv.d.trim() === 'saved/') {
  throw new Error('Saved dir is reserved for saved files');
}

// Stores all the option flags and configurations
// Console defined flag will override the config settings
const options = {
  fixtures: argv.f,
  numAccts: argv.n,
  dataPath: argv.d,
  remote: argv.r,
  verbose: argv.v,
  save: argv.s,
  load: argv.l,
};
