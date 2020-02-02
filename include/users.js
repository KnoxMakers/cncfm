function loadUsers(r){
  if (r && r.result && r.result==1){
    var user = localStorage.getItem("aneris-user");
    loadSelect("selectUser",r.users,"Choose User",user);
    loadPage();
  }else{
    if (r && r.message){
      msgAlert(r.message);
    }else{
      msgAlert("Unable to load users.");
    }
  }
}

function newUser(){
    var user = prompt("\nNew User's Name:\n(Names must be alphanumeric only)");
    if (user){
        $.get("get/", { "w": "userNew", "u": user },function(r){
            if (r && r.result && r.result==1){
              localStorage.setItem("aneris-user", user);
              $.get("get?w=userList", loadUsers, "json");
            }else{
              if (r && r.message){
                msgAlert(r.message);
              }else{
                msgAlert("Unable to create new user.");
              }
            }
        },"json");
    }

}

function getUser(){
  return $("#selectUser").val();
}

$('#selectUser').change(function(){
    var user = $('#selectUser').val();
    localStorage.setItem("aneris-user", user);
});

$(function(){
  $("#btnNewUser").click(newUser);
  $.get("get?w=userList", loadUsers, "json");
});
