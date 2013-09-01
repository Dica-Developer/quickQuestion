var http = require('http');
var url = require('url');
var polo = require('polo');
var os = require('os');
var sys = require('sys');
var events = require('events');

var responseCallback = function (resp) {
  'use strict';

  console.log('STATUS: ' + resp.statusCode);
};

function Server() {
  'use strict';

  var _this = this;

  this.clients = [];
  this.polo = polo();
  this.applyServer();
  this.polo.on('up', function (name, service) {

    // handle service name 'quickquestion'
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
  });

  this.polo.on('down', function (name, service) {

    var i;
    for (i = 0; i < _this.clients.length; i++) {
      if (_this.clients[i] === service.address) {
        _this.clients.pop(service.address);
      }
    }
    _this.emit('updateClients');
  });

  this.on('sendMessageToAll', this.sendMessageToAll);
}

sys.inherits(Server, events.EventEmitter);

Server.prototype.sendMessageToAll = function (message) {
  'use strict';

  if (message && message.length > 0) {
    var i = 0;
    for (i = 0; i < this.clients.length; i++) {
      var options = {
        hostname: this.clients[i].split(':')[0],
        port: this.clients[i].split(':')[1],
        path: '/receive',
        method: 'POST',
        agent: false,
        headers: {
          'Connection': 'false',
        }
      };
      // set content type of message
      var req = http.request(options, responseCallback);
      req.setTimeout(1000);
      req.on('error', this.errorCallback);
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
            var message = body.replace(/([a-zA-Z]+:\/\/[^ ]*)/gm, '<span data-name="link" style="cursor:pointer;" data-href="$1">$1</span>');
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
      host: os.hostname(),
      port: port
    });
  });
};

Server.prototype.errorCallback = function (event) {
  'use strict';

  if (event && 'ECONNRESET' === event.code) {
    this.emit('warning', 'Connection reset on sending message to client');
  } else {
    this.emit('error', new Error('Cannot send to client.'));
  }
};

module.exports = new Server();