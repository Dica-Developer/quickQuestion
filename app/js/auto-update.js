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
var events = require('events');
var sys = require('sys');

function AutoUpdate() {
  'use strict';

  this.currentGitTags = null;

  this.on('getTagsReady', this.compareWithCurrentVersion);
  this.on('checkForUpdates', this.getTagsFromGithub);

  this.getTagsFromGithub();
}
sys.inherits(AutoUpdate, events.EventEmitter);

AutoUpdate.prototype.getTagsFromGithub = function () {
  'use strict';
  var _this = this;
  var data = '';
  var options = {
    hostname: 'api.github.com',
    path: '/repos/Dica-Developer/quickQuestion/tags',
    headers: {
      'User-Agent': 'quickQuestion'
    },
    agent: false
  };
  https.get(options, function (res) {
    res.setEncoding('utf8');
    res.on('data', function (d) {
      data = data + d;
    }).on('end', function () {
      if (200 === this.statusCode) {
        try {
          _this.currentGitTags = JSON.parse(data);
          _this.emit('getTagsReady');
        } catch (error) {
          _this.emit('log.error', error);
        }
      } else {
        _this.emit('log.error', 'Failure on getting tags from github.');
      }
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

module.exports = new AutoUpdate();