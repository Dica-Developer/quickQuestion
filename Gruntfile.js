/*jshint camelcase: false*/
// Generated on 2013-08-01 using generator-chrome-extension 0.2.3
'use strict';
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // configurable paths
  var config = {
    app: 'app',
    dist: 'dist',
    tmp: 'tmp',
    resources: 'resources'
  };

  grunt.initConfig({
    config: config,
    watch: {
      options: {
        spawn: false
      }
    },
    clean: {
      dist: {
        files: [{
            dot: true,
            src: [
                '<%= config.tmp %>/*',
                '<%= config.dist %>/*'
            ]
          }
        ]
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
          '<%= config.app %>/scripts/{,*/}*.js',
          'test/spec/{,*/}*.js'
      ]
    },
    requirejs: {
      dist: {
        // Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js
        options: {
          // `name` and `out` is set by grunt-usemin
          baseUrl: 'app/scripts',
          optimize: 'none',
          preserveLicenseComments: false,
          useStrict: true,
          wrap: true
        }
      }
    },
    useminPrepare: {
      options: {
        dest: '<%= config.dist %>'
      },
      html: [
          '<%= config.app %>/popup.html',
          '<%= config.app %>/options.html'
      ]
    },
    usemin: {
      options: {
        dirs: ['<%= config.dist %>']
      },
      html: ['<%= config.dist %>/{,*/}*.html'],
      css: ['<%= config.dist %>/styles/{,*/}*.css']
    },
    imagemin: {
      dist: {
        files: [{
            expand: true,
            cwd: '<%= config.app %>/images',
            src: '{,*/}*.{png,jpg,jpeg}',
            dest: '<%= config.dist %>/images'
          }
        ]
      }
    },
    svgmin: {
      dist: {
        files: [{
            expand: true,
            cwd: '<%= config.app %>/images',
            src: '{,*/}*.svg',
            dest: '<%= config.dist %>/images'
          }
        ]
      }
    },
    cssmin: {
      dist: {
        files: {
          '<%= datameerTools.dist %>/styles/main.css': [
              '.tmp/styles/{,*/}*.css',
              '<%= config.app %>/styles/{,*/}*.css'
          ]
        }
      }
    },
    htmlmin: {
      dist: {
        options: {
          /*removeCommentsFromCDATA: true,
           // https://github.com/yeoman/grunt-usemin/issues/44
           //collapseWhitespace: true,
           collapseBooleanAttributes: true,
           removeAttributeQuotes: true,
           removeRedundantAttributes: true,
           useShortDoctype: true,
           removeEmptyAttributes: true,
           removeOptionalTags: true*/
        },
        files: [{
            expand: true,
            cwd: '<%= config.app %>',
            src: '*.html',
            dest: '<%= config.dist %>'
          }
        ]
      }
    },
    copy: {
      app: {
        files: [{
            expand: true,
            cwd: '<%= config.tmp %>',
            dest: '<%= config.dist %>/node-webkit.app/Contents/Resources/',
            src: 'app.zip',
            rename: function (dest, src) {
              return dest + src.substring(0, src.indexOf('/')) + '/app.nw';
            }
          }
        ]
      },
      webkit: {
        files: [{
            expand: true,
            cwd: '<%=config.resources %>/node-webkit/mac-os',
            dest: '<%= config.dist %>/',
            src: '**'
          }
        ]
      }
    },
    concurrent: {
      server: [],
      test: [],
      dist: [
          'imagemin',
          'svgmin',
          'htmlmin'
      ]
    },
    compress: {
      app: {
        options: {
          archive: '<%= config.tmp %>/app.zip'
        },
        files: [{
            expand: true,
            cwd: '<%= config.app %>',
            src: ['**/*'],
            dest: '/'
          }
        ]
      }
    },
    bower: {
      all: {
        rjsConfig: '<%= config.app %>/scripts/popup.js'
      }
    }
  });

  grunt.registerTask('chmod', 'Add lost Permissions.', function () {
    var fs = require('fs');
    fs.chmodSync('dist/node-webkit.app/Contents/Frameworks/node-webkit Helper EH.app/Contents/MacOS/node-webkit Helper EH', '555');
    fs.chmodSync('dist/node-webkit.app/Contents/Frameworks/node-webkit Helper NP.app/Contents/MacOS/node-webkit Helper NP', '555');
    fs.chmodSync('dist/node-webkit.app/Contents/Frameworks/node-webkit Helper.app/Contents/MacOS/node-webkit Helper', '555');
    fs.chmodSync('dist/node-webkit.app/Contents/MacOS/node-webkit', '555');
  });

  grunt.registerTask('createLinuxApp', 'Add lost Permissions.', function () {
    var fs = require('fs');
    var childProcess = require('child_process');
    var exec = childProcess.exec;
    var child = exec('mkdir dist; cp resources/node-webkit/linux_ia64/nw.pak dist/ && cat resources/node-webkit/linux_ia64/nw tmp/app.zip > dist/qq && chmod a+x dist/qq; touch dist/ready', function (error, stdout, stderr) {
      console.log(stderr, stdout, error);
    });
    while (!fs.existsSync('dist/ready')) {
	
    }
  });

  grunt.registerTask('dist-linux', [
      'clean:dist',
      'compress:app',
      'createLinuxApp'
  ]);

  grunt.registerTask('dist', [
      'clean:dist',
      'copy:webkit',
      'compress:app',
      'copy:app',
      'chmod'
  ]);

  grunt.registerTask('test', [
      'clean:server',
      'concurrent:test',
      'connect:test',
      'mocha'
  ]);

  grunt.registerTask('default', [
      'jshint',
      'test',
      'build'
  ]);
};
