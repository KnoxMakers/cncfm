class cncfmFiles {
    constructor() {
        $(document).on("click", ".cncfm-files-directory", function () {
            var fname = $(this).attr("data-filename");
            var fpath = cncfm.files.fullpath(fname);
            cncfm.page.go("file:" + fpath);
        });

        $(document).on("click", ".cncfm-files-file", function () {
            var fname = $(this).attr("data-filename");
            var loc = cncfm.files.get_location();
            cncfm.page.go("view:" + loc + ":" + fname);
        });

        $(document).on("click", "#btnFileRename", function (e) {
            e.stopPropagation();
            var oldname = $("#cncfm-view-filename").val();
            let params = {
                user: cncfm.users.get_user(),
                location: cncfm.page.get(1),
                filename: oldname,
                newname: prompt("Rename File?", oldname)
            }
            if (params.newname){
                cncfm.api.call("files/rename", params, function(r){
                    if (r && r.newname){
                        var location = cncfm.page.get(1);
                        var url = "view:" + location + ":" + r.newname;
                        cncfm.page.go(url);
                    }
                })
            }
        });

        $(document).on("click", "#btnFileNewDir", function (e) {
            e.stopPropagation();
            let params = {
                name: prompt("New Folder Name"),
                user: cncfm.users.get_user(),
                location: cncfm.files.get_location(),
            };
            if (params.name){
                cncfm.api.call("files/newDirectory", params, function () {
                    cncfm.page.reload();
                });
            }
        });

        $(document).on("click", ".btnDeleteDir", function (e) {
            e.stopPropagation();
            var fname = $(this).attr("data-filename");
            var fpath = cncfm.files.fullpath(fname);
            var msg = "<br/><strong>YOU</strong> are about to delete the following directory and all it's contents:<br/><br/>";
            msg += "<center><strong>" + fname + "</strong></center><br/>";
            cncfm.page.confirm(msg, function () {
                cncfm.api.call("files/deleteDirectory", { user: cncfm.users.get_user(), path: fpath }, function (data) {
                    cncfm.page.load();
                });
            });
        });

        $(document).on("click", ".btnDeleteFile", function (e) {
            e.stopPropagation();
            var fname = $(this).attr("data-filename");
            var fpath = cncfm.files.fullpath(fname);
            var msg = "<br/><strong>YOU</strong> are about to delete the following file:<br/><br/>";
            msg += "<center><strong>" + fname + "</strong><br/><br/></center>";
            cncfm.page.confirm(msg, function () {
                cncfm.api.call("files/deleteFile", { user: cncfm.users.get_user(), path: fpath }, function (data) {
                    cncfm.page.load();
                });
            });
        });
    }

    get_ext = function (fname) {
        return fname.split(".").pop().toLowerCase();
    };

    fullpath = function (fname) {
        var location = cncfm.files.get_location();
        var fpath = location + "/" + fname;
        fpath = fpath.replace(/\/+/, "/");
        return fpath;
    };

    get_location = function () {
        var wat1 = cncfm.page.get(0);
        var wat2 = cncfm.page.get(1);
        if (wat1 == "file") return wat2;
        if (wat1 == "view") return wat2;
        return "";
    };

    get_header = function (location) {
        location = location.replace(/^\/+/, "").replace(/\/+$/, "");
        var dirs = location.split("/");
        var divider = " <i class='bi bi-chevron-compact-right'></i> ";
        var html = "<a href='#file:/' class='cncfm-file-header' data-directory='/'><i class='bi bi-house-fill'></i></a>";
        var path = "";
        html += divider;
        html += "<a href='#file:/' class='cncfm-file-header' data-directory='/'>" + cncfm.users.get_user() + "</a>";
        $.each(dirs, function (key, val) {
            if (val) {
                path += "/" + val;
                html += divider;
                html += "<a href='#file:" + path + "' class='cncfm-file-header' data-directory='" + path + "'>" + val + "</a>";
            }
        });
        return html;
    };

    file_row = function (fname, fdate, ftime, fsize) {
        var tr = $("<tr/>");
        var td1 = $("<td/>");
        var td2 = $("<td/>");
        var td3 = $("<td/>");
        var td4 = $("<td/>");
        var td5 = $("<td/>");
        var td6 = $("<td/>");

        $(td1).append('<i class="bi bi-file-text"></i>');
        $(td2).append(fname);

        $(td3).append(fdate);
        $(td4).append(ftime);
        $(td5).append(fsize);

        var btnDelete = $("<button/>");
        $(btnDelete).addClass("btn").addClass("btn-danger").addClass("btn-sm").addClass("btnDeleteFile");
        $(btnDelete).append('<i class="bi bi-trash3-fill"></i>');
        $(btnDelete).attr("data-filename", fname);
        $(td6).append(btnDelete);

        $(tr).addClass("cncfm-files-file");
        $(tr).attr("data-filename", fname);
        $(tr).append(td1);
        $(tr).append(td2);
        $(tr).append(td3);
        $(tr).append(td4);
        $(tr).append(td5);
        $(tr).append(td6);

        return tr;
    };

    dir_row = function (fname) {
        var tr = $("<tr/>");
        var td1 = $("<td/>");
        var td2 = $("<td/>");
        var td6 = $("<td/>");

        $(td1).append('<i class="bi bi-folder-fill"></i>');
        $(td2)
            .append(fname + "<i class='bi bi-chevron-compact-right'>")
            .attr("colspan", 4);

        var btnDelete = $("<button/>");
        $(btnDelete).addClass("btn").addClass("btn-danger").addClass("btn-sm").addClass("btnDeleteDir");
        $(btnDelete).append('<i class="bi bi-trash3-fill"></i>');
        $(btnDelete).attr("data-filename", fname);
        $(td6).append(btnDelete);

        $(tr).addClass("cncfm-files-directory");
        $(tr).attr("data-filename", fname);
        $(tr).append(td1);
        $(tr).append(td2);
        $(tr).append(td6);

        return tr;
    };

    load = function () {
        var location = cncfm.files.get_location();
        var data = {
            location: location,
            user: cncfm.users.get_user(),
        };
        cncfm.api.call("files/list", data, function (data) {
            $("#cncfm-files-table tbody").empty();
            $("#cncfm-files-header").html(cncfm.files.get_header(location));

            $.each(data.data.dirs, function (key, val) {
                var d = cncfm.files.dir_row(val);
                $("#cncfm-files-table tbody").append(d);
            });

            $.each(data.data.files, function (key, row) {
                var f = cncfm.files.file_row(row.name, row.date, row.time, row.size);
                $("#cncfm-files-table tbody").append(f);
            });

            $("a.cncfm-file-header").droppable({
                accept: "tr.cncfm-files-file,tr.cncfm-files-directory",
                tolerance: "pointer",
                drop: function (event, ui) {
                    console.log("wat");
                    var options = {
                        user: cncfm.users.get_user(),
                        location: cncfm.page.get(1),
                        path: $(this).attr("data-directory"),
                        filename: $(ui.draggable).attr("data-filename"),
                    };
                    cncfm.api.call("files/move", options, function () {
                        cncfm.page.notify("MOVED <strong>" + options.filename + "</strong><br/>to<br/><strong> " + options.path + "</strong>");
                        cncfm.page.reload();
                    });
                },
            });

            $("tr.cncfm-files-directory").droppable({
                accept: "tr.cncfm-files-file,tr.cncfm-files-directory",
                drop: function (event, ui) {
                    var options = {
                        user: cncfm.users.get_user(),
                        location: cncfm.page.get(1),
                        directory: $(this).attr("data-filename"),
                        filename: $(ui.draggable).attr("data-filename"),
                    };
                    cncfm.api.call("files/move", options, function () {
                        cncfm.page.notify("MOVED <strong>" + options.filename + "</strong><br/>to<br/><strong> " + options.directory + "</strong>");
                        cncfm.page.reload();
                    });
                },
            });

            $("tr.cncfm-files-directory").draggable({
                axis: "y",
                cursor: "grabbing",
                revert: true,
                opacity: 0.25,
            });

            $("tr.cncfm-files-file").draggable({
                axis: "y",
                cursor: "grabbing",
                revert: true,
                opacity: 0.25,
            });
        });
    };
}
