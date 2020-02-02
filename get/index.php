<?php
include("../config.php");
include("lib/common.php");

function validScript($v, $script){
  global $_VIEWERSDIR;
  $path = "*.php";
  if (!empty($v)){ $path = realpath($_VIEWERSDIR."/$v/get/")."/*.php"; }
  foreach(glob($path) as $file){
      $parts = pathinfo($file);
      $name = $parts["filename"];
      if ($name[0] != '.' && $name != "index" && $script==$name) return $file;
  }
  return False;
}

$w = $_GET["w"];
$v = $_GET["v"];

$script = validScript($v, $w);
if ($script){
  include($script);
  exit();
}

jsonError("I don't know how to get that.")
?>
