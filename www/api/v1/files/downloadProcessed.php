<?php

include "../common.php";

$location = $_POST["location"];
$user = $_POST["user"];
$filename = $_POST["filename"];

$filepath = make_path($user, $location, $filename, false);
if (!file_exists($filepath)) {
    errormsg(-70, "FILE DOES NOT EXIST");
}
$mime = mime_content_type($filepath); //$meta["original"]);
$data = base64_encode(file_get_contents($filepath));

$output = [
    "status" => 1,
    "filename" => $filename,
    "data" => "data:$mime;base64,$data",
];
echo json_encode($output);
