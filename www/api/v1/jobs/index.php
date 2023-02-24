<?php

include "../common.php";

$user = $_POST["user"];
if (!valid_name($user)) {
    errormsg(-2, "INVALID USER");
}

$jobpath = make_path($user, ".cncfm", "", false) . "/*.job";
$failpath = make_path($user, ".cncfm", "", false) . "/*.fail";
$runfile = make_path($user, ".cncfm", "run", false);

$run = [];
if (file_exists($runfile)) {
    $run = explode("\n", file_get_contents($runfile))[0];
}

$output = [
    "status" => 1,
    "message" => "",
    "run" => $run,
    "jobs" => [],
    "fails" => [],
];

foreach (glob($jobpath) as $f) {
    $jobid = basename($f, ".job");
    $job = json_decode(file_get_contents($f), true);
    $job["date"] = date("Y-m-d", filectime($f));
    $job["time"] = date("H:i:s", filectime($f));
    $output["jobs"][$jobid] = $job;
}

foreach (glob($failpath) as $f) {
    $jobid = basename($f, ".fail");
    $job = json_decode(file_get_contents($f), true);
    $job["date"] = date("Y-m-d", filectime($f));
    $job["time"] = date("H:i:s", filectime($f));
    $output["fails"][$jobid] = $job;
    $logpath = make_path($user, ".cncfm", $jobid, false) . ".log";
    $output["fails"][$jobid]["log"] = file_get_contents($logpath);
}
echo json_encode($output);
