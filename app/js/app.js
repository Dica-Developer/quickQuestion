var server = require('../js/server.js');
var autoUpdate = require('../js/auto-update.js');
var gui = require('nw.gui');
require('../js/guiHandling.js');
var logDB = require('../js/db.js').logs;

var resizeTimeout,
  messages = [],
  colors = ['rgba(128, 128, 128, 0.05)', 'rgba(255, 0, 0, 0.05)', 'rgba(0, 255, 0, 0.01)', 'rgba(255, 255, 0, 0.01)', 'rgba(0, 0, 255, 0.05)', 'rgba(255, 0, 255, 0.01)', 'rgba(0, 255, 255, 0.01)', 'rgba(255, 255, 255, 0.01)', 'rgba(192, 192, 192, 0.01)'];

function sendMessage(val) {
  'use strict';
  server.emit('sendMessageToAll', val);
}

function resize() {
  'use strict';

  var messageToSend = $('#messageToSend');
  var newHeight = $(window).innerHeight() + messageToSend.height() - ($('#content').height() + $('#footer').height() + 32);
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

  function addImage(img) {
    return function (e) {
      img.src = e.target.result;
    };
  }

  var dropbox = document.getElementById('messageToSend');
  dropbox.addEventListener('drop', function (e) {
    e.stopPropagation();
    e.preventDefault();

    var dt = e.dataTransfer;
    var files = dt.files;

    for (var i = 0; i < files.length; i++) {
      if (files[i].type.indexOf('image/') === 0) {
        var elementLi = document.getElementById('imagepreview');
        var img = document.createElement('img');
        img.setAttribute('height', '50');
        img.file = files[i];
        elementLi.appendChild(img);

        var reader = new FileReader();
        reader.onload = addImage(img);
        reader.readAsDataURL(files[i]);
      } else {
        $('#otherpreview').append('<div>Send file "' + files[i].path + '" of type "' + files[i].type + '" with size of ' + files[i].size + ' bytes.</div>');
      }
    }
  }, false);

  window.onresize = function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(resize, 100);
  };
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(resize, 100);

  window.setTimeout(function() {
    gui.Window.get().show();
  }, 100);
});

server.on('updateClients', function () {
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

function hashCode(text) {
  'use strict';
  var hash = 0;
  for (var i = 0; i < text.length; i++) {
    var code = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + code;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

server.on('newMessage', function (message) {
  'use strict';
  messages.push(message);
  var content = '';
  for (var i = 0; i < messages.length; i++) {
    if (messages[i].contentType.indexOf('text/plain') === 0) {
      var sendOn = messages[i].timestamp.getFullYear() + '-' + ('0' + (messages[i].timestamp.getMonth()+1)).slice(-2) + '-' + ('0' + messages[i].timestamp.getDate()).slice(-2) + ' ' + ('0' + messages[i].timestamp.getHours()).slice(-2) + ':' + ('0' + messages[i].timestamp.getMinutes()).slice(-2) + ':' + ('0' + messages[i].timestamp.getSeconds()).slice(-2);
      content = content + '<li style="background-color: ' + colors[Math.abs(hashCode(messages[i].remoteAddress)) % 9] + ';"><p>' + messages[i].remoteAddress + ':' + messages[i].remotePort + ' ' +  sendOn + '</p>' + messages[i].content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</li>';
    } else {
      // TODO display download link
    }
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

server.on('messageSendSuccess', function () {
  'use strict';

  $('#messageToSend').val('');
  $('#message').text('Message send.');
});

server.on('messageSendError', function (errorMessage) {
  'use strict';

  $('#message').text(errorMessage);
});

server.on('log.error', function (message) {
  'use strict';
  console.error(JSON.stringify(message));
  logDB.query.insert({
    timestamp: new Date(),
    message: message
  });
});

server.on('log.info', function (message) {
  'use strict';
  console.info(JSON.stringify(message));
});

server.on('log.warning', function (message) {
  'use strict';
  console.warn(JSON.stringify(message));
});

autoUpdate.on('updateNeeded', function () {
  'use strict';
  var confirmUpdate = $('#confirmUpdate');
  confirmUpdate.on('click', '#update-yes', function () {
    autoUpdate.emit('update');
  });
  confirmUpdate.popup('open');
});
autoUpdate.on('updateDone', function () {
  'use strict';

  var confirmRestart = $('#confirmRestart');
  confirmRestart.on('click', '#restart-yes', function () {
    gui.Window.get().reload(3);
  });
  confirmRestart.popup('open');
});

gui.Window.get().on('close', function () {
  'use strict';

  this.hide(); // Pretend to be closed already
  console.log('We\'re closing...');
  logDB.save();
  this.close(true);
});