/*jshint camelcase: false*/
// Generated on 2013-08-01 using generator-chrome-extension 0.2.3

module.exports = function (grunt) {
  'use strict';

  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // configurable paths
  var config = {
    app: 'app',
    dist: 'dist',
    resources: 'resources'
  };

  grunt.initConfig({
    config: config,
    clean: {
      dist: {
        files: [
          {
            dot: true,
            src: [
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
        '<%= config.app %>/{,*/}*.js'
      ]
    },
    useminPrepare: {
      options: {
        dest: '<%= config.dist %>'
      },
      html: [
        '<%= config.app %>/{,*/}*.html'
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
        files: [
          {
            expand: true,
            cwd: '<%= config.app %>/images',
            src: '{,*/}*.{png,jpg,jpeg}',
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
        files: [
          {
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
        files: [
          {
            expand: true,
            cwd: '<%= config.app %>',
            dest: '<%= config.dist %>/node-webkit.app/Contents/Resources/app.nw',
            src: '**'
          }
        ]
      },
      webkit: {
        files: [
          {
            expand: true,
            cwd: '<%=config.resources %>/node-webkit/mac-os',
            dest: '<%= config.dist %>/',
            src: '**'
          }
        ]
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
    exec('mkdir dist; cp resources/node-webkit/linux_ia64/nw.pak dist/ && cat resources/node-webkit/linux_ia64/nw tmp/app.zip > dist/qq && chmod a+x dist/qq; touch dist/ready', function (error, stdout, stderr) {
      console.log(stderr, stdout, error);
    });
    while (!fs.existsSync('dist/ready')) {
    }
  });

  grunt.registerTask('dist-linux', [
    'jshint',
    'clean:dist',
    'compress:app',
    'createLinuxApp'
  ]);

  grunt.registerTask('dist', [
    'jshint',
    'clean:dist',
    'copy:webkit',
    'copy:app',
    'chmod'
  ]);

  grunt.registerTask('check', [
    'jshint'
  ]);

};
