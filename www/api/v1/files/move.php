<?php
include "../common.php";

$user = $_POST["user"];
$location = $_POST["location"];
$directory = $_POST["directory"];
$path = $_POST["path"];
$filename = $_POST["filename"];

$from = make_path($user, $location, $filename);
$metafrom = make_path($user, ".cncfm/meta/" . $location, $filename, false);

if (!empty($path)){
    $to = make_path($user, $path, $filename);
    $metato = make_path($user, ".cncfm/meta/" . $path, $filename, false);
}else{
    $to = make_path($user, $location ."/".$directory, $filename);
    $metato = make_path($user, ".cncfm/meta/" . $location . "/" . $directory, $filename, false);
}

if (!rename($from, $to)){
    errormsg(-77, "UNABLE TO MOVE FILE<br/>PERMISSIONS?");
}
chmod($to, 0770);
mkdir(dirname($metato), 0770, true);
rename($metafrom, $metato);
chmod($metato, 0770);

$output = [
    "status" => 1,
    "message" => "",
];

echo json_encode($output);

?>