
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
  "d2": { "points" : [[158,25],[253,56],[192,246],[96,215]]},
  "d3": { "points" : [[340,303],[570,303],[570,420],[340,420]]},
  "d4": { "points" : [[270,303],[270,420],[ 40,420],[ 40,303]]},
  "d5": { "points" : [[444,104],[497,189],[327,294],[264,218]]}
  }
} 


window.addEventListener('load', function() {
    document.querySelector('input#bshow').onclick=showimage; 
    document.querySelector('input#bmap').onclick=showmap; 
  });

