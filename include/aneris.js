function loadSelect(id,data,txt,val){
    $('#'+id).find("option").remove();
    $('#'+id).append( $("<option></option").attr("value","").text(txt) );
    for (var i=0;i<data.length;i++){
        $('#'+id).append( $("<option></option").attr("value",data[i]).text(data[i]) );
    }
    $('#'+id).val(val);
    $('#'+id).change();
}

function msgAlert(msg){
  var obj = $('<div class="alert alert-dismissable alert-danger"> <button type="button" class="close" data-dismiss="alert">x</button>'+msg+'</div>');
  $('#divAlerts').append(obj)
}


$('button').click(function(e){ e.preventDefault(); });
