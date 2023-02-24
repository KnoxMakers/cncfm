<?php

include "../common.php";

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
    $run = explode("\n", file_get_contents($runfile))[0];
    if ($jobid == $run[0]) {
        // kill pid
        $pid = $run[1];
        if (!posix_kill($pid)) {
            errormsg(-99, "KILLING OF RUNNING JOB FAILED (DID IT FINISH FIRST?)");
        }
    }
}

$rmpath = make_path($user, ".cncfm", "", false) . "/$jobid.*";
foreach (glob($rmpath) as $f) {
    unlink($f);
}

$output = [
    "status" => 1,
    "message" => "",
];

echo json_encode($output);
