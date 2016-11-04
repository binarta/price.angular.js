var gulp = require('gulp'),
    minifyHtml = require('gulp-minify-html'),
    templateCache = require('gulp-angular-templatecache');

var minifyHtmlOpts = {
    empty: true,
    cdata: true,
    conditionals: true,
    spare: true,
    quotes: true
};

gulp.task('price', function () {
    gulp.src('template/*.html')
        .pipe(minifyHtml(minifyHtmlOpts))
        .pipe(templateCache('price-tpls.js', {standalone: true, module: 'bin.price.templates'}))
        .pipe(gulp.dest('src'));
});

gulp.task('price-clerk-bootstrap3', function () {
    gulp.src('template/clerk/bootstrap3/*.html')
        .pipe(minifyHtml(minifyHtmlOpts))
        .pipe(templateCache('price-clerk-tpls-bootstrap3.js', {standalone: false, module: 'bin.price.templates'}))
        .pipe(gulp.dest('src'));
});

gulp.task('default', ['price', 'price-clerk-bootstrap3']);