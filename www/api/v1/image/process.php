<?php
/*
resample
grayscale
contrast (contrast: 25, brightness: 25)

gamma (factor: 3.5)

unsharp_mask (percent: 100, radius: 8, threshold: 0)
             (percent: 150, radius: 1, threshold: 0)
             (percent: 500, radius 20, threshold: 6)
             (percent: 500, radius: 4, threshold: 0)
             
tone (type: spline, values [[0,0],[100,125],[255,255]])
     (type: line, values [(2,32),(9,50),(30,84),(40,99),(76,144),(101,170),(126,193),(156,214),(181,230),(206,246),(256,254)])
     
dither (type: 'Floyd-Steinberg')

auto_contrast (cutoff: 3)

halftone (black: True, sample: 10, angle: 22, oversample: 2)
*/

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
    return $img;
}

function unsharp_mask($img, $percent, $radius, $threshold)
{
    return $img;
}

function tone($img, $type, $values)
{

}

?>