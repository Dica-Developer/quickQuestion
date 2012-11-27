var http = require('http');
var url = require('url');

http.createServer(function (request, response) {
  if ('GET' === request.method) {
    var requestUrl = url.parse(request.url, true);
    if ('/add' === requestUrl.pathname) {
      var what = requestUrl.query.what;
      var properties = requestUrl.query.properties;
      if (what) {
        console.log('what: ' + what);
        if (properties) {
          properties = JSON.parse(requestUrl.query.properties);
          console.log('properties: ' + properties);
        } else {
          properties = {};
        }
        
      } else {
        response.writeHead(400, {'Content-Type': 'text/plain'});
        response.end('What should I add?');
      }
    } else {
      response.writeHead(400, {'Content-Type': 'text/plain'});
      response.end('I did not understand the request.');
    }
  }
}).listen(process.env.PORT);
