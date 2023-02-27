<?php
include "../common.php";

$output = [
    "status" => 1,
    "message" => "",
    "uploaders" => [],
];

foreach ($_C["UPLOADERS"] as $ext => $u) {
    $name = $u["name"];

    $htmldir = $_C["PLUGIN_DIR"] . "/uploaders/$name/html/";
    $u["html"] = "";
    $htmls = glob("$htmldir/*.html");
    natsort($htmls);
    foreach ($htmls as $key => $htmlfile) {
        if (file_exists($htmlfile)) {
            $u["html"] .= file_get_contents($htmlfile);
        }
    }

    $cssdir = $_C["PLUGIN_DIR"] . "/uploaders/$name/css/";
    $u["css"] = "";
    $csss = glob("$cssdir/*.css");
    natsort($csss);
    foreach ($csss as $key => $cssfile) {
        if (file_exists($cssfile)) {
            $u["css"] .= file_get_contents($cssfile);
        }
    }

    $jsdir = $_C["PLUGIN_DIR"] . "/uploaders/$name/js/";
    $u["js"] = "";
    $jss = glob("$jsdir/*.js");
    natsort($jss);
    foreach ($jss as $key => $jsfile) {
        if (file_exists($jsfile)) {
            $u["js"] .= file_get_contents($jsfile);
        }
    }

    $output["uploaders"][$ext] = $u;
}

echo json_encode($output);