<?php
include "../common.php";

$location = $_POST["location"];
$user = $_POST["user"];
$filename = $_POST["filename"];

if (empty($location)) {
    errormsg(-12, "INVALID LOCATION");
}
if (empty($user)) {
    errormsg(-13, "INVALID USER");
}
if (empty($filename)) {
    errormsg(-14, "INVALID FILENAME");
}

$f = make_path($user, $location, $filename);
if (!file_exists($f) || is_dir($f)) {
    errormsg(-5, "INVALID FILE");
}

$mime = mime_content_type($f);
header('Content-type: ' . $mime);
$contents = file_get_contents($f);
echo $contents;
