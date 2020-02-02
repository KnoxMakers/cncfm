var cArcPenalty = 1.2;
var cLinePenalty = 1.0
var cNewPenalty = 0.35;

laserNgcGcodeViewer = function(objid, height, width){
    this.obj = document.getElementById(objid);
    this.svg = SVG(this.obj).size("100%", "100%").panZoom({zoomFactor: 0.25, zoomMin: 0.25, zoomMax: 20});
    this.group = this.svg.group();
    this.lastStroke = null;
    this.height = height;
    this.width = width;
    this.linenum = 0;
    this.distance = 0;
    this.timeEstimate = 0;
    this.current_path = "";
    this.last_stroke = "";

    this.X = 0;
    this.Y = 0;
    this.Z = 0;
    this.F = 0;
    this.S = 0;
    this.Q = 0;

    this.sDigital = false;
    this.sUnlocked = true;

    this.stroke = function(force = false){
        color = "#555";
        width = 0.5;
        if (this.Z < 0.0 && this.Q > 0.0 && this.sDigital && this.sUnlocked){
          color = "#e4001b";
          if (this.Q < 0.4){ color = "#18bef0"; }
        }
        var newStroke = { width: width, color: color }

        if (force || (this.lastStroke && (newStroke.color != this.lastStroke.color))){
            this.group.path(this.current_path).stroke(this.lastStroke)
            this.current_path = "M"+this.X+" "+(this.height-this.Y)+" ";
        }
        this.lastStroke = newStroke;
    }

    this.showStats = function(){
        var h = 0;
        var m = 0;
        var s = parseInt(this.timeEstimate);
        if (s > 60){
            m = parseInt(s/60);
            s = s - (m*60);
        }
        if (m > 60){
            h = parseInt(m/60);
            m = m - (h*60);
        }
        var t = s + "s";
        if (m > 0) t = m + "m " + t;
        if (h > 0) t = h + "h " + t;
        $("#laser-ngc-view-time").html("~" + t);
        $("#laser-ngc-view-time").show();
        $("#laser-ngc-view-distance").html(Math.round(this.distance/10)/100 + " meters");
        $("#laser-ngc-view-distance").show();
    }

    this.arclen = function(d1, d2, r){
        var angle;
        if (d1 > d2){
            angle = d2 + (360 - d1);
        }else{
            angle = d2 - d1;
        }
        return (angle/360) * 2 * Math.PI * r;
    }

    this.rad2deg = function(r){
        var deg = r * (180/Math.PI);
        deg = deg % 360;
        if (deg < 0) deg += 360;
        return deg;
    }

    this.rasterProcess = function(imgObj) {
	    console.log(imgObj, imgObj.width, imgObj.height);
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
	}

    this.fOrI = function(x){
        if (x.match(/\./)){
            return parseFloat(x);
        }
        return parseInt(x);
    }

    this.parseParam = function(param){
        var p = [];
        if (param && param.length>1){
            p[0] = param[0];
            p[1] = this.fOrI(param.substr(1));
        }
        return p;
    }

    this.parseLine = function(line){
        var command = null;
        var params = { "raw": line };
        var start = 0;

        var l = line.split(/ +/);
        if (l[0][0] == "G" || l[0][0] == "M" || l[0][0] == "O"){
            start = 1;
            command = l[0];
            if (command == "G53"){
                start = 2
                command = l[1];
            }
        }
        for (var i=start; i<l.length; i++){
            var r = this.parseParam(l[i]);
            if (r && r.length > 1){
                params[r[0]] = r[1];
            }
        }

        return { "command": command, "params": params }
    }

    this.parseCommand = function(command, params){
        this.stroke();
        var c = command[0] + parseInt(command.substr(1));
        switch (c){
            case "M2":
            case "M5":
                this.sUnlocked = false;
                break;

            case "M3":
                this.sUnlocked = true;
                break;

            case "M65":
            case "M64":
                if (params["P"] == 0){ this.sDigital = false; }
                break;

            case "M63":
            case "M62":
                if (params["P"] == 0){ this.sDigital = true; }
                break;

            case "M68":
                if (params["E"] == 0){
                  this.Q = params["Q"];
                }
                break;

            case "G0":
            case "G1":
                // linear
                var newX = this.X;
                var newY = this.Y;
                var newLoc = false;
                if ("X" in params){ newLoc = true; newX = params["X"]; }
                if ("Y" in params){ newLoc = true; newY = params["Y"]; }
                if ("Z" in params){ this.Z = params["Z"]; }
                if ("F" in params){ this.F = params["F"]; }
                if (newLoc){
                    var d = Math.sqrt( Math.pow((newX - this.X), 2) + Math.pow((newY - this.Y), 2) );
                    this.distance += d;
                    this.timeEstimate += (d / (this.F / 60)) * cLinePenalty;
                    //console.log("Line: " + this.X, this.Y, newX, newY);
                    //this.group.line(this.X, (this.height - this.Y), newX, (this.height - newY)).stroke({width: 1, color: "#fff"});
                    this.current_path += " M"+this.X+" "+(this.height-this.Y);
                    this.current_path += " L"+newX+" "+(this.height-newY);
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
                var r = Math.sqrt( Math.pow((cX - x1), 2) + Math.pow((cY - y1), 2) );
                var rad1 = Math.atan2((this.height - y1) - (this.height - cY), x1 - cX);
                var rad2 = Math.atan2((this.height - pY) - (this.height - cY), pX - cX);
                var deg1 = this.rad2deg(rad1);
                var deg2 = this.rad2deg(rad2);
                var d = this.arclen(deg1, deg2, r);
                this.distance += d;
                this.timeEstimate += (d / (this.F / 60)) * cArcPenalty;
                var p = " M"+this.X+" "+(this.height-this.Y);
                p += " A"+r+" "+r+" 0 0 1 "+pX+" "+(this.height-pY);
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
                var r = Math.sqrt( Math.pow((cX - x1), 2) + Math.pow((cY - y1), 2) );
                var rad1 = Math.atan2((this.height - y1) - (this.height - cY), x1 - cX);
                var rad2 = Math.atan2((this.height - pY) - (this.height - cY), pX - cX);
                var deg1 = this.rad2deg(rad1);
                var deg2 = this.rad2deg(rad2);
                var d = this.arclen(deg2, deg1, r);
                this.distance += d;
                this.timeEstimate += (d / (this.F / 60)) * cArcPenalty;

                //var largeArcFlag = (deg2 - deg1) <= 180 ? "0" : "1";
                //console.log(deg2, deg1, largeArcFlag);
                var p = " M"+this.X+" "+(this.height-this.Y);
                p += " A"+r+" "+r+" 0 0 0 "+pX+" "+(this.height-pY);
                //this.group.path(p).stroke(this.stroke());
                this.current_path += p;
                this.X = pX;
                this.Y = pY;
                break;

            case "O145":
                var ps = params["raw"].split(/ +/);
                var i;
                for (i=0; i<ps.length; i++){ ps[i] = ps[i].replace(/[^\d.-]/g, ''); }
                var imgi = parseInt(ps[2]);
                var imgx = parseFloat(ps[3]);
                var imgy = parseFloat(ps[4]);
                var imgw = parseFloat(ps[5]);
                var imgh = parseFloat(ps[6]);
                var imgxscangap = parseFloat(ps[7]);
                var imgyscangap = parseFloat(ps[8]);
                var imgoverscan = parseInt(ps[9]);
                var d = (imgw+imgoverscan) * (imgh/imgyscangap);
                this.distance += d;
                this.timeEstimate += (d / (this.F / 60)) + (cNewPenalty * (imgh/imgyscangap));
                var image = new Image();
                image.onload = function(){
                  var canvas = document.createElement('canvas');
                  canvas.width = this.naturalWidth;
                  canvas.height = this.naturalHeight;
                  var ctx = canvas.getContext('2d');
                  ctx.drawImage(this, 0, 0);
                  var imgPixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
	                for(var y = 0; y < imgPixels.height; y++){
        	           for(var x = 0; x < imgPixels.width; x++){
    	                  var i = (y * 4) * imgPixels.width + x * 4;
	                      var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
                        imgPixels.data[i] = 255 - avg;
                        imgPixels.data[i + 1] = 255 - avg;
    	                  imgPixels.data[i + 2] = 255 - avg;
	                   }
                  }
                  ctx.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
                  gcv.group.image(canvas.toDataURL('image/png')).size(imgw, imgh).attr({x: imgx, y:(gcv.height-imgy) })
                }
                image.src = 'get/?w=rasterImage&v=laser-ngc&id='+imgi;
                //console.log(img);
                break;
        }

    }

    this.drawLine = function(line){
        line = line.replace(/\(.*?\)/g, "");
        var p = this.parseLine(line);

        if ("Z" in p["params"]){ this.Z = p["params"]["Z"]; }
        if ("F" in p["params"]){ this.F = p["params"]["F"]; }

        if (p["command"]){
            this.parseCommand(p["command"], p["params"]);
        }
    }

    this.size = function(){
        var h = $(document).height()-275;
        var w = h * (this.width/this.height);
        $('#laser-ngc-view-container').height(h);
        this.svg.viewbox(0,0, h, $('#laser-ngc-view-container').width());
    }

    this.draw = function(){
        this.current_path = "M0 0 ";
        this.group.clear();
        this.stroke();
        var h = this.height+1;
        var w = this.width+1;
        this.group.path("M-1 -1 L"+w+" -1 L"+w+" "+h+" L-1 "+h+" L-1 -1z").stroke({width: 1, color: "#fff", dasharray: '2,2'});
        this.distance = 0;
        this.timeEstimate = 0;
        this.linenum = 0;
        this.size();
        this.X = 0;
        this.Y = 0;
        var gcode = laserNgcEditor.getValue();
        var lines = gcode.split('\n');
        for (var i=0; i<lines.length; i++){
            this.linenum += 1;
            this.drawLine(lines[i]);
        }
        this.stroke(true);
        var d = parseInt(this.distance) / 1000;
        this.showStats();
        var vy = this.height - (this.height - $("#laser-ngc-view-container").height());
        var vx = this.width - $("#laser-ngc-view-container").width();

        //this.svg.zoom(1);
        this.svg.viewbox(0,0,1300,900);
        $(document).trigger("laser-ngc-viewer-draw");
    }
}


var gcv = null;
$(function(){
    var h = _CONFIG["laser"]["machine"]["height"];
    var w = _CONFIG["laser"]["machine"]["width"];
    gcv = new laserNgcGcodeViewer("laser-ngc-view-obj", h, w);

    $('a[data-toggle="tab"]').on("shown.bs.tab", function(e) {
        var target = $(e.target).attr("href");
        $("#laser-ngc-view-time").hide();
        if (target == '#laser-ngc-tabView'){
            gcv.draw();
        }
    });
});
