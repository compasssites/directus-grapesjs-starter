const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Remove type: "module" from package.json to use CommonJS
// or rename this file to webpack.config.cjs

module.exports = {
  mode: 'development',
  entry: './src/app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
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
    new HtmlWebpackPlugin({
      template: 'index.html',
      inject: 'body',
      minify: false
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'node_modules/grapesjs/dist/css/grapes.min.css',
          to: 'css/grapes.min.css'
        },
        {
          from: 'node_modules/grapesjs/dist/grapes.min.js',
          to: 'js/grapes.min.js'
        },
        {
          from: 'node_modules/grapesjs-preset-webpage/dist/index.js',
          to: 'js/grapesjs-preset-webpage.js'
        }
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
      publicPath: '/'
    },
    compress: true,
    port: 3001,
    hot: true,
    open: true,
    historyApiFallback: true,
    client: {
      overlay: {
        errors: true,
        warnings: false
      }
    },
    devMiddleware: {
      stats: 'errors-only'
    }
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.js']
  }
};
