<?php
//
// ZoneMinder web function library, $Date: 2008-07-08 16:06:45 +0100 (Tue, 08 Jul 2008) $, $Revision: 2484 $
// Copyright (C) 2001-2008 Philip Coombes
// 
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
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

function outputlivestream($monitor,$inwidth=0,$inheight=0) {
  $scale = isset( $_REQUEST['scale'] ) ? validInt($_REQUEST['scale']) : reScale( SCALE_BASE, $monitor['DefaultScale'], ZM_WEB_DEFAULT_SCALE );
  //echo $monitor['Id']." $scale ".$monitor['Width'];
  //$scale = isset( $_REQUEST['scale'] ) ? validInt($_REQUEST['scale']) : (!defined(ZM_WEB_DEFAULT_SCALE) ? 40 : ZM_WEB_DEFAULT_SCALE);
  $connkey = $monitor['connKey']; // Minor hack
  if ( ZM_WEB_STREAM_METHOD == 'mpeg' && ZM_MPEG_LIVE_FORMAT ) {
    $streamMode = "mpeg";
    $streamSrc = getStreamSrc( array( "mode=".$streamMode, "monitor=".$monitor['Id'], "scale=".$scale, "bitrate=".ZM_WEB_VIDEO_BITRATE, "maxfps=".ZM_WEB_VIDEO_MAXFPS, "format=".ZM_MPEG_LIVE_FORMAT, "buffer=".$monitor['StreamReplayBuffer'] ) );
  }
  elseif ( canStream() ) {
    $streamMode = "jpeg";
    $streamSrc = getStreamSrc( array( "mode=".$streamMode, "monitor=".$monitor['Id'], "scale=".$scale, "maxfps=".ZM_WEB_VIDEO_MAXFPS, "buffer=".$monitor['StreamReplayBuffer'] ) );
  }
  else {
    $streamMode = "single";
    $streamSrc = getStreamSrc( array( "mode=".$streamMode, "monitor=".$monitor['Id'], "scale=".$scale ) );
  }

  
  $width = !empty($inwidth) ? $inwidth : 150;
  $height = empty($inheight) ? $width * $monitor['Height'] / $monitor['Width'] : $inheight;

  //$height = 180;
  //$width = $height * $monitor['Width'] / $monitor['Height'];
  //$width = "100%";

  $width = (int)$width;
  $height = (int)$height;
  
  // output image
  if ( $streamMode === "mpeg" ) outputVideoStream( 'liveStream'.$monitor['Id'], $streamSrc, reScale( $width, $scale ), reScale( $height, $scale ), ZM_MPEG_LIVE_FORMAT, $monitor['Name'] );
  elseif ( $streamMode == "jpeg" ) {
    if ( canStreamNative() ) outputImageStream( 'liveStream'.$monitor['Id'], $streamSrc, reScale( $width, $scale ), reScale( $height, $scale ), $monitor['Name'] );
    elseif ( canStreamApplet() ) outputHelperStream( 'liveStream'.$monitor['Id'], $streamSrc, reScale( $width, $scale ), reScale( $height, $scale ), $monitor['Name'] );
  }
  else outputImageStill( 'liveStream'.$monitor['Id'], $streamSrc, reScale( $width, $scale ), reScale( $height, $scale ), $monitor['Name'] );
}

function xhtmlHeaders( $file, $title ) {
  /* begin paths init */
  $skinCssFile = getSkinFile( 'css/skin.css' );
  $skinCssPhpFile = getSkinFile( 'css/skin.css.php' );
  $skinJsFile = getSkinFile( 'js/skin.js' );
  $skinJsPhpFile = getSkinFile( 'js/skin.js.php' );
  $basename = basename( $file, '.php' );
  $viewCssFile = getSkinFile( 'views/css/'.$basename.'.css' );
  $viewCssPhpFile = getSkinFile( 'views/css/'.$basename.'.css.php' );
  $viewJsFile = getSkinFile( 'views/js/'.$basename.'.js' );
  $viewJsPhpFile = getSkinFile( 'views/js/'.$basename.'.js.php' );
  extract( $GLOBALS, EXTR_OVERWRITE );
  /* end paths init */
?>

  <!DOCTYPE html>
  <!--[if lt IE 7]> <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
  <!--[if IE 7]> <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
  <!--[if IE 8]> <html class="no-js lt-ie9"> <![endif]-->
  <!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]-->
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title><?= ZM_WEB_TITLE_PREFIX ?> - <?= validHtmlStr($title) ?></title>
    <link rel="shortcut icon" href="assets/img/favicon.ico">
    <link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="skins/<?=$skin?>/assets/css/vendor/bootstrap.min.css">
    <link rel="stylesheet" href="skins/<?=$skin?>/assets/css/vendor/bootstrap-theme.min.css">
    <link rel="stylesheet" href="skins/<?=$skin?>/assets/css/main.css">
    <!-- begin zm -->
    <?php
      if($viewCssFile) { echo "<link rel=\"stylesheet\" href=\"{$viewCssFile}\" type=\"text/css\" media=\"screen\">"; }
      if($viewCssPhpFile) { echo "<style type=\"text/css\">"; require_once($viewCssPhpFile); echo "</style>"; }
      if($viewJsFile) { echo "<script type=\"text/javascript\" src=\"{$viewJsFile}\"></script>"; }
      if($viewJsPhpFile) { echo "<script type=\"text/javascript\">"; require_once($viewJsPhpFile); echo "</script>"; }
    ?>
    <!-- end zm -->
  </head>
<?php 
  }
?>