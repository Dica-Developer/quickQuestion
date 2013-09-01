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
    tmp: 'tmp',
    resources: 'resources'
  };

  grunt.initConfig({
    config: config,
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= config.dist %>/*',
            '<%= config.tmp %>/*'
          ]
        }]
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        '<%= config.app %>/js/server.js',
        '<%= config.app %>/js/auto-update.js',
        '<%= config.app %>/js/guiHandling.js',
        '<%= config.app %>/js/app.js',
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
        files: [{
          expand: true,
          cwd: '<%= config.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg}',
          dest: '<%= config.dist %>/images'
        }]
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
        }]
      }
    },
    copy: {
      appLinux: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>',
          dest: '<%= config.dist %>/app.nw',
          src: '**'
        }]
      },
      appMacos: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>',
          dest: '<%= config.dist %>/node-webkit.app/Contents/Resources/app.nw',
          src: '**'
        },
        {
          expand: true,
          cwd: '<%= config.resources %>/macFiles/',
          dest: '<%= config.dist %>/node-webkit.app/Contents/',
          filter: 'isFile',
          src: '*.plist'
        },
        {
          expand: true,
          cwd: '<%= config.resources %>/macFiles/',
          dest: '<%= config.dist %>/node-webkit.app/Contents/Resources/',
          filter: 'isFile',
          src: '*.icns'
        }]
      },
      webkit: {
        files: [{
          expand: true,
          cwd: '<%=config.resources %>/node-webkit/mac-os',
          dest: '<%= config.dist %>/',
          src: '**'
        }]
      },
      copyWinToTmp: {
        files: [{
          expand: true,
          cwd: '<%= config.resources %>/node-webkit/windows/',
          dest: '<%= config.tmp %>/',
          src: '**'
        }]
      }
    },
    compress: {
      appToTmp: {
        options: {
          archive: '<%= config.tmp %>/app.zip'
        },
        files: [
          {
            expand: true,
            cwd:'<%= config.app %>',
            src: ['**']
          }
        ]
      },
      finalWindowsApp: {
        options: {
          archive: '<%= config.dist %>/QuickQuestion.zip'
        },
        files: [
          {
            expand: true,
            cwd:'<%= config.tmp %>',
            src: ['**']
          }
        ]
      }
    },
    rename: {
      app: {
        files: [
          {
            src: '<%= config.dist %>/node-webkit.app',
            dest: '<%= config.dist %>/Quick Question.app'
          }
        ]
      },
      zipToApp: {
        files: [
          {
            src: '<%= config.tmp %>/app.zip',
            dest: '<%= config.tmp %>/app.nw'
          }
        ]
      }
    }
  });

  grunt.registerTask('chmod', 'Add lost Permissions.', function () {
    var fs = require('fs');
    fs.chmodSync('dist/Quick Question.app/Contents/Frameworks/node-webkit Helper EH.app/Contents/MacOS/node-webkit Helper EH', '555');
    fs.chmodSync('dist/Quick Question.app/Contents/Frameworks/node-webkit Helper NP.app/Contents/MacOS/node-webkit Helper NP', '555');
    fs.chmodSync('dist/Quick Question.app/Contents/Frameworks/node-webkit Helper.app/Contents/MacOS/node-webkit Helper', '555');
    fs.chmodSync('dist/Quick Question.app/Contents/MacOS/node-webkit', '555');
  });

  grunt.registerTask('createLinuxApp', 'Create linux distribution.', function () {
    var fs = require('fs');
    var childProcess = require('child_process');
    var exec = childProcess.exec;
    exec('mkdir dist; cp resources/node-webkit/linux_ia64/nw.pak dist/ && cp resources/node-webkit/linux_ia64/nw dist/qq && chmod a+x dist/qq; touch dist/ready', function (error, stdout, stderr) {
      console.log(stderr, stdout, error);
    });
    while (!fs.existsSync('dist/ready')) {}
  });

  grunt.registerTask('createWindowsApp', 'Create windows distribution.', function () {
    var fs = require('fs');
    var childProcess = require('child_process');
    var exec = childProcess.exec;
    exec('copy /b tmp\\nw.exe+tmp\\app.nw tmp\\QuickQuestion.exe && del tmp\\app.nw tmp\\nw.exe && echo.>tmp\\ready', function (error, stdout, stderr) {
      console.log(stderr, stdout, error);
    });
    while (!fs.existsSync('tmp/ready')) {}
  });

  grunt.registerTask('dist-linux', [
    'jshint',
    'clean:dist',
    'copy:appLinux',
    'createLinuxApp'
  ]);

  grunt.registerTask('dist-win', [
    'jshint',
    'clean:dist',
    'copy:copyWinToTmp',
    'compress:appToTmp',
    'rename:zipToApp',
    'createWindowsApp',
    'compress:finalWindowsApp'
  ]);

  grunt.registerTask('dist', [
    'jshint',
    'clean:dist',
    'copy:webkit',
    'copy:appMacos',
    'rename:app',
    'chmod'
  ]);

  grunt.registerTask('check', [
    'jshint'
  ]);

};