var http = require('http');
var url = require('url');
var os = require('os');
var polo = require('polo');
var gui = require('nw.gui');
var autoUpdate = require('../auto-update.js');

var apps = polo();
var clients = [];
var messages = [];

var tray = new gui.Tray({
  icon: 'img/icon1.png'
});

autoUpdate.checkForNewVerion();

function flipTray() {
  var icon = tray.icon;
  if (icon.indexOf('icon1') > -1) {
    tray.icon = 'img/icon2.png';
  } else {
    tray.icon = 'img/icon1.png';
  }
}

function sendMessageToAll(message) {
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
      var req = http.request(options, callback);
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
  var result = sendMessageToAll(val);
  if ('Message send.' === result) {
    $("#messageToSend").val("");
  }
  $("#message").text(result);
}

function resize() {
  var newHeight = $(window).innerHeight() + $('#messageToSend').height() - ($('#content').height() + $('#footer').height() + 30);
  if (newHeight < $('#messageToSend').height()) {
    $('#messageToSend').height(newHeight);
  } else {
    $('#messageToSend').height(newHeight + $('#messageToSend').height());
  }
}

$(function () {
  var sendMessageButton = $('#sendMessage');
  sendMessageButton.bind('vclick', function () {
    sendMessage($("#messageToSend").val());
  });

  $("#messageToSend").bind('keyup', function (e) {
    var isShiftPressed = e.shiftKey;
    switch (e.which) {
    case 13:
      if (!isShiftPressed) {
        e.preventDefault();
        sendMessage($("#messageToSend").val());
      }
      break;
    }
  });

  $("#messageToSend").bind('keydown', function (e) {
    var isShiftPressed = e.shiftKey;
    switch (e.which) {
    case 13:
      if (!isShiftPressed) {
        e.preventDefault();
      }
      break;
    }
  });

  window.onresize = resize;
  resize();
});

function updateClientUI() {
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
  var i;
  for (i = 0; i < clients.length; i++) {
    if (clients[i] === service.address) {
      clients.pop(service.address);
    }
  }
  updateClientUI();
});

function updateMessageUI() {
  flipTray();
  var content = '';
  for (var i = 0; i < messages.length; i++) {
    content = content + '<li>' + messages[i] + '</li>';
  }
  var messagelist = $('#messagelist');
  messagelist.html(content);
  messagelist.listview('refresh');
  messagelist.scrollTop(300);
}

function callback(resp) {
  console.log('STATUS: ' + resp.statusCode);
}

function errorCallback(e) {
  if (e && 'ECONNRESET' === e.code) {
    console.warn('Connection reset on sending message to client');
  } else {
    console.error('Cannot send to client.', e);
  }
}

var serverExternal = http.createServer(function (request, response) {
  var requestUrl = url.parse(request.url, true);
  if ('POST' === request.method) {
    if ('/receive' === requestUrl.pathname) {
      var body = "";
      request.on('data', function (chunk) {
        body += chunk;
      });
      request.on('end', function () {
        if (body && body.length > 0) {
          var message = body.replace(/([a-zA-Z]+:\/\/[^ ]*)/gm,'<a href="$1">$1</a>');
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
  var port = serverExternal.address().port;

  apps.put({
    name: 'quickquestion',
    host: os.hostname(),
    port: port
  });
});