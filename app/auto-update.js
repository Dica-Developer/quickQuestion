var https = require('https');
var fs = require('fs');
var zlib = require('zlib');
var execPath = process.execPath;
var pathToApp = execPath.slice(0, execPath.indexOf('Frameworks'));

function compareWithCurrentVersion(currentGitTags){
  fs.readFile('./package.json', {encoding: 'utf8'}, function(error, data){
    var localVersionString = JSON.parse(data).version.replace('v', '');
    var remoteVersionString = currentGitTags[0].name.replace('v', '');

    var alphaBetaSplit = remoteVersionString.split('-');

    var versionSplitLocal, versionSplitRemote;
    if(alphaBetaSplit.length > 1){
      //pre releases
      versionSplitRemote = alphaBetaSplit[0].split('.');
    } else {
      versionSplitRemote = remoteVersionString.split('.');
    }
    versionSplitLocal = localVersionString.split('.');

    var isUpdateNeeded = false;

    for(var index = 0, length = versionSplitLocal.length; index < length; ++index){
      var remoteVersion = parseInt(versionSplitRemote[index], 10);
      var localVersion = parseInt(versionSplitLocal[index], 10);
      console.count();
      if(localVersion < remoteVersion){
        isUpdateNeeded = true;
        break;
      }
    }

//    var AdmZip = require('adm-zip');
//    var zip = new AdmZip(pathToApp + 'Resources/app.nw');
//    zip.extractAllTo(pathToApp + 'Resources/app', true);

    // reading archives
//    var zipEntries = zip.getEntries(); // an array of ZipEntry records

//    zipEntries.forEach(function(zipEntry) {
//      console.log(zipEntry.toString()); // outputs zip entries information
//    });

    if(isUpdateNeeded){
      console.log('update needed');
      performUpdate(currentGitTags);
    } else {
      console.log('up to date');
    }
  });
}

function performUpdate(git){
  var buffer = [];
  https.get(git[0].zipball_url, function(res) {
    var location = res.headers.location;
    https.get(location, function(res) {
      console.log(res);
      res.on('data', function(d){
        buffer.push(d);
      });
      res.on('end', function(){
        writeNewZipToDisk(buffer.join(''));
      });
    })
    .on('error', function(e) {
      console.log("Got error: " + e.message);
    });
  })
  .on('error', function(e) {
    console.log("Got error: " + e.message);
  });
}

function writeNewZipToDisk(buffer){
  fs.writeFile(pathToApp + 'Resources/app.nw1', buffer, function (err) {
    if (err){
      throw err;
    }
    console.log('It\'s saved!');
  });
}

function AutoUpdate(){
  this.checkForNewVerion = function(){
    https.get("https://api.github.com/repos/Dica-Developer/quickQuestion/tags", function(res) {
      res.setEncoding('utf8');
      res.on('data', function(d){
        compareWithCurrentVersion(JSON.parse(d));
      });
      console.log(res);
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
      });
  };
}

var autoUpdate = new AutoUpdate();

exports.checkForNewVerion = autoUpdate.checkForNewVerion;