var https = require('https');
var fs = require('fs');
var execPath = process.execPath;
var pathToApp = execPath.slice(0, execPath.indexOf('Frameworks'));
var AdmZip = require('adm-zip');

function compareWithCurrentVersion(currentGitTags) {
  fs.readFile('./package.json', {
    encoding: 'utf8'
  }, function (error, data) {
    var localVersionString = JSON.parse(data).version.replace('v', '');
    var remoteVersionString = currentGitTags[currentGitTags.length - 1].name.replace('v', '');

    var alphaBetaSplit = remoteVersionString.split('-');

    var versionSplitLocal, versionSplitRemote;
    if (alphaBetaSplit.length > 1) {
      //pre releases
      versionSplitRemote = alphaBetaSplit[0].split('.');
    } else {
      versionSplitRemote = remoteVersionString.split('.');
    }
    versionSplitLocal = localVersionString.split('.');

    var isUpdateNeeded = false;

    for (var index = 0, length = versionSplitLocal.length; index < length; ++index) {
      var remoteVersion = parseInt(versionSplitRemote[index], 10);
      var localVersion = parseInt(versionSplitLocal[index], 10);
      if (localVersion < remoteVersion) {
        isUpdateNeeded = true;
        break;
      }
    }

    if (isUpdateNeeded) {
      console.log('update needed');
      performUpdate(currentGitTags);
    } else {
      console.log('up to date');
    }
  });
}

function deleteRecursive(directoryToDelete) {
  var stat = fs.statSync(directoryToDelete);
  console.log(directoryToDelete, stat);
  if (stat.isDirectory()) {
    var files = fs.readdirSync(directoryToDelete);
    files.forEach(function (value, index) {
      deleteRecursive(directoryToDelete + '/' + value);
    });
    fs.rmdirSync(directoryToDelete);
  } else {
    fs.unlinkSync(directoryToDelete);
  }
}

function performUpdate(git) {
  https.get(git[0].zipball_url, function (res) {
    var location = res.headers.location;
    https.get(location, function (res) {
      res.on('data', function (d) {
        fs.appendFileSync(pathToApp + 'Resources/app.zip', d);
      }).on('end', function () {
        var zip = new AdmZip(pathToApp + 'Resources/app.zip');
        var zipEntries = zip.getEntries();
        zipEntries.forEach(function (zipEntry) {
          if (zipEntry.entryName.indexOf('/app/', zipEntry.entryName.length - '/app/'.length) !== -1) {
            zip.extractEntryTo(zipEntry, pathToApp + 'Resources/app.nw.new');
            fs.rename(pathToApp + 'Resources/app.nw', pathToApp + 'Resources/app.nw.old', function (e) {
              if (e) {
                console.error(e);
              } else {
                fs.rename(pathToApp + 'Resources/app.nw.new/' + zipEntry.entryName, pathToApp + 'Resources/app.nw', function (e) {
                  if (e) {
                    console.error(e);
                  } else {
                    deleteRecursive(pathToApp + 'Resources/app.nw.new');
                    deleteRecursive(pathToApp + 'Resources/app.nw.old');
                    fs.unlinkSync(pathToApp + 'Resources/app.zip');
                    console.info("Please restart QuickQuestion to apply update!");
                  }
                });
              }
            });
          }
        });
      });
    }).on('error', function (e) {
      console.log("Got error: " + e.message);
    });
  })
    .on('error', function (e) {
      console.log("Got error: " + e.message);
    });
}

function AutoUpdate() {
  this.checkForNewVersion = function () {
    https.get("https://api.github.com/repos/Dica-Developer/quickQuestion/tags", function (res) {
      res.setEncoding('utf8');
      res.on('data', function (d) {
        compareWithCurrentVersion(JSON.parse(d));
      });
    }).on('error', function (e) {
      console.log("Got error: " + e.message);
    });
  };
}

var autoUpdate = new AutoUpdate();
exports.checkForNewVersion = autoUpdate.checkForNewVersion;