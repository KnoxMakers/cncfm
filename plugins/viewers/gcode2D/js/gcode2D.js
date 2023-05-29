class cncfmViewer_gcode2D {
    editor = null;
    config = null;

    cArcPenalty = 1.2;
    cLinePenalty = 1.0;
    cNewPenalty = 0.35;

    obj = null;
    svg = null;
    group = null;
    lastStroke = null;
    height = 0;
    width = 0;
    linenum = 0;
    distance = 0;
    timeEstimate = 0;
    current_path = "";
    last_stroke = "";

    X = 0;
    Y = 0;
    Z = 0;
    F = 0;
    S = 0;
    Q = 0;

    sDigital = false;
    sUnlocked = true;

    constructor(config) {
        this.config = config;
        this.height = config.height;
        this.width = config.width;
    }

    init = function () {
        this.obj = document.getElementById("gcode2D-svg");
        this.svg = SVG(this.obj).size("100%", "100%").panZoom({ zoomFactor: 0.25, zoomMin: 0.25, zoomMax: 20 });
        this.group = this.svg.group();

        var t = $("#gcode2D_code #codeEditor")[0];
        this.editor = CodeMirror.fromTextArea(t, {
            lineNumbers: true,
            //viewportMargin: Infinity,
            theme: "blackboard",
            mode: "gcode",
        });

        $(document).off("click", "#btngcode2DSave");
        $(document).on("click", "#btngcode2DSave", function () {
            $("#btngcode2DSave").removeClass("btn-info").removeClass("btn-danger").addClass("btn-warning");
            var data = cncfm.viewers.active.editor.getValue();
            var options = {
                user: cncfm.users.get_user(),
                location: cncfm.page.get(1),
                filename: cncfm.page.get(2),
                data: data,
            };
            cncfm.api.call("files/save", options, function (r) {
                if (r && r.status == 1) {
                    $("#btngcode2DSave").removeClass("btn-warning").addClass("btn-info");
                    cncfm.page.notify("Saved");
                } else {
                    $("#btngcode2DSave").removeClass("btn-warning").addClass("btn-danger");
                    cncfm.page.notify("Save Failed!");
                }
            });
        });

        $(document).off("click", ".gcode2D-viewbutton");
        $(document).on("click", ".gcode2D-viewbutton", function () {
            var v = $(this).attr("data-view");

            $(".gcode2D-viewbutton").removeClass("btn-primary").addClass("btn-outline-primary");
            $(".gcode2D_view").hide();

            $(".gcode2D-viewbutton[data-view=" + v + "]")
                .removeClass("btn-outline-primary")
                .addClass("btn-primary");
            $(".gcode2D_view[data-view=" + v + "]").show();
            if (v == "image") {
                setTimeout(cncfm.viewers.active.draw, 0);
                $("#btngcode2DSave").hide();
            } else {
                $("#btngcode2DSave").show();
                setTimeout(function () {
                    cncfm.viewers.active.editor.refresh();
                }, 0);
            }
        });
    };

    view = function (data) {
        this.editor.setValue(data);
        setTimeout(function () {
            cncfm.viewers.active.resize();
        }, 200);
    };

    resize = function () {
        //var w = $(document).width();
        var h = $(document).height();
        cncfm.viewers.active.editor.setSize(null, h - 200);
        cncfm.viewers.active.editor.refresh();

        //var w = h * (this.width / this.height);
        $("#gcode2D_image").height(h - 200);
        //this.svg.viewbox(0, 0, h - 100, $('#gcode2D_image').width());
        this.svg.viewbox(0, 0, this.width, this.height);
    };

    // LEGACY

    stroke = function (force = false) {
        var color = "#555";
        var width = this.config["stroke-width"]; //0.3;
        var power = 0;
        var shade = "00";
        var mpmin = this.config["power-min"];
        var mpmax = this.config["power-max"];

        //console.log("Z: " + this.Z + ", unlocked: " + this.sUnlocked + ", Q: " + this.Q);
        if (this.sUnlocked && this.config["s-power"] && this.S > 0){
            power = parseFloat(this.S);
            power = ((power - mpmin) / (mpmax - mpmin));
            shade = (parseInt(255 - (255 * power))).toString(16).padStart(2, "0");
            color = "#ff" + shade + shade;
        }else if (this.Z < 0.0 && this.Q > 0.0 && this.sUnlocked) {
            if (this.Q > 1.0) this.Q = 1.0;
            power = parseFloat(this.Q);
            power = ((power - mpmin) / (mpmax - mpmin));
            shade = (parseInt(255 - (255 * power))).toString(16).padStart(2, "0");
            color = "#ff" + shade + shade;
            //console.log("Q: " + this.Q + ", color: " + color);
        }
        var newStroke = { width: width, color: color };

        if (force || (this.lastStroke && newStroke.color != this.lastStroke.color)) {
            this.group.path(this.current_path).stroke(this.lastStroke).attr("fill", null).attr("fill-opacity", 0);
            this.current_path = "M" + this.X + " " + (this.height - this.Y) + " ";
        }
        this.lastStroke = newStroke;
    };

    showStats = function () {
        var h = 0;
        var m = 0;
        var s = parseInt(this.timeEstimate);
        if (s > 60) {
            m = parseInt(s / 60);
            s = s - m * 60;
        }
        if (m > 60) {
            h = parseInt(m / 60);
            m = m - h * 60;
        }
        var t = s + "s";
        if (m > 0) t = m + "m " + t;
        if (h > 0) t = h + "h " + t;
        var meters = Math.round(this.distance / 10) / 100;
        var status = meters + " meters &nbsp; | &nbsp; ~" + t;
        cncfm.viewers.active.status(status);
        //$("#gcode2D-view-time").html("~" + t);
        //$("#gcode2D-view-time").show();
        //$("#gcode2D-view-distance").html(
        //    Math.round(this.distance / 10) / 100 + " meters"
        //);
        //$("#gcode2D-view-distance").show();
    };

    arclen = function (d1, d2, r) {
        var angle;
        if (d1 > d2) {
            angle = d2 + (360 - d1);
        } else {
            angle = d2 - d1;
        }
        return (angle / 360) * 2 * Math.PI * r;
    };

    rad2deg = function (r) {
        var deg = r * (180 / Math.PI);
        deg = deg % 360;
        if (deg < 0) deg += 360;
        return deg;
    };

    rasterProcess = function (imgObj) {
        //console.log(imgObj, imgObj.width, imgObj.height);
        //var canvas = document.createElement('canvas');
        //var canvasContext = canvas.getContext('2d');

        //var imgW = imgObj.width;
        //var imgH = imgObj.height;
        //canvas.width = imgW;
        //canvas.height = imgH;

        //canvasContext.drawImage(imgObj, 0, 0);
        //var imgPixels = canvasContext.getImageData(0, 0, imgW, imgH);

        /*
          for(var y = 0; y < imgPixels.height; y++){
                for(var x = 0; x < imgPixels.width; x++){
                    var i = (y * 4) * imgPixels.width + x * 4;
                    var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
                    imgPixels.data[i] = 255 - avg;
                    imgPixels.data[i + 1] = 255 - avg;
                    imgPixels.data[i + 2] = 255 - avg;
                }
            }
            */
        //canvasContext.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
        //img = new Image()
        //img.src = canvas.toDataURL();

        return imgObj;
    };

    fOrI = function (x) {
        if (x.match(/\./)) {
            return parseFloat(x);
        }
        return parseInt(x);
    };

    parseParam = function (param) {
        var p = [];
        if (param && param.length > 1) {
            p[0] = param[0];
            p[1] = this.fOrI(param.substr(1));
        }
        return p;
    };

    parseLine = function (line) {
        var command = null;
        var params = { raw: line };
        var start = 0;

        var l = line.split(/[a-z]| +/);
        var c = l[0][0];
        if (c){ //l[0][0] == "G" || l[0][0] == "M" || l[0][0] == "O") {
            start = 0;
            command = l[0];
        }
        for (var i = start; i < l.length; i++) {
            var r = this.parseParam(l[i]);
            if (r && r.length > 1) {
                params[r[0]] = r[1];
            }
        }
        return { command: command, params: params };
    };

    parseCommand = function (command, params) {
        this.stroke();

        if ("F" in params) {
            this.F = params["F"];
        }

        if ("S" in params) {
            this.S = params["S"];
        }

        var c = command[0] + parseInt(command.substr(1));
        switch (c) {
            case "M2":
            case "M5":
                this.sUnlocked = false;
                break;

            case "M3":
                this.sUnlocked = true;
                break;

            case "M65":
            case "M64":
                if (params["P"] == 0) {
                    this.sDigital = false;
                }
                break;

            case "M63":
            case "M62":
                if (params["P"] == 0) {
                    this.sDigital = true;
                }
                break;

            case "M68":
                if (params["E"] == 0) {
                    this.Q = params["Q"];
                }
                break;

            case "G0":
            case "G1":
                // linear
                var newX = this.X;
                var newY = this.Y;
                var newLoc = false;
                if ("X" in params) {
                    newLoc = true;
                    newX = params["X"];
                }
                if ("Y" in params) {
                    newLoc = true;
                    newY = params["Y"];
                }
                if ("Z" in params) {
                    this.Z = params["Z"];
                }
                if (newLoc) {
                    var d = Math.sqrt(Math.pow(newX - this.X, 2) + Math.pow(newY - this.Y, 2));
                    this.distance += d;
                    this.timeEstimate += (d / (this.F / 60)) * this.cLinePenalty;
                    //console.log("Line: " + this.X, this.Y, newX, newY);
                    //this.group.line(this.X, (this.height - this.Y), newX, (this.height - newY)).stroke({width: 1, color: "#fff"});
                    if (this.X != newX || this.Y != newY) {
                        this.current_path += " M" + this.X + " " + (this.height - this.Y);
                    }
                    this.current_path += " L" + newX + " " + (this.height - newY);
                    //this.stroke(true);
                    this.X = newX;
                    this.Y = newY;
                }
                break;

            case "G2":
                // clockwise arc
                var pX = params["X"] || 0;
                var pY = params["Y"] || 0;
                var pI = params["I"] || 0;
                var pJ = params["J"] || 0;
                var x1 = this.X;
                var y1 = this.Y;
                var cX = x1 + pI;
                var cY = y1 + pJ;
                var r = Math.sqrt(Math.pow(cX - x1, 2) + Math.pow(cY - y1, 2));
                var rad1 = Math.atan2(this.height - y1 - (this.height - cY), x1 - cX);
                var rad2 = Math.atan2(this.height - pY - (this.height - cY), pX - cX);
                var deg1 = this.rad2deg(rad1);
                var deg2 = this.rad2deg(rad2);
                var d = this.arclen(deg1, deg2, r);
                this.distance += d;
                this.timeEstimate += (d / (this.F / 60)) * this.cArcPenalty;
                var p = "";
                if (this.X != pX || this.Y != pY) p += " M" + this.X + " " + (this.height - this.Y);
                p += " A" + r + " " + r + " 0 0 1 " + pX + " " + (this.height - pY);
                //this.group.path(p).stroke(this.stroke());
                this.current_path += p;
                this.X = pX;
                this.Y = pY;
                break;

            case "G3":
                // counterclockwise arc
                var pX = params["X"] || 0;
                var pY = params["Y"] || 0;
                var pI = params["I"] || 0;
                var pJ = params["J"] || 0;
                var x1 = this.X;
                var y1 = this.Y;
                var cX = x1 + pI;
                var cY = y1 + pJ;
                var r = Math.sqrt(Math.pow(cX - x1, 2) + Math.pow(cY - y1, 2));
                var rad1 = Math.atan2(this.height - y1 - (this.height - cY), x1 - cX);
                var rad2 = Math.atan2(this.height - pY - (this.height - cY), pX - cX);
                var deg1 = this.rad2deg(rad1);
                var deg2 = this.rad2deg(rad2);
                var d = this.arclen(deg2, deg1, r);
                this.distance += d;
                this.timeEstimate += (d / (this.F / 60)) * this.cArcPenalty;

                //var largeArcFlag = (deg2 - deg1) <= 180 ? "0" : "1";
                //console.log(deg2, deg1, largeArcFlag);
                var p = "";
                if (this.X != pX || this.Y != pY) " M" + this.X + " " + (this.height - this.Y);
                p += " A" + r + " " + r + " 0 0 0 " + pX + " " + (this.height - pY);
                //this.group.path(p).stroke(this.stroke());
                this.current_path += p;
                this.X = pX;
                this.Y = pY;
                break;

            case "O145":
                // BJJ Raster Image
                var ps = params["raw"].split(/ +/);
                var i;
                for (i = 0; i < ps.length; i++) {
                    ps[i] = ps[i].replace(/[^\d.-]/g, "");
                }
                var imgi = parseInt(ps[2]);
                var imgx = parseFloat(ps[3]);
                var imgy = parseFloat(ps[4]);
                var imgw = parseFloat(ps[5]);
                var imgh = parseFloat(ps[6]);
                var imgxscangap = parseFloat(ps[7]);
                var imgyscangap = parseFloat(ps[8]);
                var imgoverscan = parseInt(ps[9]);
                var d = (imgw + imgoverscan) * (imgh / imgyscangap);
                this.distance += d;
                this.timeEstimate += d / (this.F / 60) + this.cNewPenalty * (imgh / imgyscangap);
                var image = new Image();
                image.onload = function () {
                    var canvas = document.createElement("canvas");
                    canvas.width = this.naturalWidth;
                    canvas.height = this.naturalHeight;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(this, 0, 0);
                    var imgPixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    for (var y = 0; y < imgPixels.height; y++) {
                        for (var x = 0; x < imgPixels.width; x++) {
                            var i = y * 4 * imgPixels.width + x * 4;
                            var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
                            imgPixels.data[i] = 255 - avg;
                            imgPixels.data[i + 1] = 255 - avg;
                            imgPixels.data[i + 2] = 255 - avg;
                        }
                    }
                    ctx.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
                    var me = cncfm.viewers.active;
                    me.group
                        .image(canvas.toDataURL("image/png"))
                        .size(imgw, imgh)
                        .attr({ x: imgx, y: me.height - imgy });
                };
                image.src = cncfm.api.apiUrl + "/plugins/api?path=viewer/gcode2D/getBjjImage&id=" + imgi;
                //console.log(img);
                break;
        }
    };

    drawLine = function (line) {
        line = line.replace(/\(.*?\)/g, "");
        var p = this.parseLine(line);

        if ("Z" in p["params"]) {
            this.Z = p["params"]["Z"];
        }
        if ("F" in p["params"]) {
            this.F = p["params"]["F"];
        }

        if (p["command"]) {
            this.parseCommand(p["command"], p["params"]);
        }
    };

    size = function () {
        /*
            var h = $(document).height() - 200;
            var w = h * (this.width / this.height);
            $('#gcode2D_image').height(h);
            this.svg.viewbox(0, 0, h, $('#gcode2D_image').width());
            */
        this.resize();
    };

    status = function (status) {
        $("#gcode2DStatus").html(status);
    };

    draw = function () {
        var me = cncfm.viewers.active;
        me.current_path = "M0 0 ";
        me.group.clear();
        me.stroke();
        var h = me.height + 1;
        var w = me.width + 1;
        me.group
            .path("M-1 -1 L" + w + " -1 L" + w + " " + h + " L-1 " + h + " L-1 -1z")
            .stroke({ width: 1, color: "#fff", dasharray: "2,2" })
            .attr("fill", null);
        me.distance = 0;
        me.timeEstimate = 0;
        me.linenum = 0;
        me.size();
        me.X = 0;
        me.Y = 0;
        var gcode = me.editor.getValue();
        var lines = gcode.split("\n");
        var chunk = 10000;
        for (var ichunk = 0; ichunk * chunk < lines.length; ichunk++) {
            setTimeout(function () {
                for (var i = 0; i < chunk && me.linenum < lines.length; i++) {
                    //console.log(me.linenum);
                    var line = lines[me.linenum];
                    if (line) {
                        me.drawLine(line);
                    }
                    me.linenum += 1;
                }
                var pct = ((me.linenum / lines.length) * 100.0).toFixed(2);
                me.stroke(true);
                me.status("Drawing: " + pct + "%");
            }, 0);
        }
        me.stroke(true);
        var d = parseInt(me.distance) / 1000;
        setTimeout(function () {
            me.showStats();
        }, 0);
        var vy = me.height - (me.height - $("#gcode2D_image").height());
        var vx = me.width - $("#gcode2D_image").width();

        //this.svg.zoom(1);
        me.svg.viewbox(0, 0, me.width, me.height);
        $(document).trigger("gcode2D-draw");
    };
}
