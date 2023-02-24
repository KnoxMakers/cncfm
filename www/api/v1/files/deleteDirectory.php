<?php
include "../common.php";

$user = $_POST["user"];
$location = $_POST["path"];

$path = make_path($user, $location);
$result = rmTree($path);
//$e = "rm -rf $path";
//exec($e, $output, $result);

if (!$result) {
    errormsg(-4, "Unable to remove directory.<br/>Permissions?");
}

$metapath = make_path($user, ".cncfm/meta/$location", "", false);
rmTree($metapath);

$output = [
    "status" => 1,
    "msg" => "",
];

echo json_encode($output);
