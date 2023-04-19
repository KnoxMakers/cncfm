<!doctype html>
<html>

<head>
    <title>CNCFM</title>
    <!--<link rel="icon" type="image/x-icon" href="favicon.ico">-->
    <link rel="icon" href="img/logo.png">
    <link rel="stylesheet" href='include/lib/jquery-ui/jquery-ui.min.css'>
    <link rel="stylesheet" href='include/lib/jquery-ui/jquery-ui.structure.min.css'>
    <link rel="stylesheet" href='include/lib/bootstrap/bootstrap.min.css'>
    <link rel="stylesheet" href='include/lib/bootstrap/bootstrap.flatly.min.css'>
    <link rel="stylesheet" href='include/lib/bootstrap/bootstrap-icons/bootstrap-icons.css'>
    <link rel="stylesheet" href="include/lib/awesome-notifications/awesome-notifications.css">
    <link rel='stylesheet' href='include/lib/loading-bar/loading-bar.css'>
    <link rel='stylesheet' href='include/lib/spectrum/spectrum.css'>
    <link rel='stylesheet' href='include/lib/codemirror/codemirror.css'>
    <link rel='stylesheet' href='include/lib/codemirror/blackboard.css'>
    <link rel='stylesheet' href='include/css/app.css'>
    <style id='cncfm-plugin-css'></style>
    <script src='include/lib/jquery/jquery.min.js'></script>
    <script src='include/lib/jquery-ui/jquery-ui.min.js'></script>
    <script src='include/lib/bootstrap/bootstrap.bundle.min.js'></script>
    <script src='include/lib/awesome-notifications/awesome-notifications.js'></script>
    <script src='include/lib/loading-bar/loading-bar.js'></script>
    <script src='include/lib/spectrum/spectrum.js'></script>
    <script src='include/lib/codemirror/codemirror.js'></script>
    <script src='include/lib/codemirror/simple.js'></script>
    <script src='include/lib/codemirror/gcode.js'></script>
    <script src='include/lib/svgjs/svg.min.js'></script>
    <script src='include/lib/svgjs/svg.panzoom.min.js'></script>
    <script src='include/js/app.js'></script>
    <script src='include/js/app.users.js'></script>
    <script src='include/js/app.page.js'></script>
    <script src='include/js/app.api.js'></script>
    <script src='include/js/app.files.js'></script>
    <script src='include/js/app.jobs.js'></script>
    <script src='include/js/app.plugins.uploaders.js'></script>
    <script src='include/js/app.plugins.viewers.js'></script>
    <script src='include/js/highlightPathsInSvgPreview.js'></script>
</head>

<body>


    <nav id='cncfm-nav' class="navbar navbar-dark bg-primary fixed-top" role="navigation">
        <div class="container-fluid">
            <a class='navbar-brand' href='#'><img id='logo' src='img/logo.png' height=25 /> &nbsp; CNCFM</a>

            <form class='d-flex'>
                <select id='selectUser' name='user' class='form-control me-2'>
                    <option value=''>Loading Users...</option>
                </select>
                <button type='button' id='btnNewUser' class='btn btn-info'><i
                        class="bi bi-person-plus-fill"></i></button>
            </form>
        </div>
    </nav>

    <div id='cncfm-files' class="container-fluid cncfm-page" style='display: none; padding: 0px 20px;'>

        <div class="row">
            <div class="col">
                <span id='cncfm-files-header'>
                    <i class="bi bi-house-fill"></i>
                    <i class="bi bi-chevron-compact-right"></i>
                </span>
                <button type='button' id='btnFileUpload' class='btn btn-info float-right'> <i
                        class="bi bi-cloud-arrow-up"></i>&nbsp;&nbsp;<span id='txtUploadStatus'>Upload</span></button>
                <button type='button' id='btnFileNewDir' class='btn btn-info float-right' style='margin-right: 20px;'>
                    <i class="bi bi-folder-plus"></i>&nbsp;&nbsp;New Folder</button>
                <a href="#jobs" type='button' id='btnJobs' class='btn btn-dark float-right' style='margin-right: 20px;'>
                    <i class='bi bi-cpu'></i>&nbsp;&nbsp;Jobs</a>

            </div>
        </div>
        <hr />
        <div class="row">
            <div class="col" id='cncfm-files-content'>
                <br />
                <table class='table table-hover' id='cncfm-files-table'>
                    <thead>
                        <tr>
                            <th scope='col' width=25></th>
                            <th scope='col'>FILENAME</th>
                            <th scope='col' width=150>DATE</th>
                            <th scope='col' width=150>TIME</th>
                            <th scope='col' width=150>SIZE</th>
                            <th scope='col' width=25></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan=6>
                                <center>loading...</center>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <br /><br /<br />
            </div>
        </div>

    </div>

    <div id='cncfm-jobs' class='container-fluid cncfm-page' style='display: none;'>
        <div class="row">
            <div class="col" id='cncfm-jobs-content'>
                <br />
                <table class='table table-hover' id='cncfm-jobs-table'>
                    <thead>
                        <tr>
                            <th scope='col' width=25></th>
                            <th scope='col' width=200>JOBID</th>
                            <th scope='col' class='d-none d-md-table-cell'>FILENAME</th>
                            <th scope='col' class='d-none d-lg-table-cell'>UPLOADER</th>
                            <th scope='col' class='d-none d-sm-table-cell' width=150>DATE</th>
                            <th scope='col' class='d-none d-sm-table-cell' width=150>TIME</th>
                            <th scope='col' width=150>STATUS</th>
                            <th scope='col' width=25></th>
                            <th scope='col' width=25></th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
                <br /></br>
                <center>
                    <div id='cncfm-jobs-status'>loading...</div>
                </center>
                <br /><br /<br />
            </div>
        </div>
    </div>

    <div id='cncfm-uploader' class='container-fluid cncfm-page' style='display: none;'>

        <div id='cncfm-uploader-header' class="row">
            <nav class='navbar fixed-bottom navbar-light bg-light'>
                <div class='ms-auto'>
                    <button id='btnUploaderCancel' class='btn btn-secondary' style='margin-right: 20px;'> <i
                            class="bi bi-x-circle"></i>&nbsp;&nbsp;Cancel</button>
                    <button id='btnUploaderUpload' class='btn btn-info' style='margin-right: 20px;'> <i
                            class="bi bi-file-arrow-up-fill"></i>&nbsp;&nbsp;Upload</button>
                </div>
            </nav>
        </div>

        <div class="row">
            <div class="col" id='cncfm-uploader-content'>
            </div>
        </div>

    </div>

    <div id='cncfm-viewer' class='container-fluid cncfm-page' style='display: none;'>

        <div id='cncfm-viewer-header' class='row' style='padding: 10px;'>
            <div class='col-auto me-auto'>
                <button id='btnViewCancel' class='btn btn-info'> <i
                        class="bi bi-arrow-left"></i>&nbsp;&nbsp;Back</button>
            </div>
            <div class='col'>
                <input type='text' class='form-control' id='cncfm-view-filename' readonly>
            </div>
            <div class='col-auto ms-auto'>
                <button id='btnFileRename' type='button' class='btn btn-info float-right'> 
                    <i class="bi bi-pencil"></i>&nbsp;&nbsp;Rename
                </button>
            </div>
            <div class='col-auto ms-auto'>
                <div class='dropdown'>
                    <button id='btnViewFile' type='button' class='btn btn-info float-right dropdown-toggle'
                        data-bs-toggle="dropdown" aria-expanded="false"> <i
                        class="bi bi-download"></i>&nbsp;&nbsp;Download
                    </button>
                    <ul class='dropdown-menu' aria-labelledby='btnViewFile'>
                        <!--<li><a class='dropdown-item' href='#'>Rename</a></li>-->
                        <li><a id='btnViewFileDownloadOriginal' class='dropdown-item' href='#' data-original=''>Download
                                <span id='viewFileOriginalName'>Original</span></a></li>
                        <li><a id='btnViewFileDownloadProcessed' class='dropdown-item' href='#'>Download</a></li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col" id='cncfm-viewer-content'>
            </div>
        </div>

    </div>

    <div id='cncfm-job' class='container-fluid cncfm-page' style='display: none;'>

        <div class="row">
            <div class="col" id='cncfm-job-content' style='padding: 50px;'>
                <center>
                    <table id='cncfm-job-content-table' cellpadding=25>
                        <tr>
                            <td id='cncfm-job-buttons' ALIGN=CENTER colspan=2>
                                <button id='btnJobJobs' class='btn btn-dark' type='button'>
                                    <i class='bi bi-cpu'></i> &nbsp;
                                    My Jobs
                                </button>
                                &nbsp;&nbsp;
                                <button id='btnJobOptions' class='btn btn-primary' type='button'>
                                    <i class='bi bi-card-list'></i> &nbsp;
                                    Job Options
                                </button>
                                &nbsp;&nbsp;
                                <button id='btnJobLogs' class='btn btn-primary' type='button'>
                                    <i class='bi bi-bug'></i> &nbsp;
                                    Job Log
                                </button>
                                <hr />
                            </td>
                        </tr>
                        <tr>
                            <td id='cncfm-job-info' align=center width="50%">
                            </td>
                            <td id='cncfm-job-bar' align=center>
                                <div id='cncfm-jobbar' class='ldBar auto label-center' data-preset='circle'></div>
                            </td>
                            <td id='cncfm-job-icon' align=center width="50%">
                                <img id='cncfm-job-running' src='img/loader.gif' />
                                <i id='cncfm-job-queued' class="bi bi-clock"></i>
                                <i id='cncfm-job-bug' class="bi bi-bug"></i>
                                <div id='cncfm-job-label' align=center></div>
                            </td>
                        </tr>
                        <tr>
                            <td id='cncfm-job-options' style='display: none;' COLSPAN=2 align=LEFT>
                                <div id='cncfm-job-options-content'></div>
                            </td>
                        </tr>
                        <tr>
                            <td id='cncfm-job-logs' style='display: none;' COLSPAN=2 align=LEFT>
                                <div id='cncfm-job-logs-content'></div>
                            </td>
                        </tr>

                    </table>
                </center>
            </div>
        </div>

    </div>

    <form id='cncfm-upload' enctype="multipart/form-data">
        <input id='fileUpload' name='fileUpload' type='file' style='display: none;' />
    </form>


</body>

</html>