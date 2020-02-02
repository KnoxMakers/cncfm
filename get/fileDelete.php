<?php
include("lib/file.php");
$user = $_GET["user"];
$file = $_GET["file"];
$dir = $_GET["dir"];

validateUser($user);
$path = validateFile($user, $dir, $file);

$out = Array();

if (unlink($path)){
  $out["result"] = 1;
}else{
  $out["result"] = 0;
  $out["message"] = "Unable to delete file.";
  $out["extra"] = "$user $file $dir";
}

print json_encode($out);
?>
