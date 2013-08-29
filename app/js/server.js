var http = require('http');
var url = require('url');
var os = require('os');
var polo = require('polo');
var gui = require('nw.gui');
var autoUpdate = require('../js/auto-update.js');
var currentWindow = gui.Window.get();

var apps = polo();
var clients = [];
var messages = [];
var resizeTimeout;

autoUpdate.on('updateNeeded', function(){
  'use strict';
  var popupDialog = $('#popupDialog');
  var windowTitle = currentWindow.title;
  popupDialog.on('click', '#update-yes', function(){
    autoUpdate.emit('update');
    autoUpdate.on('progress', function(message){
      currentWindow.title = message;
    });
    autoUpdate.on('updateDone', function(progress){
      currentWindow.title = windowTitle;
      console.log(progress);
      //inform user to restart
    });
  });
  popupDialog.popup('open');
});

var tray = new gui.Tray({
  icon: 'img/icon1.png'
});

function flipTray() {
  'use strict';

  var icon = tray.icon;
  if (icon.indexOf('icon1') > -1) {
    tray.icon = 'img/icon2.png';
  } else {
    tray.icon = 'img/icon1.png';
  }
}

function responseCallback(resp) {
  'use strict';

  console.log('STATUS: ' + resp.statusCode);
}

function errorCallback(event) {
  'use strict';

  if (event && 'ECONNRESET' === event.code) {
    console.warn('Connection reset on sending message to client');
  } else {
    console.error('Cannot send to client.', event);
  }
}

function sendMessageToAll(message) {
  'use strict';

  if (message && message.length > 0) {
    for (var i = 0; i < clients.length; i++) {
      var options = {
        hostname: clients[i].split(':')[0],
        port: clients[i].split(':')[1],
        path: '/receive',
        method: 'POST',
        agent: false,
        headers: {
          'Connection': 'false',
          'Content-Length': message.length
        }
      };
      // set content type of message
      var req = http.request(options, responseCallback);
      req.setTimeout(1000);
      req.on('error', errorCallback);
      req.end(message);
    }
    return 'Message send.';
  } else {
    return 'We do not send empty messages.';
  }
}

function sendMessage(val) {
  'use strict';

  var result = sendMessageToAll(val);
  if ('Message send.' === result) {
    $('#messageToSend').val('');
  }
  $('#message').text(result);
}

function resize() {
  'use strict';

  var messageToSend = $('#messageToSend');
  var newHeight = $(window).innerHeight() + messageToSend.height() - ($('#content').height() + $('#footer').height() + 30);
  messageToSend.height(newHeight);
}

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

function updateClientUI() {
  'use strict';

  var content = '';
  clients.sort();
  for (var i = 0; i < clients.length; i++) {
    content = content + '<li>' + clients[i] + '</li>';
  }
  var clientlist = $('#clientlist');
  clientlist.html(content);
  clientlist.listview('refresh');
}

apps.on('up', function (name, service) {
  'use strict';

  // handle service name 'quickquestion'
  var newClient = true;
  var i;
  for (i = 0; i < clients.length; i++) {
    if (clients[i] === service.address) {
      newClient = false;
    }
  }
  if (newClient) {
    clients.push(service.address);
  }

  updateClientUI();
});

apps.on('down', function (name, service) {
  'use strict';

  var i;
  for (i = 0; i < clients.length; i++) {
    if (clients[i] === service.address) {
      clients.pop(service.address);
    }
  }
  updateClientUI();
});

function updateMessageUI() {
  'use strict';

  flipTray();
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
}


var serverExternal = http.createServer(function (request, response) {
  'use strict';

  var requestUrl = url.parse(request.url, true);
  if ('POST' === request.method) {
    if ('/receive' === requestUrl.pathname) {
      var body = '';
      request.on('data', function (chunk) {
        body += chunk;
      });
      request.on('end', function () {
        if (body && body.length > 0) {
          var message = body.replace(/([a-zA-Z]+:\/\/[^ ]*)/gm, '<span data-name="link" style="cursor:pointer;" data-href="$1">$1</span>');
          messages.push(message);
          updateMessageUI();
        } else {
          console.warn('Empty message received!');
        }
      });
    } else {
      response.writeHead(404, {
        'Content-Type': 'text/plain'
      });
      response.end('ಠ_ಠ');
    }
  } else {
    response.writeHead(404, {
      'Content-Type': 'text/plain'
    });
    response.end('ಠ_ಠ');
  }
});

serverExternal.listen(0, function () {
  'use strict';

  var port = serverExternal.address().port;

  apps.put({
    name: 'quickquestion',
    host: os.hostname(),
    port: port
  });
});