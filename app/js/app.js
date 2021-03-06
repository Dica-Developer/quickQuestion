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
/*global $, window, document, FileReader, Image, Buffer, navigator, webkitRTCPeerConnection, URL, RTCSessionDescription, RTCIceCandidate, WebKitMediaSource*/

/* jshint -W097 */
'use strict';

var gui = require('nw.gui');
var fs = require('fs');
var server = require('../js/server.js');
var autoUpdate = require('../js/auto-update.js');
require('../js/guiHandling.js');
var logDB = require('../js/db.js').logs;
var messageDB = require('../js/db.js').messages;
var Notify = require('notifyjs');
var messageListCreated = false;
var attachmentListViewCreated = false;
var collaboratorListCreated = [];
var resizeTimeout;
var colors = ['rgba(128, 128, 128, 0.01)', 'rgba(255, 0, 0, 0.01)', 'rgba(0, 255, 0, 0.01)', 'rgba(255, 255, 0, 0.01)', 'rgba(0, 0, 255, 0.01)', 'rgba(255, 0, 255, 0.01)', 'rgba(0, 255, 255, 0.01)', 'rgba(255, 255, 255, 0.01)', 'rgba(192, 192, 192, 0.01)'];
var handledMimeTypes = ['x-event/x-video-chat-candidate', 'x-event/x-video-chat-answer', 'x-event/x-video-chat-offer', 'model/x-sketch', 'text/plain; charset=utf-8', 'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/xbm', 'image/bmp'];
var pcL = null;
var pcR = null;

function encodeHtml(value) {
  if (value) {
    return $('<div/>').text(value).html();
  }
  return value;
}

function sendMessage(val) {
  server.emit('sendMessageToAll', val);
}

function handleWhiteboardResize() {
  var canvas = document.getElementById('sketchArea');
  var tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCanvas.getContext('2d').drawImage(canvas, 0, 0);
  canvas.width = $(window).innerWidth() - 30;
  canvas.height = $(window).innerHeight() - ($('#footerWhiteboard').height() + $('#headerWhiteboard').height() + 113);
  canvas.getContext('2d').drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, tempCanvas.width, tempCanvas.height);
}

function resize() {
  var messagelist = $('#messagelist');
  var newHeight = $(window).innerHeight() + messagelist.height() - ($('#contentText').height() + $('#footerText').height() + $('#headerText').height() + 34);
  messagelist.height(newHeight);
  messagelist.scrollTop(messagelist[0].scrollHeight);

  handleWhiteboardResize();
}

function sortByHostName(lhs, rhs) {
  return lhs.hostname > rhs.hostname;
}

server.on('updateFilesList', function () {
  if (attachmentListViewCreated) {
    $('#attachmentListView').listview('refresh');
  }
});

server.on('updateClients', function () {
  var content = '';
  var i = 0;
  this.clients.sort(sortByHostName);
  for (i = 0; i < this.clients.length; i++) {
    content = content + '<li data-icon="check"><a href="#">' + encodeHtml(this.clients[i].nickname + ':' + this.clients[i].hostname + ' (' + this.clients[i].address + ')') + '</a></li>';
  }
  $('ul[name="collaboratorListView"]').each(function () {
    $(this).html(content);
    if (collaboratorListCreated[$(this).attr('id')]) {
      $(this).listview('refresh');
    }
  });
});

function hashCode(text) {
  var hash = 0,
    i = 0,
    code;
  for (i = 0; i < text.length; i++) {
    code = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + code;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

function sketchClient(sketchMessage) {
  var i = 0,
    pos;
  var canvas = document.getElementById('sketchArea');
  var ctx = canvas.getContext('2d');

  if ('stroke' === sketchMessage.type) {
    ctx.lineWidth = sketchMessage.pencileSize;
    ctx.strokeStyle = sketchMessage.pencilColor;
    var positionArray = sketchMessage.coordinates;
    for (i = 0; i < positionArray.length; i++) {
      pos = positionArray[i];
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
  sketchClient(JSON.parse(message.content));
});

server.on('newMessage_x-event/x-video-chat-candidate', function (message) {
  var candidate = JSON.parse(message.content).candidate;
  if (pcR) {
    pcR.addIceCandidate(new RTCIceCandidate(candidate));
  }
  if (pcL) {
    pcL.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

server.on('newMessage_x-event/x-video-chat-answer', function (message) {
  var desc = JSON.parse(message.content).description;
  if (pcL) {
    pcL.setRemoteDescription(new RTCSessionDescription(desc));
  } else {
    console.warn('Received answer but have no offer send.');
  }
});

server.on('newMessage_x-event/x-video-chat-offer', function (message) {
  var desc = JSON.parse(message.content).description;
  pcR = new webkitRTCPeerConnection(null);
  pcR.onaddstream = function (e) {
    var video = $('<video>');
    video.attr('autoplay', true);
    video.css('-webkit-transform', 'rotateY(180deg)');
    video.attr('src', URL.createObjectURL(e.stream));
    $('#contentAudiovideo').append(video);
  };
  pcR.onicecandidate = function (event) {
    if (event.candidate) {
      var messageToSend = {
        type: 'x-event/x-video-chat-candidate',
        candidate: event.candidate
      };
      server.emit('sendVideoMessageToAll', messageToSend);
    }
  };
  pcR.setRemoteDescription(new RTCSessionDescription(desc));
  pcR.createAnswer(function (desc2) {
    pcR.setLocalDescription(desc2);
    var messageToSend = {
      type: 'x-event/x-video-chat-answer',
      description: desc2
    };
    server.emit('sendVideoMessageToAll', messageToSend);
  }, null, {
    'mandatory': {
      'OfferToReceiveAudio': true,
      'OfferToReceiveVideo': true
    }
  });
});

function resetMessageCount() {
  $('#messageCount').remove();
}

server.on('newMessage', function () {
  var currentCount = 1;
  var messageCount = $('#messageCount').val();
  if (messageCount) {
    currentCount = parseInt(messageCount, 10);
  } else {
    $('body').append('<input id="messageCount"></input>');
  }
  $('#messageCount').val(currentCount + 1);
  var myNotification = new Notify('New messages', {
    body: 'You received ' + currentCount + ' new ' + (messageCount > 1 ? 'messages' : 'message') + '!',
    tag: 'qq.message.received',
    notifyShow: resetMessageCount
  });
  myNotification.show();
});

function formatDate(timestamp) {
  return timestamp.getFullYear() + '-' +
    ('0' + (timestamp.getMonth() + 1)).slice(-2) + '-' +
    ('0' + timestamp.getDate()).slice(-2) + ' ' +
    ('0' + timestamp.getHours()).slice(-2) + ':' +
    ('0' + timestamp.getMinutes()).slice(-2) + ':' +
    ('0' + timestamp.getSeconds()).slice(-2);
}

function updateMessageList(content) {
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
  var timestamp = new Date(message.timestamp);
  var sendOn = formatDate(timestamp);
  var content = '<li style="background-color: ' + colors[Math.abs(hashCode(message.remoteAddress)) % 9] + ';"><p class="ui-li-aside">by <strong>' + encodeHtml((message.nickname || message.remoteAddress)) + '</strong> at <strong>' + sendOn + '</strong></p>';
  content = content + '<p style="white-space: pre-line;">';
  content = content + encodeHtml(message.content).replace(/([a-zA-Z]+:\/\/[^ ]*)/gm, '<a data-name="link" class="ui-link"  data-dbid="' + message.___id + '">$1</a>');
  content = content + '</p>';
  content = content + '</li>';

  updateMessageList(content);

  $('[data-name="link"]').on('click', function () {
    gui.Shell.openExternal($(this).data('dbid'));
  });
  $('[data-name="link"]').data('name', '');
});

function handleFileClick(event) {
  var fileSaveAsDialog = $('#fileSaveAsDialog');
  fileSaveAsDialog.data('dbid', $(event.target).closest('a').data('dbid'));
  $('#fileHandlePopup').popup('open', {
    positionTo: 'origin',
    transition: 'pop',
    x: event.clientX,
    y: event.clientY
  });
}

function addImageMessage(message) {
  var timestamp = new Date(message.timestamp);
  var sendOn = formatDate(timestamp);
  var content = '<li style="background-color: ' + colors[Math.abs(hashCode(message.remoteAddress)) % 9] + ';"><p class="ui-li-aside">by <strong>' + encodeHtml((message.nickname || message.remoteAddress)) + '</strong> at <strong>' + sendOn + '</strong></p>';
  content = content + '<p style="white-space: pre-line;">';
  content = content + '<a data-name="link"  data-dbid="' + message.___id + '"><img src="' + message.content + '" height="50"></img></a>';
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
  var timestamp = new Date(message.timestamp);
  var sendOn = formatDate(timestamp);
  var content = '<li style="background-color: ' + colors[Math.abs(hashCode(message.remoteAddress)) % 9] + ';"><p class="ui-li-aside">by <strong>' + encodeHtml((message.nickname || message.remoteAddress)) + '</strong> at <strong>' + sendOn + '</strong></p>';
  content = content + '<p style="white-space: pre-line;">';
  content = content + '<a data-name="link" class="ui-link" data-dbid="' + message.___id + '">message of type ' + encodeHtml(message.contentType) + '</a>';
  content = content + '</p>';
  content = content + '</li>';

  updateMessageList(content);

  $('[data-name="link"]').on('click', handleFileClick);
  $('[data-name="link"]').data('name', '');
});

function displayMessagesAfterRestart() {
  var i;
  var messages = messageDB.query(
    [{
      contentType: {
        left: 'text/'
      }
    }, {
      contentType: {
        left: 'image/'
      }
    }]
  ).order('timestamp desc').limit(10).get();

  for (i = messages.length - 1; i > -1; i--) {
    if (handledMimeTypes.indexOf(messages[i].contentType) > -1) {
      server.emit('newMessage_' + messages[i].contentType, messages[i]);
    } else {
      server.emit('newMessageUnhandled', messages[i]);
    }
  }
}

server.on('newMessage', function (message) {
  messageDB.query.insert(message);
});

server.on('messageSendSuccess', function () {
  $('#messageToSend').val('');
  $('#message').text('Message was sent.');
});

server.on('messageSendError', function (errorMessage) {
  $('#message').text(errorMessage);
});

server.on('log.error', function (message) {
  console.error(JSON.stringify(message));
  logDB.query.insert({
    timestamp: new Date(),
    message: message
  });
});

server.on('log.info', function (message) {
  console.info(JSON.stringify(message));
});

server.on('log.warning', function (message) {
  console.warn(JSON.stringify(message));
});

autoUpdate.on('updateNeeded', function () {
  var confirmUpdate = $('#confirmUpdate');
  confirmUpdate.on('click', '#update-yes', function () {
    gui.Shell.openExternal('http://dica-developer.github.io/quickQuestion/');
  });

  confirmUpdate.popup('open');
});

autoUpdate.on('updateDone', function () {
  var confirmRestart = $('#confirmRestart');
  confirmRestart.on('click', '#restart-yes', function () {
    gui.Window.get().reload(3);
  });
  confirmRestart.popup('open');
});

autoUpdate.on('log.warning', function (message) {
  console.warn(JSON.stringify(message));
  logDB.query.insert({
    timestamp: new Date(),
    message: message
  });
});

function fixPosition(e, gCanvasElement) {
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

function teardown() {
  var os = require('os');
  process.stdout.write('We\'re closing...' + os.EOL);
  logDB.save();
  messageDB.save();
}

function saveFile(path, dbId) {
  var message = messageDB.query(dbId).first();
  if (message && message.content) {
    var content = message.content;
    var from = content.indexOf(';base64,') + ';base64,'.length;
    content = content.substring(from);
    var buffer = new Buffer(content, 'base64');
    fs.writeFile(path, buffer, function (error) {
      if (error) {
        // TODO handle error
      }
    });
  } else {
    // TODO handle error
  }
}

function removeAttachment(event) {
  var attachmentEntry = $(event.target).closest('li');
  attachmentEntry.remove();
  if (0 === $('#attachmentListView > li').length) {
    $('#attachmentButton').hide();
  }

}

function screenCastVideoStreamSuccess(stream) {
  var ms = new WebKitMediaSource();
  var video = $('<video>');
  video.attr('autoplay', true);
  video.attr('controls', true);
  video.attr('src', window.URL.createObjectURL(ms));
  video.attr('src', URL.createObjectURL(stream));

  $('#contentAudiovideo').append(video);
  ms.onprogress = function (e) {
    console.log(e);
  };
  ms.addEventListener('sourceopen', function () {
    var sourceBuffer = ms.addSourceBuffer('video/webm; codecs="vorbis,vp8"');
    sourceBuffer.appendStream(stream);
  }, false);

  /*
  function onInitFs(fs) {
    fs.root.getFile('video.mp4', {
      create: true
    }, function (fileEntry) {
      fileEntry.createWriter(function (fileWriter) {
        fileWriter.onwriteend = function () {
          console.log('Write completed.');
        };
        fileWriter.onerror = function (e) {
          console.log('Write failed: ' + e.toString());
        };
        fileWriter.write(URL.createObjectURL(stream));
      }, function (e) {
        console.log(e);
      });
    }, function (e) {
      console.log(e);
    });
  }
  window.webkitRequestFileSystem(window.TEMPORARY, 1024 * 1024, onInitFs, function (e) {
    console.log(e);
  });*/
}

function videoStreamSuccess(stream) {
  pcL = new webkitRTCPeerConnection(null);
  pcL.onicecandidate = function (event) {
    if (event.candidate) {
      var message = {
        type: 'x-event/x-video-chat-candidate',
        candidate: event.candidate
      };
      server.emit('sendVideoMessageToAll', message);
    }
  };
  pcL.onaddstream = function (e) {
    var video = $('<video>');
    video.attr('autoplay', true);
    video.css('-webkit-transform', 'rotateY(180deg)');
    video.attr('src', URL.createObjectURL(e.stream));
    $('#contentAudiovideo').append(video);

    fs.createWriteStream('/tmp/test.video');
  };

  pcL.addStream(stream);

  pcL.createOffer(function (desc) {
    pcL.setLocalDescription(desc);
    var message = {
      type: 'x-event/x-video-chat-offer',
      description: desc
    };
    server.emit('sendVideoMessageToAll', message);
  });
}

function videoStreamError(error) {
  console.error('navigator.getUserMedia error: ', error);
}

// startup on DOM ready
$(function () {
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
    saveFile($(this).val(), $('#fileSaveAsDialog').data('dbid'));
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

  $('ul[name="collaboratorListView"]').on('listviewcreate', function () {
    collaboratorListCreated[$(this).attr('id')] = true;
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
    case 8:
      var copy = $('<textarea>');
      copy.addClass('ui-input-text ui-body-a ui-corner-all ui-shadow-inset ui-focus');
      copy.text(messageToSend.val());
      document.body.appendChild(copy[0]);
      if (copy[0].scrollHeight < parseInt(messageToSend.css('height'), 10)) {
        // FIXME this is not very accurate after line break removal
        // 15 is a hardcoded value from jquery mobile
        // 6 should be the padding and calculated
        messageToSend.css('height', (copy[0].scrollHeight + 15 + 6));
        resize();
      }
      document.body.removeChild(copy[0]);
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

  messageToSend.bind('keyup', function () {
    resize();
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
    var liElement, leftAElement, img, reader, pElement, removeAttachmentLink;

    for (i = 0; i < files.length; i++) {
      liElement = $('<li>');
      liElement.data('path', files[i].path);
      liElement.data('type', files[i].type);
      leftAElement = $('<a>');
      liElement.append(leftAElement);
      $('#attachmentListView').append(liElement);
      if (files[i].type.indexOf('image/') === 0) {
        img = $('<img>');
        img.attr('height', '80');
        img.attr('src', files[i].path);
        leftAElement.append(img);

        reader = new FileReader();
        reader.onload = addImage(img);
        reader.readAsDataURL(files[i]);
      } else {
        pElement = $('<p>');
        pElement.css('white-space', 'pre-line');
        pElement.text('File: "' + files[i].path + '" Type: "' + files[i].type + '" Size: ' + files[i].size);
        leftAElement.append(pElement);
      }
      removeAttachmentLink = $('<a href="#removeAttachment" data-rel="popup" data-position-to="window" data-transition="pop">Remove Attachment</a>');
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
    var dbId = $('#fileSaveAsDialog').data('dbid');
    var message = messageDB.query(dbId).first();
    if (message && message.content) {
      var content = message.content;
      var from = content.indexOf(';base64,') + ';base64,'.length;
      content = content.substring(from);
      var buffer = new Buffer(content, 'base64');
      if (message.contentType.indexOf('image/') === 0 || message.contentType.indexOf('video/') === 0) {
        filePath = filePath + '.' + message.contentType.split('/')[1];
      }
      fs.writeFile(filePath, buffer, function (error) {
        if (error) {
          // TODO handle error
        } else {
          gui.Shell.openExternal('file://' + filePath);
        }
      });
    } else {
      // TODO handle error
    }
  });

  $('#startVideoChat').on('click', function () {
    navigator.webkitGetUserMedia({
      audio: true,
      video: {
        mandatory: {
          maxWidth: 320,
          maxHeight: 180
        }
      }
    }, videoStreamSuccess, videoStreamError);
  });

  $('#startAudioChat').on('click', function () {
    navigator.webkitGetUserMedia({
      audio: true,
      video: false
    }, videoStreamSuccess, videoStreamError);
  });

  $('#startScreenShare').on('click', function () {
    navigator.webkitGetUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'screen'
        }
      }
    }, videoStreamSuccess, videoStreamError);
  });

  $('#startScreenCast').on('click', function () {
    navigator.webkitGetUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'screen'
        }
      }
    }, screenCastVideoStreamSuccess, videoStreamError);
  });

  window.onresize = function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(resize, 100);
  };
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(resize, 100);

  window.setTimeout(function () {
    gui.Window.get().show();
    gui.Window.get().on('close', function (reallyQuitOnMacOs) {
      teardown();
      if (undefined === reallyQuitOnMacOs || null === reallyQuitOnMacOs || 'quit' === reallyQuitOnMacOs) {
        gui.Window.get().close(true);
      }
    });
  }, 100);

  $(window).on('pagechange', function () {
    resize();
  });
});

process.on('SIGINT', teardown);
process.on('SIGTERM', teardown);

messageDB.on('ready', function () {
  messageDB.query.settings({
    onInsert: function () {
      var message = this;
      if (handledMimeTypes.indexOf(message.contentType) > -1) {
        server.emit('newMessage_' + message.contentType, message);
      } else {
        server.emit('newMessageUnhandled', message);
      }
    }
  });
  $(function () {
    displayMessagesAfterRestart();
  });
});