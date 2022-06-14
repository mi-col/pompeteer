const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  target: 'node',
  mode: 'production',
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.(ts|js)?$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
        }, {
          loader: 'ts-loader',
        }]
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: {
    puppeteer: 'puppeteer'
  },
  plugins: [
    new BundleAnalyzerPlugin()
  ],
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'pompeteer',
      type: 'umd',
    },
    clean: true,
  },
};
