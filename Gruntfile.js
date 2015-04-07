/*jshint camelcase: false*/

module.exports = function(grunt) {
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
      files: '<%= config.app %>/js/*.js'
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
          dest: '<%= config.dist %>/nwjs.app/Contents/Resources/app.nw',
          src: '**'
        }, {
          expand: true,
          cwd: '<%= config.resources %>/macFiles/',
          dest: '<%= config.dist %>/nwjs.app/Contents/',
          filter: 'isFile',
          src: '*.plist'
        }, {
          expand: true,
          cwd: '<%= config.resources %>/macFiles/',
          dest: '<%= config.dist %>/nwjs.app/Contents/Resources/',
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
        files: [{
          expand: true,
          cwd: '<%= config.app %>',
          src: ['**']
        }]
      },
      finalWindowsApp: {
        options: {
          archive: '<%= config.dist %>/QuickQuestion.zip'
        },
        files: [{
          expand: true,
          cwd: '<%= config.tmp %>',
          src: ['**']
        }]
      }
    },
    rename: {
      app: {
        files: [{
          src: '<%= config.dist %>/nwjs.app',
          dest: '<%= config.dist %>/Quick Question.app'
        }]
      },
      zipToApp: {
        files: [{
          src: '<%= config.tmp %>/app.zip',
          dest: '<%= config.tmp %>/app.nw'
        }]
      }
    }
  });

  grunt.registerTask('chmod', 'Add lost Permissions.', function() {
    var fs = require('fs');
    fs.chmodSync('dist/Quick Question.app/Contents/Frameworks/nwjs Helper EH.app/Contents/MacOS/nwjs Helper EH', '555');
    fs.chmodSync('dist/Quick Question.app/Contents/Frameworks/nwjs Helper NP.app/Contents/MacOS/nwjs Helper NP', '555');
    fs.chmodSync('dist/Quick Question.app/Contents/Frameworks/nwjs Helper.app/Contents/MacOS/nwjs Helper', '555');
    fs.chmodSync('dist/Quick Question.app/Contents/MacOS/nwjs', '555');
  });

  grunt.registerTask('createLinuxApp', 'Create linux distribution.', function() {
    var done = this.async();
    var childProcess = require('child_process');
    var exec = childProcess.exec;
    exec('mkdir -p ./dist; cp resources/node-webkit/linux_ia64/icudtl.dat dist/ && cp resources/node-webkit/linux_ia64/nw.pak dist/ && cp resources/node-webkit/linux_ia64/nw dist/node-webkit && cp resources/linux/qq dist/qq && chmod a+x dist/qq', function(error, stdout, stderr) {
      var result = true;
      if (stdout) {
        grunt.log.write(stdout);
      }
      if (stderr) {
        grunt.log.write(stderr);
      }
      if (error !== null) {
        grunt.log.error(error);
        result = false;
      }
      done(result);
    });
  });

  grunt.registerTask('createWindowsApp', 'Create windows distribution.', function() {
    var done = this.async();
    var childProcess = require('child_process');
    var exec = childProcess.exec;
    exec('copy /b tmp\\nw.exe+tmp\\app.nw tmp\\QuickQuestion.exe && del tmp\\app.nw tmp\\nw.exe', function(error, stdout, stderr) {
      var result = true;
      if (stdout) {
        grunt.log.write(stdout);
      }
      if (stderr) {
        grunt.log.write(stderr);
      }
      if (error !== null) {
        grunt.log.error(error);
        result = false;
      }
      done(result);
    });
  });

  grunt.registerTask('setVersion', 'Set version to all needed files', function(version) {
    var config = grunt.config.get(['config']);
    var appPath = config.app;
    var resourcesPath = config.resources;
    var mainPackageJSON = grunt.file.readJSON('package.json');
    var appPackageJSON = grunt.file.readJSON(appPath + '/package.json');
    var infoPlistTmp = grunt.file.read(resourcesPath + '/macFiles/Info.plist.tmp', {
      encoding: 'UTF8'
    });
    var infoPlist = grunt.template.process(infoPlistTmp, {
      data: {
        version: version
      }
    });
    mainPackageJSON.version = version;
    appPackageJSON.version = version;
    grunt.file.write('package.json', JSON.stringify(mainPackageJSON, null, 2), {
      encoding: 'UTF8'
    });
    grunt.file.write(appPath + '/package.json', JSON.stringify(appPackageJSON, null, 2), {
      encoding: 'UTF8'
    });
    grunt.file.write(resourcesPath + '/macFiles/Info.plist', infoPlist, {
      encoding: 'UTF8'
    });
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

  grunt.registerTask('dist-macos', [
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

  grunt.registerTask('dmg', 'Create dmg from previously created app folder in dist.', function() {
    var done = this.async();
    var createDmgCommand = 'resources/macFiles/package.sh';
    require('child_process').exec(createDmgCommand, function(error, stdout, stderr) {
      var result = true;
      if (stdout) {
        grunt.log.write(stdout);
      }
      if (stderr) {
        grunt.log.write(stderr);
      }
      if (error !== null) {
        grunt.log.error(error);
        result = false;
      }
      done(result);
    });
  });

  grunt.registerTask('deb', 'Create deb from previously created app folder in dist.', function() {
    var done = this.async();
    var appPath = config.app;
    var appPackageJSON = grunt.file.readJSON(appPath + '/package.json');
    var createDmgCommand = 'resources/linux/debPackage.sh ' + appPackageJSON.version;
    require('child_process').exec(createDmgCommand, function(error, stdout, stderr) {
      var result = true;
      if (stdout) {
        grunt.log.write(stdout);
      }
      if (stderr) {
        grunt.log.write(stderr);
      }
      if (error !== null) {
        grunt.log.error(error);
        result = false;
      }
      done(result);
    });
  });

  grunt.registerTask('rpm', 'Create rpm from previously created app folder in dist.', function() {
    var done = this.async();
    var appPath = config.app;
    var appPackageJSON = grunt.file.readJSON(appPath + '/package.json');
    var createDmgCommand = 'resources/linux/rpmPackage.sh ' + appPackageJSON.version;
    require('child_process').exec(createDmgCommand, function(error, stdout, stderr) {
      var result = true;
      if (stdout) {
        grunt.log.write(stdout);
      }
      if (stderr) {
        grunt.log.write(stderr);
      }
      if (error !== null) {
        grunt.log.error(error);
        result = false;
      }
      done(result);
    });
  });
};
