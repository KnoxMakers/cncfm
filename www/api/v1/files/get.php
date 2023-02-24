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

$metadir = make_path($user, ".cncfm/meta/" . $location, $filename, false);
$metafile = "$metadir/meta.json";
$origfile = "$metadir/orig.data";
$meta = false;
if (file_exists($metafile) && file_exists($origfile)) {
    $meta = json_decode(file_get_contents($metafile));
}

$f = make_path($user, $location, $filename);
if (!file_exists($f) || is_dir($f)) {
    errormsg(-5, "INVALID FILE");
}

if (filesize($f) > $_C["MAX_FILESIZE"]) {
    errormsg(-10, "FILE TOO BIG TO VIEW");
}
$mime = mime_content_type($f);
//header('Content-type: ' . $mime);
$contents = file_get_contents($f);
if (!$contents) {
    errormsg(-15, "UNABLE TO READ FILE.");
}

$output = [
    "status" => 1,
    "message" => "",
    "mime" => $mime,
    "data" => $contents,
    "meta" => $meta,
];
echo json_encode($output);
