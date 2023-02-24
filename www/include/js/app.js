class cncfmApp {

    settings = {};

    page = null;
    api = null;
    users = null;
    files = null;
    plugins = null;
    jobs = null;

    init = function () {
        this.api = new cncfmApi();
        this.users = new cncfmUsers();
        this.page = new cncfmPage();
        this.files = new cncfmFiles();
        this.uploaders = new cncfmPluginsUploaders();
        this.viewers = new cncfmPluginsViewers();
        this.jobs = new cncfmJobs();

        cncfm.api.call("app/settings", [], function (data) {
            cncfm.settings = data.data;
            cncfm.page.update();
        })
    }

    set = function (key, val) {
        var user = this.users.get_user();
        var key = user + "." + key;
        localStorage.setItem(key, val);
    }

    get = function (key) {
        var user = this.users.get_user();
        var key = user + "." + key;
        return localStorage.getItem(key);
    }

    downloadURI = function (filename, datauri) {
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", datauri);
        downloadAnchorNode.setAttribute("download", filename);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

}

var cncfm = new cncfmApp();

$(function () {

    cncfm.init();

});
