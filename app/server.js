var http = require('http');
var url = require('url');
var os = require('os');
var polo = require('polo');
var apps = polo();
var clients = [];
var messages = [];

$(function () {
  $('#sendMessage').bind('vclick', function () {
    var result = sendMessageToAll($("#messageToSend").val());
    if ('Message send.' === result) {
      $("#messageToSend").val("");
    }
    $("#message").text(result);
  });
});

function updateClientUI(){
  var content = '';
  for (var i = 0; i < clients.length; i++) {
    content = content + '<li>' + clients[i] + '</li>';
  }
  $('#clientlist').html(content);
  $('#clientlist').listview('refresh');
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

function updateMessageUI(){
  var content = '';
  for (var i = 0; i < messages.length; i++) {
    content = content + '<li>' + messages[i] + '</li>';
  }
  $('#messagelist').html(content);
  $('#messagelist').listview('refresh');
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

function sendMessageToAll(message) {
  if (message && message.length > 0) {
    for (i = 0; i < clients.length; i++) {
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
    response.writeHead(404, {
      'Content-Type': 'text/plain'
    });
    return 'We do not send empty messages.';
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
          messages.push(body);
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