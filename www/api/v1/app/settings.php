<?php
include("../common.php");

$output = [
    "status" => 1,
    "code" => 0,
    "data" => [
        "SITE_NAME" => $_C["SITE_NAME"],
        "SITE_LOGO" => $_C["SITE_LOGO"],
        "MULTI_USER" => $_C["MULTI_USER"]
    ]
];

echo json_encode($output);
?>