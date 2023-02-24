<?php
include "../common.php";

$path = $_GET["path"];

function get_apis($dir, $pre){
    $apis = array();
    foreach(glob("$dir/*.php") as $filename){
        $apis["$pre/".basename($filename, ".php")] = $filename;
    }
    return $apis;
}

$apis = array();
foreach ($_C["VIEWERS"] as $ext => $u) {
    $name = $u["name"];
    $apidir = $_C["PLUGIN_DIR"] . "/viewers/$name/api/";
    $apis = array_merge($apis, get_apis($apidir, "viewer/$name"));
}

foreach ($_C["UPLOADERS"] as $ext => $u) {
    $name = $u["name"];
    $apidir = $_C["PLUGIN_DIR"] . "/uploaders/$name/api/";
    $apis = array_merge($apis, get_apis($apidir, "uploader/$name"));
}

if (isset($apis[$path])){

    include($apis[$path]);

}else{

    $output = [
        "status" => -67,
        "message" => "UNKNOWN PLUGIN API",
        "known" => $apis,
    ];

    echo json_encode($output);
}