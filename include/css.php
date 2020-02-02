<?php
header("Content-Type: text/css");
header("X-Content-Type-Options: nosniff");
include("../config.php");
$type = $_GET["t"];
$what = $_GET["w"];

function combinePrint ($_DIR){
  foreach (glob($_DIR) as $f){ print file_get_contents($f); }
}

if ($type == "u"){
  $uploaders = Array();foreach($_UPLOADERS as $ext => $u){ if (!in_array($u, $uploaders)){ $uploaders[] = $u; }}
  if (in_array($what, $uploaders)){
    combinePrint("$_UPLOADERSDIR/$what/css/*.css");
  }
}elseif ($type == "v"){
  $viewers = Array();foreach($_VIEWERS as $ext => $v){ if (!in_array($v, $viewers)){ $viewers[] = $v; }}
  if (in_array($what, $viewers)){
    combinePrint("$_VIEWERSDIR/$what/css/*.css");
  }
}
?>
