class cncfmApi {
    apiUrl = "api/v1";

    constructor() {

    }

    call = function (path, data, callback, fallback = false) {
        var url = this.apiUrl + "/" + path;
        $.post(url, data, function (r) {
            if (r && r.status && r.status == 1) {
                callback(r);
            } else if (fallback) {
                fallback(r);
            } else {
                cncfm.api.error(r);
                console.log(r)
            }
        }).fail(function () {
            cncfm.page.error("API ERROR", true);
        });
    }


    error = function (data) {
        var title = "ERROR";
        var msg = "UNKNOWN ERROR";
        var blocking = false;

        if (data) {
            if (data.status && data.status < -999) { blocking = true; }
            if (data.message) { msg = data.message; }
            if (data.status && data.status < 0) {
                cncfm.page.error(msg, blocking);
            }
        } else {
            cncfm.page.error(msg, blocking);
        }
    }

}
