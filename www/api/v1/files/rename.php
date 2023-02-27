<?php
include "../common.php";

$user = $_POST["user"];
$location = $_POST["location"];
$filename = $_POST["filename"];
$newname = $_POST["newname"];

$oldext = pathinfo($filename)["extension"];
$newext = pathinfo($newname)["extension"];
if ($newext !== $oldext){ $newname .= ".$oldext"; }

$from = make_path($user, $location, $filename);
$metafrom = make_path($user, ".cncfm/meta/" . $location, $filename, false);

$to = make_path($user, $location, $newname);
$metato = make_path($user, ".cncfm/meta/" . $location, $newname, false);

if (file_exists($to)){
    errormsg(-76, "UNABLE TO RENAME FILE<br/>NEW FILENAME ALREDY EXISTS");
}

if (!rename($from, $to)){
    errormsg(-77, "UNABLE TO RENAME FILE<br/>PERMISSIONS?");
}
chmod($to, 0770);
rename($metafrom, $metato);
chmod($metato, 0770);

$output = [
    "status" => 1,
    "message" => "",
    "from" => $from,
    "to" => $to,
    "metafrom" => $metafrom,
    "metato" => $metato,
    "oldname" => $filename,
    "newname" => $newname
];

echo json_encode($output);

?>