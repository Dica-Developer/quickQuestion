var server = require('../js/server.js');
var autoUpdate = require('../js/auto-update.js');

function GuiHandling(gui) {
  'use strict';

  var _this = this;
  this.trayOnly = false;
  this.trayIsLocked = false;
  this.gui = gui;
  this.ICON_PATHS = {
    standard: 'img/tray.png',
    update: 'img/tray-update.png',
    message: 'img/tray-nessage.png'
  };
  this.trayMenu = this.createTrayMenu();
  this.tray = new this.gui.Tray({
    icon: _this.ICON_PATHS.standard,
    menu: this.trayMenu
  });
  this.currentWindow = this.gui.Window.get();

  this.handleUpdateProgress = function (updateMessage) {
    if (!_this.trayIsLocked) {
      _this.trayIsLocked = true;
      _this.tray.icon = _this.ICON_PATHS.update;
    }
    _this.setWindowTitle(updateMessage);
  };

  this.handleUpdateDone = function () {
    _this.trayIsLocked = false;
    _this.tray.icon = _this.ICON_PATHS.standard;
    _this.setWindowTitle();
  };

  this.handleIncomingMessage = function () {
    if (_this.trayOnly && !_this.trayIsLocked) {
      _this.tray.icon = _this.ICON_PATHS.message;
    }
  };

  this.setTrayOnly = function () {
    _this.trayOnly = true;
  };

  this.unsetTrayOnly = function () {
    _this.trayOnly = false;
  };

  this.currentWindow.on('blur', this.setTrayOnly);
  this.currentWindow.on('focus', this.unsetTrayOnly);
  this.currentWindow.on('minimize', this.setTrayOnly);
  this.currentWindow.on('maximize', this.unsetTrayOnly);
  server.on('newClient', this.newClientConnected);
  server.on('message', this.handleIncomingMessage);
  autoUpdate.on('progress', this.handleUpdateProgress);
  autoUpdate.on('updateDone', this.handleUpdateDone);

}

GuiHandling.prototype.newClientConnected = function () {
  'use strict';

};

GuiHandling.prototype.setWindowTitle = function (message) {
  'use strict';

  message = message || 'Quick Question';
  this.currentWindow.title = message;
};

GuiHandling.prototype.createTrayMenu = function () {
  'use strict';

  var _this = this;
  var menu = new this.gui.Menu();
  var updateItem = new this.gui.MenuItem({
    label: 'Check for updates',
    click: function () {
      autoUpdate.emit('checkForUpdates');
    }
  });
  var devTools = new this.gui.MenuItem({
    label: 'Debug Quick Question',
    click: function () {
      _this.currentWindow.showDevTools();
    }
  });
  var separator = new this.gui.MenuItem({
    type: 'separator'
  });
  var quitItem = new this.gui.MenuItem({
    label: 'Quit Quick Question',
    click: function () {
      _this.currentWindow.close();
    }
  });

  menu.append(updateItem);
  menu.append(devTools);
  menu.append(separator);
  menu.append(quitItem);
  return menu;
};

module.exports = GuiHandling;