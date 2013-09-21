/*
Quick Question - Communication and Collaboration tool.
Copyright (C) 2013  Dica-Developer

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/*global $, window, document, FileReader, Image, Buffer*/

var gui = require('nw.gui');
var fs = require('fs');
var server = require('../js/server.js');
var autoUpdate = require('../js/auto-update.js');
require('../js/guiHandling.js');
var logDB = require('../js/db.js').logs;
var messageDB = require('../js/db.js').messages;
var messageListCreated = false;
var attachmentListViewCreated = false;
var collaboratorListCreated = false;
var resizeTimeout;
var colors = ['rgba(128, 128, 128, 0.01)', 'rgba(255, 0, 0, 0.01)', 'rgba(0, 255, 0, 0.01)', 'rgba(255, 255, 0, 0.01)', 'rgba(0, 0, 255, 0.01)', 'rgba(255, 0, 255, 0.01)', 'rgba(0, 255, 255, 0.01)', 'rgba(255, 255, 255, 0.01)', 'rgba(192, 192, 192, 0.01)'];
var handledMimeTypes = ['model/x-sketch', 'text/plain; charset=utf-8', 'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/xbm', 'image/bmp'];

function sendMessage(val) {
  'use strict';
  server.emit('sendMessageToAll', val);
}

function handleWhiteboardResize() {
  'use strict';

  var canvas = document.getElementById('sketchArea');
  var tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCanvas.getContext('2d').drawImage(canvas, 0, 0);
  canvas.width = $(window).innerWidth() - 30;
  canvas.getContext('2d').drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, tempCanvas.width, tempCanvas.height);
}

function resize() {
  'use strict';

  var messageToSend = $('#messageToSend');
  var newHeight = $(window).innerHeight() + messageToSend.height() - ($('#content').height() + $('#footer').height() + 32);
  messageToSend.height(newHeight);

  handleWhiteboardResize();
}

function sortByHostName(lhs, rhs) {
  'use strict';
  return lhs.hostname > rhs.hostname;
}

server.on('updateFilesList', function () {
  'use strict';

  if (attachmentListViewCreated) {
    $('#attachmentListView').listview('refresh');
  }
});

server.on('updateClients', function () {
  'use strict';
  var content = '';
  var i = 0;
  this.clients.sort(sortByHostName);
  for (i = 0; i < this.clients.length; i++) {
    content = content + '<li data-icon="check"><a href="#">' + this.clients[i].hostname + ' (' + this.clients[i].address + ')</a></li>';
  }
  $('ul[name="collaboratorListView"]').each(function () {
    $(this).html(content);
  });

  var collaboratorList = $('#collaboratorListView');
  if (collaboratorListCreated) {
    collaboratorList.listview('refresh');
  }
});

function hashCode(text) {
  'use strict';
  var hash = 0,
    i = 0;
  for (i = 0; i < text.length; i++) {
    var code = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + code;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

function sketchClient(sketchMessage) {
  'use strict';
  var i = 0;
  var canvas = document.getElementById('sketchArea');
  var ctx = canvas.getContext('2d');

  if ('stroke' === sketchMessage.type) {
    ctx.lineWidth = sketchMessage.pencileSize;
    ctx.strokeStyle = sketchMessage.pencilColor;
    var positionArray = sketchMessage.coordinates;
    for (i = 0; i < positionArray.length; i++) {
      var pos = positionArray[i];
      if (0 === i) {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      } else {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
  } else if ('image' === sketchMessage.type) {
    if (typeof sketchMessage.image === 'string') {
      var img = new Image();
      img.src = sketchMessage.image;
      img.onload = function () {
        ctx.drawImage(this, 0, 0);
      };
    } else {
      console.error('Invalid image sketch message.');
    }
  } else {
    console.warn('Unknown sketch type ' + sketchMessage.type + '. Ignoring message.');
  }
}

server.on('newMessage_model/x-sketch', function (message) {
  'use strict';

  sketchClient(JSON.parse(message.content));
});

function formatDate(timestamp) {
  'use strict';

  return timestamp.getFullYear() + '-' +
    ('0' + (timestamp.getMonth() + 1)).slice(-2) + '-' +
    ('0' + timestamp.getDate()).slice(-2) + ' ' +
    ('0' + timestamp.getHours()).slice(-2) + ':' +
    ('0' + timestamp.getMinutes()).slice(-2) + ':' +
    ('0' + timestamp.getSeconds()).slice(-2);
}

function updateMessageList(content) {
  'use strict';

  $('ul[name="messagelist"]').each(function () {
    $(this).append(content);
  });

  var messageList = $('#messagelist');
  if (messageListCreated) {
    messageList.listview('refresh');
  }
  messageList.scrollTop(messageList[0].scrollHeight);

  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(resize, 100);
}

server.on('newMessage_text/plain; charset=utf-8', function (message) {
  'use strict';

  var timestamp = new Date(message.timestamp);
  var sendOn = formatDate(timestamp);
  var content = '<li style="background-color: ' + colors[Math.abs(hashCode(message.remoteAddress)) % 9] + ';"><p class="ui-li-aside">by <strong>' + message.remoteAddress + '</strong> at <strong>' + sendOn + '</strong></p>';
  content = content + '<p style="white-space: pre-line;">';
  content = content + message.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/([a-zA-Z]+:\/\/[^ ]*)/gm, '<span data-name="link" style="cursor:pointer;" data-href="$1">$1</span>');
  content = content + '</p>';
  content = content + '</li>';

  updateMessageList(content);

  $('[data-name="link"]').on('click', function () {
    gui.Shell.openExternal($(this).data('href'));
  });
  $('[data-name="link"]').data('name', '');
});

function handleFileClick(event) {
  'use strict';

  var fileSaveAsDialog = $('#fileSaveAsDialog');
  fileSaveAsDialog.data('content', $(event.target).closest('span').data('href'));
  $('#fileHandlePopup').popup('open', {
    positionTo: 'origin',
    transition: 'pop',
    x: event.clientX,
    y: event.clientY
  });
}

function addImageMessage(message) {
  'use strict';

  var timestamp = new Date(message.timestamp);
  var sendOn = formatDate(timestamp);
  var content = '<li style="background-color: ' + colors[Math.abs(hashCode(message.remoteAddress)) % 9] + ';"><p class="ui-li-aside">by <strong>' + message.remoteAddress + '</strong> at <strong>' + sendOn + '</strong></p>';
  content = content + '<p style="white-space: pre-line;">';
  content = content + '<span data-name="link" style="cursor:pointer;" data-href="' + message.content + '"><img src="' + message.content + '" height="50"></img></span>';
  content = content + '</p>';
  content = content + '</li>';

  updateMessageList(content);

  $('[data-name="link"]').on('click', handleFileClick);
  $('[data-name="link"]').data('name', '');
}

server.on('newMessage_image/png', addImageMessage);
server.on('newMessage_image/jpeg', addImageMessage);
server.on('newMessage_image/gif', addImageMessage);
server.on('newMessage_image/svg+xml', addImageMessage);
server.on('newMessage_image/xbm', addImageMessage);
server.on('newMessage_image/bmp', addImageMessage);

server.on('newMessageUnhandled', function (message) {
  'use strict';

  var timestamp = new Date(message.timestamp);
  var sendOn = formatDate(timestamp);
  var content = '<li style="background-color: ' + colors[Math.abs(hashCode(message.remoteAddress)) % 9] + ';"><p class="ui-li-aside">by <strong>' + message.remoteAddress + '</strong> at <strong>' + sendOn + '</strong></p>';
  content = content + '<p style="white-space: pre-line;">';
  content = content + '<span data-name="link" style="cursor:pointer;" data-href="' + message.content + '">message of type ' + message.contentType + '</span>';
  content = content + '</p>';
  content = content + '</li>';

  updateMessageList(content);

  $('[data-name="link"]').on('click', handleFileClick);
  $('[data-name="link"]').data('name', '');
});

function displayMessagesAfterRestart() {
  'use strict';

  var i;
  var messages = messageDB.query({
    timestamp: {
      gte: (new Date()).setTime((new Date()).getTime() - (3600 * 1000))
    }
  }).get();

  for (i = 0; i < messages.length; i++) {
    if (handledMimeTypes.indexOf(messages[i].contentType) > -1) {
      server.emit('newMessage_' + messages[i].contentType, messages[i]);
    } else {
      server.emit('newMessageUnhandled', messages[i]);
    }
  }
}

server.on('newMessage', function (message) {
  'use strict';

  messageDB.query.insert(message);
});

server.on('messageSendSuccess', function () {
  'use strict';

  $('#messageToSend').val('');
  $('#message').text('Message was sent.');
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

autoUpdate.on('log.warning', function (message) {
  'use strict';
  console.warn(JSON.stringify(message));
  logDB.query.insert({
    timestamp: new Date(),
    message: message
  });
});

/*
found on http://jsfiddle.net/ghostoy/wTmFE/1/
Thanks to http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element/4430498#4430498
*/

function fixPosition(e, gCanvasElement) {
  'use strict';

  var x;
  var y;
  if (e.pageX || e.pageY) {
    x = e.pageX;
    y = e.pageY;
  } else {
    x = e.clientX + document.body.scrollLeft +
      document.documentElement.scrollLeft;
    y = e.clientY + document.body.scrollTop +
      document.documentElement.scrollTop;
  }
  x -= gCanvasElement.offsetLeft;
  y -= gCanvasElement.offsetTop;
  return {
    x: x,
    y: y
  };
}

function saveFile(path, content) {
  'use strict';

  var from = content.indexOf(';base64,') + ';base64,'.length;
  content = content.substring(from);
  var buffer = new Buffer(content, 'base64');
  fs.writeFile(path, buffer, function (error) {
    if (error) {
      // TODO handle error
    }
  });
}

function removeAttachment(event) {
  'use strict';

  var attachmentEntry = $(event.target).closest('li');
  attachmentEntry.remove();
  if (0 === $('#attachmentListView > li').length) {
    $('#attachmentButton').hide();
  }

}

// startup on DOM ready
$(function () {
  'use strict';

  var lastSketchPoints = [];
  var mousedown = false;
  var canvas = document.getElementById('sketchArea');
  canvas.style.cursor = 'crosshair';
  var context = canvas.getContext('2d');
  context.strokeStyle = 'black';
  context.lineWidth = 1;
  $(canvas).on('vmousedown', function (e) {
    mousedown = true;
    var pos = fixPosition(e, canvas);
    lastSketchPoints.push(pos);
    context.beginPath();
    context.moveTo(pos.x, pos.y);
    return false;
  });

  $(canvas).on('vmousemove', function (e) {
    if (mousedown) {
      var pos = fixPosition(e, canvas);
      lastSketchPoints.push(pos);
      context.lineTo(pos.x, pos.y);
      context.stroke();
    }
  });

  $(canvas).on('vmouseup', function () {
    mousedown = false;
    var sketchMessage = {
      type: 'stroke',
      coordinates: lastSketchPoints,
      pencilColor: $('#pencilColorSketchArea option:selected')[0].value,
      pencilSize: $('#pencilSizeSketchArea option:selected')[0].value
    };
    server.emit('sendSketchMessageToAll', sketchMessage);
    lastSketchPoints = [];
  });

  $('#whiteboardSaveAsDialog').change(function () {
    var image = canvas.toDataURL('image/png');
    image = image.replace('data:image/png;base64,', '');
    var buffer = new Buffer(image, 'base64');
    fs.writeFile($(this).val(), buffer, function (error) {
      if (error) {
        // TODO handle error
      }
    });
  });

  $('#saveSketchArea').on('click', function () {
    $('#whiteboardSaveAsDialog').trigger('click');
  });

  $('#fileSaveAsDialog').change(function () {
    saveFile($(this).val(), $('#fileSaveAsDialog').data('content'));
  });

  $('#newSketchArea').on('click', function () {
    context.clearRect(0, 0, canvas.width, canvas.height);
  });

  $('#pencilSizeSketchArea').on('change', function () {
    context.lineWidth = $('#pencilSizeSketchArea option:selected')[0].value;
  });

  $('#pencilColorSketchArea').on('change', function () {
    context.strokeStyle = $('#pencilColorSketchArea option:selected')[0].value;
  });

  $('#messagelist').on('listviewcreate', function () {
    messageListCreated = true;
  });

  $('#attachmentListView').on('listviewcreate', function () {
    attachmentListViewCreated = true;
  });

  $('#collaboratorListView').on('listviewcreate', function () {
    collaboratorListCreated = true;
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
      img.attr('src', e.target.result);
    };
  }

  var dropbox = document.getElementById('messageToSend');
  dropbox.addEventListener('drop', function (e) {
    e.stopPropagation();
    e.preventDefault();

    var dt = e.dataTransfer;
    var files = dt.files;
    var i = 0;

    for (i = 0; i < files.length; i++) {
      var liElement = $('<li>');
      liElement.data('path', files[i].path);
      liElement.data('type', files[i].type);
      var leftAElement = $('<a>');
      liElement.append(leftAElement);
      $('#attachmentListView').append(liElement);
      if (files[i].type.indexOf('image/') === 0) {
        var img = $('<img>');
        img.attr('height', '50');
        img.attr('src', files[i].path);
        leftAElement.append(img);

        var reader = new FileReader();
        reader.onload = addImage(img);
        reader.readAsDataURL(files[i]);
      } else {
        var pElement = $('<p>');
        pElement.css('white-space', 'pre-line');
        pElement.text('File: "' + files[i].path + '" Type: "' + files[i].type + '" Size: ' + files[i].size);
        leftAElement.append(pElement);
      }
      var removeAttachmentLink = $('<a href="#removeAttachment" data-rel="popup" data-position-to="window" data-transition="pop">Remove Attachment</a>');
      removeAttachmentLink.on('click', removeAttachment);
      liElement.append(removeAttachmentLink);
    }
    if (attachmentListViewCreated && (files.length > 0)) {
      $('#attachmentListView').listview('refresh');
    }
    if ($('#attachmentButton').is(':hidden')) {
      $('#attachmentButton').show();
    }
  }, false);

  canvas.ondragover = function (e) {
    e.preventDefault();
    return false;
  };

  canvas.ondrop = function (e) {
    e.stopPropagation();
    e.preventDefault();

    var dt = e.dataTransfer;
    var files = dt.files;

    if (files.length > 0) {
      var reader = new FileReader();
      reader.onload = function (event) {
        var img = new Image();
        img.src = event.target.result;
        img.onload = function () {
          context.drawImage(this, 0, 0);
          var sketchMessage = {
            type: 'image',
            image: event.target.result
          };
          server.emit('sendSketchMessageToAll', sketchMessage);
        };
      };
      reader.readAsDataURL(files[0]);
    }
  };

  $('#saveAsFileButton').on('click', function () {
    $('#fileSaveAsDialog').trigger('click');
    $('#fileHandlePopup').popup('close');
  });

  $('#openFileButton').on('click', function () {
    $('#fileHandlePopup').popup('close');
    var path = require('path');
    var os = require('os');
    var filePath = path.join(os.tmpdir(), 'quickQuestionTempFile');
    var content = $('#fileSaveAsDialog').data('content');
    var from = content.indexOf(';base64,') + ';base64,'.length;
    content = content.substring(from);
    var buffer = new Buffer(content, 'base64');
    fs.writeFile(filePath, buffer, function (error) {
      if (error) {
        // TODO handle error
      } else {
        gui.Shell.openExternal('file://' + filePath);
      }
    });
  });

  window.onresize = function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(resize, 100);
  };
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(resize, 100);

  window.setTimeout(function () {
    gui.Window.get().show();
  }, 100);
});

// Window close or CMD+Q
var teardown = function () {
  'use strict';

  var os = require('os');
  process.stdout.write('We\'re closing...' + os.EOL);
  logDB.save();
  messageDB.save();
};

process.on('exit', teardown);
process.on('SIGINT', teardown);
process.on('SIGTERM', teardown);

messageDB.on('ready', function () {
  'use strict';
  $(function () {
    displayMessagesAfterRestart();
  });
});