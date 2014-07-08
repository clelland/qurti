// return the aligned bounding rectangle that contains the (potentially rotated) device shape 
function getBoundingRect( d ) {
   var minx = Math.floor(Math.min(d.points[0][0],d.points[1][0],d.points[2][0],d.points[3][0]));
   var maxx = Math.ceil(Math.max(d.points[0][0],d.points[1][0],d.points[2][0],d.points[3][0]));
   var miny = Math.floor(Math.min(d.points[0][1],d.points[1][1],d.points[2][1],d.points[3][1]));
   var maxy = Math.ceil(Math.max(d.points[0][1],d.points[1][1],d.points[2][1],d.points[3][1]));
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
    return [ Math.cos(angle) * (x-cx) - Math.sin(angle) * (y-cy) + cx,  Math.sin(angle) * (x-cx) + Math.cos(angle) * (y-cy) + cy ];
}

// get the center of a device
function getDeviceCenter(d) {
   var x1 = Math.max(d.points[0][0],d.points[1][0],d.points[2][0],d.points[3][0]);
   var x2 = Math.min(d.points[0][0],d.points[1][0],d.points[2][0],d.points[3][0]);
   var y1 = Math.max(d.points[0][1],d.points[1][1],d.points[2][1],d.points[3][1]);
   var y2 = Math.min(d.points[0][1],d.points[1][1],d.points[2][1],d.points[3][1]);
   var center = [x2+(x1-x2)/2, y2+(y1-y2)/2]; 
   return center;
}

// get the translation to adjust for the incorrect rotation center
function getRotationCorrection(dc, offset, angle) {
   var p = rotatePoint(dc[0], dc[1], offset[0],offset[1],angle);
   var trans = [dc[0]-p[0],dc[1]-p[1]];
   return trans;
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
// get device size
function getDeviceSize(d) {
   width = Math.ceil(lineLen(d.points[0],d.points[1]));
   height = Math.ceil(lineLen(d.points[1],d.points[2]));
   return {width: width, height: height};
}

// get a scaled representation (width,height) of a device
function getScaledDeviceSize(d, maxx, maxy) {
   var s= getDeviceSize(d)
   var scale=Math.min(maxx/s.width, maxy/s.height);
   return {width: s.width*scale, height: s.height*scale};
}

// scale a device rectangle by a factor
function scaleDevice(d, scale) {
  var shape=[[0,0],[0,0],[0,0],[0,0]];
  for(var i =0;i<4;i++) {
     shape[i][0] = Math.round(d.points[i][0]*scale);
     shape[i][1] = Math.round(d.points[i][1]*scale);
  }
  return shape;
}

// scale a map to fit in a new width/height
function scaleMap(map, scale) {
   var fixedmap={};
   
   fixedmap.width = Math.round(map.width* scale);
   fixedmap.height = Math.round(map.height* scale);
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

  // show the device center
  var devcenter = getDeviceCenter(d);
  context.beginPath();
  context.arc(devcenter[0],devcenter[1],10,0,2*Math.PI);
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
    var mapscale=Math.max(imageObj.width/map.width, imageObj.height/map.height);
    var mymap = scaleMap(map, mapscale);
    var d = mymap.devices[dk];
    var rct = getBoundingRect(d);
    var rot = -getRotation(d);

    // move the image to the center of the map - one direction should be 0...
    var imageoffset = [Math.floor((mymap.width-imageObj.width)/2), Math.floor((mymap.height-imageObj.height)/2)];

    var devsize = getDeviceSize(d);
    var devscale = Math.max(ctx.canvas.width/devsize.width, ctx.canvas.height/devsize.height);

    // the rotate center is the Top Left of the bounding rect
    // the desired rotation is the first device point (top-left)
    var trans =  [(rct[0] - d.points[0][0])*devscale, (rct[1] - d.points[0][1])*devscale];
    ctx.rotate(rot);

    ctx.drawImage(imageObj,rct[0]-imageoffset[0]-1,rct[1]-imageoffset[1]-1, rct[2]+1,rct[3]+1, trans[0],trans[1],rct[2]*devscale,rct[3]*devscale);
  }
  imageObj.src = imageurl;

}

