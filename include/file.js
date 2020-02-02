function loadFile(){
  var current_file = $("#current-file").val();
  var current_dir = $("#current-dir").val();

  $("table.file-header td.file-name").html(current_file);
  $("div.fileview").hide()
  var ext = current_file.split('.').pop().toLowerCase();
  if (_VIEWERS && _VIEWERS[ext]){
    var v = _VIEWERS[ext];
    $("#view-"+v).show();
    $(document).trigger("viewer."+v);
  }
}

$(document).on("click", "#btnFileDelete", function(e){
  var user = $("#selectUser").val();
  var file = $("#current-file").val();
  var dir = $("#current-dir").val();
  if (confirm("Are you sure you want to delete this file?")){
    $.get("get/", { "w": "fileDelete", "user": user, "dir": dir, "file": file }, function(r){
      if (r && r.result && r.result==1){
        document.location="#";
        getFiles();
      }else{
        if (r && r.message){
          msgAlert(r.message);
        }else{
          msgAlert("Unable to delete file.");
        }
      }
    }, "json");
  }
  e.preventDefault();
});

$(document).on("click", "#btnFileRename", function(e){
  var user = $("#selectUser").val();
  var file = $("#current-file").val();
  var dir = $("#current-dir").val();
  var newname = prompt("What would you like to name this file?", file);
  if (newname){
    $.get("get/", { "w": "fileRename", "user": user, "dir": dir, "file": file, "newname": newname }, function(r){
      if (r && r.result && r.result==1){
        newname = r.newname;
        $("#current-file").val(newname);
        $("table.file-header td.file-name").html(newname);
        getFiles();
      }else{
        if (r && r.message){
          msgAlert(r.message);
        }else{
          msgAlert("Unable to rename file.");
        }
      }
    }, "json");
  }
  e.preventDefault();
});

$(document).on("click", "#btnFileDownload", function(e){
  var user = $("#selectUser").val();
  var file = $("#current-file").val();
  var dir = $("#current-dir").val();
  var params = { "w": "fileDownload", "user": user, "dir": dir, "file": file }
  var url = "get/?" + $.param(params);
  window.open(url);
  e.preventDefault();
});
