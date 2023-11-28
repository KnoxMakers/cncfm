// cncfm.uploaders.active

class cncfmUploader_svg2laser {
  config = null;
  svgColors = [];
  svgImages = {};
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
    $(document).off("change", "#svg2laser-raster-method");
    $(document).off("change", "#svg2laser .raster-image-preview-setting");
    $(document).off("mouseover", "#svg2laser .raster-image-preview-row");
    $(document).off("mouseout", "#svg2laser .raster-image-preview-row");
    $(document).off("change", "#svg2laser #svg2laser-raster-dpi");
    $(document).off("input", "#svg2laser .raster-image-preview-setting");

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
    $(document).on(
      "change",
      "#svg2laser-raster-method",
      this.onRasterModeChange
    );
    $(document).on(
      "input",
      "#svg2laser .raster-image-preview-setting",
      this.onRasterImagePreviewSettingSlide
    );
    $(document).on(
      "change",
      "#svg2laser .raster-image-preview-setting",
      this.onRasterImagePreviewSetting
    );
    $(document).on(
      "mouseover",
      "#svg2laser .raster-image-preview-row",
      this.onRasterImagePreviewMouseOver
    );
    $(document).on(
      "mouseout",
      "#svg2laser .raster-image-preview-row",
      this.onRasterImagePreviewMouseOut
    );

    $(document).on("change", "#svg2laser #svg2laser-raster-dpi", function () {
      $(
        "#svg2laser .raster-image-preview-setting[raster-field='resample']:checked"
      ).each(function () {
        $(this).trigger("change");
      });
    });
  }

  activate = function (f) {
    var reader = new FileReader();

    reader.addEventListener("load", function () {
      $("#svg2laser-original-svg").remove();
      var svg = $(reader.result).attr("id", "svg2laser-original-svg");
      $("#svg2laser").append(svg);
      $("#svg2laser #svg-container").append(reader.result);
      cncfm.uploaders.active.readSvg();
      cncfm.uploaders.active.updatePalette();
    });

    reader.readAsText(f);
    this.init();

    cncfm.uploaders.active.onRasterModeChange();

    return true;
  };

  upload = function () {
    let options = cncfm.uploaders.active.getOptions();

    var svg = $("#svg2laser #svg-container").html();
    var blob = new Blob([svg], { type: "image/svg+xml" });
    var fname = cncfm.uploaders.f.name;
    var f = new File([blob], fname, { type: "image/svg+xml" });
    cncfm.uploaders.f = f;

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

    //console.log(me.config.raster);

    if (!me.config.raster.bjj) {
      var rbjj = $("#svg2laser-raster-method option[value='bjj']");
      $(rbjj).remove();
    }

    if (me.config.raster.dpiDefault) {
      $("#svg2laser-raster-dpi").val(me.config.raster.dpiDefault);
    }

    if (me.config.raster.thresholdDefault) {
      $("#svg2laser-raster-threshold").val(me.config.raster.thresholdDefault);
    }

    if (me.config.raster.powerMinDefault) {
      $("#svg2laser-raster-minpower").val(me.config.raster.powerMinDefault);
    }

    if (me.config.raster.powerMaxDefault) {
      $("#svg2laser-raster-maxpower").val(me.config.raster.powerMaxDefault);
    }

    if (me.config.raster.feedrateDefault) {
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

  onRasterModeChange = function () {
    var mode = $("#svg2laser-raster-method").val();
    $("#svg2laser-raster-minpower-row").hide();
    if (mode == "bjj") {
      $("#svg2laser-raster-maxpower-label").html("POWER");
    } else if (mode == "gcode") {
      $("#svg2laser-raster-maxpower-label").html("MAXIMUM POWER");
      $("#svg2laser-raster-minpower-row").show();
    }
  };

  onRasterImagePreviewMouseOver = function () {
    var svgid = $(this).attr("svgid");
    $("#svg2laser #svg-container image[id=" + svgid + "]").addClass("show");
  };

  onRasterImagePreviewMouseOut = function () {
    var svgid = $(this).attr("svgid");
    $("#svg2laser #svg-container image[id=" + svgid + "]").removeClass("show");
  };

  onRasterImagePreviewSettingSlide = function () {
    var field = $(this).attr("raster-field");
    var svgid = $(this).attr("svgid");
    var fieldsel = "[raster-field=" + field + "]";
    var val = $(this).val();
    var labelsel = ".raster-image-preview-setting-label[svgid=" + svgid + "]";
    var fields = [
      "dither",
      "brightness",
      "gamma",
      "contrast",
      "unsharp_radius",
      "unsharp_percent",
      "threshold",
    ];
    //console.log(field, val), labelsel + ;
    if (fields.includes(field)) {
      $(labelsel + fieldsel).html(" = " + val);
    }
  };

  onRasterImagePreviewSetting = function () {
    var svgid = $(this).attr("svgid");
    var rowsel = ".raster-image-preview-row[svgid=" + svgid + "]";
    var sel = ".raster-image-preview-setting[svgid=" + svgid + "]";
    var imgsel = "#svg2laser img.raster-image-preview[svgid=" + svgid + "]";
    var labelsel = ".raster-image-preview-setting-label[svgid=" + svgid + "]";

    $(rowsel + " .manual-settings").hide();
    var presetval = $(sel + "[raster-field=preset").val();
    var invertval = $(sel + "[raster-field=invert]").is(":checked") ? 1 : 0;
    var resampleval = $(sel + "[raster-field=resample]").is(":checked") ? 1 : 0;
    var removebgval = $(sel + "[raster-field=removebg]").is(":checked") ? 1 : 0;

    var data = {
      svgid: svgid,
      preset: presetval,
      invert: invertval,
      resample: resampleval,
      removebg: removebgval,
      dpi: $("#svg2laser-raster-dpi").val(),
      settings: {},
      img: $(imgsel).attr("orig"),
      width: $(imgsel).attr("svgw"),
      height: $(imgsel).attr("svgh"),
    };

    if (presetval == "manual") {
      $(rowsel + " .manual-settings").show();
      var fields = [
        "dither",
        "brightness",
        "gamma",
        "contrast",
        "unsharp_radius",
        "unsharp_percent",
        "threshold",
      ];
      $.each(fields, function (key, field) {
        var fieldsel = "[raster-field=" + field + "]";
        var fieldval = $(sel + fieldsel).val();
        $(labelsel + fieldsel).html(" = " + fieldval);
        data["settings"][field] = fieldval;
      });
    }

    $(rowsel).addClass("overlay");
    cncfm.api.call("image/rasterPrepare", data, function (data) {
      var svgid = data.svgid;
      var svgsel = "#svg2laser #svg-container image[id=" + svgid + "]";
      var rowsel = ".raster-image-preview-row[svgid=" + svgid + "]";
      var sel = "#svg2laser img.raster-image-preview[svgid=" + svgid + "]";
      $(svgsel).attr("xlink:href", data.img);
      $(sel).attr("src", data.img);
      $(rowsel).removeClass("overlay");
    });
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

  loadRasterImageTable() {
    function makeSpacer() {
      var tr = $("<tr>");
      var td = $("<td>");
      $(td).append($("<hr>"));
      $(tr).append(td);
      return tr;
    }

    function makeSelect(svgid, id, name, options) {
      var tr = $("<tr>");
      var td = $("<td>");

      var label = $("<label for='' class='form-label'>" + name + "</label>");
      var input = $("<select>").addClass("form-select");
      $(input).addClass("raster-image-preview-setting");
      $(input).attr("raster-field", id).attr("svgid", svgid);
      $.each(options, function (key, val) {
        $(input).append($("<option>", { value: key, text: val }));
      });
      //$(td).append(label);
      $(td).append(input);
      $(tr).append(td);
      return tr;
    }

    function makeRange(svgid, id, name, min, max, step, val) {
      var tr = $("<tr>");
      var td = $("<td>");

      var label = $("<label for='' class='form-label'>" + name + "</label>");
      var labelval = $("<span>").addClass("raster-image-preview-setting-label");
      $(labelval).attr("raster-field", id).attr("svgid", svgid);
      $(labelval).html(" = " + val);
      $(label).append(labelval);

      var input = $("<input type='range'>").addClass("form-range");
      $(input).addClass("raster-image-preview-setting");
      $(input).attr("raster-field", id).attr("svgid", svgid);
      $(input).attr("min", min).attr("max", max).attr("step", step).val(val);
      $(td).append(label);
      $(td).append(input);
      $(tr).append(td);
      return tr;
    }

    function makeSwitch(svgid, id, name) {
      var tr = $("<tr>");
      var td = $("<td>");
      var div = $("<div>").addClass("form-check form-switch");
      var label = $("<label for='' class='form-label'>" + name + "</label>");
      var input = $("<input type='checkbox'>").addClass("form-check-input");
      $(input).addClass("raster-image-preview-setting");
      $(input).attr("role", "switch");
      $(input).attr("raster-field", id).attr("svgid", svgid);
      $(div).append(input);
      $(div).append(label);
      $(td).append(div);
      $(tr).append(td);
      return tr;
    }

    $.each(this.svgImages, function (id, img) {
      var tr = $("<tr>").addClass("raster-image-preview-row").attr("svgid", id);

      var td1 = $("<td>").addClass("raster-image-preview");

      var imgtag = $("<img>")
        .attr("src", img.uri)
        .attr("orig", img.uri)
        .attr("svgx", img.x)
        .attr("svgy", img.y)
        .attr("svgw", img.width)
        .attr("svgh", img.height)
        .attr("svgid", id)
        .addClass("raster-image-preview");

      $(td1).append(imgtag);
      $(tr).append(td1);

      var td2 = $("<td>").addClass("raster-image-preview-settings");
      var td2table = $("<table width='100%'>");
      var manualtable = $("<table width='100%'>")
        .addClass("manual-settings")
        .hide();

      $(td2table).append(makeSwitch(id, "invert", "Invert"));
      $(td2table).append(makeSwitch(id, "resample", "Resample"));
      //$(td2table).append(makeSwitch(id, "removebg", "Remove Background"));

      var options = {
        "": "Raw",
        manual: "Manual Settings",
        gold: "Preset: Gold",
        stipo: "Preset: Stipo",
        gravy: "Preset: Gravy",
        xin: "Preset: Xin",
        newsy: "Preset: Newsy",
      };
      $(td2table).append(makeSelect(id, "preset", "", options));

      var options = {
        "": "No Dither",
        "floyd-steinberg": "Dither: Floyd-Steinberg",
        atkinson: "Dither: Atkinson",
        stucki: "Dither: Stucki",
        "jarvis-judice-ninke": "Dither: Jarvis-Judice-Ninke",
        burkes: "Dither: Burkes",
        sierra3: "Dither: Sierra3",
        sierra2: "Dither: Sierra2",
      };
      $(manualtable).append(makeSelect(id, "dither", "", options));

      //$(manualtable).append(makeSpacer());

      $(manualtable).append(
        makeRange(id, "contrast", "Contrast", 0, 5, 0.05, 1)
      );
      $(manualtable).append(
        makeRange(id, "brightness", "Brightness", 0, 5, 0.05, 1)
      );
      $(manualtable).append(makeRange(id, "gamma", "Gamma", 0, 5, 0.05, 1));
      $(manualtable).append(
        makeRange(id, "unsharp_radius", "Sharpen (r)", 0, 50, 1, 0)
      );
      $(manualtable).append(
        makeRange(id, "unsharp_percent", "Sharpen (%)", 0, 1000, 25, 0)
      );
      $(manualtable).append(
        makeRange(id, "threshold", "Threshold", 0, 255, 1, 0)
      );

      $(td2).append(td2table);
      $(td2).append(manualtable);
      $(tr).append(td2);

      $("#raster-image-table").append(tr);
    });
  }

  readSvg = function () {
    var raster = false;
    var svgColors = [];
    var svgImages = {};
    var svgRect = $("#svg2laser-original-svg")[0].getBoundingClientRect();

    $("#svg2laser #svg-container svg")
      .find("*")
      .each(function () {
        var tag = $(this).prop("tagName").toLowerCase();
        var color = "none";
        if (tag == "image") {
          raster = true;
          var id = $(this).prop("id");
          var uri = $(this).attr("xlink:href");
          var imgRect = $(
            "#svg2laser-original-svg #" + id
          )[0].getBoundingClientRect();
          svgImages[id] = {
            uri: uri,
            x: Math.round(imgRect.left - svgRect.left),
            y: Math.round(imgRect.top - svgRect.top),
            width: Math.round(imgRect.width),
            height: Math.round(imgRect.height),
          };
        } else {
          color = $(this).css("stroke");
          if (!color.startsWith("rgb")) color = "none";
          //if (color && color != 'none') { color = rgb2hex(color); }
        }
        if (color && color != "none") {
          if (svgColors.indexOf(color) < 0) {
            svgColors.push(color);
          }
        }
      });

    this.svgColors = svgColors;
    this.svgImages = svgImages;
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
      this.loadRasterImageTable();
      $("#svg2laser #raster-settings").show();
    } else {
      $("#svg2laser #raster-settings").hide();
      $("#svg2laser #raster-none").show();
    }
    processSVG();
  };
}
