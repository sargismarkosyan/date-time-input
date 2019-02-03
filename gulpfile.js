const {series, parallel, src, dest} = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const clean = require('gulp-clean');
const umd = require('gulp-umd');

var appFiles = [
  './app/app.js',
  './app/vendor/*.js',
  './app/util/*.js',
  './app/model/*.js',
  './app/service/*.js'
];
var distPath = './dist';
var distName = 'dateTimeInput';

function cleanDist() {
  return src(distPath + '/*', {read: false})
    .pipe(clean({force: true}));
}

function merge() {
  return src(appFiles)
    .pipe(concat(distName + '.js'))
    .pipe(dest(distPath));
}

function umdDist() {
  return src(`${distPath}/${distName}.js`)
    .pipe(umd({
      dependencies: function (file) {
        return [
          {
            name: 'jQuery',
            amd: 'jQuery',
            cjs: 'jQuery',
            global: 'jQuery',
            param: '$'
          },
          {
            name: '_',
            amd: 'lodash',
            cjs: 'lodash',
            global: '_',
            param: '_'
          }
        ];
      },
      exports: function (file) {
        return 'dateTimeInput';
      },
      namespace: function (file) {
        return 'dateTimeInput';
      }
    }))
    .pipe(dest(distPath));
}

function minify() {
  return src(`${distPath}/${distName}.js`)
    .pipe(rename({extname: '.min.js'}))
    .pipe(sourcemaps.init())
    .pipe(uglify({
      mangle: true,
      output: {
        max_line_len: 500
      }
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(dest(distPath));
}

exports.build = series(cleanDist, merge, umdDist, minify);
exports.default = exports.build;

/*exports.build = series(
  clean,
  parallel(
    cssTranspile,
    series(jsTranspile, jsBundle)
  ),
  parallel(cssMinify, jsMinify),
  publish
);*/