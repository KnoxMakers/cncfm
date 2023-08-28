<?php

include "../common.php";
$log = "";

$user = $_POST["user"];
if (!valid_name($user)) {
    errormsg(-2, "INVALID USER");
}

$jobid = $_POST["jobid"];
$jobpath = make_path($user, ".cncfm", "", false) . "/*.job";
$failpath = make_path($user, ".cncfm", "", false) . "/*.fail";
$valid_jobs = [];
foreach (glob($jobpath) as $f) {
    $valid_jobs[] = basename($f, ".job");
}
foreach (glob($failpath) as $f) {
    $valid_jobs[] = basename($f, ".fail");
}

if (!in_array($jobid, $valid_jobs)) {
    errormsg(-3, "INVALID JOB");
}

$runfile = make_path($user, ".cncfm", "run", false);
$run = [];
if (file_exists($runfile)) {
    $run = explode("\n", file_get_contents($runfile));
    if ($jobid == $run[0]) {
        $pid = intval($run[1]);
        $killfile = make_path($user, ".cncfm", "kill", false);
        file_put_contents($killfile, $pid, FILE_APPEND);
    }
}

$rmpath = make_path($user, ".cncfm", "", false) . "/$jobid.*";
foreach (glob($rmpath) as $f) {
    unlink($f);
}

$output = [
    "status" => 1,
    "message" => "",
    "log" => $log
];

echo json_encode($output);