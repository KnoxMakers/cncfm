class cncfmPluginsViewers {
    loaded = false;
    viewers = {};
    f = null;
    active = null;

    constructor() {
        $(document).on("click", "#btnViewCancel", function () {
            var path = cncfm.page.get(1);
            var url = "file:" + path;
            cncfm.page.go(url);
        });

        $(document).on("click", "#btnViewFileDownloadOriginal:not(.disabled)", function (e) {
            e.preventDefault();
            var options = {
                "user": cncfm.users.get_user(),
                "location": cncfm.page.get(1),
                "original": $(this).attr("data-original"),
                "filename": cncfm.page.get(2)
            }
            cncfm.api.call("files/downloadOriginal", options, function (r) {
                cncfm.downloadURI(r.filename, r.data);
            });
        });

        $(document).on("click", "#btnViewFileDownloadProcessed:not(.disabled)", function (e) {
            e.preventDefault();
            var options = {
                "user": cncfm.users.get_user(),
                "location": cncfm.page.get(1),
                "filename": cncfm.page.get(2)
            }
            cncfm.api.call("files/downloadProcessed", options, function (r) {
                cncfm.downloadURI(r.filename, r.data);
            });
        });

        cncfm.api.call("plugins/viewers", [], function (data) {
            let seen = new Set();
            $.each(data.viewers, function (ext, viewer) {
                if (viewer) {
                    cncfm.viewers.viewers[ext] = viewer;
                    if (!seen.has(viewer.name) && viewer.js) {
                        $("body").append($("<script />", {
                            html: viewer.js
                        }));
                    }
                    if (!seen.has(viewer.name) && viewer.css) {
                        $("body").append($("<style />", {
                            html: viewer.css,
                        }));
                    }
                    seen.add(viewer.name);
                }
            });
            cncfm.viewers.loaded = true;
        });

        $(window).resize(function () {
            if (cncfm.viewers.active && cncfm.viewers.active.resize) {
                cncfm.viewers.active.resize();
            }
        });
    }

    get(f) {
        var ext = cncfm.files.get_ext(f);

        if (this.viewers[ext]) {
            return this.viewers[ext];
        } else {
            cncfm.page.notify("No Viewer for: " + ext);
            cncfm.page.go("file:/")
            return null;
        }
    }

    activate(viewer) {
        var className = "cncfmViewer_" + viewer.name;
        cncfm.viewers.activeName = viewer.name;
        cncfm.viewers.activeConf = null;
        if (viewer.config) {
            cncfm.viewers.activeConf = viewer.config;
        }
        try {
            cncfm.viewers.active = eval("new " + className + "(cncfm.viewers.activeConf)");
            $("#cncfm-viewer-content").html(viewer.html);
            cncfm.viewers.active.init();
        }
        catch (err) {
            console.log(err);
            cncfm.page.notify(err.message);
        }
    }

    view = function (loc, f) {
        if (!this.loaded) {
            setTimeout(function () {
                cncfm.viewers.view(loc, f);
            }, 100);
        } else {
            var options = {
                user: cncfm.users.get_user(),
                location: loc,
                filename: f,
            };
            $("#cncfm-view-filename").val(f);
            var v = cncfm.viewers.get(f);
            if (v) {
                $("#btnViewFileDownloadProcessed").html("<i class='bi bi-download'></i> " + f);
                cncfm.api.call("files/get", options, function (r) {
                    if (r && r.meta && r.meta.original) {
                        $("#btnViewFileDownloadOriginal").attr("data-original", r.meta.original);
                        $("#btnViewFileDownloadOriginal").removeClass("disabled");
                        $("#btnViewFileDownloadOriginal").html("<i class='bi bi-download'></i> " + r.meta.original);
                    } else {
                        $("#btnViewFileDownloadOriginal").attr("data-original", '');
                        $("#btnViewFileDownloadOriginal").addClass("disabled");
                        $("#btnViewFileDownloadOriginal").html("---");
                    }
                    cncfm.viewers.activate(v);
                    cncfm.viewers.active.view(r.data);
                    console.log("viewing: ", loc, f);
                    cncfm.page.show("viewer");
                });
            }
        }
    };
}
