const baseConfig = require('./webpack.base.config');

module.exports = [
  {
    ...baseConfig,
    entry: { example: './example' },
    module: {
      rules: [
        ...baseConfig.module.rules,
        // For clock react component
        {
          test: /\.css/,
          loader: 'css-loader',
        },
        {
          test: /\.less$/,
          use: [
            {
              loader: 'style-loader', // creates style nodes from JS strings
            },
            {
              loader: 'css-loader', // translates CSS into CommonJS
            },
            {
              loader: 'less-loader', // compiles Less to CSS
            },
          ],
        },
      ],
    },
    externals: {},
  },
];
