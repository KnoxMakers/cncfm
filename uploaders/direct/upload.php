<?php
/*
$_DIR
$_FILE_NAME
$_FILE_PATH
$_FILE_PARTS
$_EXT
*/

$to = realpath($_DIR)."/$_FILE_NAME";

if (!rename($_FILE_PATH, $to)){ jsonError("Unable to save uploaded file."); }
chmod($to, 0777);
jsonSuccess();

?>
