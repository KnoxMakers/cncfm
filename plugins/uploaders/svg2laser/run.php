<?php
$user = $job["user"];
$location = $job["location"];
$filename = $job["filename"];
$options = $job["options"];
$config = $job["config"];
// $datafile

// convert objects to path
$svg = tempnam(sys_get_temp_dir(), 'svg2gcode') . ".svg";
$bin = $config["inkscape"]["bin"];
if (!empty($bin) && file_exists($bin)){
    $e = "xvfb-run $bin --actions=\"file-open:$datafile;select-all:no-groups;object-to-path;select-all:no-layers;selection-ungroup;export-filename:$svg;export-do;file-close\"";
    $ret = bin_exec($e, $stdout, $stderr);
    if (intval($ret) > 0) {
        job_error($user, $jobid, $stderr);
    }
}else{
    copy($datafile, $svg);
}

$newsvg = tempnam(sys_get_temp_dir(), 'svg2gcode') . ".svg";
$bin = "/usr/bin/env python3 " . __DIR__ . "/bin/cncfm-root2layers.py";
$e = "$bin $svg";
$ret = bin_exec($e, $stdout, $stderr);
if (intval($ret) > 0) {
    job_error($user, $jobid, $stderr);
}
file_put_contents($newsvg, $stdout);

$svg = $newsvg;

if ($options["has_vector"] > 0) {
    $tmpname = tempnam(sys_get_temp_dir(), 'svg2gcode.vector.');

    $outfile = bin_filename($user, $location, $filename . ".vector", "ngc");
    $path = make_path($user, $location);
    $fullpath = make_path($user, $location, $outfile);
    $bin1 = "/usr/bin/env python3 " . __DIR__ . "/bin/cncfm-gcodetools.py";

    $e1 = "$bin1 --directory=$path --filename=$tmpname";
    $e1 .= " --add-numeric-suffix-to-filename=false --active-tab=path-to-gcode";
    $e1 .= " --Zsafe=-0.001";
    $e1 .= " --gcode-header=\"" . $config["machine"]["gcodeHeader"] . "\"";
    $e1 .= " --gcode-footer=\"" . $config["machine"]["gcodeFooter"] . "\"";
    $e1 .= " --gcode-on=\"" . $config["machine"]["gcodeOn"] . "\"";
    $e1 .= " --gcode-off=\"" . $config["machine"]["gcodeOff"] . "\"";
    $e1 .= " --gcode-power=\"" . $config["machine"]["gcodePower"] . "\"";

    $passes = [];
    $i = 1;
    $minp = $config["machine"]["power-min"];
    $maxp = $config["machine"]["power-max"];
    $mpformat = $config["machine"]["power-format"];
    foreach ($options["passes"] as $pass) {
        $color = $pass["color"];
        $feedrate = $pass["feedrate"];
        $power = sprintf($mpformat, $minp + (($maxp-$minp)*($pass["power"] / 100.0)));
        $e1 .= " --laserpass=\"$color:$feedrate:$power\"";
        $i++;
    }

    $e1 .= " $svg";

    $stdout = false;
    $stderr = "";
    $ret = bin_exec($e1, $stdout, $stderr);
    if (intval($ret) > 0) {
        job_error($user, $jobid, $stderr);
    } else {
        error_log("$tmpname => $fullpath");
        rename($tmpname, $fullpath);
        chmod($fullpath, 0770);
        $data = file_get_contents($datafile);
        job_meta($user, $location, $filename, $outfile, $data);
    }
}

if (($options["has_raster"] > 0) && ($options["raster"]["enable"] == "Y")) {
    $tmpname = tempnam(sys_get_temp_dir(), 'svg2gcode.raster.');

    $outfilename = bin_filename($user, $location, $filename . ".raster", "ngc");
    $outpath = make_path($user, $location);
    $outfile = make_path($user, $location, $outfilename);
    $bin1 = "/usr/bin/env python3 " . __DIR__ . "/bin/cncfm-raster.py";

    $mpmin = $config["machine"]["power-min"];
    $mpmax = $config["machine"]["power-max"];
    $mpformat = $config["machine"]["power-format"];
    $rpmin = $options["raster"]["minpower"];
    $rpmax = $options["raster"]["maxpower"];
    $rpmin = sprintf($mpformat, $mpmin + ($mpmax-$mpmin) * ($rpmin / 100.0));
    $rpmax = sprintf($mpformat, $mpmax * ($rpmax / 100.0));

    $e2 = "$bin1 --filename=$tmpname";
    $e2 .= " --gcode_header=\"" . $config["machine"]["gcodeHeader"] . "\"";
    $e2 .= " --gcode_footer=\"" . $config["machine"]["gcodeFooter"] . "\"";
    $e2 .= " --gcode_on=\"" . $config["machine"]["gcodeOn"] . "\"";
    $e2 .= " --gcode_off=\"" . $config["machine"]["gcodeOff"] . "\"";
    $e2 .= " --gcode_power=\"" . $config["machine"]["gcodePower"] . "\"";
    $e2 .= " --method=\"" . $options["raster"]["method"] . "\"";
    $e2 .= " --algorithm=\"" . $options["raster"]["algorithm"] . "\"";
    $e2 .= " --dpi=\"" . $options["raster"]["dpi"] . "\"";
    $e2 .= " --threshold=\"" . $options["raster"]["threshold"] . "\"";
    $e2 .= " --feedrate=\"" . $options["raster"]["feedrate"] . "\"";
    $e2 .= " --minpower=\"" . $rpmin . "\"";
    $e2 .= " --maxpower=\"" . $rpmax . "\"";
    $e2 .= " --precision=\"" . $config["machine"]["power-precision"] . "\"";
    if (!empty($config["machine"]["bjjImageDir"])) {
        @mkdir($config["machine"]["bjjImageDir"], 0770, true);
        $e2 .= " --bjj_image_dir=\"" . $config["machine"]["bjjImageDir"] . "\"";
    }
    $e2 .= " $svg";

    $stdout = false;
    $stderr = "";
    $ret = bin_exec($e2, $stdout, $stderr);
    if (intval($ret) > 0) {
        job_error($user, $jobid, $stderr);
    } else {
        error_log($stderr);
        error_log("$tmpname => $outfile");
        rename($tmpname, $outfile);
        chmod($outfile, 0770);
        $data = file_get_contents($datafile);
        job_meta($user, $location, $filename, $outfile, $data);
    }
}

@unlink($svg);