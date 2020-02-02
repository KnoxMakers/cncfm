<?php
include("lib/file.php");

$user = $_POST["user"];
$dir = $_POST["dir"];
validateUser($user);
$_DIR = validateDir($user, $dir);
$_FILE_PATH = $_FILES["f"]["tmp_name"];
if (empty($_FILE_PATH)){ jsonError("File failed to upload."); }
$_FILE_NAME = preg_replace("/[^0-9\-\.\_a-zA-Z]/","",$_FILES["f"]["name"]);
$_FILE_PARTS = pathinfo($_FILE_NAME);
$_EXT = strtolower($_FILE_PARTS["extension"]);
if (!isset($_UPLOADERS[$_EXT])) jsonError("I don't know how to handle that type of file yet.");
$_UDIR = realpath($_UPLOADERSDIR."/".$_UPLOADERS[$_EXT]);
$_USCRIPT = realpath($_UDIR."/upload.php");
if ($_USCRIPT){
  @include($_USCRIPT);
  exit();
}
jsonError("Unknown error with uploader.")
?>
