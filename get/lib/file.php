<?php
if (empty($_USERSDIR)){ exit(); }

function validUser($u){
  global $_USERSDIR;
  foreach(glob($_USERSDIR."/*") as $f){
    if (is_dir($f)){ if ($u == basename($f)){ return True; } }
  }
  return False;
}

function validateUser($u){
  global $_USERSDIR;
  foreach(glob($_USERSDIR."/*") as $f){
    if (is_dir($f)){ if ($u == basename($f)){ return True; } }
  }
  jsonError("Invalid User");
}

function validExt($ext){
  global $_VIEWERS;
  if (isset($_VIEWERS[$ext])){ return True; }
  return False;
}

function validateExt($file){
  global $_VIEWERS;
  $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
  if (isset($_VIEWERS[$ext])){ return $ext; }
  return False;
}

function buildDirs($dirs, $path){
  foreach(glob($path."/*") as $f){
    if ($f[0] != "."){
      if (is_dir($f)){
        $dirs[] = realpath($f);
        $dirs = buildDirs($dirs, $path."/".basename($f));
      }
    }
  }
  return $dirs;
}

function buildFiles($files, $path){
  foreach(glob($path."/*") as $f){
    if ($f[0] != "."){
      if (is_dir($f)){
        $files = buildFiles($files, $path."/".basename($f));
      }else{
        $files[] = realpath($f);
      }
    }
  }
  return $files;
}

function validateDir($user, $dir){
  global $_USERSDIR;
  $prefix = realpath($_USERSDIR."/".$user."/");
  if (empty($dir)){ return $prefix; }

  $dir = realpath($prefix.$dir);
  $dirs = buildDirs(Array($prefix), $prefix);
  if (!in_array($dir, $dirs)){
    jsonError("Invalid Directory", $dirs);
  }
  return $dir;
}

function validateFile($user, $dir, $file){
  global $_USERSDIR;
  if (!validUser($user)){
    jsonError("Invalid User");
  }
  $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
  if (!validExt($ext)){
    jsonError("Invalid file type.");
  }
  $files = buildFiles(Array(), $_USERSDIR."/".$user);
  $path = realpath($_USERSDIR."/".$user."/".$dir."/".$file);
  if (!in_array($path, $files)){
    jsonError("Invalid file.");
  }
  return $path;
}

function deleteDir($user, $dir){
  $dir = validateDir($user, $dir);

  $files = buildFiles(Array(), $dir);
  $dirs = buildDirs(Array(), $dir);

  foreach($files as $file){
    $result = unlink($file);
    if (!$result){ jsonError("Unable to remove files from directory.  Permission Error?"); }
  }

  usort($dirs, function($a, $b){ return strlen($b) - strlen($a); });
  foreach($dirs as $d){
    $result = rmdir($d);
    if (!$result){ jsonError("Unable to remove directory.  Permission Error?"); }
  }

  $result = rmdir($dir);
  if (!$result){ jsonError("Unable to remove directory.  Permission Error?"); }

  return True;

}

?>
