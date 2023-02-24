<?php
include "config.php";
$_FVALID = "A-Za-z0-9-\._";

header('Content-Type: application/json; charset=utf-8');

function errormsg($status, $msg)
{
    $output = array(
        "status" => $status,
        "message" => $msg,
    );
    echo json_encode($output);
    exit();
}

function human_filesize($bytes, $dec = 2)
{
    $size = array('B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB');
    $factor = floor((strlen($bytes) - 1) / 3);
    if ($factor == 0) {
        $dec = 0;
    }

    return sprintf("%.{$dec}f", $bytes / pow(1024, $factor)) . @$size[$factor];
}

function make_path($user, $location, $filename = "", $sanitize = true)
{
    global $_C;
    $user = sanitize_name($user);
    $filename = sanitize_name($filename);
    $dir = $_C["USER_DIR"] . "/$user/$location";
    if (!empty($filename)) {
        $dir .= "/$filename";
    }

    if ($sanitize) {$dir = sanitize_path($dir);}
    return $dir;
}

function valid_name($name)
{
    global $_FVALID;

    if (!empty($name) && $name[0] == ".") {
        return false;
    }

    $regex = "/[^" . $_FVALID . "]/";
    if (preg_match($regex, $name)) {
        return false;
    }

    return true;
}

function valid_path($path)
{
    $parts = explode("/", $path);
    foreach ($parts as $part) {
        if (!valid_name($part)) {
            return false;
        }

    }
    return true;
}

function sanitize_name($name)
{
    global $_FVALID;
    $regex = "/[^" . $_FVALID . "]/";
    $name = preg_replace("/^\.+/", "", $name);

    return preg_replace($regex, '_', $name);
}

function sanitize_path($path, $hidden = true)
{
    $parts = explode("/", $path);
    $fpath = "";
    foreach ($parts as $part) {
        $part = sanitize_name($part);
        if (!empty($part)) {
            $fpath .= "/$part";
        }

    }
    return $fpath;
}

function valid_uploader($name)
{
    global $_C;

    if (!valid_name($name)) {
        return false;
    }

    $dir = $_C["PLUGIN_DIR"] . "/uploaders";
    $known_uploaders = scandir($dir);
    if (in_array($name, $known_uploaders)) {
        return true;
    }

    return false;
}

function valid_viewer($name)
{
    global $_C;

    if (!valid_name($name)) {
        return false;
    }

    $dir = $_C["PLUGIN_DIR"] . "/viewers";
    $known_viewers = scandir($dir);
    if (in_array($name, $known_viewers)) {
        return true;
    }

    return false;
}

function queue_upload($queue, $file)
{
    $jobid = round(microtime(true), 2);
    $jobfile = make_path($queue["user"], ".cncfm", "$jobid.job", false);
    $datafile = make_path($queue["user"], ".cncfm", "$jobid.data", false);
    @mkdir(dirname($jobfile), 0770, true);
    if (!file_put_contents($jobfile, json_encode($queue))) {
	error_log($jobfile);
	error_log(print_r($queue, true));
        errormsg(-12, "UNABLE TO CREATE QUEUE. PERMISSIONS?");
    }
    rename($file, $datafile);
    return $jobid;
}

function bin_exec($cmd, &$stdout = false, &$stderr = false)
{
    if ($stdout === false){ 
        $pipe1 = ['file', '/dev/null', 'a'];
        $use_stdout = false;
    }else{
        $pipe1 = ['pipe', 'w'];
        $use_stdout = true;
    }

    if ($stderr === false){ 
        $pipe2 = ['file', '/dev/null', 'a'];
        $use_stderr = false;
    }else{
        $pipe2 = ['pipe', 'w'];
        $use_stderr = true;
    }

    $proc = proc_open($cmd, [
        1 => $pipe1,
        2 => $pipe2,
    ], $pipes);
    if ($use_stdout){
        $stdout = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
    }
    if ($use_stderr){
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[2]);
    }
    return proc_close($proc);
}

function bin_filename($user, $path, $filename, $ext)
{
    $i = 1;
    while (true) {
        $fname = $filename . "_" . str_pad($i, 4, "0", STR_PAD_LEFT) . ".$ext";
        $fpath = make_path($user, $path, $fname);
        if (!file_exists($fpath)) {
            return $fname;
        }
        $i++;
    }
}

function rmTree($dir)
{
    if (!is_dir($dir)){ return false; }
    $files = array_diff(scandir($dir), array('.','..'));
    foreach ($files as $file) {
        (is_dir("$dir/$file")) ? rmTree("$dir/$file") : unlink("$dir/$file");
    }
    return rmdir($dir);
}