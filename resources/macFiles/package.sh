#!/bin/sh

hdiutil create -srcfolder "dist/Quick Question.app" -volname "QuickQuestion" -fs HFS+ -fsargs "-c c=64,a=16,e=16" -format UDRW dist/QuickQuestion.tmp.dmg
hdiutil attach -readwrite -noverify -noautoopen "dist/QuickQuestion.tmp.dmg"
mkdir /Volumes/QuickQuestion/.background
cp resources/macFiles/background.png /Volumes/QuickQuestion/.background
chmod -Rf go-w /Volumes/QuickQuestion
ln -sfn /Applications/ /Volumes/QuickQuestion/Applications
osascript resources/macFiles/dmgStyler.applescript
hdiutil detach /Volumes/QuickQuestion
hdiutil convert "dist/QuickQuestion.tmp.dmg" -format UDZO -imagekey zlib-level=9 -o "dist/QuickQuestion.dmg" -puppetstrings
rm dist/QuickQuestion.tmp.dmg