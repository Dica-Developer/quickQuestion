node-taffydb
============

Port of TaffyDB to work as Node NPM Module



USAGE
=========================
Here are some quick instructions on how to use this module.  You can see the help docs located at http://www.taffydb.com/

### Activating the module

You will have to first require the module

> var TAFFY = require('node-taffydb').TAFFY;

Next, pass an array of objects. 
>// Create DB and fill it with records

>var friends = TAFFY([
>	{"id":1,"gender":"M","first":"John","last":"Smith","city":"Seattle, WA","status":"Active"},
	{"id":2,"gender":"F","first":"Kelly","last":"Ruth","city":"Dallas, TX","status":"Active"},
	{"id":3,"gender":"M","first":"Jeff","last":"Stevenson","city":"Washington, D.C.","status":"Active"},
	{"id":4,"gender":"F","first":"Jennifer","last":"Gill","city":"Seattle, WA","status":"Active"}	
]);

Now you can query friends and do different operations. I have highlighted a few below.

#### Get All Records ####
> var results = friends().get();

#### Order by Column Descending or Ascending
> var results = friends().order("city asec").get();

> var results = friends().order("city desc").get();

#### Query by Column ####
> var results = friends({gender:"F"}).get();

#### Query Last Record ####
> var results = friends().last();

#### Query First Record ####
> var results = friends().first();

#### Query by Column, selecting columns ####
> var results = friends({id:2}).select("id","gender");

#### Query distinct column values ####
> var results = friends().distinct("first");