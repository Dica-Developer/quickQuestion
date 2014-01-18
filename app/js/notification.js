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

var sys = require('sys');
var events = require('events');

function Notifications() {
  'use strict';
  var _this = this;
  this.messageWindowLoaded = false;
  this.messageWindow = _this.createNewWindow();
  var messageHideTimeOutID = null;

  this.newMessage = function (message) {
    if (_this.messageWindowLoaded) {
      clearTimeout(messageHideTimeOutID);
      _this.messageWindow.window.document.getElementById('message').innerText = message;
      var windowWidth = window.screen.availWidth;
      var windowTop = window.screen.availTop;
      _this.messageWindow.moveTo(windowWidth - 250, windowTop);
      _this.messageWindow.width = 250;
      _this.messageWindow.height = 30;
      messageHideTimeOutID = setTimeout(function () {
        _this.messageWindow.width = 1;
        _this.messageWindow.height = 1;
        _this.messageWindow.moveTo(windowWidth, windowTop);
        _this.emit('windowHide');
      }, 4000);
    }
  };

  this.close = function () {
    _this.messageWindow.close();
  };
}

sys.inherits(Notifications, events.EventEmitter);

Notifications.prototype.createNewWindow = function () {
  'use strict';

  var _this = this;

  var newMessageWindow = window.nwDispatcher.nwGui.Window.open('../views/notifications/newMessage.html', {
    frame: false,
    toolbar: false,
    width: 1,
    height: 1,
    'always-on-top': true,
    show: false,
    resizable: true
  });

  newMessageWindow.on('loaded', function () {
    var windowWidth = window.screen.availWidth;
    var windowTop = window.screen.availTop;
    newMessageWindow.moveTo(windowWidth, windowTop);
    newMessageWindow.show();
    _this.messageWindowLoaded = true;
  });

  return newMessageWindow;
};

module.exports = new Notifications();