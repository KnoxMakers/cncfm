class cncfmUsers {
    constructor() {
        $(document).on("change", "#selectUser", function () {
            var l = $(this).attr("data-last-user");
            var u = cncfm.users.get_user();
            $(this).attr("data-last-user", u);
            localStorage.setItem("cncfm-user", u);
            if (!l){
                cncfm.page.load();
            }else{
                cncfm.page.go("file:/");
            }
        });

        $(document).on("click", "#btnNewUser", function (e) {
            let name = prompt("New Username");
            cncfm.api.call("users/new", { name: name }, function (data) {
                localStorage.setItem("cncfm-user", data.name);
                cncfm.users.load_users();
            });
            e.stopPropagation();
        });

        this.load_users();
    }

    load_users = function () {
        cncfm.api.call("users/list", {}, function (data) {
            var u = localStorage.getItem("cncfm-user");
            $("#selectUser").empty();
            $.each(data.data, function (key, val) {
                $("#selectUser").append(new Option(val));
            });
            if (u) {
                $("#selectUser").val(u);
            }
            $("#selectUser").trigger("change");
        });
    };

    get_user = function () {
        return $("#selectUser").val();
    };
}
