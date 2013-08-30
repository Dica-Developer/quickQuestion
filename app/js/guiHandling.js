var server = require('../js/server.js');
var autoUpdate = require('../js/auto-update.js');
var gui, currentWindow, tray;


function GuiHandling(GUI){
  'use strict';

  this.trayOnly = false;
  gui = GUI;
  tray = new gui.Tray({
    icon: 'img/icon1.png'
  });
  currentWindow = gui.Window.get();
  currentWindow.on('blur', this.setTrayOnly);
  currentWindow.on('focus', this.unsetTrayOnly);
  currentWindow.on('minimize', this.setTrayOnly);
  currentWindow.on('maximize', this.unsetTrayOnly);
  server.on('newClient', this.newClientConnected);
  server.on('message', this.incomingMessage);
  autoUpdate.on('progress', this.setWindowTitle);
  autoUpdate.on('updateDone', this.setWindowTitle);
}

GuiHandling.prototype.flipTray = function() {
  'use strict';

  var icon = tray.icon;
  if (icon.indexOf('icon1') > -1) {
    tray.icon = 'img/icon2.png';
  } else {

  }
};

GuiHandling.prototype.setTrayOnly = function(){
  'use strict';

  this.trayOnly = true;
};

GuiHandling.prototype.unsetTrayOnly = function(){
  'use strict';

  this.trayOnly = false;
};

GuiHandling.prototype.newClientConnected = function(){
  'use strict';

  if(this.trayOnly){
    this.flipTray();
  }
};

GuiHandling.prototype.incomingMessage = function(){
  'use strict';

  if(this.trayOnly){
    this.flipTray();
  }
};

GuiHandling.prototype.setWindowTitle = function(message){
  'use strict';

  message = message || 'Quick Question';
  currentWindow.title = message;
};

module.exports = GuiHandling;
