<?php
include("lib/file.php");
$user = $_POST["user"];
$file = $_POST["file"];
$dir = $_POST["dir"];
$data = $_POST["data"];

validateUser($user);
$path = validateFile($user, $dir, $file);
$out = Array();

if (file_put_contents($path, $data)){
  $out["result"] = 1;
}else{
  $out["result"] = 0;
  $out["message"] = "Unable to save file.";
}

print json_encode($out);
?>
