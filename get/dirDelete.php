<?php
include("lib/file.php");
$user = $_GET["user"];
$dir = $_GET["dir"];

validateUser($user);

if (empty($dir)){ jsonError("No directory given to delete."); }
deleteDir($user, $dir);

$out = Array(
  "result" => 1,
);

print json_encode($out);
?>
