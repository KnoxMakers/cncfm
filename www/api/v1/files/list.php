<?php
include "../common.php";

$location = $_POST["location"];
$user = $_POST["user"];
if (empty($location)) {
    $location = "/";
}

$dir = make_path($user, $location);
if (!file_exists($dir) || !is_dir($dir)) {
    errormsg(-5, "INVALID LOCATION<br/>$dir");
}

$known = [
    "dirs" => [],
    "files" => [],
];

$files = scandir($dir, SCANDIR_SORT_NONE);
foreach ($files as $f) {
    $fullpath = sanitize_path("$dir/$f");
    if (is_dir($fullpath)) {
        if (valid_path($fullpath) && valid_name($f)) {
            $known["dirs"][] = $f;
        }

    } elseif (valid_name($f)) {
        $stat = stat($fullpath);
        $fdate = date("Y-m-d", $stat["mtime"]);
        $ftime = date("H:i:s", $stat["mtime"]);
        $fsize = human_filesize($stat["size"]);
        $known["files"][] = [
            "name" => $f,
            "date" => $fdate,
            "time" => $ftime,
            "size" => $fsize,
            "mtime" => $stat["mtime"],
            "bytes" => $stat["size"],
        ];
    }
}

$sortcol = array_column($known["files"], 'mtime');
array_multisort($sortcol, SORT_DESC, $known["files"]);

$output = [
    "status" => 1,
    "message" => "",
    "data" => $known,
];
echo json_encode($output);
