#!/bin/bash

meuser="cncfm"
mepath="$(dirname -- "${BASH_SOURCE[0]}")"
mename=`basename "$0"`

exec &>> $mepath/logs/files.log

for pid in $(pidof -x $mename); do
    if [ $pid != $$ ]; then
        # sentinel already running
        exit 1
    fi
done


while true
do
    echo "[$(date)] : files-sentinel : starting up"
    sudo -u $meuser python3 $mepath/files-sentinel.py
    sleep 1
done