class cncfmJobs {
    progressbar = null;

    constructor() {
        this.progressBar = new ldBar("#cncfm-jobbar");
        setTimeout(function () {
            cncfm.jobs.poll();
        }, 1000);

        $(document).on("click", "#btnJobJobs", function () {
            cncfm.page.go("jobs");
        });

        $(document).on("click", "#btnJobOptions", function () {
            $("#cncfm-job-options").toggle();
        });

        $(document).on("click", "#btnJobLogs", function () {
            $("#cncfm-job-logs").toggle();
        });

        $(document).on("click", ".btnViewJob", function () {
            var jobid = $(this).attr("data-job");
            var jobloc = $(this).attr("data-loc");
            cncfm.page.go("job:" + jobid + ":" + jobloc);
        });

        $(document).on("click", ".btnDeleteJob", function () {
            //e.stopPropagation();
            var jobid = $(this).attr("data-job");
            var msg =
                "<br/><strong>YOU</strong> are about to kill the following job:<br/><br/>";
            msg += "<center><strong>" + jobid + "</strong><br/><br/></center>";
            cncfm.page.confirm(msg, function () {
                cncfm.api.call(
                    "jobs/kill",
                    { user: cncfm.users.get_user(), jobid: jobid },
                    function (data) {
                        // pass
                    }
                );
            });
        });
    }

    poll = function () {
        var user = cncfm.users.get_user();
        if (!user) {
            setTimeout(cncfm.jobs.poll, 1000);
        }

        cncfm.api.call("jobs/", { user: user }, function (data) {
            cncfm.jobs.update(data);
            setTimeout(cncfm.jobs.poll, 3000);
        });
    };

    clearJob = function () {
        $("#cncfm-job-info").html("").hide();
        $("#cncfm-job-options-content").html("");
        $("#cncfm-job-logs-content").html("");
        $("#cncfm-job-running").hide();
        $("#cncfm-job-queued").hide();
        $("#cncfm-job-bug").hide();
    }

    checkProgress = function (data) {
        if (cncfm.page.get(0) == "job") {
            var jobid = $("#cncfm-job").attr("data-jobid");
            var loc = $("#cncfm-job").attr("data-loc");
            if (!loc) loc = "/";
            if (!data || !data.jobs || (!data.jobs[jobid] && !data.fails[jobid])) {
                $("#cncfm-job").attr("title", "");
                var p = "file:" + loc;
                setTimeout(function () {
                    cncfm.page.go(p);
                }, 200);
            } else {
                if (data && data.jobs && data.jobs[jobid]) {
                    var job = data.jobs[jobid];
                    var status = "QUEUED";
                    if (data.run == jobid) {
                        status = "WORKING";
                    }
                } else if (data && data.fails && data.fails[jobid]) {
                    var job = data.fails[jobid];
                    var status = "FAILED";
                } else {
                    return;
                }
                cncfm.jobs.jobProgress(status, false, true);

                var loc = job.location;
                var infotable = "<br/><table cellpadding=5>";
                infotable += "<tr><td align=right>jobid:</td><td>" + jobid + "</td></tr>";
                infotable += "<tr><td align=right>file:</td><td>" + loc + "/" + job.filename + "</td></tr>";
                infotable += "<tr><td align=right>uploader:</td><td>" + job.uploader + "</td></tr>";
                infotable += "</table>";
                $("#cncfm-job-info").html(infotable).show();

                var configtable = "<h4>job options:</h4><br/>";
                configtable += "<table width='100%' id='cncfm-job-config-table' cellpadding=5>";
                $.each(job.options, function (key, val) {
                    if (!Array.isArray(val) && (typeof val !== "object") && !Object.is(val)) {
                        configtable += "<tr><td width='50%' align=right>" + key + ":</td><td>" + val + "</td></tr>";
                    }
                });
                if (job.options.has_vector == "1") {
                    configtable += "<tr><td colspan=2><hr/></td></tr>";
                    $.each(job.options.passes, function (key, val) {
                        configtable += "<tr><td align=right>vector.pass." + key + ":</td><td><nobr>";
                        configtable += "" + val.color;
                        configtable += ", F" + val.feedrate;
                        configtable += ", P" + val.power + "%";
                        configtable += "</nobr></td></tr>";
                    });
                }
                if (job.options.has_raster == '1') {
                    configtable += "<tr><td colspan=2><hr/></td></tr>";
                    $.each(job.options.raster, function (key, val) {
                        configtable += "<tr><td align=right>raster." + key + ":</td><td>" + val + "</td></tr>";
                    });
                }
                configtable += "</table>";
                $("#cncfm-job-options-content").html(configtable);

                if (job.log) {
                    $("#cncfm-job-logs-content").html("<h4>stderr:</h4>\n" + job.log);
                } else {
                    $("#cncfm-job-logs-content").html("no log");
                }
            }
        }
    };

    jobProgress = function (label, bar = false, loading = false) {
        var l = $("#cncfm-job-label").html();
        if (l != label) {
            $("#cncfm-job-label").html(label);
            if (label == "WORKING") {
                $("#cncfm-job-running").show();
                $("#cncfm-job-queued").hide();
                $("#cncfm-job-bug").hide();
            } else if (label == "QUEUED") {
                $("#cncfm-job-running").hide();
                $("#cncfm-job-queued").show();
                $("#cncfm-job-bug").hide();
            } else if (label == "FAILED") {
                $("#cncfm-job-running").hide();
                $("#cncfm-job-queued").hide();
                $("#cncfm-job-bug").show();
            }
        }

        if (bar === false) {
            $("#cncfm-job-bar").hide();
        } else {
            $("#cncfm-job-bar").show();
            this.progressBar.set(bar);
        }

        if (loading === false) {
            $("#cncfm-job-loading").hide();
        } else {
            $("#cncfm-job-loading").show();
        }
    };

    jobsRow = function (jobid, row, status) {
        var tr = $("<tr/>");
        var td1 = $("<td/>");
        var td2 = $("<td/>");
        var td3 = $("<td/>").addClass("d-none d-md-table-cell");
        var td4 = $("<td/>").addClass("d-none d-lg-table-cell");
        var td5 = $("<td/>").addClass("d-none d-sm-table-cell");
        var td6 = $("<td/>").addClass("d-none d-sm-table-cell");
        var td7 = $("<td/>");
        var td8 = $("<td/>");
        var td9 = $("<td/>");

        if (status == "RUNNING") {
            $(td1).append('<i class="bi bi-hourglass-split"></i>');
        } else if (status == "QUEUED") {
            $(td1).append('<i class="bi bi-hourglass-top"></i>');
        } else {
            $(td1).append('<i class="bi bi-bug-fill"></i>');
        }

        $(td2).append(jobid);
        $(td3).append(row["filename"]);
        $(td4).append(row["uploader"]);
        $(td5).append(row["date"]);
        $(td6).append(row["time"]);
        $(td7).append(status);

        var btnView = $("<button/>");
        $(btnView)
            .addClass("btn")
            .addClass("btn-info")
            .addClass("btn-sm")
            .addClass("btnViewJob");
        $(btnView).append('<i class="bi bi-eye"></i>');
        $(btnView).attr("data-job", jobid);
        $(btnView).attr("data-loc", row["location"]);
        $(td8).append(btnView);

        var btnDelete = $("<button/>");
        $(btnDelete)
            .addClass("btn")
            .addClass("btn-danger")
            .addClass("btn-sm")
            .addClass("btnDeleteJob");
        $(btnDelete).append('<i class="bi bi-trash3-fill"></i>');
        $(btnDelete).attr("data-job", jobid);
        $(td9).append(btnDelete);

        $(tr).addClass("cncfm-jobs-job");
        $(tr).attr("data-job", jobid);
        $(tr).append(td1);
        $(tr).append(td2);
        $(tr).append(td3);
        $(tr).append(td4);
        $(tr).append(td5);
        $(tr).append(td6);
        $(tr).append(td7);
        $(tr).append(td8);
        $(tr).append(td9);

        return tr;
    };

    update = function (data) {
        cncfm.jobs.checkProgress(data);
        $("#cncfm-jobs-table tbody").empty();
        var total_jobs = Object.keys(data.jobs).length;
        var total_fails = Object.keys(data.fails).length;
        if (total_jobs > 0) {
            $.each(data.jobs, function (key, row) {
                var status = "QUEUED";
                if (data.run == key) {
                    status = "RUNNING";
                }
                var tr = cncfm.jobs.jobsRow(key, row, status);
                $("#cncfm-jobs-table tbody").append(tr);
            });
        }
        if (total_fails > 0) {
            $.each(data.fails, function (key, row) {
                var status = "FAILED";
                var tr = cncfm.jobs.jobsRow(key, row, status);
                $("#cncfm-jobs-table tbody").append(tr);
            });
        }
        var totmsg = "You have " + total_jobs + " active job";
        if (total_jobs != 1) totmsg += "s";
        totmsg += ".<br/>";
        $("#cncfm-jobs-status").html(totmsg);

    };
}
