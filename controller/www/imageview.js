
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
  var devsize = getDeviceSize(d, 400, 300);
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

var mapdata = {
  "width": 640,
  "height": 480,
  "devices": {
  "d1": { "points" : [[0,0],[100,0],[100,200],[0,200]]},
  "d2": { "points" : [[150,3],[250,20],[220,220],[120,200]]},
  "d3": { "points" : [[340,303],[570,303],[570,420],[340,420]]},
  "d4": { "points" : [[ 40,303],[270,303],[270,420],[ 40,420]]},
  "d5": { "points" : [[444,104],[497,189],[327,294],[264,218]]}
  }
} 


  window.onload = function() {
    document.querySelector('input#bshow').onclick=showimage; 
    document.querySelector('input#bmap').onclick=showmap; 
  }

