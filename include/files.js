var _GETFILESSTATUS=false;
var _FILE;
var fileSelector = $('#fileUpload');
$('#formFileUpload').ajaxForm({
    beforeSend: function() {
        $('#txtUploadStatus').html("0%");
    },
    uploadProgress: function(event, position, total, percentComplete) {
        var percentVal = percentComplete + '%';
        if (percentComplete == 100) percentVal = "Working...";
        $('#txtUploadStatus').html(percentVal);
    },
    success: function() {
        var percentVal = 'Working...';
        $('#txtUploadStatus').html(percentVal);
    },
    complete: function(xhr) {
        var r = JSON.parse(xhr.responseText);
        if (r && r.result && r.result == 1){
            getFiles();
        }else{
            if (r && r.message){
                msgAlert(r.message);
            }else{
                msgAlert("Upload Failed.  Perhaps the size was too big or there were permission errors.");
            }
        }
        $('#txtUploadStatus').html("Upload");
    },
    error: function(){
        msgAlert("Invalid File.");
        $('#txtUploadStatus').html("Upload");
    }
});

function getFiles(){
    var user = $('#selectUser').val();
    var tbody = $('#fileTable tbody');
    var tfoot = $('#fileTable tfoot');
    var cDir = $("#current-dir").val();

    if (user){
      $('#txtFilesUser').html(user);
      $('#txtFilesDir').html(cDir);
    }else{
        $('#txtFilesUser').html("PLEASE CHOOSE A USER");
    }
    $(tbody).find("tr").remove();
    $(tfoot).find("tr").remove();
    if (!_GETFILESSTATUS){
      _GETFILESSTATUS=true;
      $.get("get/", { "w": "fileList", "dir": cDir, "user": user }, function(data){
          if (data && data.result && data.result==1){
            var current_dir = $("#current-dir").val() || "";
            var dirCount = 0;
            if (current_dir && current_dir != '/'){
              var cSplit = current_dir.split('/');
              cSplit.pop();
              cSplit.pop();
              if (cSplit) {
                var newDir = cSplit.join('/')+"/";
              }else{
                var newDir = "";
              }
              var tr = $('<tr>');
              tr.append($("<td>").append($("<i>").addClass("fa fa-undo")));
              tr.append($("<td colspan=5>").append($("<a>").attr("href", '#'+newDir).text("[ .. ]").addClass("files-dir")));
              tbody.append(tr);
            }
            $.each(data.dirs, function(i,dir) {
              var newDir = (current_dir + "/" + dir + "/").replace(/\/+/g, '\/');
              dirCount += 1;
              var tr = $('<tr>');
              tr.append($("<td>").append($("<i>").addClass("fa fa-folder-open")));
              tr.append($("<td colspan=4>").append($("<a>").attr("href", '#'+newDir).text("[ "+dir+" ]").addClass("files-dir")));
              tr.append($("<td>").append( $("<button>").addClass("btn btn-md btn-danger deleteDir").attr("dirname", dir).append(
                $("<i>").addClass("fa fa-trash")
              )));
              tbody.append(tr);
            });
            var rowCount = 0;
            $.each(data.files, function(i,file) {
              rowCount += 1;
              var tr = $('<tr>');
              tr.append($("<td>").append($("<i>").addClass("fa fa-file")));
              tr.append($("<td>").append($("<a>").attr("href", '#'+current_dir + "/" +file.name).text(file.name).addClass('files-file')));
              tr.append($("<td class='hidden-xs'>").html(file.date));
              tr.append($("<td class='hidden-xs hidden-sm'>").html(file.time));
              tr.append($("<td class='hidden-xs hidden-sm'>").html(file.size));
              tr.append($("<td>").append( $("<button>").addClass("btn btn-md btn-danger deleteFile").attr("filename", file.name).append(
                $("<i>").addClass("fa fa-trash")
              )));
              tbody.append(tr);
            });
            tr = $('<tr>');
            tr.append($("<td colspan=5><hr/></td>"));
            tfoot.append(tr);
            tr = $('<tr>');
            tr.append($("<td colspan=4>"+rowCount+" FILES</td>"));
            tr.append($("<td colspan=2 class='hidden-xs hidden-sm'>"+data.size+"</td>"));
            tfoot.append(tr);
          }else{
            if (data && data.message){
              msgAlert(data.message);
            }else{
              msgAlert("Unknown error while getting files.")
            }
          }
          _GETFILESSTATUS=false;
      },"json");
    }
}

function fileSelectorChanged(e){
  _FILE = e.target.files[0]
  if (_FILE && _FILE.name){
      ext = _FILE.name.split('.').pop().toLowerCase();
      if (_UPLOADERS[ext]){
          $(document).trigger("aneris.upload."+_UPLOADERS[ext]);
      }else{
        msgAlert("I am not able to handle that type of file yet.");
      }
  }
}

function fileButtonClicked(){
  var bStatus = $('#txtUploadStatus').html();
  var user = $('#selectUser').val();
  if (user){
      if (bStatus == "Upload"){
          fileSelector.click();
      }else{
        msgAlert("Stop it. I'm busy.");
      }
  }else{
      msgAlert("Please choose a user before uploading files.");
  }
}

function deleteFile(e){
    e.preventDefault();
    var user = $('#selectUser').val();
    var dir = $("#current-dir").val();
    var filename = $(this).closest("button").attr("filename");
    if (confirm("Are you sure you want to delete the file: " + filename)){
        $.get("get/", {"w": "fileDelete", "user": user, "dir": dir, "file": filename},function(data){
            if (data && data.result && data.result==1){
              getFiles();
            }else{
              if (data && data.message){
                msgAlert(data.message);
              }else{
                msgAlert("Unable to delete file.");
              }
            }
        }, "json");
    }
}

function createDir(){
  var dir = $("#current-dir").val();
  var newDir = prompt("\nNew Folder's Name:\n(Names must be alphanumeric only)");
  var user = getUser();
  if (!user){
    msgAlert("Select a user before creating a folder.");
    return
  }
  if (newDir){
      $.get("get/", { "w": "dirNew", "user": user, "dir": dir, "newDir": newDir },function(r){
          if (r && r.result && r.result==1){
            getFiles();
          }else{
            if (r && r.message){
              msgAlert(r.message);
            }else{
              msgAlert("Unable to create new folder.");
            }
          }
      },"json");
  }}

function deleteDir(e){
  e.preventDefault();
  var user = $('#selectUser').val();
  var dir = $("#current-dir").val();
  var dirname = (dir + "/" + $(this).closest("button").attr("dirname")).replace(/\/+/g, '\/');
  if (confirm("Are you sure you want to delete the folder and all of it's contents:\n" + dirname)){
      $.get("get/", {"w": "dirDelete", "user": user, "dir": dirname},function(data){
        if (data && data.result && data.result==1){
          getFiles();
        }else{
          if (data && data.message){
            msgAlert(data.message);
          }else{
            msgAlert("Unable to delete file.");
          }
        }
      }, "json");
  }
}

$(fileSelector).on("click",function(){ $(this).val(null); });
$(fileSelector).on('change',fileSelectorChanged);
$('#selectUser').change(function(){
  getFiles();
  document.location="#";
});
$(document).on("click","#buttonFileUpload",fileButtonClicked);
$(document).on("click",'.deleteFile', deleteFile);
$(document).on("click","#buttonFileNewDir",createDir);
$(document).on("click",'.deleteDir', deleteDir);
