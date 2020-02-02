<?php
include("lib/file.php");

$user = $_GET["user"];
$file = $_GET["file"];
$dir = $_GET["dir"];

validateUser($user);
$path = validateFile($user, $dir, $file);
$out = Array(
  "result" => 1,
  "data" => file_get_contents($path),
);
print json_encode($out);

?>
