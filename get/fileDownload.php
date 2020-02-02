<?php
include("lib/file.php");

$user = $_GET["user"];
$file = $_GET["file"];
$dir = $_GET["dir"];

validateUser($user);
$path = validateFile($user, $dir, $file);

header("Content-Type: ".mime_content_type($path));
header("Content-Transfer-Encoding: Binary");
header("Content-disposition: attachment; filename=\"".basename($path)."\"");
readfile($path);

?>
