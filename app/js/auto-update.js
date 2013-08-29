var https = require('https');
var fs = require('fs');
var AdmZip = require('adm-zip');
var events = require('events');
var sys = require('sys');

var execPath = process.execPath;
var pathToApp = execPath.slice(0, execPath.indexOf('Frameworks'));

function deleteRecursive(directoryToDelete) {
  'use strict';

  var stat = fs.statSync(directoryToDelete);
  console.log(directoryToDelete, stat);
  if (stat.isDirectory()) {
    var files = fs.readdirSync(directoryToDelete);
    files.forEach(function (value) {
      deleteRecursive(directoryToDelete + '/' + value);
    });
    fs.rmdirSync(directoryToDelete);
  } else {
    fs.unlinkSync(directoryToDelete);
  }
}

function AutoUpdate() {
  'use strict';

  this.currentGitTags = null;

  this.on('getTagsReady', this.compareWithCurrentVersion);
  this.on('update', this.performUpdate);

  this.getTagsFromGithub();
}
sys.inherits(AutoUpdate, events.EventEmitter);

AutoUpdate.prototype.getTagsFromGithub = function(){
  'use strict';
  var _this = this;

  https.get('https://api.github.com/repos/Dica-Developer/quickQuestion/tags', function (res) {
    res.setEncoding('utf8');
    res.on('data', function (d) {
      _this.currentGitTags = JSON.parse(d);
      _this.emit('getTagsReady');
    });
  }).on('error', function (e) {
      console.log('Got error: ' + e.message);
    });
};

AutoUpdate.prototype.compareWithCurrentVersion = function() {
  'use strict';
  var _this = this;

  fs.readFile('./package.json', {
    encoding: 'utf8'
  }, function (error, data) {
    var localVersionString = JSON.parse(data).version;
    var remoteVersionString = _this.currentGitTags[0].name;

    var versionSplitLocal, versionSplitRemote;
    versionSplitRemote = remoteVersionString.split('.');
    versionSplitLocal = localVersionString.split('.');

    var isUpdateNeeded = false;

    for (var index = 0, length = versionSplitLocal.length; index < length; ++index) {
      var remoteVersion = parseInt(versionSplitRemote[index], 10);
      var localVersion = parseInt(versionSplitLocal[index], 10);
      if (localVersion < remoteVersion) {
        isUpdateNeeded = true;
        break;
      }
    }

    if (isUpdateNeeded) {
      _this.emit('updateNeeded');
    }
  });
};

AutoUpdate.prototype.performUpdate = function() {
  'use strict';

  var _this = this;
  /*jshint camelcase: false*/
  https.get(this.currentGitTags[0].zipball_url, function (res) {
    var location = res.headers.location;
    var downloadedLength = 0;
    _this.emit('progress', 'Start download');
    https.get(location, function (res) {
      var contentLength = res.headers['content-length'];
      res.on('data', function (d) {
        downloadedLength = downloadedLength + d.length;
        var progress = (100 * downloadedLength / contentLength).toFixed(2);
        var message = 'Download ' + progress + '% done.';
        _this.emit('progress', message);
        fs.appendFileSync(pathToApp + 'Resources/app.zip', d);
      }).on('end', function () {
          _this.emit('progress', 'Download done');
          var zip = new AdmZip(pathToApp + 'Resources/app.zip');
          var zipEntries = zip.getEntries();
          zipEntries.forEach(function (zipEntry) {
            if (zipEntry.entryName.indexOf('/app/', zipEntry.entryName.length - '/app/'.length) !== -1) {
              zip.extractEntryTo(zipEntry, pathToApp + 'Resources/app.nw.new');
              fs.rename(pathToApp + 'Resources/app.nw', pathToApp + 'Resources/app.nw.old', function (e) {
                if (e) {
                  console.error(e);
                } else {
                  fs.rename(pathToApp + 'Resources/app.nw.new/' + zipEntry.entryName, pathToApp + 'Resources/app.nw', function (e) {
                    if (e) {
                      console.error(e);
                    } else {
                      _this.emit('progress', 'Adding files');
                      deleteRecursive(pathToApp + 'Resources/app.nw.new');
                      deleteRecursive(pathToApp + 'Resources/app.nw.old');
                      fs.unlinkSync(pathToApp + 'Resources/app.zip');
                      console.info('Please restart QuickQuestion to apply update!');
                      _this.emit('updateDone');
                    }
                  });
                }
              });
            }
          });
        });
    }).on('error', function (e) {
        console.log('Got error: ' + e.message);
      });
  })
    .on('error', function (e) {
      console.log('Got error: ' + e.message);
    });
};

module.exports = new AutoUpdate();