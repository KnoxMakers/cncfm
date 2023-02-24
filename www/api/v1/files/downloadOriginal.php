<?php

include "../common.php";

$location = $_POST["location"];
$user = $_POST["user"];
$filename = $_POST["filename"];

$metadir = make_path($user, ".cncfm/meta/" . $location, $filename, false);
$metafile = "$metadir/meta.json";
$origfile = "$metadir/orig.data";
if (!file_exists($metafile) || !file_exists($origfile)) {
    errormsg(-70, "Original doesn't exist:\n$metafile");
}
$meta = json_decode(file_get_contents($metafile), true);
$mime = mime_content_type($origfile); //$meta["original"]);

//header('Content-type: ' . $mime);

$data = base64_encode(file_get_contents($origfile));

$output = [
    "status" => 1,
    "filename" => $meta["original"],
    "data" => "data:$mime;base64,$data",
];
echo json_encode($output);
