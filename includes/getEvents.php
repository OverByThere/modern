<?php
require_once("../../../includes/config.php");
require_once("../../../includes/functions.php");
require_once("../../../includes/database.php");
chdir(ZM_PATH_WEB);
 $MonitorName = $_REQUEST['MonitorName'];
# $query = "select Id, Width, Height, Date(StartTime) as Date, Time(StartTime) as Time, Length from Events where MonitorId = 1 limit 25";
$query = "select E.Id,E.MonitorId,M.Name As MonitorName,M.Width,M.Height,M.DefaultScale,Date(E.StartTime) as Date, Time(E.StartTime) as Time,E.Length from Monitors as M inner join Events as E on (M.Id = E.MonitorId) where (M.Name = '$MonitorName') limit 100";
 $result = mysql_query($query) or die('Error, selecting monitors failed.');
 while ($event = mysql_fetch_array($result)){
 $thumbData = createListThumbnail($event);
?>
 <div class="thumb" style="float:left; padding:4px 0; width:175px; height:190px; ">
  <img src="<?= $thumbData['Path'] ?>" alt="<?= $event['Id'] ?> Thumbnail"/>
  <p>Date: <?=$event['Date'] ?></p>
  <p>Time: <?=$event['Time'] ?></p>
  <p>Event: <?= $event['Id'] ?></p>
  <p>Duration: <?= $event['Length'] ?></p>
 </div>
<?php
 }
?>
<div class="clearfix"></div>
<?php
?>
