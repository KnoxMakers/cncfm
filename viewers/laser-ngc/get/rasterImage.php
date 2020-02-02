<?php
$rasterid = intval($_GET["id"]);
if ($rasterid <= 0) exit();

$filename = "";
foreach(glob($_RASTERSDIR."/*-$rasterid.*") as $f){ $filename = $f; }
if (empty($filename)) exit();

$image_mime = image_type_to_mime_type(exif_imagetype($filename));
if (empty($image_mime)) exit();

header('Content-Type: '.$image_mime);
readfile($filename);
?>
