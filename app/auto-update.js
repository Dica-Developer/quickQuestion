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
    var remoteVersionString = currentGitTags[0].name.replace('v', '');

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
      //performUpdate(currentGitTags);
    } else {
      console.log('up to date');
    }
  });
}

function performUpdate(git) {
  https.get(git[0].zipball_url, function (res) {
    var location = res.headers.location;
    https.get(location, function (res) {
      res.on('data', function (d) {
        fs.appendFileSync(pathToApp + 'Resources/app.nw1', d);
      }).on('end', function () {
        var zip = new AdmZip(pathToApp + 'Resources/app.nw1');
        var zipEntries = zip.getEntries();
        zipEntries.forEach(function (zipEntry) {
          if (zipEntry.entryName.indexOf('/app/', zipEntry.entryName.length - '/app/'.length) !== -1) {
            zip.extractEntryTo(zipEntry, pathToApp + 'Resources/app.nw2');
            appZip = new AdmZip();
            appZip.addLocalFolder(pathToApp + 'Resources/app.nw2/' + zipEntry.entryName);
            appZip.writeZip(pathToApp + 'Resources/app.nw3');
          }
        });
        fs.unlink(pathToApp + 'Resources/app.nw1', function (e) {
          if (e) {
            console.error(e);
          }
        });
        fs.rmdir(pathToApp + 'Resources/app.nw2', function (e) {
          if (e) {
            console.error(e);
          }
        });
        fs.rename(pathToApp + 'Resources/app.nw3', pathToApp + 'Resources/app.nw', function (e) {
          if (e) {
            console.error(e);
          } else {
            console.info("Please restart QuickQuestion to apply update!");
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