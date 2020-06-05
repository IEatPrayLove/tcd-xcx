const path = require('path')

const config = {
  projectName: 'island-zhancan',
  date: '2019-7-21',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: {
    babel: {
      sourceMap: true,
      presets: [
        ['env', {
          modules: false
        }]
      ],
      plugins: [
        'transform-decorators-legacy',
        'transform-class-properties',
        'transform-object-rest-spread'
      ]
      // uglify: {
      //   enable: true,
      //   config: {
      //     // 配置项同 https://github.com/mishoo/UglifyJS2#minify-options
      //   }
      // }
    },
    sass: {
      resource: path.resolve(__dirname, '..', 'src/styles/configScss.scss'),
      projectDirectory: path.resolve(__dirname, '..')
    }
  },
  defineConstants: {
  },
  copy: {
    patterns: [
      { from: 'src/components/html2wxml-template/html2wxml.wxml', to: 'dist/components/html2wxml-template/' }
    ],
    options: {
    }
  },
  weapp: {
    module: {
      postcss: {
        autoprefixer: {
          enable: true,
          config: {
            browsers: [
              'last 3 versions',
              'Android >= 4.1',
              'ios >= 8'
            ]
          }
        },
        pxtransform: {
          enable: true,
          config: {

          }
        },
        url: {
          enable: true,
          config: {
            limit: 10240 // 设定转换尺寸上限
          }
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    },
    // compile: {
    //   exclude: [
    //     'node_modules/mqtt/dist/mqtt.min.js'
    //   ]
    // }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    module: {
      postcss: {
        autoprefixer: {
          enable: true,
          config: {
            browsers: [
              'last 3 versions',
              'Android >= 4.1',
              'ios >= 8'
            ]
          }
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    }
  },
  mini: {
    compile: {
      exclude: [
        path.resolve(__dirname, '..', 'src/package/otherScanOrder/model/mqtt.js')
      ]
    }
  }

}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'))
  }
  return merge({}, config, require('./prod'))
}
