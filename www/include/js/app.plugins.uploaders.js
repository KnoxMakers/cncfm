class cncfmPluginsUploaders {
    loaded = false;
    uploaders = {};
    f = null;
    activeName = null;
    activeConf = null;
    active = null;

    constructor() {
        $(document).on("click", "#btnFileUpload", function () {
            $("#fileUpload").replaceWith($("#fileUpload").val("").clone(true));
            $("#fileUpload").click();
        });

        $(document).on("click", "#btnUploaderCancel", function () {
            cncfm.page.reload();
        });

        $(document).on("click", "#btnUploaderUpload", function () {
            cncfm.uploaders.active.upload();
        });

        // ------- Drag and drop logic below -------
        $(document).on("dragenter dragover", (e) => {
            e.preventDefault();

            // Add 'dragover' class only if '#cncfm-files' is visible and '#cncfm-uploader' is not.
            if (
                $("#cncfm-files").is(":visible") &&
                !$("#cncfm-uploader").is(":visible")
            ) {
                $("body").addClass("dragover");
            }
        });

        $(document).on("dragleave drop", (e) => {
            e.preventDefault();
            $("body").removeClass("dragover");
        });

        $(document).on("drop", (e) => {
            e.preventDefault();
            $("body").removeClass("dragover");

            // Accept drops only if '#cncfm-files' is visible, '#cncfm-uploader' is not, and there are actually files dropped.
            if (
                $("#cncfm-files").is(":visible") &&
                !$("#cncfm-uploader").is(":visible") &&
                e.originalEvent.dataTransfer &&
                e.originalEvent.dataTransfer.files.length
            ) {
                this.changeHandler(e.originalEvent.dataTransfer.files[0]);
            }
        });

        $(document).on("change", "#fileUpload", this.changeHandler.bind(this));

        cncfm.api.call("plugins/uploaders", [], function (data) {
            let seen = new Set();
            $.each(data.uploaders, function (ext, uploader) {
                if (uploader) {
                    cncfm.uploaders.uploaders[ext] = uploader;
                    if (!seen.has(uploader.name) && uploader.js) {
                        $("body").append(
                            $("<script />", {
                                html: uploader.js,
                            })
                        );
                    }
                    if (!seen.has(uploader.name) && uploader.css) {
                        $("body").append(
                            $("<style />", {
                                html: uploader.css,
                            })
                        );
                    }
                    seen.add(uploader.name);
                }
            });
            cncfm.uploaders.loaded = true;
            var filetypes =
                "." + Object.keys(cncfm.uploaders.uploaders).join(",.");
            $("#fileUpload").attr("accept", filetypes);
        });

        $(window).resize(function () {
            if (cncfm.uploaders.active && cncfm.uploaders.active.resize) {
                cncfm.uploaders.active.resize();
            }
        });
    }

    changeHandler(arg) {
        let f;
        if (arg instanceof File) {
            // If 'arg' is an instance of 'File', we use it directly.
            f = arg;
        } else if (arg.target && arg.target.files[0]) {
            // If 'arg' is an event object with a 'target' property,
            // we extract the file from it.
            f = arg.target.files[0];
        } else {
            // If 'arg' is neither a 'File' nor an event object with a 'target',
            // we don't know how to handle it and thus return immediately.
            return;
        }
        cncfm.uploaders.f = f;
        var u = cncfm.uploaders.get(f);
        if (u) {
            var className = "cncfmUploader_" + u.name;
            cncfm.uploaders.activeName = u.name;
            let config = {};
            if (u.config) {
                config = u.config;
            }
            try {
                $("#cncfm-uploader-content").html(u.html);
                cncfm.uploaders.activeName = u.name;
                cncfm.uploaders.activeConf = config;
                cncfm.uploaders.active = eval("new " + className + "(config)");
                cncfm.uploaders.active.activate(f);
                cncfm.page.show("uploader");
            } catch (err) {
                console.log(err);
                cncfm.page.notify(err.message);
            }
        }
    }

    get(f) {
        var ext = cncfm.files.get_ext(f.name);
        if (this.uploaders[ext]) {
            return this.uploaders[ext];
        } else {
            cncfm.page.notify("No Uploader for: " + ext);
            cncfm.page.go("file:/");
            return null;
        }
    }

    upload = function (options) {
        var f = cncfm.uploaders.f;
        var uploader = cncfm.uploaders.activeName;
        var config = cncfm.uploaders.activeConf;
        var url = cncfm.api.apiUrl + "/plugins/upload";
        var data = new FormData();
        data.append("fileUpload", f);
        data.set("user", cncfm.users.get_user());
        data.set("location", cncfm.files.get_location());
        data.set("uploader", uploader);
        data.set("filename", f.name);
        data.set("config", JSON.stringify(config));
        data.set("options", JSON.stringify(options));
        cncfm.jobs.jobProgress("UPLOADING", 0);
        cncfm.page.show("process");
        $.ajax({
            url: url,
            type: "POST",
            data: data,
            cache: false,
            contentType: false,
            processData: false,

            xhr: function () {
                var myXhr = $.ajaxSettings.xhr();
                if (myXhr.upload) {
                    myXhr.upload.addEventListener(
                        "progress",
                        function (e) {
                            if (e.lengthComputable) {
                                $("progress").attr({
                                    value: e.loaded,
                                    max: e.total,
                                });
                                var percent = (e.loaded / e.total) * 100;
                                cncfm.jobs.jobProgress("UPLOADING", percent);
                            }
                        },
                        false
                    );
                }
                return myXhr;
            },
        }).done(function (r) {
            if (r && r.status && r.status == 1) {
                var loc = cncfm.page.get(1);
                if (!loc) loc = "/";
                cncfm.page.go("job:" + r.jobid + ":" + loc);
            } else {
                cncfm.api.error(r);
            }
        });
    };
}
