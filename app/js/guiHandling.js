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
var server = require('../js/server.js');
var autoUpdate = require('../js/auto-update.js');

function GuiHandling() {
  'use strict';

  var _this = this;
  this.applicationHidden = false;
  this.gui = window.nwDispatcher.nwGui;
  this.ICON_PATHS = {
    standard: 'img/tray.png',
    update: 'img/tray-update.png',
    message: 'img/tray-message.png'
  };
  this.trayMenu = this.createTrayMenu();
  this.tray = new this.gui.Tray({
    icon: _this.ICON_PATHS.standard,
    menu: this.trayMenu
  });

  function Menu(cutLabel, copyLabel, pasteLabel) {
    var menu = new this.gui.Menu({
      type: 'menubar'
    });
    var cut = new this.gui.MenuItem({
      label: cutLabel || 'Cut',
      click: function() {
        document.execCommand('cut');
        console.log('Menu:', 'cutted to clipboard');
      }
    });

    var copy = new this.gui.MenuItem({
      label: copyLabel || 'Copy',
      click: function() {
        document.execCommand('copy');
        console.log('Menu:', 'copied to clipboard');
      }
    });

    var paste = new this.gui.MenuItem({
      label: pasteLabel || 'Paste',
      click: function() {
        document.execCommand('paste');
        console.log('Menu:', 'pasted to textarea');
      }
    });

    menu.append(cut);
    menu.append(copy);
    menu.append(paste);

    return menu;
  }

  if (process.platform === 'darwin') {
    var menu = new this.gui.Menu({
      type: 'menubar'
    });
    menu.createMacBuiltin('Quick Question');
    this.gui.Window.get().menu = menu;

  } else {
    this.gui.Window.get().menu = new Menu();
  }

  this.handleUpdateProgress = function(updateMessage) {
    _this.tray.icon = _this.ICON_PATHS.update;
    _this.setWindowTitle(updateMessage);
  };

  this.handleUpdateDone = function() {
    _this.tray.icon = _this.ICON_PATHS.standard;
    _this.setWindowTitle();
  };

  this.handleIncomingMessage = function() {
    if (_this.applicationHidden) {
      _this.tray.icon = _this.ICON_PATHS.message;
    }
  };

  this.setApplicationHidden = function() {
    _this.applicationHidden = true;
  };

  this.setApplicationNotHidden = function() {
    _this.applicationHidden = false;
    _this.tray.icon = _this.ICON_PATHS.standard;
  };

  this.currentWindow = this.gui.Window.get();
  this.currentWindow.on('blur', this.setApplicationHidden);
  this.currentWindow.on('focus', this.setApplicationNotHidden);
  server.on('newClient', this.newClientConnected);
  server.on('newMessage', this.handleIncomingMessage);
  autoUpdate.on('progress', this.handleUpdateProgress);
  autoUpdate.on('updateDone', this.handleUpdateDone);

}

GuiHandling.prototype.newClientConnected = function() {
  'use strict';

};

GuiHandling.prototype.setWindowTitle = function(message) {
  'use strict';

  message = message || 'Quick Question';
  this.currentWindow.title = message;
};

GuiHandling.prototype.createTrayMenu = function() {
  'use strict';

  var _this = this;
  var menu = new this.gui.Menu();
  var updateItem = new this.gui.MenuItem({
    label: 'Check for updates',
    click: function() {
      autoUpdate.emit('checkForUpdates');
    }
  });
  var devTools = new this.gui.MenuItem({
    label: 'Debug Quick Question',
    click: function() {
      _this.currentWindow.showDevTools();
    }
  });
  var separator = new this.gui.MenuItem({
    type: 'separator'
  });
  var quitItem = new this.gui.MenuItem({
    label: 'Quit Quick Question',
    click: function() {
      _this.currentWindow.close();
    }
  });

  menu.append(updateItem);
  menu.append(devTools);
  menu.append(separator);
  menu.append(quitItem);
  return menu;
};

module.exports = new GuiHandling();
