// cncfm.uploaders.active

class cncfmUploader_svg2laser {
  config = null;
  svgColors = [];
  raster = false;

  constructor(config = null) {
    this.config = config;
    $(document).off("change", "#svg2laser #presets");
    $(document).off("change.spectrum", "#svg2laser .colorpicker");
    $(document).off("change", "#svg2laser .pass-setting[data-setting=mode]");
    $(document).off(
      "change",
      "#svg2laser .pass-setting[data-setting=feedrate]"
    );
    $(document).off("change", "#svg2laser .pass-setting[data-setting=power]");
    $(document).off("click", "#btnsvg2laser_morepasses");

    $(document).on("change", "#svg2laser #presets", this.onPresetChange);
    $(document).on(
      "change.spectrum",
      "#svg2laser .colorpicker",
      this.onColorChange
    );
    $(document).on(
      "change",
      "#svg2laser .pass-setting[data-setting=mode]",
      this.onModeChange
    );
    $(document).on(
      "change",
      "#svg2laser .pass-setting[data-setting=feedrate]",
      this.onFeedrateChange
    );
    $(document).on(
      "change",
      "#svg2laser .pass-setting[data-setting=power]",
      this.onPowerChange
    );
    $(document).on("click", "#btnsvg2laser_morepasses", this.addPass);
  }

  activate = function (f) {
    var reader = new FileReader();

    reader.addEventListener("load", function () {
      $("#svg2laser #svg-container").append(reader.result);
      cncfm.uploaders.active.readSvg();
      cncfm.uploaders.active.updatePalette();
    });

    reader.readAsText(f);
    this.init();
    return true;
  };

  upload = function () {
    let options = cncfm.uploaders.active.getOptions();
    cncfm.uploaders.upload(options);
  };

  getOptions = function () {
    var options = {};

    options["has_raster"] = 0;
    if (this.raster) {
      options["has_raster"] = 1;
      options["raster"] = {
        enable: $("#svg2laser-raster-enable").val(),
        method: $("#svg2laser-raster-method").val(),
        algorithm: $("#svg2laser-raster-algorithm").val(),
        dpi: $("#svg2laser-raster-dpi").val(),
        threshold: $("#svg2laser-raster-threshold").val(),
        minpower: $("#svg2laser-raster-minpower").val(),
        maxpower: $("#svg2laser-raster-maxpower").val(),
        feedrate: $("#svg2laser-raster-speed").val(),
      };
    }

    options["has_vector"] = 0;
    options["passes"] = [];
    $("#svg2laser tr.pass-settings").each(function (k) {
      var color = $(this).find(".pass-setting[data-setting=color]").val();
      var feedrate = $(this).find(".pass-setting[data-setting=feedrate]").val();
      var power = $(this).find(".pass-setting[data-setting=power]").val();
      if (color && feedrate && power) {
        options["passes"].push({
          color: color,
          feedrate: feedrate,
          power: power,
        });
      }
    });
    if (options["passes"].length > 0) {
      options["has_vector"] = 1;
    }
    return options;
  };

  init = function () {
    var me = cncfm.uploaders.active;

    var mat = cncfm.get("material");
    
    var p = $("#svg2laser #presets");
    $(p).find("option").remove();
    $(p).append("<option value=''>CHOOSE MATERIAL</option>").val("");
    if (this.config && this.config.presets) {
      $.each(this.config.presets, function (mat, values) {
        $(p).append("<option value='" + mat + "'>" + mat + "</option>");
      });
    }
    if (mat) $(p).val(mat);
    this.addPass();
    this.addPass();
    this.addPass();

    console.log(me.config.raster);

    if (!me.config.raster.bjj){
      var rbjj = $("#svg2laser-raster-method option[value='bjj']");
      $(rbjj).remove();
    }

    if (me.config.raster.dpiDefault){
      $("#svg2laser-raster-dpi").val(me.config.raster.dpiDefault);
    }

    if (me.config.raster.thresholdDefault){
      $("#svg2laser-raster-threshold").val(me.config.raster.thresholdDefault);
    }

    if (me.config.raster.powerMinDefault){
      $("#svg2laser-raster-minpower").val(me.config.raster.powerMinDefault);
    }

    console.log(me.config.raster.powerMaxDefault);
    if (me.config.raster.powerMaxDefault){
      console.log("yes");
      $("#svg2laser-raster-maxpower").val(me.config.raster.powerMaxDefault);
    }

    if (me.config.raster.feedrateDefault){
      $("#svg2laser-raster-speed").val(me.config.raster.feedrateDefault);
    }

  };

  getPresetSelect = function () {
    var mat = $("#svg2laser #presets").val();
    var config = this.config;

    var s = $("<select>")
      .addClass("form-control pass-setting")
      .attr("data-setting", "mode");
    $(s).append("<option val='CUSTOM'>CUSTOM</option>");

    if (mat && config && config.presets && config.presets[mat]) {
      $.each(config.presets[mat], function (p, vals) {
        $(s).append("<option val='" + p + "'>" + p + "</option>");
      });
    }
    return s;
  };

  onPresetChange = function () {
    cncfm.set("material", $("#svg2laser #presets").val());
    $("#svg2laser select[data-setting=mode]").each(function (i) {
      var s = cncfm.uploaders.active.getPresetSelect();
      var val = $(this).val();
      var d = $(this).prop("disabled");
      $(s).prop("disabled", d);
      $(this).replaceWith(s);
    });
  };

  onModeChange = function () {
    var val = $(this).val();
    var tr = $(this).closest("tr");
    var mat = $("#svg2laser #presets").val();
    var config = cncfm.uploaders.active.config;

    if (
      mat &&
      config &&
      config.presets &&
      config.presets[mat] &&
      config.presets[mat][val]
    ) {
      var f = config.presets[mat][val]["f"];
      var p = config.presets[mat][val]["p"];
      $(tr).find("input[data-setting=feedrate]").val(f);
      $(tr).find("input[data-setting=power]").val(p);
    }
  };

  onFeedrateChange = function () {
    var tr = $(this).closest("tr");
    $(tr).find("select[data-setting=mode]").val("CUSTOM");
  };

  onPowerChange = function () {
    var tr = $(this).closest("tr");
    $(tr).find("select[data-setting=mode]").val("CUSTOM");
  };

  onColorChange = function () {
    var val = $(this).val();
    var tr = $(this).closest("tr");
    if (val) {
      $(tr).find(".pass-setting").prop("disabled", false);
    } else {
      $(tr).find(".pass-setting").prop("disabled", true);
    }
  };

  addPass = function () {
    var i = $("#passes tbody tr").length + 1;
    var tr = $("<tr>").addClass("pass-settings").attr("data-pass", i);

    var td1 = $("<td>").css("text-align", "center").html(i);

    var td2 = $("<td>").css("text-align", "center");
    var c = $("<input type='text'>")
      .addClass("pass-setting colorpicker")
      .attr("data-setting", "color");
    $(td2).append(c);

    var td3 = $("<td>");
    var ps = cncfm.uploaders.active
      .getPresetSelect()
      .attr("disabled", "disabled");
    $(td3).append(ps);

    var td4 = $("<td>");
    var ifeed = $(
      "<input type='number' step='100' min='100' maxsize='5' class='form-control pass-setting' data-setting='feedrate' disabled='disabled'>"
    );
    $(td4).append(ifeed);

    var td5 = $("<td>");
    var ipwrgroup = $("<div class='input-group'>");
    var ipwr = $(
      "<input class='form-control pass-setting' type='number' step=1 min=1 max=100 data-setting='power' disabled='disabled'>"
    );
    var ipwraddon = $("<span class='input-group-text'>%</span>");
    $(ipwrgroup).append(ipwr).append(ipwraddon);
    $(td5).append(ipwrgroup);

    $(tr).append(td1);
    $(tr).append(td2);
    $(tr).append(td3);
    $(tr).append(td4);
    $(tr).append(td5);

    $("#passes tbody").append(tr);

    cncfm.uploaders.active.updatePalette();
  };

  updatePalette() {
    $("#svg2laser .colorpicker").spectrum({
      showPaletteOnly: true,
      showPalette: true,
      palette: cncfm.uploaders.active.svgColors,
      preferredFormat: "hex",
      allowEmpty: true,
      hideAfterPaletteSelect: true,
    });
  }

  readSvg = function () {
    var raster = false;
    var svgColors = [];

    $("#svg2laser #svg-container svg")
      .find("*")
      .each(function () {
        var tag = $(this).prop("tagName").toLowerCase();
        var color = "none";
        if (tag == "image") {
          raster = true;
        } else {
          color = $(this).css("stroke");
          if (!color.startsWith("rgb")) color = "none";
          //if (color && color != 'none') { color = rgb2hex(color); }
        }
        if (color && color != "none") {
          //console.log(color, svgColors);
          if (svgColors.indexOf(color) < 0) {
            svgColors.push(color);
          }
        }
      });

    this.svgColors = svgColors;
    this.raster = raster;

    $("#svg2laser #vector-reading").hide();
    if (svgColors.length > 0) {
      $("#svg2laser #pass-settings").show();
    } else {
      $("#svg2laser #pass-settings").hide();
      $("#svg2laser #vector-none").show();
    }
    $("#svg2laser #raster-reading").hide();
    if (raster) {
      $("#svg2laser #raster-settings").show();
    } else {
      $("#svg2laser #raster-settings").hide();
      $("#svg2laser #raster-none").show();
    }
  };
}
