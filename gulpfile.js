// Init Modules
const { series, parallel, src, dest, watch } = require("gulp");
const sass = require("gulp-sass");
const rename = require("gulp-rename");

const webpackStream = require("webpack-stream");
const webpackConfig = require("./webpack.config");
var browserSync = require('browser-sync').create();

// File Path Variables
const files = {
  source: {
    scss: "./src/scss/index.scss",
    ts: "./src/ts/index.ts",
  },
  public: {
    css: "./public/",
    js: "./public/",
  },
  watch: {
    scss: "./src/scss/**/*.scss",
    ts: "./src/ts/*.ts"
  }
}

// BrowserSync Dev Server
function browsersync() {
  browserSync.init({
    injectChanges: true,
    server: {
      baseDir: "public"
    }
  });
}

// Sass Task
function scssTask() {
  return src( files.source.scss )
    .pipe( sass() )
    .pipe(rename("styles.css"))
    .pipe( dest( files.public.css ));
}

// TS Task 
function tsTask() {
  return src( files.source.ts)
    .pipe( webpackStream( webpackConfig ))
    .pipe(rename("main.js"))
    .pipe( dest( files.public.js ));
}


// Watch Task
function watchTask() {
  // Init browser-sync
  browsersync();
  // Watch files
  watch( [ files.watch.scss, files.watch.ts ] ,
    parallel( scssTask, tsTask )).on('change', browserSync.reload);
}

// Default Task
exports.default = series(
  parallel( scssTask, tsTask ),
  watchTask
);