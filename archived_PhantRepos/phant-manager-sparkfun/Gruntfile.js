'use strict';

module.exports = function(grunt) {
  // Show elapsed time at the end
  require('time-grunt')(grunt);
  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    nodeunit: {
      files: ['test/**/*_test.js']
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      app: {
        src: 'index.js'
      },
      routes: {
        src: 'routes/*.js'
      }
    },
    watch: {
      less: {
        files: 'less/*.less',
        tasks: ['less']
      },
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      app: {
        files: '<%= jshint.app.src %>',
        tasks: ['nodeunit', 'jshint:app']
      },
      routes: {
        files: 'routes/*.js',
        tasks: ['nodeunit', 'jshint:routes']
      },
      publicjs: {
        files: 'public/js/src/**/*.js',
        tasks: ['concat', 'uglify']
      }
    },
    bower: {
      install: {
        options: {
          cleanTargetDir: true,
          install: true,
          targetDir: './bower_components'
        }
      }
    },
    less: {
      development: {
        files: {
          "public/css/phant.css": "less/phant.less",
          "public/css/svg.css": "less/svg.less"
        }
      },
      production: {
        options: {
          cleancss: true,
          sourceMap: true
        },
        files: {
          "public/css/phant.min.css": "less/phant.less",
          "public/css/svg.min.css": "less/svg.less"
        }
      }
    },
    shell: {
      serve: {
        options: {
          stdout: true
        },
        command: './.bin/dev'
      }
    },
    concat: {
      dist: {
        src: [
          'third_party/jquery/dist/jquery.js',
          'third_party/ubilabs-geocomplete/jquery.geocomplete.js',
          'third_party/bootstrap/dist/js/bootstrap.js',
          'third_party/bootstrap-tagsinput/src/bootstrap-tagsinput.js',
          'third_party/bootbox/bootbox.js',
          'third_party/handlebars/handlebars.js',
          'third_party/leaflet/dist/leaflet-src.js',
          'third_party/leaflet.markercluster/dist/leaflet.markercluster-src.js',
          'public/js/src/mows.js',
          'public/js/src/map.js',
          'public/js/src/config.js',
          'public/js/src/form.js',
          'public/js/src/stream.js'
        ],
        dest: 'public/js/phant-manager.js',
      }
    },
    concurrent: {
      dev: {
        tasks: ['less', 'concat', 'uglify', 'watch', 'shell:serve']
      },
      options: {
        logConcurrentOutput: true
      }
    },
    jsbeautifier: {
      files: [
        'Gruntfile.js',
        'index.js',
        'routes/*.js',
        'test/*.js'
      ],
      options: {
        js: {
          indentChar: ' ',
          indentSize: 2
        }
      },
    },
    uglify: {
      dest: {
        files: {
          'public/js/phant-manager.min.js': '<%= concat.dist.src %>'
        }
      }
    }
  });

  grunt.registerTask('default', ['jsbeautifier', 'bower', 'jshint', 'less', 'concat', 'uglify', 'nodeunit']);
  grunt.registerTask('dev', ['bower', 'concurrent:dev']);

};
