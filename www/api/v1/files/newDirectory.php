<?php
include "../common.php";

$user = $_POST["user"];
$location = $_POST["location"];
$name = $_POST["name"];

$path = make_path($user, $location, $name);

if (!mkdir($path)) {
    errormsg(-5, "UNABLE TO CREATE DIRECTORY!<br/>PERMISSIONS?<br/>ALREADY EXISTS?");
}

$output = [
    "status" => 1,
    "msg" => "",
];

echo json_encode($output);
