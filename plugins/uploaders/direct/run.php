<?php
$user = $job["user"];
$location = $job["location"];
$filename = $job["filename"];

$to = make_path($user, $location, $filename);
echo "creating file: $to\n";
rename($datafile, $to);
chmod($to, 0770);