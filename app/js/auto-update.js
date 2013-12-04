/*
Quick Question - Communication and Collaboration tool.
Copyright (C) 2013  Dica-Developer

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
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
  this.on('checkForUpdates', this.getTagsFromGithub);

  this.getTagsFromGithub();
}
sys.inherits(AutoUpdate, events.EventEmitter);

AutoUpdate.prototype.getTagsFromGithub = function () {
  'use strict';
  var _this = this;
  var data = '';

  https.get('https://api.github.com/repos/Dica-Developer/quickQuestion/tags', function (res) {
    res.setEncoding('utf8');
    res.on('data', function (d) {
      data = data + d;
    }).on('end', function () {
      try {
        _this.currentGitTags = JSON.parse(data);
      } catch (error) {
        _this.emit('log.error', error);
      }
      _this.emit('getTagsReady');
    }).on('error', function (e) {
      _this.emit('log.error', e);
    });
  });
};

AutoUpdate.prototype.compareWithCurrentVersion = function () {
  'use strict';
  var _this = this;

  fs.readFile('./package.json', {
    encoding: 'utf8'
  }, function (error, data) {
    var versionSplitLocal, versionSplitRemote;
    var localVersionString = JSON.parse(data).version;
    var remoteVersionString = '0.0',
      isUpdateNeeded = false,
      index = 0,
      loopLength;

    if (_this.currentGitTags && _this.currentGitTags.length > 0 && _this.currentGitTags[0].hasOwnProperty('name')) {
      remoteVersionString = _this.currentGitTags[0].name;
    }

    versionSplitRemote = remoteVersionString.split('.');
    versionSplitLocal = localVersionString.split('.');
    loopLength = versionSplitLocal.length;

    for (index = 0; index < loopLength; ++index) {
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

AutoUpdate.prototype.performUpdate = function () {
  'use strict';

  var _this = this,
    downloadedLength = 0,
    zip;
  var zipEntries;

  /*jshint camelcase: false*/
  https.get(this.currentGitTags[0].zipball_url, function (res) {
    var location = res.headers.location;
    _this.emit('progress', 'Start download');
    https.get(location, function (res) {
      var contentLength = parseInt(res.headers['content-length'], 10);
      res.on('data', function (chunk) {
        var progress = null;
        downloadedLength = downloadedLength + parseInt(chunk.length, 10);
        if (contentLength) {
          progress = (100 * downloadedLength / contentLength).toFixed(2);
        }
        var message = '';
        if (!progress || isNaN(progress)) {
          message = 'Downloading';
        } else {
          message = 'Download ' + progress + '% done.';
        }
        _this.emit('progress', message);
        fs.appendFileSync(pathToApp + 'Resources/app.zip', chunk);
      }).on('end', function () {
        _this.emit('progress', 'Download done');
        zip = new AdmZip(pathToApp + 'Resources/app.zip');
        zipEntries = zip.getEntries();
        zipEntries.forEach(function (zipEntry) {
          if (zipEntry.entryName.indexOf('/app/', zipEntry.entryName.length - '/app/'.length) !== -1) {
            zip.extractEntryTo(zipEntry, pathToApp + 'Resources/app.nw.new');
            fs.rename(pathToApp + 'Resources/app.nw', pathToApp + 'Resources/app.nw.old', function (e) {
              if (e) {
                _this.emit('error', e);
              } else {
                fs.rename(pathToApp + 'Resources/app.nw.new/' + zipEntry.entryName, pathToApp + 'Resources/app.nw', function (e) {
                  if (e) {
                    _this.emit('error', e);
                  } else {
                    _this.emit('progress', 'Deleting old files');
                    deleteRecursive(pathToApp + 'Resources/app.nw.new');
                    deleteRecursive(pathToApp + 'Resources/app.nw.old');
                    fs.unlinkSync(pathToApp + 'Resources/app.zip');
                    _this.emit('updateDone');
                  }
                });
              }
            });
          }
        });
      });
    }).on('error', function (e) {
      _this.emit('error', e);
    });
  })
    .on('error', function (e) {
      _this.emit('error', e);
    });
};

module.exports = new AutoUpdate();