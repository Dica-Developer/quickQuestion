/*global window*/
var http = require('http');
var url = require('url');
var polo = require('polo');
var os = require('os');
var sys = require('sys');
var events = require('events');
var fs = require('fs');

var responseCallback = function (resp) {
  'use strict';

  console.info('STATUS: ' + resp.statusCode);
};

function Server() {
  'use strict';

  var _this = this;

  this.clients = [];
  this.polo = polo();
  this.applyServer();
  this.polo.on('up', function (name, service) {
    if ('quickquestion' === name) {
      var newClient = true;
      var i;
      for (i = 0; i < _this.clients.length; i++) {
        if (_this.clients[i] === service.address) {
          newClient = false;
        }
      }
      if (newClient) {
        if (service.hasOwnProperty('hostname') && service.hasOwnProperty('address') && service.address && service.hostname) {
          _this.clients.push({
            address: service.address,
            hostname: service.hostname
          });
          _this.emit('updateClients');
          _this.emit('newClient');
        } else {
          _this.emit('log.error', {
            message: 'Invalid client up request.',
            service: service
          });
        }
      }
    }
  });

  this.polo.on('down', function (name, service) {
    if ('quickquestion' === name) {
      var i;
      for (i = 0; i < _this.clients.length; i++) {
        if (_this.clients[i] === service.address) {
          _this.clients.pop({
            address: service.address,
            hostname: service.hostname
          });
        }
      }
      _this.emit('updateClients');
    }
  });

  this.on('sendMessageToAll', this.sendMessageToAll);
}

sys.inherits(Server, events.EventEmitter);

Server.prototype.sendMessage = function (message, type) {
  'use strict';
  var _this = this;
  var options = null;
  var callErrorCallback = function (event) {
    _this.errorCallback(event, message, options);
  };
  var i = 0;
  for (i = 0; i < this.clients.length; i++) {
    options = {
      hostname: this.clients[i].address.split(':')[0],
      port: this.clients[i].address.split(':')[1],
      path: '/receive',
      method: 'POST',
      agent: false,
      headers: {
        'Content-Type': type
      }
    };
    var req = http.request(options, responseCallback);
    req.setTimeout(1000);
    req.on('error', callErrorCallback);
    req.end(message);
  }
  this.emit('messageSendSuccess');
};

Server.prototype.sendMessageToAll = function (message) {
  'use strict';
  var i = 0;
  if (message && message.length > 0) {
    this.sendMessage(message, 'text/plain; charset=utf-8');
  } else {
    this.emit('messageSendError', 'We do not send empty messages.');
  }
  var filesToSend = window.$('#filesToSend > li');
  for (i = 0; i < filesToSend.length; i++) {
    var type = 'application/octet-stream';
    if (window.$(filesToSend[i]).data('type') && '' !== window.$(filesToSend[i]).data('type')) {
      type = window.$(filesToSend[i]).data('type');
    }
    var dataUriPrefix = 'data:' + type + ';base64,';
    var buf = fs.readFileSync(window.$(filesToSend[i]).data('path'));
    var messageDataUri = dataUriPrefix + buf.toString('base64');

    this.sendMessage(messageDataUri, type);
    window.$(filesToSend[i]).remove();
  }
  window.$('#filesToSend').listview('refresh');
};

Server.prototype.applyServer = function () {
  'use strict';
  var _this = this;

  this.externalServer = http.createServer(function (request, response) {

    var requestUrl = url.parse(request.url, true);
    if ('POST' === request.method) {
      if ('/receive' === requestUrl.pathname) {
        var body = '';
        request.on('data', function (chunk) {
          body += chunk;
        });
        request.on('end', function () {
          if (body && body.length > 0) {
            var message = {};
            message.content = body;
            message.remoteAddress = request.socket.remoteAddress;
            message.remotePort = request.socket.remotePort;
            message.contentType = request.headers['content-type'];
            message.timestamp = new Date();
            _this.emit('newMessage', message);
          } else {
            _this.emit('emptyMessage');
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

  this.externalServer.listen(0, function () {
    var port = this.address().port;
    _this.polo.put({
      name: 'quickquestion',
      hostname: os.hostname(),
      port: port
    });
  });
};

Server.prototype.errorCallback = function (error, message, options) {
  'use strict';

  if (error && 'ECONNRESET' === error.code) {
    this.emit('log.warning', 'Connection reset on sending message to client');
  } else {
    this.emit('log.error', {
      message: error.message,
      messageToSend: message,
      sendOptions: options
    });
  }
};

module.exports = new Server();