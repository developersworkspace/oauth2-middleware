// Imports
var gulp = require('gulp');
var clean = require('gulp-clean');
var ts = require('gulp-typescript');
var rename = require("gulp-rename");
var sequence = require('run-sequence');
var tslint = require('gulp-tslint');

// Compiles typescript files
gulp.task('compile:ts', function () {
    return gulp
        .src(["./src/**/*.ts"], { base: './src' })
        .pipe(ts({ module: 'commonjs', target: 'es6', noImplicitAny: false }))
        .pipe(gulp.dest('./dist'));
});

// Removes compiled js files
gulp.task('clean', function () {
    return gulp
        .src([
            './dist/**/*.js'
        ], { read: false })
        .pipe(clean())
});


// Copies 'package.json' file to build directory
gulp.task('copy:package.json', function () {
    return gulp
        .src('./package.json')
        .pipe(gulp.dest('./dist'));
});

// Renames config file
gulp.task('rename:config', function () {
    return gulp.src('./dist/config.prod.js', { base: process.cwd() })
        .pipe(rename('config.js'))
        .pipe(gulp.dest('./dist'));
});


// Run tslint
gulp.task("tslint", () =>
    gulp.src("./src/**/*.ts")
        .pipe(tslint({
            extends: "tslint:latest",
            formatter: "verbose"
        }))
        .pipe(tslint.report())
);

// Copies 'loign.html' file to build directory
gulp.task('copy:login.html', function () {
    return gulp
        .src('./src/login.html')
        .pipe(gulp.dest('./dist'));
});

gulp.task('build', function (done) {
    sequence('clean', 'compile:ts', 'copy:package.json', 'rename:config', 'copy:login.html', done);
});

gulp.task('build:dev', function (done) {
    sequence('clean', 'compile:ts', 'copy:package.json', 'copy:login.html', done);
});
