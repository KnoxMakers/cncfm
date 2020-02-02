var RASTER_RATIO = 1;

$(document).on("change",".raster-laser-ngc-val",function(){
    var mindpi = _CONFIG["laser"]["raster"]["min"];
    var maxdpi = _CONFIG["laser"]["raster"]["max"];
    var maxw = _CONFIG["laser"]["machine"]["width"];
    var maxh = _CONFIG["laser"]["machine"]["height"];

    var dpi = parseInt($('#raster-laser-ngc-dpi').val());
    var width = parseFloat($('#raster-laser-ngc-w').val());
    var height = parseFloat($('#raster-laser-ngc-h').val());

    if (dpi < mindpi) dpi = mindpi;
    if (dpi > maxdpi) dpi = maxdpi;

    if (width > maxw){
      width = maxw;
      height = parseFloat(width / RASTER_RATIO).toFixed(1);
    }
    if (height > maxh){
      height = maxh;
      width = parseFloat(height * RASTER_RATIO).toFixed(1);
    }
    $('#raster-laser-ngc-w').val(width);
    $('#raster-laser-ngc-h').val(height);
    $('#raster-dpi').val(dpi);
});

$(document).on("change","#raster-laser-ngc-w",function(){
    w = $(this).val();
    h = parseFloat(w / RASTER_RATIO).toFixed(1);
    $('#raster-laser-ngc-h').val(h);
});

$(document).on("change","#raster-laser-ngc-h",function(){
    h = $(this).val();
    w = parseFloat(h * RASTER_RATIO).toFixed(1);
    $('#raster-laser-ngc-w').val(w);
});

$(document).on("click","#raster-laser-ngc-btnCreate",function(){
    $('#formFileUpload').submit();
    getFiles();
    $('#modal-raster-laser-ngc').modal("hide");
});

$(document).on("aneris.upload.raster-laser-ngc", function(){
    var _URL = window.URL || window.webkitURL;
    img = new Image();
    img.onload = function(){
        RASTER_RATIO = this.width/this.height;
        $("#raster-laser-ngc-w").val(this.width);
        $("#raster-laser-ngc-w").change();
    }
    img.src = _URL.createObjectURL(_FILE);
    $('#raster-laser-ngc-preview').attr("src",img.src);
    $("#raster-laser-ngc-dpi").val(_CONFIG["laser"]["raster"]["dpi"]["default"]);
    $("#raster-laser-ngc-p").val(_CONFIG["laser"]["raster"]["power"]["default"]);
    $("#raster-laser-ngc-f").val(_CONFIG["laser"]["raster"]["feedrate"]["default"]);
    $('#modal-raster-laser-ngc').modal();
});
