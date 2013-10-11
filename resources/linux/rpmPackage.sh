#!/bin/sh

cp -f resources/linux/description-pak ./
mkdir -p ./SOURCES
tar -cz app/ > ./SOURCES/QuickQuestion-$1.tgz
RPMSOURCEDIR=.
checkinstall -y --install=no --fstrans=yes -R --pkgname QuickQuestion --pkgrelease 1 --reset-uids --deldoc --delspec \
--deldesc --maintainer dica-developer@mascha.me --pkgversion $1 --pkgarch amd64  --showinstall=no \
--pkgsource http://dica-developer.github.io/quickQuestion/ --pkglicense GPLv3 --pkggroup Tool resources/linux/install.sh
rm -r ./SOURCES
rm description-pak
rm -r ./doc-pak
