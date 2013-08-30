var server = require('../js/server.js');
var autoUpdate = require('../js/auto-update.js');
var gui = require('nw.gui');
var GuiHandler = require('../js/guiHandling.js');
new GuiHandler(gui);

var resizeTimeout,
  messages = [];

function sendMessage(val) {
  'use strict';
  server.emit('sendMessageToAll', val);
}

function resize() {
  'use strict';

  var messageToSend = $('#messageToSend');
  var newHeight = $(window).innerHeight() + messageToSend.height() - ($('#content').height() + $('#footer').height() + 30);
  messageToSend.height(newHeight);
}

// startup on DOM ready
$(function () {
  'use strict';

  var sendMessageButton = $('#sendMessage');
  sendMessageButton.bind('vclick', function () {
    sendMessage($('#messageToSend').val());
  });

  var messageToSend = $('#messageToSend');
  messageToSend.bind('keyup', function (e) {
    var isShiftPressed = e.shiftKey;
    switch (e.which) {
    case 13:
      if (!isShiftPressed) {
        e.preventDefault();
        sendMessage($('#messageToSend').val());
      }
      break;
    }
  });

  messageToSend.bind('keydown', function (e) {
    var isShiftPressed = e.shiftKey;
    switch (e.which) {
    case 13:
      if (!isShiftPressed) {
        e.preventDefault();
      }
      break;
    }
  });

  window.onresize = function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(resize, 100);
  };
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(resize, 100);
});


server.on('updateClients', function(){
  'use strict';
  var content = '';
  this.clients.sort();
  for (var i = 0; i < this.clients.length; i++) {
    content = content + '<li>' + this.clients[i] + '</li>';
  }
  var clientlist = $('#clientlist');
  clientlist.html(content);
  clientlist.listview('refresh');
});

server.on('newMessage', function(message){
  'use strict';
  messages.push(message);
  var content = '';
  for (var i = 0; i < messages.length; i++) {
    content = content + '<li>' + messages[i] + '</li>';
  }
  var messageList = $('#messagelist');
  messageList.html(content);
  messageList.listview('refresh');
  messageList.scrollTop(messageList[0].scrollHeight);
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(resize, 100);

  $('[data-name="link"]').on('click', function () {
    gui.Shell.openExternal($(this).data('href'));
  });
});

server.on('messageSendSuccess', function(){
  'use strict';

  $('#messageToSend').val('');
  $('#message').text('Message send.');
});

server.on('messageSendError', function(errorMessage){
  'use strict';

  $('#message').text(errorMessage);
});

server.on('error', function(e){
  'use strict';

  throw e;
});

autoUpdate.on('updateNeeded', function () {
  'use strict';
  var popupDialog = $('#popupDialog');
  popupDialog.on('click', '#update-yes', function () {
    autoUpdate.emit('update');
    autoUpdate.on('updateDone', function (progress) {
      console.log(progress);
      //inform user to restart
    });
  });
  popupDialog.popup('open');
});