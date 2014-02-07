//
// Copyright (C) 2013 Kevin Varley at Emergent Ltd
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
//

var start = new Date();
var end = new Date();
start.setHours(0,0,0,0);
var activity;
var frames = [];
var chosencameras = new Array();
var timelinedata = [];
var playing = false;
var timers = new Array;
var ajaxRequests = new Array();
var currentlyplaying = [];
var timeline;
var data;
var haschosencameras = false;
var liveview = true;
var shouldbeplaying = false;
var timerstimers = new Array();
var currenteventarrays = new Array();
var paused = false;
var breakplayback = false;
var times = "";
var gaplessPlayback = true;
var eventsToExport = [];
var fullscreen = false;
var stopped = false;
var buffering = false;
var playbackspeed = 200;
var playheadspeed = 1000;
var currentevent;
var options = {
  'width':  '100%',
  'height': '170px',
  'editable': false,
  'cluster': true,
  'showCustomTime': true,
  'showCurrentTime': false,
  'style': 'box',
};
$.noty.defaults = {
  layout: 'topRight',
  theme: 'defaultTheme',
  type: 'alert',
  text: '',
  dismissQueue: true, // If you want to use queue feature set this true
  template: '<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',
  animation: {
      open: {height: 'toggle'},
      close: {height: 'toggle'},
      easing: 'swing',
      speed: 500 // opening & closing animation speed
  },
  timeout: 2000, // delay for closing event. Set false for sticky notifications
  force: false, // adds notification to the beginning of queue when set to true
  modal: false,
  maxVisible: 5, // you can set max visible notification for dismissQueue true option
  closeWith: ['click'], // ['click', 'button', 'hover']
  callback: {
      onShow: function() {},
      afterShow: function() {},
      onClose: function() {},
      afterClose: function() {}
  },
  buttons: false // an array of buttons
};
var errorImageSrc = "skins/modern/views/assets/images/onerror.png";

/* begin third party code */
/* http://www.unseenrevolution.com/$-ajax-error-handling-function/ */
$(function() {
  $.ajaxSetup({
    error: function(jqXHR, exception) {
      if (jqXHR.status === 0) {
        console.log('Not connect. Verify Network.');
      } else if (jqXHR.status == 404) {
        noty({text: 'Network error: 404', type: 'error'});
        console.log('Requested page not found. [404]');
      } else if (jqXHR.status == 500) {
        noty({text: 'Network error: 500', type: 'error'});
        console.log('Internal Server Error [500].');
      } else if (exception === 'parsererror') {
        noty({text: 'Parse error', type: 'error'});
        console.log('Requested JSON parse failed.');
      } else if (exception === 'timeout') {
        noty({text: 'Network error: Timeout', type: 'error'});
        console.log('Time out error.');
      } else if (exception === 'abort') {
        noty({text: 'Network error: Request aborted', type: 'error'});
        console.log('Ajax request aborted.');
      } else {
        noty({text: 'Network error: Uncaught error', type: 'error'});
        console.log('Uncaught Error.\n' + jqXHR.responseText);
      }
    }
  });
});
/* end third party code */

function stopLiveStreams() {
  $(".monitor-stream-image").each(function() {
    $(this).attr("data-livesrc", $(this).attr("src"));
    $(this).attr("src", errorImageSrc);
  });
}

function resumeLiveStreams() {
  $(".monitor-stream-image").each(function() {
    $(this).attr("src", $(this).attr("data-livesrc"));
  });
}

function addMonitor(monitorId, showall) {
  if(arguments.length === 1) {
    showall = false;
  }
  if(liveview === false) {
    if(playing === true || shouldbeplaying === true || paused === true) {
      clearPlayback();
      newPlayheadTimer();
      stopped = false;
    }
  }
  if(showall === false) {
    noty({text: 'Adding camera', type: 'info'});
  }
  if($.inArray(monitorId, chosencameras) === -1) {
    window["currentevents" + monitorId] = new Array();
    currenteventarrays.push("currentevents" + monitorId);

    var ajaxRequestId = ajaxRequests.length;
    //console.log("adding request in addMonitor " + ajaxRequestId);
    ajaxRequests[ajaxRequestId] = $.ajax({
      type: "POST",
      url: 'index.php?view=framefetcher',
      data: {monitor: monitorId, width: cameras[monitorId-1].Width, height: cameras[monitorId-1].Height, scale: 100},
      success: function(data) {
        chosencameras.push(monitorId);
        //console.log("Pushed " + monitorId + " / " + cameras[monitorId-1].Name + " to chosencameras");
        if(liveview === true) {
          $('<!--' + cameras[monitorId-1].Name + ' --> <div id=\"monitor-stream-' + monitorId + '\" class=\"monitor-stream\" data-montiorid=\"' + monitorId + '\"><div class=\"col-container\"><div class=\"monitor-stream-info\"><p class=\"monitor-stream-info-name\" data-rel=\"tooltip\" title=\"The name assigned to this camera\">' + cameras[monitorId-1].Name + '</p><p class=\"monitor-stream-info-events\" data-rel=\"tooltip\" title=\"The total number of events recorded by this camera\">' + cameras[monitorId-1].Events + ' events</p><p class=\"monitor-stream-info-right\"><button class=\"monitor-stream-info-colour\" data-rel=\"tooltip\" title=\"The colour assigned to this camera on the timeline\"><span class=\"glyphicon glyphicon-stop\"></span></button><button class=\"monitor-stream-info-close\" data-rel=\"tooltip\" title=\"Hide this camera from view\"><span class=\"glyphicon glyphicon-remove\"></span></button></p>' + data + '</div></div>').appendTo('#monitor-streams');
        }
        else {
          $('<!-- ' + cameras[monitorId-1].Name + ' --> <div id=\"monitor-stream-' + monitorId + '\" class=\"monitor-stream\" data-montiorid=\"' + monitorId + '\"><div class=\"col-container\"><div class=\"monitor-stream-info\"><p class=\"monitor-stream-info-name\" data-rel=\"tooltip\" title=\"The name assigned to this camera\">' + cameras[monitorId-1].Name + '</p><p class=\"monitor-stream-info-events\" data-rel=\"tooltip\" title=\"The total number of events recorded by this camera\">' + cameras[monitorId-1].Events + ' events</p><p class=\"monitor-stream-info-right\"><button class=\"monitor-stream-info-colour\" data-rel=\"tooltip\" title=\"The colour assigned to this camera on the timeline\"><span class=\"glyphicon glyphicon-stop\"></span></button><button class=\"monitor-stream-info-close\" data-rel=\"tooltip\" title=\"Hide this camera from view\"><span class=\"glyphicon glyphicon-remove\"></span></button></p><img id="liveStream' + cameras[monitorId-1].Id + '" class="monitor-stream-image" src="' + errorImageSrc + '" alt="' + cameras[monitorId-1].Id + '" width="' + cameras[monitorId-1].Width + '" height="' + cameras[monitorId-1].Height + '" onerror="imgError(this);"></div></div>').appendTo('#monitor-streams');
        }
        $("#monitor-stream-" + monitorId + " .monitor-stream-info-events").tooltip({placement: 'bottom'});
        $("#monitor-stream-" + monitorId + " .monitor-stream-info-close").tooltip({placement: 'bottom'});
        $("#monitor-stream-" + monitorId + " .monitor-stream-info-colour").tooltip({placement: 'bottom'});
        $("#monitor-stream-" + monitorId + " .monitor-stream-info-name").tooltip({placement: 'bottom'});
        if((haschosencameras === true)&&(showall === false)&&(liveview===false)) {
          requeryTimeline();
        }
        if((showall === true)&&(monitorId==cameras[cameras.length-1].Id)&&(liveview===false)) {
          requeryTimeline();
        }
        
        ajaxRequests.splice(ajaxRequestId, 1);

        if(chosencameras.length > 1) {
          $("#monitor-stream-" + monitorId).css("width", $(".monitor-stream").first().css("width"));
          $("#monitor-stream-" + monitorId + " .monitor-stream-image").css("width", "100%");
        }
      }
    });
  }
}

function stopPlayback() {
  shouldbeplaying = false;
  playing = false;
  timeline.options.showCustomTime = false;
  timeline.draw(null, options);
  $("#pause").html("<span class=\"glyphicon glyphicon-play\"></span>");
  $("#pause").attr("id", "play");
}

function clearTimer(eventId) {
  if(typeof(timers[eventId]) !== "undefined" && typeof(timers[eventId]) !== null) {
    clearInterval(timers[eventId]);
    timers[eventId] = 0;
  }
}

function clearTimers() {
  $.each(currenteventarrays, function(index, value) {
    var monid = value.substr(value.length - 1);
    $.each(window[value], function(key, val) {
      clearTimer(val);
    });
  });
  currentlyplaying = null;
  timers = [];
}

function clearPlayback() {
  shouldbeplaying = false;
  playing = false;
  stopped = true;
  buffering = false;
  clearInterval(window.playheadtimer);
  window.playheadtimer = 0;
  clearTimers();
  currentevent = null;
  $.each(currenteventarrays, function(index, value) {
    window[value] = [];
  });
  timeline.setCustomTime(new Date());
  clearCameraFrames();
}

function clearCameraFrames() {
  $("#monitor-streams img").attr("src", errorImageSrc);
}

function pausePlayback() {
  shouldbeplaying = false;
  playing = false;
  paused = true;
}

function resumePlayback() {
  shouldbeplaying = true;
  playing = true;
  paused = false;

}

function toggleBufferingState(shouldbebuffering) {
  if(shouldbebuffering === false) {
    shouldbeplaying = true;
    playing = true;
    paused = false;
    buffering = false;
    newPlayheadTimer();
  }
  else {
    shouldbeplaying = false;
    playing = false;
    paused = true;
    buffering = true;
    clearInterval(window.playheadtimer);
    window.playheadtimer = 0;
  }
}

/* begin third party code */
// Andy E
// http://stackoverflow.com/users/94197/andy-e
// http://stackoverflow.com/questions/3075577/convert-mysql-datetime-stamp-into-javascripts-date-format
Date.createFromMysql = function(mysql_string) {
  if(typeof mysql_string === 'string') {
    var t = mysql_string.split(/[- :]/);
    //when t[3], t[4] and t[5] are missing they defaults to zero
    return new Date(t[0], t[1] - 1, t[2], t[3] || 0, t[4] || 0, t[5] || 0);          
  }
  return null;
}
/* end third party code */

$.fn.exists = function(){
  if(this.length>0) {
    return true;
  }
  else {
    return false;
  }
}

function imgError(image) {
  image.onerror = "";
  image.src = errorImageSrc;
  return true;
}

function setTime(element, refresh, formatting) {
  setInterval(function(){
    $(element).text(moment().format(formatting));
  },refresh);
}

function loadUserDefaultPreset() {
  if($("#preset-selection input[name=defaultpreset]:checked").val()!=="-1") {
    var presetMonitorIds = $("#preset-selection input[name=defaultpreset]:checked").parent().find(".preset-list-link").attr("data-value");
    var presetMonitorIds = presetMonitorIds.split(",");
    $.each(presetMonitorIds, function(index, value) {
      addMonitor(value, true);
    });
    noty({text: 'Added cameras', type: 'success'});
  }
  else {
    $(cameras).each(function(i, v) {
      addMonitor(v.Id, true);
    });
    //noty({text: 'Added cameras', type: 'success'});
  }
}

function displayFrame(monitorId, img) {
    $("#liveStream" + monitorId).attr('src', img);
    //$("#monitor-stream-"+monitorId+" .monitor-stream-image").attr('src', img);
}

function requeryTimeline() {
  //console.log("Requerying...");
  if(chosencameras.length > 0) {
    $(".timeline-frame").css("background-color","red");
    var startformatted = moment(start).format('YYYY-MM-DD HH:mm') + ':00';
    var endformatted = moment(end).format('YYYY-MM-DD HH:mm') + ':00';
    var ajaxRequestId = ajaxRequests.length;
    //console.log("adding request in requeryTimeline " + ajaxRequestId);
    ajaxRequests[ajaxRequestId] = $.ajax({
      type: "POST",
      url: 'index.php?view=onefiletorulethemall',
      data: {timeline: 'ok', cameras: chosencameras.join(","), start: startformatted, end: endformatted},
      beforeSend: function() {
        noty({ text: "Downloading data...", type: "info" });
      },
      success: function(data) {
        noty({ text: "Processing data", type: "info" });
        activity = JSON.parse(data);
        var timelineWorker = new Worker("/zm/skins/modern/views/assets/js/processtimeline.js");
        noty({ text: "Updating timeline...", type: "info" });

        timelineWorker.addEventListener('message', function(e) {
          if(e.data.indexOf("###") != -1) {
            var x = e.data.split("###");
            switch(x[0]) {
              case "timelinedata":
                window.timelinedata = JSON.parse(x[1]);
                break;
              case "myframes":
                window.frames = JSON.parse(x[1]);
                break;
            }
          }
          else {
            if(e.data === "success") {
              window.processedtimelinedata = [];
              $.each(timelinedata, function(index, value) {
                value.start = moment(value.start);
                value.end = moment(value.end);
                window.processedtimelinedata.push(value);
              });
              delete window.timelinedata;
              timelinedata = window.processedtimelinedata;
              timeline.draw(timelinedata, options);
              timeline.applyRange(start, end);
              timeline.redraw();
              ajaxRequests.splice(ajaxRequestId, 1);
              $(".timeline-frame").css("background-color","");
              noty({text: 'Timeline updated (' + timelinedata.length + " events)", type: 'success'});
            }
          }
        }, false);

        timelineWorker.postMessage("cameras###" + JSON.stringify(cameras));
        timelineWorker.postMessage("activity###" + data);
        timelineWorker.postMessage("start");

      }
    });
  }
  else {
    timeline.draw(null, options);
    noty({text: 'No cameras selected', type: 'info'});
  }
}

function playbackFrames(monitorId, eventId, imgarray) {
  var x = 0;
  if(!timers.hasOwnProperty(eventId)) {
    timers[eventId] = setInterval(function(){
      // prevent stuttering
      if(window["currentevents" + monitorId].length > 1) {
        //console.log("Current events > 1 /// " + window["currentevents" + monitorId]);
        //get the item before this item in the array
        var previousEventIndex = window["currentevents" + monitorId].length-2;
        var previousEventId = window["currentevents" + monitorId][previousEventIndex];
        //console.log("Removing event /// " + previousEventIndex);
        window["currentevents" + monitorId].splice(previousEventIndex, 1);
        clearTimer(previousEventId);
      }
      // if an event should be being played
      if (shouldbeplaying === true) {
        // if there are still frames to play
        if (x < imgarray.length) {
          playing = true;
          displayFrame(monitorId, imgarray[x]);
        }
        // if there are no more frames to play
        else {
          clearTimer(eventId);
          displayFrame(monitorId, errorImageSrc);
          window["currentevents" + monitorId].splice(window["currentevents" + monitorId].indexOf(eventId), 1);
          // if gaplessPlayback enabled & the event finishes tidily
          if(gaplessPlayback === true) {
            //jumpToNearestEvent(timeline.getCurrentTime());
            window.setTimeout(function() {
              jumpToNearestEvent(timeline.getCustomTime());
            }, 5000);
          }
        }
        x++;
      }
      // if an event shouldn't be playing
      else {
        // if an event has come to an end neatly
        if(paused === false) {
          clearTimer(eventId);
          displayFrame(monitorId, errorImageSrc);
        }
        else {
          displayFrame(monitorId, $("#liveStream" + monitorId).attr("src"));
        }
        // if an event has come to an end tidily we should no longer be playing
        if(window["currentevents" + monitorId].length === 1) {
          playing = false;
          shouldbeplaying = false;
        }
        // remove the event from the relevant array
        if(paused === false) {
          window["currentevents" + monitorId].splice(window["currentevents" + monitorId].indexOf(eventId), 1);
        }
      }
    },playbackspeed);
  }
}

function preloadFrames(imgarray) {
  for(var i = 0; i < imgarray.length; i++) {
    var imgObj = new Image();
    imgObj.src = imgarray[i];
    if(i === (imgarray.length-1)) {
      toggleBufferingState(false);
      return true;
    }
  }
}

function playEvent(monitorId, eventId) {
  toggleBufferingState(true);
  currentevent = eventId;
  /*This shouldn't be nedeched, but leaving it here for a few commits in case I haven't fixed the problem
  console.log("monitorId="+monitorId+" & typeof(monitorId)="+typeof(monitorId));
  console.log("chosencameras[0]=" + chosencameras[0] + " & typeof(chosencameras[0])=" + typeof(chosencameras[0]));
  if(typeof(monitorId)!="number") {
    monitorId = parseInt(monitorId);
  }*/
  if($.inArray(monitorId, chosencameras) === -1) {
    addMonitor(monitorId);
  }
  window["currentevents" + monitorId].push(eventId);
  console.log("playing event: " + eventId + " on monitor " + monitorId + " with speed " + playbackspeed + " and playheadtimer speed " + playheadspeed);
  liveview = false;
  shouldbeplaying = true;
  var tempframes = new Array();
  if(frames[monitorId-1][eventId]) {
    $.each(frames[monitorId-1][eventId], function(i, v) {
      tempframes.push(v);
    });
  }

  if(preloadFrames(tempframes) === true) {
    console.log("Preloaded event " + eventId + " on " + monitorId);
    playbackFrames(monitorId, eventId, tempframes);
  }
}

function jumpToNearestEvent(datetime, direction) {
  //console.log("jumpToNearestEvent called at " + timeline.getCustomTime());
  direction = (typeof direction === "undefined") ? "forward" : direction;
  var matchFound = false;
  $.each(activity, function(i, v) {
    if(matchFound === false) {
      if (direction === "backward") {
        if(Date.createFromMysql(v.StartTime) <= datetime) {
          matchFound = true;
          breakplayback = true;
          //timeline.setCurrentTime(Date.createFromMysql(v.StartTime));
          timeline.setCustomTime(moment(Date.createFromMysql(v.StartTime)).subtract('seconds', 1));
        }
      }
      else {
        if(Date.createFromMysql(v.StartTime) >= datetime) {
          matchFound = true;
          breakplayback = true;
          //timeline.setCurrentTime(Date.createFromMysql(v.StartTime));
          timeline.setCustomTime(moment(Date.createFromMysql(v.StartTime)).subtract('seconds', 1));
        }
      }
    }
  });
}

function clearAjaxRequests() {
  ajaxRequests = [];
}

function setupTimeline() {
  timeline = new links.Timeline(document.getElementById('timeline'));

  timeline.applyRange(start, end);
  timeline.setVisibleChartRange(start, end, true);

  function onselect() {
    if(liveview === false) {
      $(".currently-playing").css("visibility", "visible");
      $(".playback-date").css("visibility", "visible");
      $(".playback-time").css("visibility", "visible");

      if(playing === true) {
        clearPlayback();
        stopped = false;
        newPlayheadTimer();
      }

      var sel = timeline.getSelection();

      timeline.setSelection(null);

      if (sel.length) {
        if(sel[0].row != undefined) {
          var itemobj = timeline.getItem(sel[0].row);
          if($(".playpause-button").attr("id") === "play") {
            togglePlayPauseButton();
          }
          timeline.setCustomTime(itemobj.start);
          timeline.repaintCustomTime();
        }
      }
    }
  }
  links.events.addListener(timeline, 'select', onselect);
  timeline.draw(null, options);

  $(document).on("mousewheel", "#timeline", function(event) {
      event.preventDefault();

      timeline.recalcConversion();

      var frameLeft = links.Timeline.getAbsoluteLeft(timeline.dom.content);
      var mouseX = links.Timeline.getPageX(event);
      var zoomAroundDate = (mouseX != undefined && frameLeft != undefined) ? timeline.screenToTime(mouseX - frameLeft) : undefined;

      if((event.originalEvent.deltaY <= 0)&&(event.originalEvent.deltaY != -0)) {
        timeline.zoom(0.3, zoomAroundDate);
        timeline.trigger("rangechange");
        timeline.trigger("rangechanged");
      }
      else {
        timeline.zoom(-0.3, zoomAroundDate);
        timeline.trigger("rangechange");
        timeline.trigger("rangechanged");
    }
  });
}

function toggleShowAllButton(override) {
  if(arguments.length === 0) {
    override = false;
  }
  if(override === false) {
    if($("button.show-all-cameras").exists()) {
      if(chosencameras.length === cameras.length) {
        $("button.show-all-cameras").replaceWith("<button class=\"hide-all-cameras show-hide-cameras\" data-rel=\"tooltip\" title=\"Click here to show / hide all cameras\"><span class=\"glyphicon glyphicon-eye-close\"></span></button>");
      }
    }
    else {
      if(chosencameras.length < cameras.length) {
        $("button.hide-all-cameras").replaceWith("<button class=\"show-all-cameras show-hide-cameras\" data-rel=\"tooltip\" title=\"Click here to show / hide all cameras\"><span class=\"glyphicon glyphicon-eye-open\"></span></button>");
      }
    }
  }
  else {
    if($("span.glyphicon.glyphicon-eye-close").exists()) {
      $("button.hide-all-cameras").replaceWith("<button class=\"show-all-cameras show-hide-cameras\" data-rel=\"tooltip\" title=\"Click here to show / hide all cameras\"><span class=\"glyphicon glyphicon-eye-open\"></span></button>");
    }
    else{
      $("button.show-all-cameras").replaceWith("<button class=\"hide-all-cameras show-hide-cameras\" data-rel=\"tooltip\" title=\"Click here to show / hide all cameras\"><span class=\"glyphicon glyphicon-eye-close\"></span></button>");
    }
  }
  $(".show-hide-cameras").tooltip();
}

function togglePlayPauseButton() {
  if($(".playpause-button").attr("id") === "play") {
    $("#play").html("<span class=\"glyphicon glyphicon-pause\"></span>");
    $("#play").attr("id", "pause");
  }
  else {
    $("#pause").html("<span class=\"glyphicon glyphicon-play\"></span>");
    $("#pause").attr("id", "play");
  }
}

function toggleMode() {
  if(liveview === true) {
    liveview = false;

    // if there have been cameras selected
    if($.trim($("#monitor-streams").html()).length) {
      $(".monitor-stream-image").each(function() {
        $(this).attr("data-livesrc", $(this).attr("src"));
        $(this).attr("src", errorImageSrc);
      });
    }

    $("#playback").tooltip('destroy');
    $("#playback").html("<span class=\"glyphicon glyphicon-record\"></span>");
    $("#playback").attr("title", "Enter Live View Mode");
    $("#playback").attr("id", "liveview");
    $("#liveview").tooltip();

    $("#speed").show();
    $("#play").show();
    $("#play").prop("disabled", false);
    $("#export").prop("disabled", false);
    $("#rangestart").prop("disabled", false);
    $("#rangeend").prop("disabled", false);

    $(".currently-playing").css("visibility", "visible");
    $(".playback-date").css("visibility", "visible");
    $(".playback-time").css("visibility", "visible");

    if($("#choose-cameras").dialog("isOpen")===true) {
      $("#choose-cameras").dialog("close");
    }
    requeryTimeline();
  }
  else {
    liveview = true;
    $("#liveview").tooltip('destroy');
    $("#liveview").html("<span class=\"glyphicon glyphicon-film\"></span>");
    $("#liveview").attr("title", "Enter Playback Mode")
    $("#liveview").attr("id", "playback");
    $("#playback").tooltip();

    $(".currently-playing").css("visibility", "hidden");
    $(".playback-date").css("visibility", "hidden");
    $(".playback-time").css("visibility", "hidden");

    $("#speed").hide();
    $("#play").hide();
    $("#play").prop("disabled", true);
    $("#export").prop("disabled", true);
    $("#rangestart").prop("disabled", true);
    $("#rangeend").prop("disabled", true);

    $(".playback-date").text("0000-00-00");
    $(".playback-time").text("00:00:00");

    stopPlayback();

    clearPlayback();
    // if there have been cameras selected
    window.setTimeout(function() {
      if($.trim($("#monitor-streams").html()).length) {
        $(".monitor-stream-image").each(function() {
          $(this).attr("src", $(this).attr("data-livesrc").split('&rand')[0] + "&rand=" + new Date().getTime());
          $(this).removeAttr("data-livesrc");
        });
      }
    }, 1000);
  }
}

function getEventIds(start, end) {
  var eventIds = new Array();
  $.each(activity, function(i, v) {
    var tempDate = Date.createFromMysql(v.StartTime);
    if ((tempDate >= start)&&(tempDate <= end)) {
      if(!(v.MonitorId in eventIds)) {
        eventIds[v.MonitorId] = new Array();
      }
      eventIds[v.MonitorId].push(v.Id);
    }
  });
  return eventIds;
}

function newPlayheadTimer() {
  window.playheadtimer = setInterval(function() {
    if(paused === false && stopped === false && liveview === false) {
      timeline.setCustomTime(moment(timeline.getCustomTime()).add('seconds', 1));
    }
    if((liveview === false)&&(paused === false)) {
      var eventsToPlay = new Array();
      //remove var date = moment(timeline.getCurrentTime()).format('YYYY-MM-DD');
      //remove var time = moment(timeline.getCurrentTime()).format('HH:mm:ss');
      var date = moment(timeline.getCustomTime()).format('YYYY-MM-DD');
      var time = moment(timeline.getCustomTime()).format('HH:mm:ss');
      //var datetime = moment(timeline.getCurrentTime()).format('YYYY-MM-DD HH:mm:ss');
      var datetime = moment(timeline.getCustomTime()).subtract('seconds', 1).format('YYYY-MM-DD HH:mm:ss');
      //console.log("checking " + datetime);
      $(".playback-date").text(date);
      $(".playback-time").text(time);
      $.each(activity, function(i, v) {
        if (v.StartTime == datetime) {
            if($.inArray(v.Id, window["currentevents" + v.MonitorId]) == -1) {
              //playEvent(v.MonitorId, v.Id);
              //playing = true;
              eventsToPlay.push(v.MonitorId + "," + v.Id);
            }
        }
      });
      //console.log(eventsToPlay);
      if(eventsToPlay.length > 0) {
        $.each(eventsToPlay, function(index, value) {
          var x = value.split(",");
          playEvent(x[0], x[1]);
          playing = true;
        });
      }
    }
  }, playheadspeed);
}

$(document).ready(function() { /* begin document ready */

  $("[data-rel='tooltip']").tooltip();

  $('.monitor-thumbnail').capty({ animation: 'fixed' });

  setupTimeline();

  $("#choose-cameras").dialog({
    autoOpen: false,
    resizable: true,
    minWidth: 535,
    height: 'auto'
  });

  $("#preset-selection").dialog({
    autoOpen: false,
    resizable: true,
    minWidth: 400
  });

  $("#set-default-preset").dialog({
    autoOpen: false,
    resizable: true,
    width: 'auto'
  });

  $("<button class=\"show-all-cameras show-hide-cameras\" data-rel=\"tooltip\" title=\"Click here to show / hide all cameras\"><span class=\"glyphicon glyphicon-eye-open\"></span></button>").appendTo($("#ui-id-1").parent());
  $(".show-hide-cameras").tooltip();
  $(".ui-dialog-titlebar-close").html("<span class=\"glyphicon glyphicon-remove\"></span>");

  $('#rangestart').datetimepicker({
    dateFormat: "dd/mm/yy",
    stepMinute: 5,
    onSelect: function() {
      if(ajaxRequests.length > 0) {
        noty({ text: "Still processing existing request...", type: "info" });
        $(this).datetimepicker("hide");
      }
    },
    onClose: function(dateText, inst) {
      if(ajaxRequests.length > 0) {
        setTimeout(function() {
          if( moment($("#rangestart").val(), 'D/M/YYYY h:mm') < moment($("#rangeend").val(), 'D/M/YYYY h:mm')) {
            if((moment(start).format('DD/MM/YYYY HH:mm') !== $("#rangestart").val())||(moment(end).format('DD/MM/YYYY HH:mm') !== $("#rangeend").val())) {
              if(playing === true || shouldbeplaying === true || paused === true) {
                clearPlayback();
                newPlayheadTimer();
                stopped = false;
                togglePlayPauseButton();
              }
              start = moment($("#rangestart").val(), 'D/M/YYYY h:mm').toDate();
              end = moment($("#rangeend").val(), 'D/M/YYYY h:mm').toDate();
              requeryTimeline();
            }
          }
          else {
            var temprangestart = moment($("#rangeend").val(), 'D/M/YYYY h:mm').toDate();
            temprangestart.setDate(temprangestart.getDate() - 1);
            $("#rangestart").val(moment(temprangestart).format('D/M/YYYY h:mm'));
            noty({text: 'Range start cannot be after range end!', type: 'error'});
          }
        }, 200);
      }
    }
  });

  $('#rangeend').datetimepicker({
    dateFormat: "dd/mm/yy",
    stepMinute: 5,
    onSelect: function() {
      if(ajaxRequests.length > 0) {
        noty({ text: "Still processing existing request...", type: "info" });
        $(this).datetimepicker("hide");
      }
    },
    onClose: function(dateText, inst) {
      if(ajaxRequests.length > 0) {
        setTimeout(function() {
          if( moment($("#rangeend").val(), 'D/M/YYYY h:mm') > moment($("#rangestart").val(), 'D/M/YYYY h:mm')) {
            if((moment(start).format('DD/MM/YYYY HH:mm') !== $("#rangestart").val())||(moment(end).format('DD/MM/YYYY HH:mm') !== $("#rangeend").val())) {
              if(playing === true || shouldbeplaying === true || paused === true) {
                clearPlayback();
                newPlayheadTimer();
                stopped = false;
                togglePlayPauseButton();
              }
              start = moment($("#rangestart").val(), 'D/M/YYYY h:mm').toDate();
              end = moment($("#rangeend").val(), 'D/M/YYYY h:mm').toDate();
              requeryTimeline();
            }
          }
          else {
            if( moment($("#rangeend").val(), 'D/M/YYYY h:mm').isSame($("#rangestart").val())) {
              var temprangeend = moment($("#rangestart").val(), 'D/M/YYYY h:mm').toDate();
              temprangeend.setDate(temprangeend.getDate() + 1);
              $("#rangeend").val(moment(temprangeend).format('D/M/YYYY h:mm'));
              noty({text: 'Range end cannot be before range start!', type: 'error'});
            }
          }
        }, 200);
      }
    }
  });

  $('#rangestart').val(moment(start).format('DD/MM/YYYY HH:mm'));
  $('#rangeend').val(moment(end).format('DD/MM/YYYY') + ' ' + moment().format('HH:mm'));

  loadUserDefaultPreset();

  $(document).on("change", 'input[name="defaultpreset"]:radio', function() {
    noty({text: "Changing default preset...", type: 'info'});
    var newDefaultPresetName = $(this).parent().find(".preset-list-link").text();
    if(newDefaultPresetName != "All Cameras") {
      var monitorIds = $(this).parent().find("a").attr("data-value").split(",");
    }
    else {
      var monitorIds = [];
      $(cameras).each(function(i, v) {
        monitorIds.push(v.Id);
      });
    }
    var ajaxRequestId = ajaxRequests.length;
    //console.log("adding request " + ajaxRequestId);
    ajaxRequests[ajaxRequestId] = $.ajax({
      type: "POST",
      url: 'index.php?view=onefiletorulethemall',
      data: {updateUserDefaultPreset: true, defaultPresetId: $(this).attr("value")},
      success: function(data) {
        if(data === "success") {
          noty({text: '\'' + newDefaultPresetName + '\' set as default', type: 'success'});
          $("#preset-selection").dialog("close");
          if(newDefaultPresetName != "All Cameras") {
            haschosencameras = true;
            noty({text: 'Loading data', type: 'info'});
            clearAjaxRequests();

            stopLiveStreams();
            $("#monitor-streams").empty();

            chosencameras = [];
            shouldbeplaying = false;
            playing = false;
            $.each(monitorIds, function(index, value) {
              addMonitor(value, true);
            });
          }
          else {
            stopLiveStreams();
            $("#monitor-streams").empty();

            chosencameras = [];
            shouldbeplaying = false;
            playing = false;
            $.each(monitorIds, function(index, value) {
              addMonitor(value, true);
            });
            toggleShowAllButton(true);
          }
        }
        else {
          noty({text: 'Failed to save default preset', type: 'error'});
          console.log(data);
        }
        
        ajaxRequests.splice(ajaxRequestId, 1);
      }
    });
  });

  $(document).on("click", "#scale-increase", function() {
    $(".monitor-stream").css("width", $(".monitor-stream-image").first().width() / 0.75 + "px");
    $(".monitor-streams .monitor-stream-image").css("width", "100%");
    //$(".monitor-stream").css("width", "auto");
    //$(".monitor-streams .col-container").css("height", $(".monitor-stream-image").first().height() * 2 + "px");
  });

  $(document).on("click", "#scale-reset", function() {
    $(".monitor-streams .col-container").css("width", "");
    $(".monitor-streams .monitor-stream-image").css("width", "");
    $(".monitor-stream").css("width", "480px");
  });

  $(document).on("click", "#scale-decrease", function() {
    $(".monitor-stream").css("width", $(".monitor-stream-image").first().width() * 0.75 + "px");
    $(".monitor-streams .monitor-stream-image").css("width", "100%");
    //$(".monitor-stream").css("width", "auto");
    //$(".monitor-streams .col-container").css("height", $(".monitor-stream-image").first().height() / 2 + "px");
  });

  $(document).on("click", ".monitor-stream-info-close", function(event) {
    if(liveview === false) {
      if(playing === true || shouldbeplaying === true || paused === true) {
        clearPlayback();
        newPlayheadTimer();
        stopped = false;
      }
    }
    
    var monitorClass = $(this).parent().parent().parent().parent().attr("id");
    var monitorId = monitorClass.substr(monitorClass.length -1);
    chosencameras.splice(chosencameras.indexOf(monitorId), 1);
    //console.log("Spliced " + monitorId + " / " + cameras[monitorId-1].Name + " from chosencameras");
    $(this).parent().parent().parent().parent().remove();
    var monitorSrc = $(this).parent().parent().parent().find(".monitor-stream-image").attr("src");
    $(this).parent().parent().parent().find(".monitor-stream-image").attr("src", errorImageSrc);
    if(liveview === true) {
      $(".monitor-stream-image").each(function() {
        $(this).attr('src', $(this).attr('src').split('&rand')[0] + "&rand=" + new Date().getTime());
      });
    }
    if(liveview === false) {
      requeryTimeline();
    }
  });

  $(document).on("change", "#speed", function() {
    //console.log("Change called on #speed");
    playbackspeed = $(this).val();
    //console.log("Playback speed is " + playbackspeed + " but should be " + $(this).val());
    clearInterval(window.playheadtimer);
    window.playheadtimer = 0;
    switch(playbackspeed) {
      case "400":
        playheadspeed = 2000;
        break;
      case "200":
        playheadspeed = 1000;
        break;
      case "100":
        playheadspeed = 500;
        break;
      case "50":
        playheadspeed = 250;
        break;
    }
    if(playing === true || shouldbeplaying === true || paused === true) {
      clearPlayback();
      stopped = false;
      if(paused === true) {
        togglePlayPauseButton();
      }
      paused = false;
      shouldbeplaying = true;

      var value = false;
      $.each(activity, function(i, v) {
        if(v.Id == currentevent) {
          currentEventStartTime = moment(v.StartTime, "YYYY-MM-DD HH:mm:ss").toDate();
          return false;
        }
      });

      noty({ text: "Restarting playback at " + $("#speed").find(":selected").text() + " speed...", type: "success" });

      window.setTimeout(function() {
        timeline.setCustomTime(currentEventStartTime)
        jumpToNearestEvent(moment(currentEventStartTime).subtract('seconds', 1));
      }, 3000);
    }
    newPlayheadTimer();
  });

  $(document).on("dblclick", ".monitor-stream-fullscreen", function() {
    $(this).panzoom("reset");
  });

  $(document).on("click", ".monitor-stream-image", function() {
    if(fullscreen === false) {
      if(liveview === true) {
        stopLiveStreams();
      }
      var monitorID = $(this).attr("id").match(/\d+/);
      var width = ($(window).width()-10);
      var height = ($(window).height()-10);
      var monitorWidth = $(this).width();
      var monitorHeight = $(this).height();
      var originalMonitorMarkup = $(this).clone();
      var monitorMarkup = $(this).clone();
      $(monitorMarkup).addClass("monitor-stream-fullscreen");
      $(monitorMarkup).addClass("monitor-stream-fullscreen-" + monitorID);
      if(liveview === true) {
        $(monitorMarkup).attr("src", $(monitorMarkup).attr("data-livesrc"));
      }
      $(this).remove();
      var dialogContent = "<div class=\"monitor-stream-dialog\"></div>";
      $(dialogContent).dialog({
        modal: false,
        height: height,
        width: width,
        resizable: true,
        draggable: true,
        open: function() {
          $(monitorMarkup).appendTo(".monitor-stream-dialog");
          fullscreen = true;
        },
        close: function(event, ui) {
          $(this).dialog('destroy').remove();
          $(originalMonitorMarkup).appendTo("#monitor-stream-" + monitorID);
          if(liveview === true) {
            $("#liveStream" + monitorID).attr("src", $("#liveStream" + monitorID).attr("src").split('&rand')[0] + "&rand=" + new Date().getTime());
            $("#monitor-stream-" + monitorID + " .col-container").removeAttr("style");
            resumeLiveStreams();
          }
          fullscreen = false;
        },
      });
      $(".ui-dialog-titlebar-close").html("<span class=\"glyphicon glyphicon-remove\"></span>");
      $(".monitor-stream-fullscreen").css("display", "block");
      $(".monitor-stream-fullscreen").css("margin", "0 auto");
      if(monitorWidth > monitorHeight) {
        $(".monitor-stream-fullscreen").css("height", "100%");
        $(".monitor-stream-fullscreen").css("width", "auto");
      }
      else {
        $(".monitor-stream-fullscreen").css("width", "100%");
        $(".monitor-stream-fullscreen").css("height", "auto");
      }

      // enable zoom
      var $section = $('.monitor-stream-dialog');
      var $panzoom = $section.find('#liveStream' + monitorID).panzoom();
      // handle mousewheel scroll zooming
      $panzoom.parent().on('mousewheel.focal', function( e ) {
        e.preventDefault();
        var delta = e.delta || e.originalEvent.wheelDelta;
        var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
        $panzoom.panzoom('zoom', zoomOut, {
          increment: 0.1,
          minScale: 1,
          focal: e
        });
      });

    }
  });

  $(document).on("click", ".show-all-cameras", function(event) {
    event.preventDefault();
    $(".monitor-stream-image").each(function() {
      $(this).attr("src", errorImageSrc);
    });
    stopLiveStreams();
    $("#monitor-streams").empty();
    chosencameras = [];
    $(cameras).each(function(i, v) {
      addMonitor(v.Id, true);
    });
    noty({text: 'Added cameras', type: 'success'});
    toggleShowAllButton(true);
  });

  $(document).on("click", ".hide-all-cameras", function(event) {
    event.preventDefault();
    stopLiveStreams();
    $("#monitor-streams").empty();
    chosencameras = [];
    requeryTimeline();
    toggleShowAllButton(true);
  });

  $(document).on("click", ".preset-list-link:not(.show-all-cameras)", function(event) {
    event.preventDefault();
    haschosencameras = true;
    noty({text: 'Loading data', type: 'info'});
    clearAjaxRequests();

    stopLiveStreams();
    $("#monitor-streams").empty();

    chosencameras = [];
    shouldbeplaying = false;
    playing = false;
    var monitorIds = $(this).attr("data-value").split(",");
    $.each(monitorIds, function(index, value) {
      addMonitor(value, true);
    });
  });

  $(document).on("click", "#pause", function(event) {
    event.preventDefault();
    window.stop();
    $("#pause").html("<span class=\"glyphicon glyphicon-play\"></span>");
    $("#pause").attr("id", "play");
    pausePlayback();
  });

  $(document).on("click", "#play", function(event) {
    event.preventDefault();
    if (paused === true) {
      window.stop();
      resumePlayback();
      togglePlayPauseButton();
    }
    else {
      timeline.setCustomTime(start);
      jumpToNearestEvent(start);
      togglePlayPauseButton();
    }
  });

  $(document).on("click", "#liveview", function() {
    toggleMode();
  });

  $(document).on("click", "#playback", function() {
    toggleMode();
  });

  $(document).on("click", "#choose-cameras-opener", function(event) {
    if($("#choose-cameras").dialog("isOpen")!==true) {
      toggleShowAllButton();
      $("#choose-cameras").dialog("open");
    }
    else {
      $("#choose-cameras").dialog("close");
    }
  });

  $(document).on("click", "#preset-selection-opener", function(event) {
    if($("#preset-selection").dialog("isOpen")!==true) {
      $("#preset-selection").dialog("open");
    }
    else {
      $("#preset-selection").dialog("close");
    }
  });

  $(".monitor-thumbnail").click(function() {
    haschosencameras = true;
    var monitorClass = $(this).attr("id");
    var monitorId = monitorClass.substr(monitorClass.length - 1);
    if($('#monitor-stream-' + monitorId).length == 0) {
      addMonitor(monitorId);
    }
    else {
      $("#monitor-stream-" + monitorId).remove();
      chosencameras.splice(chosencameras.indexOf(monitorId), 1);
      requeryTimeline();
      if(!$(".monitor-stream")[0]) {
        liveview = false;
      }
    }
  });

  $(document).on("click", "#timeline", function(event) {
    if(liveview === false) {
      if(event.target.className !== "timeline-event" && event.target.className !== "timeline-event-content") {
        paused = false;
        clearPlayback();
        stopped = false;
        newPlayheadTimer();
        var offset = $(this).offset();
        timeline.recalcConversion();
        jumpToNearestEvent(timeline.screenToTime(event.clientX - offset.left));
        if($(".playpause-button").attr("id") === "play") {
          togglePlayPauseButton();
        }
      }
    }
  });

  $(document).on("click", "#page-refresh", function(event) {
    event.preventDefault();
    stopLiveStreams();
    noty({ text: "Refreshing...", type: "info" });
    window.setTimeout(function() {
      location.reload();
    }, 2000);
  });

  window.playheadtimer = setInterval(function() {
    if(paused === false && stopped === false && liveview === false) {
      timeline.setCustomTime(moment(timeline.getCustomTime()).add('seconds', 1));
    }
    if((liveview === false)&&(paused === false)) {
      var eventsToPlay = new Array();
      var date = moment(timeline.getCustomTime()).format('YYYY-MM-DD');
      var time = moment(timeline.getCustomTime()).format('HH:mm:ss');
      var datetime = moment(timeline.getCustomTime()).subtract('seconds', 1).format('YYYY-MM-DD HH:mm:ss');
      $(".playback-date").text(date);
      $(".playback-time").text(time);
      $.each(activity, function(i, v) {
        if (v.StartTime == datetime) {
            if($.inArray(v.Id, window["currentevents" + v.MonitorId]) == -1) {
              eventsToPlay.push(v.MonitorId + "," + v.Id);
            }
        }
      });
      if(eventsToPlay.length > 0) {
        $.each(eventsToPlay, function(index, value) {
          var x = value.split(",");
          playEvent(x[0], x[1]);
          playing = true;
        });
      }
    }
  }, playheadspeed);

  /* refresh camera thumbnails every 20 seconds */
  setInterval(function(){
    var timestamp = (new Date()).getTime();
    $(".monitor-thumbnail").each(function() {
      $(this).attr("src", $(this).attr("src").split('&rand')[0] + "&rand=" + timestamp);
    });
  },20000);

}); /* end document ready */