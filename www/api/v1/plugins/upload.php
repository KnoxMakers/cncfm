<?php
include "../common.php";

$file = $_FILES["fileUpload"];
$error = $file["error"];
if ($error !== UPLOAD_ERR_OK) {
    errormsg(-10, "UPLOAD FAILED WITH ERROR: $error");
}

$user = $_POST["user"];
$location = $_POST["location"];
$filename = $_POST["filename"];
$options = json_decode($_POST["options"], true);
$config = json_decode($_POST["config"], true);

$uploader = $_POST["uploader"];
if (!valid_uploader($uploader)) {
    errormsg(-7, "Invalid Uploader: $uploader");
}

$queue = [
    "user" => sanitize_name($user),
    "location" => sanitize_path($location),
    "filename" => sanitize_name($filename),
    "uploader" => $uploader,
    "options" => $options,
    "config" => $config,
];

$jobid = queue_upload($queue, $file["tmp_name"]);

$output = [
    "status" => 1,
    "message" => "",
    "queue" => $queue,
    "jobid" => $jobid,
];

echo json_encode($output);
