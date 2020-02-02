<?php
include("lib/file.php");
$user = $_GET["user"];
$dir = $_GET["dir"];
$newDir = preg_replace("/[^0-9\-\.\_a-zA-Z]/","",$_GET["newDir"]);

validateUser($user);
$path = validateDir($user, $dir);
$newpath = $path."/".$newDir;


$out = Array();

if (mkdir($newpath)){
  $out["result"] = 1;
  $out["newDir"] = $newDir;
}else{
  $out["result"] = 0;
  $out["message"] = "Unable to create directory.";
}

print json_encode($out);
?>
