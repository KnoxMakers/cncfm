<?php
$out["result"] = 0;

$user = preg_replace("/[^0-9\-\_a-zA-Z]/","",$_GET["u"]);
$path = $_USERSDIR."/$user";
if (mkdir($path))
    $out["result"] = 1;
else
    $out["result"] = 0;
    $out["message"] = "Unable to create user.";

print json_encode($out);
?>
