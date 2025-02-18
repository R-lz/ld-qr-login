#! /bin/bash

zip -r ld-qr-login.zip . -x "pack.sh" "README.md" "icons/*" "manifest.json" "popup.html" "popup.js" "content.js" "background.js" "qrcode.min.js"

echo "打包完成"

