const gulp = require('gulp');
const merge = require('merge-stream');

gulp.task('copy-src', function () {
    let css = gulp.src('./src/css/**')
        .pipe(gulp.dest('./extension/css'));

    let html = gulp.src('./src/popup.html')
        .pipe(gulp.dest('./extension'));

    let manifest = gulp.src('./manifest.json')
        .pipe(gulp.dest('./extension'));

    let icons = gulp.src('./src/icons/**')
        .pipe(gulp.dest('./extension/icons'));

    return merge(css, html, manifest, icons)
});
