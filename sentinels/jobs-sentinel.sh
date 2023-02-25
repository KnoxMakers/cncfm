#!/bin/bash

meuser="www-data"
mepath="$(dirname -- "${BASH_SOURCE[0]}")"
mename=`basename "$0"`

exec &>> $mepath/../logs/jobs-sentinel.log

for pid in $(pidof -x $mename); do
    if [ $pid != $$ ]; then
        # sentinel already running
        exit 1
    fi
done

echo "[$(date)] : $mename : starting up"

while true
do
    sudo -u $meuser php $mepath/../www/api/v1/cron.php &
    sleep 2
done
