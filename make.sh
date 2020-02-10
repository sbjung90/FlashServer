#!/bin/bash
PWD_DIR=`pwd`
rm  -f .foreverignore
echo "$PWD_DIR/log/*.*" >> .foreverignore
echo "$PWD_DIR/*.sh" >> .foreverignore
echo "#!/bin/bash" > start.sh
echo "forever start -a -l \"$PWD_DIR/log/forever_log.log\" -w --watchIgnore --sourceDir \"$PWD_DIR/\" index.js" >> start.sh
