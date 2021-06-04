var webpack = require('webpack');
var path    = require('path');
var library = 'Atlas';
var output  = library + '4.js';

var config = {
  mode: 'none',
  entry: path.resolve(__dirname + '/index.js'),
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname + '/lib'),
    filename: output,
    library: library,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /\.m?js$/i,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        }
      },
      {
        test:/\.html$/i,
        exclude: /node_modules/,
        loader: 'html-loader',
      },
      {
        test: /\.css$/i,
        loader: 'style-loader',
      },
      {
        test: /\.css$/i,
        loader: 'css-loader',
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        loader: 'file-loader',
      }
    ]
  },
  resolve: {
    alias: {
      Modules: path.resolve(__dirname, 'node_modules')
    },
  },
};

module.exports = config;
