<?php
include "../common.php";

$user = $_POST["user"];
$location = $_POST["location"];
$filename = $_POST["filename"];
$path = make_path($user, $location, $filename);
$data = $_POST["data"];

$result = file_put_contents($path, $data);
chmod($path, 0770);
//$result = unlink($path);

if (!$result) {
    errormsg(-3, "Unable to save file.  Permissions?");
}

$output = [
    "status" => 1,
    "path" => $path,
    "msg" => "",
];

echo json_encode($output);
