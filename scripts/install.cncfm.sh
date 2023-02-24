#!/bin/bash

TZ="America/New_York"
BASEDIR=/app
APPDIR="${BASEDIR}/cncfm"

# very opinionated installer
# assumes in it's own container/vm with nothing else running

timedatectl set-timezone $TZ

apt update
apt dist-upgrade -y
apt install -y vim apache2 php python3-pip libfuse2 sudo fuse rsync 
a2enmod rewrite

pip3 install numpy lxml cssselect pillow pyinotify

useradd cncfm
usermod -a -G www-data cncfm

mkdir -p $APPDIR 
chown -R cncfm:www-data $BASEDIR
chmod -R 750 $BASEDIR
chmod -R 770 $APPDIR/USERS

# COPY FILES TO $APPDIR


systemctl enable apache2
systemctl start apache2
echo "
<VirtualHost *:80>
        DocumentRoot /app/cncfm/www

        ErrorLog /app/cncfm/logs/apache-error.log
        CustomLog /app/cncfm/logs/apache-access.log combined

        <Directory /app/cncfm/www/>
                Options Indexes FollowSymLinks
                AllowOverride all
                Require all granted
        </Directory>
</VirtualHost>
" > /etc/apache2/sites-available/cncfm.conf
a2dissite '*'
a2ensite cncfm
systemctl restart apache2

echo "########################################################"
echo ""
echo "set post_max_size and upload_max_size in php.ini"
echo ""
echo "########################################################"
echo ""
echo "change htaccess_CHANGEME to .htaccess in api directory"
echo ""
echo "########################################################"

