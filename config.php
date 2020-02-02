<?php

$_NAME = "CNCFM";
$_LOGO = "images/logo.png";

$_HOMEDIR = "/var/www/html/";
$_USERSDIR = "/home/moonraker/USERS/";

$_UPLOADERSDIR = $_HOMEDIR."uploaders/";
$_UPLOADERS = Array(
  "ngc" => "direct",
  "svg" => "svg-laser-ngc",
  "jpg" => "raster-laser-ngc",
  "gif" => "raster-laser-ngc",
  "png" => "raster-laser-ngc",
);

$_VIEWERSDIR = $_HOMEDIR."viewers/";
$_VIEWERS = Array(
  "ngc" => "laser-ngc",
);

$_USER_IGNORE = Array("RASTER",);
$_FILE_IGNORE = Array();

$_RASTERSDIR = $_USERSDIR."RASTER";


$_CONFIG = Array(
    "laser" => Array(
        "machine" => Array(
            "width" => 1300,
            "height" => 900,
        ),
        "raster" => Array(
          "dpi" => Array( "min" => 100, "max" => 1000, "default" => 333 ),
          "power" => Array( "default" => 30 ),
          "feedrate" => Array( "default" => 20000 ),
          "overscan" => 8,
        ),
        "presets" => Array(
                "WOOD (3mm)" => Array(
                    "CUT" =>           Array( "f" => 1000,    "p" => 50 ),
                    "ENGRAVE" =>       Array( "f" => 1500,   "p" => 20 ),
                ),
                "WOOD (6mm)" => Array(
                    "CUT" =>           Array( "f" => 800,    "p" => 90 ),
                    "ENGRAVE" =>       Array( "f" => 1500,   "p" => 20 ),
                ),
                "ACRYLIC (3mm)" => Array(
                    "CUT" =>           Array( "f" => 1000,    "p" => 50 ),
                    "ENGRAVE" =>       Array( "f" => 1500,   "p" => 10 ),
                ),
                "PAPER" => Array(
                    "CUT" =>           Array( "f" => 1000,   "p" => 10 ),
                ),
                "CARDBOARD" => Array(
                    "CUT" =>           Array( "f" => 1000,   "p" => 50 ),
                    "ENGRAVE" =>       Array( "f" => 1500,   "p" => 20 )
                )
          )
    )
);



?>
