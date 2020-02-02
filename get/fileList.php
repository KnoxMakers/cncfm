<?php
include("lib/file.php");

$user = $_GET["user"];
$dir = $_GET["dir"];

validateUser($user);
$path = validateDir($user, $dir);

$_DIRS = Array();
$_FILES = Array();
$totalsize = 0;
$myfiles = glob($path."/*");
usort($myfiles, create_function('$a,$b', 'return filemtime($b) - filemtime($a);'));
foreach($myfiles as $f){
    if ($f[0] != '.'){
      if (is_dir($f)){
        $_DIRS[] = basename($f);
      }elseif(validateExt($f) !== False){
        $totalsize += filesize($f);
        $file = Array();
        $file["name"] = basename($f);
        $file["size"] = round((filesize($f)/1024),2)." KB";
        $file["date"] = date("Y-m-d",filemtime($f));
        $file["time"] = date("H:i:s",filemtime($f));
        $_FILES[] = $file;
      }
    }
}

$out = Array();
$out["result"] = 1;

$out["files"] = $_FILES;
$out["dirs"] = $_DIRS;

$out["size"] = $totalsize/1024;
if ($out["size"] < 100){
    $out["size"] = round($out["size"],2)." KB";
}else{
    $out["size"] = round($out["size"]/1024,2)." MB";
}

print json_encode($out);
?>
