function loadPage(){
  $('#maincontent .pages').hide();
    $(document).trigger("page.unload");
    var h = location.hash.substr(1);
    if (!h || h[h.length-1] == '/'){
      $("#current-dir").val(h);
      getFiles();
      $('#maincontent #page-files').show();
    }else{
      var fparts = h.split('/');
      var fname = fparts.pop()
      var dname = fparts.join('/');
      $("#current-dir").val(dname);
      $("#current-file").val(fname);
      $('#maincontent #page-file').show();
      loadFile();
    }
}

$(function(){
    $(window).on("hashchange", function(){ loadPage(); });
});
