var postcss = require('gulp-postcss');
var gulp = require('gulp');
var autoprefixer = require('autoprefixer');
var csswring = require('csswring');

gulp.task('css', function () {
    var processors = [
        autoprefixer({browsers: ['> 1% in US']}),
        csswring
    ];
    return gulp.src('./assets/css/style.css')
        .pipe(postcss(processors))
        .pipe(gulp.dest('./assets/css/'));
});