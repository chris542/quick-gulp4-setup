const { src, dest, watch, series, parallel } = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const replace = require("gulp-replace");
const browserSync = require("browser-sync");

const files = {
  htmlPath: "./index.html",
  scssPath: "src/scss/**/*.scss",
  jsPath: "src/js/**/*.js"
};

const server = browserSync.create();

function reload(done) {
  server.reload();
  done();
}

function serve(done) {
  server.init({
    server: { baseDir: "./" }
  });
  done();
}

function scssTask() {
  return src(files.scssPath)
    .pipe(sourcemaps.init()) // initialize sourcemaps first
    .pipe(sass()) // compile SCSS to CSS
    .pipe(postcss([autoprefixer(), cssnano()])) // PostCSS plugins
    .pipe(sourcemaps.write(".")) // write sourcemaps file in current directory
    .pipe(dest("dist")); // put final CSS in dist folder
}

function jsTask() {
  return src([
    "./src/js/script.js",
    files.jsPath
    //,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
  ])
    .pipe(concat("all.js"))
    .pipe(uglify())
    .pipe(dest("dist"));
}

// Cachebust
function cacheBustTask() {
  var cbString = new Date().getTime();
  return src([files.htmlPath])
    .pipe(replace(/cb=\d+/g, "cb=" + cbString))
    .pipe(dest("."));
}

function watchTask() {
  watch(
    [files.scssPath, files.jsPath, files.htmlPath],
    { interval: 1000, usePolling: true }, //Makes docker work
    series(parallel(scssTask, jsTask), cacheBustTask, reload)
  );
}

exports.default = series(parallel(scssTask, jsTask), cacheBustTask);
exports.dev = series(
  parallel(scssTask, jsTask),
  cacheBustTask,
  serve,
  watchTask
);
