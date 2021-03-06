
function showimage () {
  var canvas = document.getElementById('myCanvas');
  var context = canvas.getContext('2d');
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.border="thin dotted blue";

  var inp = document.getElementById('px');
  var did = inp.value;
  if(did=="") did =0;
  var dk = Object.keys(mapdata.devices)[did];
  var d = mapdata.devices[dk];
// this bit is to fake a place to put it
  var devsize = getScaledDeviceSize(d, 400, 300);
  canvas.width = devsize.width;
  canvas.height = devsize.height;

  drawImage(mapdata, dk, context,'Chromelogo.png');

}

// this is a diagnostic/test function to show what is SHOULD look like based on the map data
// it displays the outline of all the devices overlayed on the test image 
// each device shows the rotation, device ID and the enclosing rectangle
function showmap() {
  var canvas = document.getElementById('myCanvas');
  // force a default size, this gets changed by showImage
  canvas.width=400;
  canvas.height=300;
  var context = canvas.getContext('2d');
  canvas.style.transform="";
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);

  var imageObj = new Image();

  imageObj.onload = function() {
    // scale map to fit in canvas
    var scale=Math.max(canvas.width/mapdata.width, canvas.height/mapdata.height);
    var mymap = scaleMap(mapdata, scale);

    // move the image to the center of the map - one direction should be 0...
    var imgscale=Math.min(canvas.width/imageObj.width, canvas.height/imageObj.height);
    var size = [imageObj.width*imgscale, imageObj.height*imgscale];
    var offset = [(mymap.width-size[0])/2, (mymap.height-size[1])/2];
    context.drawImage(imageObj,0,0,imageObj.width,imageObj.height,offset[0],offset[1],size[0],size[1]);
    // draw a line to show the edge of the image
    context.beginPath();
    context.strokeRect(offset[0],offset[1],size[0],size[1]);

    for( dk in mymap.devices) {
      if(mymap.devices.hasOwnProperty(dk)) {
        var d= mymap.devices[dk];
        drawDevice(dk,d,context);
      }
    }
  }
  imageObj.src = 'Chromelogo.png';
}

// map data is the actual points of the outer corners of the device screen
// the points are ordered top left, top right, bottom left, bottom right
// so the first two points define the top edge of the device
// note that the 'top' is as defined by the device,
// so if it auto-rotates - that might be a side
// the ip is not used, just handy for manual mapping

var mapdata={
  "width" : 2682,
  "height" : 2082,
  "devices" : {
    "4915353847070720" : { "ip":"114", "points" : [[120,108],[405,111],[405,600],[120,600]]},
    "5441676319391744" : { "ip":"143",  "points" : [[1569,780],[642,780],[642,99],[1569,99]]},
    "4698887495352320" : { "ip":"105",  "points" : [[1860,480],[1860,33],[2523,33],[2523,480]]},
    "6024589280804864" : { "ip":"144",  "points" : [[1860,480],[1860,33],[2523,33],[2523,480]]},
    "4646780952117248" : { "ip":"123",  "points" : [[1872,795],[1872,546],[2268,546],[2268,795]]},
    "5305903813230592" : { "ip":"124",  "points" : [[94,1966],[94,1000],[824,1000],[824,1966]]},
    "6310926160494592" : { "ip":"115",  "points" : [[1008,984],[1712,984],[1712,1956],[1008,1956]]},
    "6476368300736512" : { "ip":"130",  "points" : [[1916,946],[2562,946],[2562,1942],[1916,1942]]}
  }
}

