var sys = require('sys');
var events = require('events');
var gui = window.nwDispatcher.nwGui;

function Notifications(){
  'use strict';
  var _this = this;
  this.messageWindowLoaded = false;
  this.messageWindowOpen = false;
  this.messageWindow = this.createNewWindow();
  var messageHideTimeOutID = null;
  this.newMessage = function(){
    if(_this.messageWindowLoaded){
      clearTimeout(messageHideTimeOutID);
      _this.messageWindow.show();
      _this.messageWindowOpen = true;
      messageHideTimeOutID = setTimeout(function(){
        var winDocument = _this.messageWindow.window.document;
        var messageCount = winDocument.getElementById('messageCount');
        var messageTempus = winDocument.getElementById('messageTempus');
        messageCount.innerText = '0';
        messageTempus.innerText = 'message';
        _this.messageWindow.hide();
        _this.messageWindowOpen = false;
      }, 4000);
    }

    if(_this.messageWindowOpen){
      var winDocument = _this.messageWindow.window.document;
      var messageCount = winDocument.getElementById('messageCount');
      var currentCount = parseInt(messageCount.innerText, 10);
      var messageTempus = winDocument.getElementById('messageTempus');
      messageCount.innerText = '' + (currentCount + 1);
      if(messageCount > 1){
        messageTempus.innerText = 'messages';
      }
    }
  };
}

sys.inherits(Notifications, events.EventEmitter);

Notifications.prototype.createNewWindow = function(){
  'use strict';

  var _this = this;

  var newMessageWindow = gui.Window.open('../views/notifications/newMessage.html', {
    frame: false,
    toolbar: false,
    width: 250,
    height: 40,
    'always-on-top': true,
    show: false,
    resizable: false
  });

  newMessageWindow.on('loaded', function(){
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
