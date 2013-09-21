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
/*global window*/
var fs = require('fs');
var sys = require('sys');
var events = require('events');
var nwGui = window.nwDispatcher.requireNwGui();
var TAFFY = require('node-taffydb').TAFFY;
var os = require('os');

function Db(name) {
  'use strict';

  this.name = name;
  this.query = null;
  this.storingPath = nwGui.App.dataPath + '/' + name + '.json';

  var _this = this;
  fs.readFile(this.storingPath, {
    encoding: 'UTF8'
  }, function (error, data) {
    if (!error && data) {
      _this.query = TAFFY(JSON.parse(data));
    } else {
      _this.query = TAFFY();
    }
    _this.emit('ready');
  });
  this.save = function () {
    process.stdout.write('Persisting ' + this.name + ' database' + os.EOL);
    fs.writeFileSync(this.storingPath, JSON.stringify(this.query().get()), {
      encoding: 'UTF8'
    });
  };
}
sys.inherits(Db, events.EventEmitter);

module.exports.options = new Db('options');
module.exports.messages = new Db('messages');
module.exports.logs = new Db('logs');