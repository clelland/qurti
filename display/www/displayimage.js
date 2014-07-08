
function blankImage() {
  var canvas = document.getElementById('myCanvas');
  var context = canvas.getContext('2d');
  context.setTransform(1, 0, 0, 1, 0, 0);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  context.clearRect(0, 0, canvas.width, canvas.height);
  showCanvas(true);
}

function showCanvas(state) {
  var imgdiv = document.getElementById('imagediv');
  if(state) {
    imgdiv.style.display = '';
  } else {
    imgdiv.style.display = 'none';
  }
}

function showDebug() {
   showCanvas(false);
}

function showimage (url) {
  var canvas = document.getElementById('myCanvas');
  var context = canvas.getContext('2d');
  blankImage();

  if(clientId) {
    var d = mapdata.devices[clientId];
    drawImage(mapdata, clientId, context,url);
  } else {
    context.strokeText(text,10,10);
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


