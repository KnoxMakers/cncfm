<?php
include("lib/file.php");
$user = $_GET["user"];
$file = $_GET["file"];
$dir = $_GET["dir"];

validateUser($user);

$newname = preg_replace("/[^0-9\-\.\_a-zA-Z]/","",$_GET["newname"]);

$oldext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
$newext = strtolower(pathinfo($newname, PATHINFO_EXTENSION));
if ($oldext != $newext){ $newname .= ".".$oldext; }

$oldfile = validateFile($user, $dir, $file);
$dir = validateDir($user, $dir);
$newfile = $dir."/".$newname;

$out = Array();

if (rename($oldfile, $newfile)){
  $out["result"] = 1;
  $out["newname"] = $newname;
}else{
  $out["result"] = 0;
  $out["message"] = "Unable to rename file.";
}

print json_encode($out);
?>
