  $(document).ready(function(){
   var refresh = $("#inptRefresh").val();
   refresh = (refresh * 1000);
   $("#footer a").colorbox({iframe:true, width:'25%', height:'25%'});
   $("#monitors").load("skins/new/views/monitors.php", function(){post_load()});
   $("#tabs").tabs();

   $("#add_tab").click(function() {
   });
   

   function post_load() {
    $("a[rel='monitor']").colorbox({
     iframe:true,
     photo:true,
     preloading:false,
     current:'{current} of {total}',
     width:'85%',
     height:'75%'
    });
    
    $(".minimize").click(function() {
     $(this).parent().parent().find('.mon').toggle('blind');
    });
   }

  setInterval(function() {
   $("#monitors li").each(function() {
   var _this = $(this);
   $(".spinner",_this).html("<img width='15px' src='skins/new/graphics/spinner.gif' />");
   var mid = $(this).attr("id");
   mid = mid.split("_");
   $(".mon",this).load("skins/new/views/monitors.php?mid=" + mid[1] + " .mon", function () { 
    $(".spinner",_this).fadeOut('slow');
   });
  });
 }, refresh);

  $("#monitors").sortable({ opacity: 0.6, cursor: 'move', update: function() {
  var order = $(this).sortable("serialize") + '&action=sequence';
    $.post("skins/new/includes/updateSequence.php", order);
   }});

 });
