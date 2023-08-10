#!/bin/bash

######################################
#
# very opinionated installer
# - assumes in it's own Debian install
#
######################################

TZ="America/New_York"
BASEDIR=/app

######################################
#
# Don't edit under here..
# or do.. I'm not the boss of you
#
######################################


# A few derived variables
MEDIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
APPDIR="${BASEDIR}/cncfm"
MEHOST=`hostname --fqdn`


# Set the timezone
timedatectl set-timezone $TZ


# Update the system
apt update
apt dist-upgrade -y


# Install needed software
apt install -y vim apache2 php python3-pip libfuse2 sudo fuse rsync xvfb
pip3 install numpy lxml cssselect pillow pyinotify


# Create cncfm user and add to the www-data group
useradd cncfm
usermod -a -G www-data cncfm


# Make directories and copy/get files
mkdir -p $APPDIR 
mkdir -p $APPDIR/logs
mkdir -p $APPDIR/USERS/default
mkdir -p $APPDIR/bin
cp -rf $MEDIR/../* $APPDIR
wget "https://inkscape.org/gallery/item/37359/Inkscape-b0a8486-x86_64.AppImage" -O $APPDIR/bin/Inkscape.AppImage


# Ask user which example config to start
CONFIGFILE=$(whiptail --nocancel --title "CNCFM INSTALL" --radiolist "Choose initial config" 20 58 10 \
  "LS" "LASER: Power by S-code" ON \
  "LMOON" "LASER: Moonraker             " OFF 3>&1 1>&2 2>&3)

echo "Initial Config: $CONFIGFILE"

case "$CONFIGFILE" in
"LS")
        cp $APPDIR/example_configs/laser.S.json $APPDIR/config.json
        ;;
"LMOON")
        cp $APPDIR/example_configs/laser.moonraker.json $APPDIR/config.json
        mkdir -p $APPDIR/USERS/RASTER
        ;;
esac


# set permissions
chown -R cncfm:www-data $BASEDIR
chmod -R 750 $BASEDIR
chmod -R 770 $APPDIR/USERS
chmod -R 770 $APPDIR/logs


# Setup Apache config
echo "
<VirtualHost *:80>
        DocumentRoot ${APPDIR}/www

        ErrorLog ${APPDIR}/logs/apache-error.log
        CustomLog ${APPDIR}/logs/apache-access.log combined

        <Directory ${APPDIR}/www/>
                Options Indexes FollowSymLinks
                AllowOverride all
                Require all granted
                php_value post_max_size 100M
                php_value upload_max_filesize 100M
        </Directory>

        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_FILENAME}\.php -f
        RewriteRule ^api/(.*)$ $1.php [NC,L] 
</VirtualHost>
" > /etc/apache2/sites-available/cncfm.conf


# Ensure cncfm is the only site
a2dissite '*'
a2ensite cncfm


# Enable mod_rewrite
a2enmod rewrite


# Enable Apache on boot and start
systemctl enable apache2
systemctl stop apache2
systemctl start apache2


# Install cron for files-sentinel and start
command="${APPDIR}/sentinels/files-sentinel.sh"
job="*/5 * * * * $command"
chmod 700 $command
cat <(fgrep -i -v "$command" <(crontab -l)) <(echo "$job") | crontab -


# Install cron for jobs-sentinel and start
command="${APPDIR}/sentinels/jobs-sentinel.sh"
job="*/5 * * * * $command"
chmod 700 $command
cat <(fgrep -i -v "$command" <(crontab -l)) <(echo "$job") | crontab -


echo "######################################"
echo "#"
echo "# config: $APPDIR/config.json"
echo "#"
echo "# CNCFM is installed @ http://${MEHOST}"
echo "#"
echo "######################################"
