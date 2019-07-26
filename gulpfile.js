const gulp = require('gulp');

gulp.task('copy-html', function () {
    return gulp.src('./src/popup.html')
        .pipe(gulp.dest('./extension'));
});
