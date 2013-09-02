var http = require('http');
var url = require('url');
var polo = require('polo');
var os = require('os');
var sys = require('sys');
var events = require('events');

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
        _this.clients.push(service.address);
        _this.emit('updateClients');
        _this.emit('newClient');
      }
    }
  });

  this.polo.on('down', function (name, service) {
    if ('quickquestion' === name) {
      var i;
      for (i = 0; i < _this.clients.length; i++) {
        if (_this.clients[i] === service.address) {
          _this.clients.pop(service.address);
        }
      }
      _this.emit('updateClients');
    }
  });

  this.on('sendMessageToAll', this.sendMessageToAll);
}

sys.inherits(Server, events.EventEmitter);

Server.prototype.sendMessageToAll = function (message) {
  'use strict';
  var options = null;
  var _this = this;
  var callErrorCallback = function (event) {
    _this.errorCallback(event, message, options);
  };
  if (message && message.length > 0) {
    var i = 0;
    for (i = 0; i < this.clients.length; i++) {
      options = {
        hostname: this.clients[i].split(':')[0],
        port: this.clients[i].split(':')[1],
        path: '/receive',
        method: 'POST',
        agent: false,
        headers: {
          'Connection': 'false',
          'Content-Type': 'text/plain; charset=utf-8'
        }
      };
      var req = http.request(options, responseCallback);
      req.setTimeout(1000);
      req.on('error', callErrorCallback);
      req.end(message);
    }
    this.emit('messageSendSuccess');
  } else {
    this.emit('messageSendError', 'We do not send empty messages.');
  }
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
            message.content = body.replace(/([a-zA-Z]+:\/\/[^ ]*)/gm, '<span data-name="link" style="cursor:pointer;" data-href="$1">$1</span>');
            message.sender = request.socket.remoteAddress+ ':' + request.socket.remotePort;
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
      // TODO: select one from os.networkInterfaces() instead of sending the hostname
      host: os.hostname(),
      port: port
    });
  });
};

Server.prototype.errorCallback = function (error, message, options) {
  'use strict';

  if (error && 'ECONNRESET' === error.code) {
    this.emit('log.warning', 'Connection reset on sending message to client');
  } else {
    this.emit('log.error', {message: error.message, messageToSend: message, sendOptions: options} );
  }
};

module.exports = new Server();