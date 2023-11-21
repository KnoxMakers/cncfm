<?php
/*

function resample($img, $width, $height, $dpi)
{
    return $img;
}

function grayscale($img)
{
    return $img;
}

function contrast($img, $amount)
{
    return $img;
}

function brighten($img, $amount)
{
    return $img;
}

function gamma($img, $amount)
{
    imagegammacorrect($img, 1.0, $amount);
    return $img;
}

function unsharp_mask($img, $amount, $radius, $threshold)
{
    // https://github.com/trepmag/unsharp-mask/blob/master/src/UnsharpMask.php
    ////////////////////////////////////////////////////////////////////////////////////////////////
    ////
    ////                  Unsharp Mask for PHP - version 2.1.1
    ////
    ////    Unsharp mask algorithm by Torstein Hønsi 2003-07.
    ////             thoensi_at_netcom_dot_no.
    ////               Please leave this notice.
    ////
    ///////////////////////////////////////////////////////////////////////////////////////////////
    if ($amount > 500)
        $amount = 500;
    $amount = $amount * 0.016;
    if ($radius > 50)
        $radius = 50;
    $radius = $radius * 2;
    if ($threshold > 255)
        $threshold = 255;

    $radius = abs(round($radius));
    if ($radius == 0) {
        return $img;
    }
    $w = imagesx($img);
    $h = imagesy($img);
    $imgCanvas = imagecreatetruecolor($w, $h);
    $imgBlur = imagecreatetruecolor($w, $h);

    $matrix = array(
        array(1, 2, 1),
        array(2, 4, 2),
        array(1, 2, 1)
    );
    imagecopy($imgBlur, $img, 0, 0, 0, 0, $w, $h);
    imageconvolution($imgBlur, $matrix, 16, 0);

    if ($threshold > 0) {
        for ($x = 0; $x < $w - 1; $x++) {
            for ($y = 0; $y < $h; $y++) {
                $rgbOrig = ImageColorAt($img, $x, $y);
                $rOrig = (($rgbOrig >> 16) & 0xFF);
                $gOrig = (($rgbOrig >> 8) & 0xFF);
                $bOrig = ($rgbOrig & 0xFF);

                $rgbBlur = ImageColorAt($imgBlur, $x, $y);
                $rBlur = (($rgbBlur >> 16) & 0xFF);
                $gBlur = (($rgbBlur >> 8) & 0xFF);
                $bBlur = ($rgbBlur & 0xFF);

                $rNew = (abs($rOrig - $rBlur) >= $threshold) ? max(0, min(255, ($amount * ($rOrig - $rBlur)) + $rOrig)) : $rOrig;
                $gNew = (abs($gOrig - $gBlur) >= $threshold) ? max(0, min(255, ($amount * ($gOrig - $gBlur)) + $gOrig)) : $gOrig;
                $bNew = (abs($bOrig - $bBlur) >= $threshold) ? max(0, min(255, ($amount * ($bOrig - $bBlur)) + $bOrig)) : $bOrig;

                if (($rOrig != $rNew) || ($gOrig != $gNew) || ($bOrig != $bNew)) {
                    $pixCol = ImageColorAllocate($img, $rNew, $gNew, $bNew);
                    ImageSetPixel($img, $x, $y, $pixCol);
                }
            }
        }
    } else {
        for ($x = 0; $x < $w; $x++) {
            for ($y = 0; $y < $h; $y++) {
                $rgbOrig = ImageColorAt($img, $x, $y);
                $rOrig = (($rgbOrig >> 16) & 0xFF);
                $gOrig = (($rgbOrig >> 8) & 0xFF);
                $bOrig = ($rgbOrig & 0xFF);

                $rgbBlur = ImageColorAt($imgBlur, $x, $y);

                $rBlur = (($rgbBlur >> 16) & 0xFF);
                $gBlur = (($rgbBlur >> 8) & 0xFF);
                $bBlur = ($rgbBlur & 0xFF);

                $rNew = ($amount * ($rOrig - $rBlur)) + $rOrig;
                if ($rNew > 255) {
                    $rNew = 255;
                } elseif ($rNew < 0) {
                    $rNew = 0;
                }
                $gNew = ($amount * ($gOrig - $gBlur)) + $gOrig;
                if ($gNew > 255) {
                    $gNew = 255;
                } elseif ($gNew < 0) {
                    $gNew = 0;
                }
                $bNew = ($amount * ($bOrig - $bBlur)) + $bOrig;
                if ($bNew > 255) {
                    $bNew = 255;
                } elseif ($bNew < 0) {
                    $bNew = 0;
                }
                $rgbNew = ($rNew << 16) + ($gNew << 8) + $bNew;
                ImageSetPixel($img, $x, $y, $rgbNew);
            }
        }
    }
    imagedestroy($imgCanvas);
    imagedestroy($imgBlur);

    return $img;
}

function tone($img, $type, $values)
{

}

*/
// Act as a pass-through until these can be implemented in php
$json = json_encode($_POST);
//error_log($json);
$tmp = tmpfile();
$tmpname = stream_get_meta_data($tmp)['uri'];
fwrite($tmp, $json);

$e = dirname(__FILE__) . "/rasterPrepare.py $tmpname";
header('Content-Type: application/json; charset=utf-8');
passthru($e);
fclose($tmp);

?>