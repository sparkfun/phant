'use strict';

module.exports = function(grunt) {
  // Show elapsed time at the end
  require('time-grunt')(grunt);
  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      app: {
        src: 'lib/*.js'
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib']
      }
    },
    jsbeautifier: {
      files: [
        'Gruntfile.js',
        'lib/*.js',
        'test/*.js'
      ],
      options: {
        js: {
          indentChar: ' ',
          indentSize: 2
        }
      }
    }
  });

  // Default task.
  grunt.registerTask('default', ['jsbeautifier', 'jshint']);

};
