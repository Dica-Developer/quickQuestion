var https = require('https');
var fs = require('fs');

function compareWithCurrentVersion(currentGitTags){
  fs.readFile('./package.json', {encoding: 'utf8'}, function(error, data){
    console.log(currentGitTags);
    var localVersionString = JSON.parse(data).version.replace('v', '');
    var remoteVersionString = currentGitTags[0].name.replace('v', '');;

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

    fs.readFile('test.bla', function(error, file){
      console.log('check for file');
      if(error){
        console.log('file does not exist', error);
        fs.writeFile('test.bla', 'test', function(error, b){
          if(error){
            console.log('file write error', error);
          } else {
            console.log('file written', b);
          }
        });

      }else{
        console.log('file exists', file);

      }
    });

    if(isUpdateNeeded){
      console.log('update needed');
    } else {
      console.log('up to date');
    }
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