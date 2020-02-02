<?php

function bin_exec($cmd, &$stdout=null, &$stderr=null) {
    $proc = proc_open($cmd,[
        1 => ['pipe','w'],
        2 => ['pipe','w'],
    ],$pipes);
    $stdout = stream_get_contents($pipes[1]);
    fclose($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[2]);
    return proc_close($proc);
}

function jsonSuccess($e="", $extra=false){
  $out = Array(
    "result" => 1,
    "message" => $e,
    "extra" => $extra,
  );
  echo json_encode($out);
  exit();

}

function jsonError($e, $extra=false){
  $out = Array(
    "result" => 0,
    "message" => $e,
    "extra" => $extra,
  );
  echo json_encode($out);
  exit();
}

?>
