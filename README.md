New:
----------
Job system to run jobs in background.
  - failed jobs will view a log to help with troubleshooting

File management improvements including drag/drop to move files.

Original source file (svg) is saved when uploaded so you can download it later.

svg2laser uploader
  - now full page instead of dialog
  - svg preview when choosing settings
  - Automatically does Object to Path for you
  - overhaul of raster settings on their own tab
    - Option of the old way (bjj/2x_laser) or by generating gcode
    - Dithering options with different algorithms
    - Threshold setting (0-255) for minimum grayscale value before lasering
    - A min and max power setting (only max is used when using bjj or dithering)
