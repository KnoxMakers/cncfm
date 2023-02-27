<?php

$id = intval($_GET["id"]);

$rpath = $_C["BJJRASTER_DIR"]."/raster-*.jpg";
$rasters = array();
foreach(glob($rpath) as $filename){
    $rasters[basename($filename)] = $filename;
}


if (isset($rasters["raster-$id.jpg"])){
    header("Content-type: image/jpeg");
    echo file_get_contents($rasters["raster-$id.jpg"]);
    exit();
};

print_r($rasters);

?>