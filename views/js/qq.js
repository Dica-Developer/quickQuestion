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
    });
  }

  $(function () {
    $('#sendMessage').bind('vclick', function () {
      var xhr = $.post('/sendMessageToAll', $("#messageToSend").val(), function (response) {
        $("#messagelist").html($("#messageToSend").val());
        $("#messageToSend").val("");
        $("#message").text(response);
      }, 'text/plain');
      xhr.fail(function (response) {
        $("#message").text(response.responseText || "Message failed to send!");
      });
    });
    refreshMessagelist();
    setInterval(refreshMessagelist, 500);
    refreshClientlist();
    setInterval(refreshClientlist, 30000);
  });
}());