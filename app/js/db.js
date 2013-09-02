var TAFFY = require('node-taffydb').TAFFY;

function Db(name) {
  'use strict';

  this.name = name;
  this.query = null;

  var dbContent = window.localStorage[this.name];
  if (dbContent) {
    this.query = TAFFY(JSON.parse(dbContent));
  } else {
    this.query = TAFFY();
  }
  this.save = function () {
    window.localStorage[this.name] = JSON.stringify(this.query().get());
  };
}

module.exports.options = new Db('options');
module.exports.messages = new Db('messages');
module.exports.logs = new Db('logs');
