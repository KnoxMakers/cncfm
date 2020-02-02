var laserNgcEditor = CodeMirror.fromTextArea(document.getElementById('laser-ngc-gcode-edit'), { lineNumbers: true, mode: "linuxcnc", theme: "blackboard"  });

function laserNgcFindRaster(){
    var g = laserNgcEditor.getValue();
    var r = /O145 call \[(\d+)\]/gi;
    $('#laser-ngc-raster-images').html("");
    while (match = r.exec(g)){
        $('#laser-ngc-raster-images').append("<a href='get/?w=rasterImage&v=laser-ngc&id="+match[1]+"' target='_blank' class='swipebox'><img class='laser-ngc-raster-image-preview' src='get/?w=rasterImage&v=laser-ngc&id="+match[1]+"'/></a>");
    }
    //$('.swipebox').swipebox();
}

function laserNgcLoad(){
    var filename = $("#current-file").val();
    var dir = $("#current-dir").val();
    var user = $('#selectUser').val();

    if (!filename){
        msgAlert("Invalid File");
        console.log("invalid file:", h, user);
        return
    }

    laserNgcEditor.setValue("Loading");
    $("#laser-ngc-raster-images").html("");
    $('.nav-tabs a[href="#laser-ngc-tabGcode"]').tab('show')
    $.get("get/", { "w": "fileGet", "dir": dir, "user": user, "file": filename }, function(r){
        if (r && r.result && r.result==1){
          laserNgcEditor.setValue(r.data);
          laserNgcFindRaster();
          setTimeout(function(){ laserNgcEditor.refresh(); },150);
        }else{
          if (r && r.message){
            msgAlert(r.message);
          }else{
            msgAlert("Unable to load file.");
          }
        }
    }, "json");
}

function laserNgcSave(){
    var dir = $("#current-dir").val();
    var filename = $("#current-file").val();
    var user = $('#selectUser').val();
    var data = laserNgcEditor.getValue();

    $('#laser-ngc-saveStatus').html("Saving...");

    $.post("get/?w=fileSave", { file: filename, dir: dir, user: user, data: data }, function(r){
       $('#laser-ngc-saveStatus').html("Save");
       if (r && r.result && r.result==1){

       }else{
         if (r && r.message){
           msgAlert(r.message);
         }else{
           msgAlert("Unable to save.");
         }
       }
    },"json");
}


$(document).on("page.unload", function(){
    laserNgcEditor.setValue("Loading...");
    setTimeout(function(){ laserNgcEditor.refresh(); },100);
});
$(document).on("viewer.laser-ngc", function(){ laserNgcLoad(); });
$(document).on("click",'#laser-ngc-btnSave', laserNgcSave);
