var http = require('http');
var url = require('url');
var polo = require('polo');
var os = require('os');
var apps = polo();
var clients = [];
var messages = [];
var viewsDir = 'views';
var rootDir = '.';
var fs = require('fs');
var EventEmitter = require("events").EventEmitter;
var eventEmitter = new EventEmitter();

fs.exists(viewsDir, function (exists) {
  if (!exists) {
    viewsDir = '/usr/local/lib/node_modules/quickquestion/views';
    rootDir = '/usr/local/lib/node_modules/quickquestion';
    fs.exists(viewsDir, function (exists) {
      if (!exists) {
        viewsDir = '/usr/lib/node_modules/quickquestion/views';
        rootDir = '/usr/lib/node_modules/quickquestion';
        fs.exists(viewsDir, function (exists) {
          if (!exists) {
            viewsDir = 'views';
            rootDir = '.';
          }
          eventEmitter.emit('rootDirInit');
        });
      } else {
        eventEmitter.emit('rootDirInit');
      }
    });
  } else {
    eventEmitter.emit('rootDirInit');
  }
});

apps.on('up', function (name, service) {
  // handle service name 'quickquestion'
  var newClient = true;
  var i = 0;
  for (i = 0; i < clients.length; i++) {
    if (clients[i] === service.address) {
      newClient = false;
    }
  }
  if (newClient) {
    clients.push(service.address);
  }
});

apps.on('down', function (name, service) {
  var i = 0;
  for (i = 0; i < clients.length; i++) {
    if (clients[i] === service.address) {
      clients.pop(service.address);
    }
  }
});

function cleanup() {
  console.log('Quick Question stopped.');
}

process.on('exit', function () {
  cleanup();
});
process.on('SIGINT', function () {
  process.exit(0);
});
process.on('SIGTERM', function () {
  process.exit(0);
});

var serverExternal = http.createServer(function (request, response) {
  var i = 0;
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
        } else {
          console.warn('Empty message received!');
        }
      });
      // todo notify ui about it
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

var serverInternal = http.createServer(function (request, response) {
  var i = 0;
  var requestUrl = url.parse(request.url, true);
  if ('POST' === request.method) {
    if ('/sendMessageToAll' === requestUrl.pathname) {
      var body = "";
      request.on('data', function (chunk) {
        body += chunk;
      });
      request.on('end', function () {
        if (body && body.length > 0) {
          for (i = 0; i < clients.length; i++) {
            var options = {
              hostname: clients[i].split(':')[0],
              port: clients[i].split(':')[1],
              path: '/receive',
              method: 'POST'
            };
            var req = http.request(options);
            req.on('error', function (e) {
              console.log('Cannot send to client.', e);
            });
            req.end(body);
          }
          response.end('Message send.');
        } else {
          response.writeHead(404, {
            'Content-Type': 'text/plain'
          });
          response.end('We do not send empty messages.');
        }
      });
    } else {
      response.writeHead(404, {
        'Content-Type': 'text/plain'
      });
      response.end('ಠ_ಠ');
    }
  } else if ('GET' === request.method) {
    if ('/messages' === requestUrl.pathname) {
      response.writeHead(200, {
        'Content-Type': 'application/json'
      });
      response.end(JSON.stringify(messages));
    } else if ('/clients' === requestUrl.pathname) {
      response.writeHead(200, {
        'Content-Type': 'application/json'
      });
      response.end(JSON.stringify(clients));
    } else {
      var file = viewsDir + (requestUrl.pathname.length > 1 ? requestUrl.pathname : '/index.html');
      fs.readFile(file, function (error, data) {
        if (error) {
          console.error(error);
          response.writeHead(404, {
            'Content-Type': 'text/plain'
          });
          response.end('ಠ_ಠ');
        } else {
          var type = 'text/plain';
          if (file.indexOf('.html') > -1) {
            type = 'text/html';
          } else if (file.indexOf('.js') > -1) {
            type = 'text/javascript';
          } else if (file.indexOf('.ico') > -1) {
            type = 'image/vnd.microsoft.icon';
          } else if (file.indexOf('.svg') > -1) {
            type = 'image/svg+xml';
          } else if (file.indexOf('.css') > -1) {
            type = 'text/css';
          }
          response.writeHead(200, {
            'Content-Type': type
          });
          response.end(data);
        }
      });
    }
  } else {
    response.writeHead(404, {
      'Content-Type': 'text/plain'
    });
    response.end('ಠ_ಠ');
  }
});
serverInternal.listen(process.env.PORT || 0, '127.0.0.1', function () {
  var port = serverInternal.address().port;
  console.log('Use Quick Question by visiting: http://127.0.0.1:' + port);
});