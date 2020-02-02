<?php
/*
$_DIR
$_FILE_NAME
$_FILE_PATH
$_FILE_PARTS
$_EXT
*/

function getRasterNum(){
  global $_RASTERSDIR;
  $i = 0;
  do {
      $i++;
      $path = $_RASTERSDIR."/*-$i.*";
      $files = glob($path);
  }while(count($files)>0);
  return $i;
}

$_RASTERCODE = "M63 P0 (Turn off synchronized motion)
M65 P0 (Turn off digital output immediately)
G00 Z0.000001 (Z-Magic output off)
G21 (All units in mm)

M68 E0 Q%s
F%s
M3 (Enable the spindle)
S0.000001 (Set the spindle to the slowest rate that LinuxCNC sees as being on)

O145 call [%d] [%.2f] [%.2f] [%.3f] [%.3f] [%.3f]   [%.3f]   [%.2f]
(         pic %s x %s y %s w %s h %s xscangap %s yscangap %s overscan )

M5
";

$i = getRasterNum();
$to = realpath($_RASTERSDIR)."/raster-$i.$_EXT";
if (!rename($_FILE_PATH, $to)){ jsonError("Unable to save raster file."); }
chmod($to, 0777);

$gfile = realpath($_DIR)."/$_FILE_NAME.$i.ngc";

$overscan = $_CONFIG["laser"]["raster"]["overscan"];
$feedrate = intval($_POST["raster-laser-ngc-f"]);
$w = floatval($_POST["raster-laser-ngc-w"]);
$h = floatval($_POST["raster-laser-ngc-h"]);
$x = $overscan;
$y = $h;

// Power Sanity
$power = intval($_POST["raster-laser-ngc-p"]);
if ($power < 1) $power = 1;
if ($power > 100) $power = 100;
$power = round( ($power/100.0), 2 );

// Calculate scangap from dpi values.
$gap = round(25.4*(1/$_POST["raster-laser-ngc-dpi"]),3);

// Spacing for comments
$s1 = str_repeat(" ", strlen($i)-2);
$s2 = str_repeat(" ", strlen(sprintf("%.2f",$_POST["raster-laser-ngc-x"])));
$s3 = str_repeat(" ", strlen(sprintf("%.2f",$_POST["raster-laser-ngc-y"])));
$s4 = str_repeat(" ", strlen(sprintf("%.2f",$_POST["raster-laser-ngc-w"]))+1);
$s5 = str_repeat(" ", strlen(sprintf("%.2f",$_POST["raster-laser-ngc-h"]))+1);
$s6 = str_repeat(" ", strlen(sprintf("%.3f",$gap))-5);
$s7 = str_repeat(" ", strlen(sprintf("%.3f",$gap))-5);

// Generate Gcode
$gcode = "%\n".sprintf($_RASTERCODE,$power,$feedrate,$i,$x,$y,$w,$h,$gap,$gap,$overscan,$s1,$s2,$s3,$s4,$s5,$s6,$s7)."%\n";

if (!file_put_contents($gfile,$gcode)){ jsonError("Unable to write file"); }
jsonSuccess();

chmod($gfile, 0777);
?>
