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
  this.messageWindowOpen = false;
  this.messageWindow = _this.createNewWindow();
  var messageHideTimeOutID = null;

  this.newMessage = function () {
    if (_this.messageWindowLoaded) {
      clearTimeout(messageHideTimeOutID);
      _this.messageWindow.show();
      _this.messageWindowOpen = true;
      messageHideTimeOutID = setTimeout(function () {
        _this.messageWindow.hide();
        _this.emit('windowHide');
      }, 4000);
    }

    if (_this.messageWindowOpen) {
      var winDocument = _this.messageWindow.window.document;
      var messageCount = winDocument.getElementById('messageCount');
      var currentCount = parseInt(messageCount.innerText, 10);
      var messageTempus = winDocument.getElementById('messageTempus');
      messageCount.innerText = (currentCount + 1);
      if (messageCount > 1) {
        messageTempus.innerText = 'messages';
      }
    }
    _this.on('windowHide', function () {
      var winDocument = _this.messageWindow.window.document;
      var messageCount = winDocument.getElementById('messageCount');
      var messageTempus = winDocument.getElementById('messageTempus');
      messageCount.innerText = '0';
      messageTempus.innerText = 'message';
      _this.messageWindowOpen = false;
    });
  };
}

sys.inherits(Notifications, events.EventEmitter);

Notifications.prototype.createNewWindow = function () {
  'use strict';

  var _this = this;

  var newMessageWindow = window.nwDispatcher.nwGui.Window.open('../views/notifications/newMessage.html', {
    frame: false,
    toolbar: false,
    width: 250,
    height: 30,
    'always-on-top': true,
    show: false,
    resizable: false
  });

  newMessageWindow.on('loaded', function () {
    var windowWidth = window.screen.availWidth;
    var windowTop = window.screen.availTop;
    var x = windowWidth - newMessageWindow.width;
    var y = windowTop;
    newMessageWindow.moveTo(x, y);
    _this.messageWindowLoaded = true;
  });

  return newMessageWindow;
};

var notifications = new Notifications();
module.exports.newMessage = notifications.newMessage;