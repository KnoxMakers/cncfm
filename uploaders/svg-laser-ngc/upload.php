<?php
/*
$_DIR
$_FILE_NAME
$_FILE_PATH
$_FILE_PARTS
$_EXT
*/

$_passes = Array();
foreach((array)$_POST["svgStrokeColor"] as $key => $svgColor){
    if (!empty($svgColor)){
        $key = intval($key);
        $svgPulses = intval($_POST["svgPulse"][$key]);
        $svgFeedrate = intval($_POST["svgFeedrate"][$key]);
        $svgPower = intval($_POST["svgPower"][$key]);

	error_log("before: ".$svgPower);
        $svgPower = round( ($svgPower/100.0), 2);
	error_log("after: ".$svgPower);

        // Color Sanity
        $hexpattern = "/[^0123456789abcd/ef\#]/";
        $color = preg_replace($hexpattern, "", $color);

        //#HEXCOLOR:S:FEEDRATE:POWER
        $_passes[] = "$svgColor:$svgPulses:$svgFeedrate:$svgPower";
    }
}

$fname = basename($_FILE_NAME);
if ($_EXT != "ngc") $fname .= ".ngc";

$e = realpath($_UDIR."/bin/svg2ngc.py")." --directory=$_DIR --filename=$fname ";
$i = 1;
foreach($_passes as $pass){
    $e .= " --laser-pass$i=\"$pass\"";
    $i += 1;
}
$e .= " $_FILE_PATH";
$stdout = "";
$stderr = "";
$ret = bin_exec($e, $stdout, $stderr);
if (!empty($stderr)){ jsonError($stderr); }

$rasterDPI = intval($_POST["rasterDPI"]);
$rasterFeedrate = intval($_POST["rasterFeedrate"]);
$rasterPower = intval($_POST["rasterPower"]);
$rasterPower = round( ($rasterPower/100.0), 2 );

$e = realpath($_UDIR."/bin/svg2ngcraster.py")." --directory=$_DIR --filename=$fname --images=$_RASTERSDIR ";
$e .= " --laser=\"$rasterDPI:$rasterFeedrate:$rasterPower\" ";
$e .= " $_FILE_PATH";
$ret = bin_exec($e, $stdout, $stderr);
if (!empty($stderr)){ jsonError($stderr); }


bin_exec("chmod -R 777 $_DIR");
bin_exec("chmod -R 777 $_RASTERSDIR");

jsonSuccess();
?>
