// return the aligned bounding rectangle that contains the (potentially rotated) device shape 
function getBoundingRect( d ) {
   var minx = Math.min(d.points[0][0],d.points[1][0],d.points[2][0],d.points[3][0]);
   var maxx = Math.max(d.points[0][0],d.points[1][0],d.points[2][0],d.points[3][0]);
   var miny = Math.min(d.points[0][1],d.points[1][1],d.points[2][1],d.points[3][1]);
   var maxy = Math.max(d.points[0][1],d.points[1][1],d.points[2][1],d.points[3][1]);
   return [minx,miny,maxx-minx,maxy-miny];
}

// rotate a rectangle by radians around a center point
function rotateRect( rect, cx, cy, angle) {
   var rnew = [
     rotatePoint(rect[0][0],rect[0][1],cx,cy,angle),
     rotatePoint(rect[1][0],rect[1][1],cx,cy,angle),
     rotatePoint(rect[2][0],rect[2][1],cx,cy,angle),
     rotatePoint(rect[3][0],rect[3][1],cx,cy,angle)];
   return rnew;
}

// rotate a point by radians around a center point
function rotatePoint(x, y, cx, cy, angle) {
    return [ Math.cos(angle) * (x-cx) - Math.sin(angle) * (y-cy) + cy,  Math.sin(angle) * (x-cx) + Math.cos(angle) * (y-cy) + cy ];
}


// get the device rotation (in degrees) from its rectangle
function getRotation( d ) {
   var dy = d.points[1][1] - d.points[0][1];
   var dx = d.points[1][0] - d.points[0][0];
   var angle = Math.atan2(dy, dx);
   return angle;
}
function lineLen(point1, point2) {
   var dy = point2[1] - point1[1];
   var dx = point2[0] - point1[0];
   var len = Math.sqrt(dx*dx+dy*dy);
   return len;
}
// get a scaled representation (width,height) of a device
function getDeviceSize(d, maxx, maxy) {
   width = lineLen(d.points[0],d.points[1]);
   height = lineLen(d.points[1],d.points[2]);

   var scale=Math.min(maxx/width, maxy/height);
   return {width: width*scale, height: height*scale};
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
function scaleMap(map, scale) {
   var fixedmap={};
   
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
function drawDevice(devkey, d, context) {

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

  var text = devkey+"="+getRotation(d).toFixed(1);
  context.strokeText(text,rct[0]+rct[2]/2,rct[1]+rct[3]/2);
}

// draws an image on the device using the device entry in the map
// the image is rotated and translated appropriately and displayed
// full screen

function drawImage(map, dk, ctx, imageurl) {
  var imageObj = new Image();

  imageObj.onload = function() {
    // scale the map to match the image
    // this makes the image fit IN the map, not fitting the map into the image
    var scale=Math.max(imageObj.width/map.width, imageObj.height/map.height);
    var mymap = scaleMap(map, scale);
    var d = mymap.devices[dk];
    var rct = getBoundingRect(d);
    var rot = -getRotation(d);
    // move the image to the center of the map - one direction should be 0...
    var offset = [(mymap.width-imageObj.width)/2, (mymap.height-imageObj.height)/2];

    ctx.translate(-(rct[0]-offset[0]), -(rct[1]-offset[1]));
    ctx.rotate(rot);
    ctx.drawImage(imageObj,0,0)
  }
  imageObj.src = imageurl;

}

