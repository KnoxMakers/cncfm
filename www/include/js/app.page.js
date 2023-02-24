class cncfmPage {
  settings = {};
  notifier = new AWN();

  constructor() {
    $(document).on("click", ".copy-text-html", function () {
      var txt = $(this).html();
      navigator.clipboard.writeText(txt);
      cncfm.page.notify("Copied text to clipboard.");
    });

    $(document).on("click", ".copy-text-val", function () {
      var txt = $(this).val();
      navigator.clipboard.writeText(txt);
      cncfm.page.notify("Copied text to clipboard.");
    });

    $(window).on("hashchange", function () {
      cncfm.page.load();
    });
  }

  update = function () {
    document.title = cncfm.settings["SITE_NAME"];
    $("#logo").attr("src", cncfm.settings["SITE_LOGO"]);
  };

  go = function (hash) {
    document.location = "#" + hash;
    $(window).trigger("hashchange");
  };

  show = function (page) {
    $(".cncfm-page").hide();
    if (!page.startsWith("#")) {
      page = "#cncfm-" + page;
    }
    $(page).fadeIn("fast", function () {
      $(".cncfm-page:not(" + page + ")").hide();
    });
  };

  get = function (i) {
    var hash = window.location.hash.slice(1);
    if (!hash) {
      hash = "file:/";
    }
    var hashcmd = hash.split(":");
    if (hashcmd[i]) {
      return hashcmd[i];
    }
    return false;
  };

  load = function () {
    var wat = cncfm.page.get(0);

    switch (wat) {
      case "job":
        var jobid = cncfm.page.get(1);
        var loc = cncfm.page.get(2);
        if (!loc) loc = "/";
        $("#cncfm-job").attr("data-jobid", jobid);
        $("#cncfm-job").attr("data-loc", loc);
        cncfm.jobs.clearJob();
        cncfm.jobs.jobProgress("LOADING", false, true);
        cncfm.page.show("job");
        break;

      case "view":
        var loc = cncfm.page.get(1);
        var f = cncfm.page.get(2);
        cncfm.viewers.view(loc, f);
        break;

      case "jobs":
        cncfm.page.show("jobs");
        break;

      case "file":
      default:
        cncfm.page.show("files");
        cncfm.files.load();
        break;
    }
  };

  reload = function (hard = false) {
    if (hard) {
      location.reload();
    } else {
      cncfm.page.load();
    }
  };

  notify = function (msg) {
    cncfm.page.notifier.info(msg);
  };

  error = function (msg) {
    cncfm.page.notifier.alert(msg);
  };

  confirm = function (msg, onOk = function () { }, onCancel = function () { }) {
    cncfm.page.notifier.confirm(msg, onOk, onCancel);
  };
}
