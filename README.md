# Quick Question #


## Requirements ##

You must have [node.js](http://nodejs.org/ "Node.js") installed, to start working with QuickQuestion.

## Install ##

After installing [node.js](http://nodejs.org/ "Node.js"), you have to run the following commands:

    git clone git@github.com:Dica-Developer/quickQuestion.git
    cd quickQuestion
    npm install
    npm -g install grunt-cli
    
## Build ##

To build a distribution you have to run the following commands depending on your distribution:

1. For Mac OS:

        grunt dist

2. For Linux:

        grunt dist-linux

3. For Windows:

        grunt dist-win

The built app can then be found in the folder:

    ./dist/
