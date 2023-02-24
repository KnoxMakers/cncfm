<?php
include "../common.php";

$user = $_POST["user"];
$location = $_POST["path"];

$path = make_path($user, $location);
$result = unlink($path);

if (!$result) {
    errormsg(-3, "Unable to remove file.  Permissions?");
}


$dir = trim(dirname($location), "/");
$filename = rtrim(basename($location), "/");
$metapath = make_path($user, ".cncfm/meta/$dir", "$filename", false);
rmTree($metapath);

$output = [
    "status" => 1,
    "msg" => "",
];

echo json_encode($output);
