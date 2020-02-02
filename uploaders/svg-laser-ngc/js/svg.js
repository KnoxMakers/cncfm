var hexDigits = new Array ("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f");
var rgb2hex = function (rgb) { rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/); return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]); }
var hex = function (x) { return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16]; }
var svgColors = Array();

function svgLaserNgcClearPasses(){
    $('#svg-laser-ngc-passes tbody tr').remove();
}

function svgLaserNgcInit(){
    svgLaserNgcClearPasses();
}

function svgLaserNgcUpdateMats(){
    var mat = $("#svg-laser-ngc-materials").val();
    if (mat && _CONFIG["laser"]["presets"][mat]){
		$("select[svg-setting=mode]").each(function(){
            var s = this;
            var oldval = $(s).val();
            $(s).find("option").remove();
            $(s).append( $("<option>").val("").text("") );
            $(s).append( $("<option>").val("custom").text("CUSTOM") );
			if (mat && _CONFIG["laser"]["presets"][mat]){
	        	$.each(_CONFIG["laser"]["presets"][mat], function(key, p){
    	        	var o = $("<option>").val(key).text(key);
                    $(s).append(o);
    	    	});
			}
			if (oldval){ $(s).val("custom"); }
    	});
	}
}

function svgLaserNgcAddPasses(num){
    var rowCount = $('#svg-laser-ngc-passes tbody tr').length;
    var start = rowCount+1;
    var finish = rowCount + num;
    if (finish > 20){
        finish = 20;
        msgAlert("Reached maximum of 20 passes.");
    }

    for (i = start; i <= finish; i++){
        var row = $("<tr>");

        var col1 = $("<td>").append( $("<strong>").append(i) );

        var col2 = $("<td>");
        var colorselect = $("<input>").addClass("colorselect").attr("type", "text");
        $(colorselect).attr({ "svg-pass": i, "svg-setting": "stroke" });
        $(colorselect).attr("name", "svgStrokeColor["+i+"]")
        $(col2).append(colorselect);
        $(col2).append(colorselect);

        var col3 = $("<td>");
        var modes = $("<select>").addClass("form-control").attr("name", "mode["+i+"]");
        $(modes).attr({"svg-pass": i, "svg-setting": "mode"});
        $(modes).attr("name", "svgMode["+i+"]")
        $(modes).append( $("<option>").val("").text("") );
        $(modes).append( $("<option>").val("custom").text("CUSTOM") );

        var mat = $("#svg-laser-ngc-materials").val();
        $(modes).attr("disabled", true);
        $(col3).append(modes);

        var col4 = $("<td>");
        var feedrate = $("<input>").attr({ "type": "number", "step": 100, "min": 100, "max": 3000, "maxsize": 4 });
        $(feedrate).addClass("form-control");
        $(feedrate).attr({ "svg-pass": i, "svg-setting": "feedrate" });
        $(feedrate).attr("name", "svgFeedrate["+i+"]")
        $(feedrate).attr("disabled", true);
        $(col4).append(feedrate);

        var col5 = $("<td>");
        var power = $("<div>").addClass("input-group");
        var powernum = $("<input>", { "type": "number", "step": 1, "min": 1, "max": 100 }).addClass("form-control");
        $(powernum).attr({ "svg-pass": i, "svg-setting": "power" });
        $(powernum).attr("name", "svgPower["+i+"]")
        var powerlabel = $("<span>").addClass("input-group-addon").text("%");
        $(powernum).attr("disabled", true);
        $(power).append(powernum);
        $(power).append(powerlabel);
        $(col5).append(power);

        var col6 = $("<td>");
        var perf = $("<select>").addClass("form-control");
        $(perf).append( $("<option>").val(10000).text("SOLID") );
        $(perf).append( $("<option>").val(1000).text("PERFORATED") );
        $(perf).attr("disabled", true);
        $(perf).attr({ "svg-pass": i, "svg-setting": "perf" });
        $(perf).attr("name", "svgPulse["+i+"]")
        $(col6).append(perf);

        $(row).append(col1);
        $(row).append(col2);
        $(row).append(col3);
        $(row).append(col6);
        $(row).append(col4);
        $(row).append(col5);

        $('#svg-laser-ngc-passes tbody').append(row);
    }

	svgLaserNgcUpdateMats();

    $(".colorselect").spectrum({
        hideAfterPaletteSelect: true,
        preferredFormat: "hex",
        allowEmpty: true,
        showPaletteOnly: true,
        showPalette: true,
        palette: svgColors,
        change: function(c){
            var val = $(this).val();
            var pass = $(this).attr("svg-pass");
            if (val){
                $("[svg-pass="+pass+"]").enable();
            }else{
                $("[svg-setting=mode][svg-pass="+pass+"]").disable();
                $("[svg-setting=feedrate][svg-pass="+pass+"]").disable();
                $("[svg-setting=power][svg-pass="+pass+"]").disable();
                $("[svg-setting=perf][svg-pass="+pass+"]").disable();
            }
        },
    });
}

function svgLaserNgcPreviewLoaded(){
    svgColors = Array();
    raster = false;
    $('#svg-laser-ngc-preview').find("*").each(function(){
        var tag = $(this).prop("tagName").toLowerCase();
        var color = 'none';
        if (tag == "image"){
            raster = true;
        }else{
            color = $(this).css("stroke");
            if (color && color != 'none'){ color = rgb2hex(color); }
        }
        if (color && color != 'none'){
            if (svgColors.indexOf(color) < 0){
                svgColors.push(color);
            }
        }
    });

    svgLaserNgcClearPasses();
    svgLaserNgcAddPasses(3);
    if (raster){
        $('#svg-laser-ngc-raster-settings').show();
    }else{
        $('#svg-laser-ngc-raster-settings').hide();
    }
}

$('#svg-laser-ngc-btnMorePasses').click(function(){ svgLaserNgcAddPasses(3); });

$(document).on("change", "select[svg-setting=mode]", function(){
    var mat = $("#svg-laser-ngc-materials").val();
    var pass = $(this).attr("svg-pass");
    var mode = $(this).val();
    if (_CONFIG["laser"]["presets"] && _CONFIG["laser"]["presets"][mat] && _CONFIG["laser"]["presets"][mat][mode]){
        var f = _CONFIG["laser"]["presets"][mat][mode].f;
        var p = _CONFIG["laser"]["presets"][mat][mode].p;
        $("input[svg-setting=power][svg-pass="+pass+"]").val(p);
        $("input[svg-setting=feedrate][svg-pass="+pass+"]").val(f);
    }
});

$(document).on("input", "input[svg-setting=feedrate], input[svg-setting=power]", function(){
    var pass = $(this).attr("svg-pass");
    $("select[svg-setting=mode][svg-pass="+pass+"]").val("custom");
});

$('#svg-laser-ngc-btnCreate').click(function(){
    //$('#formUploader').val("svg-laser-ngc");
    $('#formFileUpload').submit();
    $('#modal-svg-laser-ngc').modal("hide");
});


$(function(){
    $("#svg-laser-ngc-materials").append( $("<option>").val("").text("CUSTOM MATERIAL") );
    $.each(_CONFIG["laser"]["presets"], function(k, p){
        $("#svg-laser-ngc-materials").append( $("<option>").val(k).text(k) );
    });
    $("#svg-laser-ngc-raster-dpi").val(_CONFIG["laser"]["raster"]["dpi"]["default"]);
    $("#svg-laser-ngc-raster-power").val(_CONFIG["laser"]["raster"]["power"]["default"]);
    $("#svg-laser-ngc-raster-feedrate").val(_CONFIG["laser"]["raster"]["feedrate"]["default"]);
    $(document).on("change","#svg-laser-ngc-materials", function(){ svgLaserNgcUpdateMats(); });
    $(document).on("aneris.upload.svg-laser-ngc", function(){
      var _URL = window.URL || window.webkitURL
      svgLaserNgcInit();
      $('#svg-laser-ngc-preview').load(_URL.createObjectURL(_FILE),svgLaserNgcPreviewLoaded);
      $('#modal-svg-laser-ngc').modal();
    });
});
