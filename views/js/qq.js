(function () {
  "use strict";

  /*global $, document*/

  function refreshClientlist() {
    $.get('/clients', function (data) {
      var i = 0;
      var content = '';
      for (i = 0; i < data.length; i++) {
        content = content + '<li>' + data[i] + '</li>';
      }
      $('#clientlist').html(content);
      $('#clientlist').listview('refresh');
    });
  }

  function refreshMessagelist() {
    $.get('/messages', function (data) {
      var i = 0;
      var content = '';
      for (i = 0; i < data.length; i++) {
        content = content + '<li>' + data[i] + '</li>';
      }
      $('#messagelist').html(content);
      $('#messagelist').listview('refresh');
    });
  }

  function sendMessage() {
    var xhr = $.post('/sendMessageToAll', $("#messageToSend").val(), function (response) {
      $("#messageToSend").val("");
      $("#message").text(response);
    }, 'text');
    xhr.fail(function (response) {
      $("#message").text(response.responseText || "Message failed to send!");
    });
  }

  $(function () {
    $('#messageToSend').bind('keypress', function (event) {
      if (event.which === 13) {
        sendMessage();
      }
    });
    $('#sendMessage').bind('vclick', sendMessage);
    refreshMessagelist();
    setInterval(refreshMessagelist, 500);
    refreshClientlist();
    setInterval(refreshClientlist, 30000);
  });
}());