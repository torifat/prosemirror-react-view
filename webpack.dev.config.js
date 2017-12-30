const baseConfig = require('./webpack.base.config');

module.exports = [
  { ...baseConfig, entry: { example: './example' }, externals: {} },
];
