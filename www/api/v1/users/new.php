<?php
include "../common.php";

$name = sanitize_name($_POST["name"]);
$path = make_path($name, "/");

if (!mkdir($path)) {
    errormsg(-6, "UNABLE TO CREATE USER!<br/>PERMISSIONS?<br/>ALREADY EXISTS?");
}

$output = [
    "status" => 1,
    "message" => "",
    "name" => $name,
];

echo json_encode($output);
