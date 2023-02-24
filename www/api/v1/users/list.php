<?php
include "../common.php";

$users = [];
$exclude = ["RASTER"];

// Users are just first level directories in the user directory.
$files = scandir($_C["USER_DIR"], SCANDIR_SORT_NONE);
foreach ($files as $f) {
    $fullpath = $_C["USER_DIR"] . "/$f";
    if (is_dir($fullpath) && valid_name($f) && !in_array($f, $exclude)) {
        $users[] = $f;
    }
}
natcasesort($users);
$users = array_values($users);

$output = [
    "status" => 1,
    "message" => "",
    "data" => $users,
];

echo json_encode($output);
