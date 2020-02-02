<!DOCTYPE html>
<?php
include("config.php");
$uploaders = Array();foreach($_UPLOADERS as $ext => $u){ if (!in_array($u, $uploaders)){ $uploaders[] = $u; }}
$viewers = Array();foreach($_VIEWERS as $ext => $v){ if (!in_array($v, $viewers)){ $viewers[] = $v; }}
?>
<html lang="en">
  <head>
    <title><?= $_NAME ?></title>
    <link rel="icon" type="image/png" href="images/logo.png" />
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <link href="include/3rdparty/bootstrap/css/bootstrap.min.css" rel="stylesheet"/>
    <link href="include/3rdparty/bootstrap/css/bootstrap-flatly.min.css" rel="stylesheet"/>
    <link href="include/3rdparty/bootstrap/css/dashboard.css" rel="stylesheet"/>
    <link href="include/3rdparty/font-awesome/css/font-awesome.min.css" rel="stylesheet"/>
    <!--<link rel="stylesheet" href="include/lightbox/css/swipebox.min.css"/>-->
    <link rel="stylesheet" href="include/3rdparty/codemirror/lib/codemirror.css"/>
    <link rel="stylesheet" href="include/3rdparty/codemirror/theme/blackboard.css"/>
    <link rel="stylesheet" href="include/3rdparty/spectrum/spectrum.css"/>
    <link href="include/aneris.css" rel="stylesheet"/>
<?php
foreach($uploaders as $u){
    echo "    <link rel=\"stylesheet\" href=\"include/css.php?t=u&w=$u\"/>";
}
foreach($viewers as $v){
    echo "    <link rel=\"stylesheet\" href=\"include/css.php?t=v&w=$v\"/>";
}
?>
  </head>

  <body>
    <form id='formFileUpload' action="get/?w=fileUpload" method="post" enctype="multipart/form-data" style='display: inline;'>
        <input type="file" name='f' id='fileUpload' style='display: none;'/>

        <nav id='header' class="navbar navbar-default navbar-fixed-top" role="navigation">
            <div class="container-fluid">
                <div class="navbar-header" id='mainnavbar'>
                    <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#helioNavMenu">
                        <span class='icon-bar'></span>
                        <span class='icon-bar'></span>
                        <span class='icon-bar'></span>
                    </button>
                    <a id='brand' href='#'><img id='logo' src='<?= $_LOGO ?>'/><?= $_NAME ?></a>
                </div>
                <div class="navbar-collapse collapse pull-right" id='helioNavMenu' style='margin:8px;'>
                <table width='100%'><tr><td><select id='selectUser' name='user' class='form-control'> <option value=''>Loading Users...</option> </select></td>
                <td width=25><button id='btnNewUser' class='btn btn-info' style='margin-left: 5px;'><i class='fa fa-plus'></i></button><div class='clear'></div></td></tr></table>
                </div>
            </div>
        </nav>

        <div class="container-fluid">
          <div class="row">
            <div class='col-md-12 main'><br/>
              <div id='divAlerts'></div>
              <div id='maincontent'>
                <div id='page-files' style='display: none;' class='pages'>
                  <button id='buttonFileUpload' class='btn btn-info pull-right'> <i class='fa fa-upload'></i>&nbsp;&nbsp;<span id='txtUploadStatus'>Upload</span></button>
                  <button id='buttonFileNewDir' class='btn btn-info pull-right' style='margin-right: 20px;'> <i class='fa fa-plus-square'></i>&nbsp;&nbsp;New Folder</button>
                    <h3><span id='txtFilesUser'></span><span id='txtFilesDir'></span></h3>
                    <div class='clear'></div>
                    <hr/>
                    <table id='fileTable' class='table'>
                    <thead>
                      <th width=45></th>
                      <th>Filename</th>
                      <th width=175 class='hidden-xs'>Date</th>
                      <th width=175 class='hidden-xs hidden-sm'>Time</th>
                      <th width=175 class='hidden-xs hidden-sm'>Size</th>
                      <th width=60></th>
                    </thead>
                    <tbody> </tbody>
                    <tfoot> </tfoot>
                    </table>
                </div>
                <div id='page-file' style='display: none;' class='pages'>
                  <input type='hidden' id='current-file'/>
                  <input type='hidden' id='current-dir' name='dir'/>
                  <table class='file-header'>
                    <tr>
                      <td class='file-name'></td>
                      <td align=right>
                        <a href='#' id='btnFileRename' class='btn btn-info file-action'><i class='fa fa-edit'></i><span class='hidden-xs'>&nbsp; RENAME</span></a>
                        <a href='#' id='btnFileDelete' class='btn btn-danger file-action'><i class='fa fa-trash'></i><span class='hidden-xs'>&nbsp; DELETE</span></a>
                        <a href='#' id='btnFileDownload' class='btn btn-success file-action'><i class='fa fa-cloud-download'></i><span class='hidden-xs'>&nbsp; DOWNLOAD</span></a>
                      </td>
                    </tr>
                  </table>
                  <br/>
                  <?php
                  foreach($viewers as $v){
                    echo "<div id='view-$v' style='display: none;' class='fileview'>";
                    @include $_VIEWERSDIR."/$v/view.html";
                    echo "</div>";
                  }
                  ?>
                </div>
                <?php
                foreach($uploaders as $u){
                  @include $_UPLOADERSDIR."/$u/pages.html";
                }
                ?>
              </div>
            </div>
          </div>
        </div>
        <?php
        foreach($uploaders as $u){
          @include $_UPLOADERSDIR."/$u/modal.html";
        }
        foreach($viewers as $v){
          @include $_VIEWERSDIR."/$v/modal.html";
        }
        ?>
    </form>

    <script src="include/3rdparty/jquery/jquery.min.js"></script>
    <script src="include/3rdparty/jquery.form.js"></script>
    <script src="include/3rdparty/bootstrap/js/bootstrap.min.js"></script>
    <script src="include/3rdparty/codemirror/lib/codemirror.js"></script>
    <script src="include/3rdparty/codemirror/addon/display/autorefresh.js"></script>
    <script src="include/3rdparty/codemirror/addon/mode/simple.js"></script>
    <script src="include/3rdparty/codemirror/mode/linuxcnc/linuxcnc.js"></script>
    <script src="include/3rdparty/spectrum/spectrum.js"></script>
    <script src="include/3rdparty/svgjs/svg.min.js"></script>
    <script src="include/3rdparty/svgjs/svg.panzoom.min.js"></script>
    <script src='include/config.js.php'></script>
    <script src="include/aneris.js"></script>
    <script src="include/users.js"></script>
    <script src="include/page.js"></script>
    <script src='include/files.js'></script>
    <script src='include/file.js'></script>

<?php
foreach($uploaders as $u){
    echo "    <script src=\"include/js.php?t=u&w=$u\"></script>";
}
foreach($viewers as $v){
    echo "    <script src=\"include/js.php?t=v&w=$v\"></script>";
}
?>

  </body>
</html>
