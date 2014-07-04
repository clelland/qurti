// return the aligned bounding rectangle that contains the (potentially rotated) device shape 
function getBoundingRect( d ) {
   var minx = Math.min(d.points[0][0],d.points[1][0],d.points[2][0],d.points[3][0]);
   var maxx = Math.max(d.points[0][0],d.points[1][0],d.points[2][0],d.points[3][0]);
   var miny = Math.min(d.points[0][1],d.points[1][1],d.points[2][1],d.points[3][1]);
   var maxy = Math.max(d.points[0][1],d.points[1][1],d.points[2][1],d.points[3][1]);
   return [minx,miny,maxx-minx,maxy-miny];
}

// get the device rotation (in degrees) from its rectangle
function getRotation( d ) {
   var dy = d.points[1][1] - d.points[0][1];
   var dx = d.points[1][0] - d.points[0][0];
   var angle = Math.atan2(dy, dx)* 180/Math.PI;
   return angle;
}

// scale a device rectangle by a factor
function scaleDevice(d, scale) {
  var shape=[[0,0],[0,0],[0,0],[0,0]];
  for(var i =0;i<4;i++) {
     shape[i][0] = d.points[i][0]*scale;
     shape[i][1] = d.points[i][1]*scale;
  }
  return shape;
}

// scale a map to fit in a new width/height
function scaleMap(map, width, height) {
   var fixedmap={};
   var scale=Math.min(width/map.width, height/map.height);
   
   fixedmap.width = map.width* scale;
   fixedmap.height = map.height* scale;
   fixedmap.devices = new Object();
    for( dk in map.devices) {
      if(map.devices.hasOwnProperty(dk)) {
        var d= map.devices[dk];
        fixedmap.devices[dk] = {"points": scaleDevice(d,scale)};
      }
    }
   return fixedmap;
}

//draw a device shape on a canvas from its map entry
function drawDevice(d, context) {

  // show the top of the device
  context.beginPath();
  context.moveTo(d.points[0][0], d.points[0][1]);
  context.lineTo(d.points[1][0], d.points[1][1]);
  context.lineWidth=10;
  context.strokeStyle="#FF0000";
  context.stroke();
  // show the screen boundary of the rest of the device
  context.beginPath();
  context.moveTo(d.points[1][0], d.points[1][1]);
  context.lineTo(d.points[2][0], d.points[2][1]);
  context.lineTo(d.points[3][0], d.points[3][1]);
  context.lineTo(d.points[0][0], d.points[0][1]);
  context.strokeStyle="#00FF00";
  context.lineWidth=2;
  context.stroke();

  // show the screen boundary of the rest of the device
  context.beginPath();
  var rct = getBoundingRect(d);
  context.rect(rct[0], rct[1],rct[2], rct[3]);
  context.strokeStyle="#0000FF";
  context.lineWidth=1;
  context.stroke();

  var text = "r="+getRotation(d).toFixed(1);
  context.strokeText(text,rct[0]+rct[2]/2,rct[1]+rct[3]/2);
}

// draws an image on the device using the device entry in the map
// the image is rotated and translated appropriately and displayed
// full screen

function drawImage(d, context, imageurl) {
  var imageObj = new Image();
  var rct = getBoundingRect(d);
  // the rect and angle are relative to the map, the shift/rotate
  // that needs to be performed is the opposite...
  var translate = " translate(-"+rct[0]+"px,-"+rct[1]+"px) ";
  var rot = " rotate("+(0-getRotation(d))+"deg) ";
  context.canvas.style.transform=translate+rot;

  imageObj.onload = function() {
      context.drawImage(imageObj,0,0);
  };

  imageObj.src = imageurl;
}

