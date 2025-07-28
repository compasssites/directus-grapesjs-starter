const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const fs = require('fs');

module.exports = {
  mode: 'development',
  entry: {
    app: './src/app.js',
    test: './src/test.js'
  },
  output: {
    filename: 'js/[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true,
    assetModuleFilename: 'assets/[name][ext][query]',
    library: 'DirectusGrapesJSBuilder',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      grapesjs: 'grapesjs',
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new HtmlWebpackPlugin({
      template: 'index.html',
      filename: 'index.html',
      inject: 'body',
      minify: false,
      chunks: ['app'],
      scriptLoading: 'defer',
      templateParameters: {
        title: 'Directus GrapesJS Builder'
      }
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'node_modules/grapesjs/dist/grapes.min.js'),
          to: 'js/grapes.min.js'
        },
        {
          from: path.resolve(__dirname, 'node_modules/grapesjs/dist/css/grapes.min.css'),
          to: 'css/grapes.min.css'
        },
        {
          from: path.resolve(__dirname, 'node_modules/grapesjs-preset-webpage/dist/index.js'),
          to: 'js/grapesjs-preset-webpage.js'
        }
      ]
    })
  ],
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist'),
        publicPath: '/',
        watch: true
      },
      {
        directory: path.join(__dirname, 'public'),
        publicPath: '/public',
        watch: true
      }
    ],
    compress: true,
    port: 3001,
    hot: true,
    open: true,
    historyApiFallback: true,
    client: {
      overlay: {
        errors: true,
        warnings: false
      },
      logging: 'error',
      progress: true
    },
    devMiddleware: {
      writeToDisk: true,
      stats: 'errors-only',
      publicPath: '/'
    },
    watchFiles: {
      paths: ['src/**/*', 'public/**/*'],
      options: {
        usePolling: false
      }
    }
  },
  devtool: 'source-map'
};
