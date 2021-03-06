function drawRegistrationImage(deviceIP){
  blankImage();
  var canvas = document.getElementById('myCanvas');
  var context = canvas.getContext('2d');
  var barwidth=Math.min(canvas.width/10, canvas.height/10);
  var bitwidth= (canvas.height-barwidth*2)/10;
  // the whole display should have a red outer border ~1/10 of the screenwidth
  // with a green center fill and a blue bar across the top inside the red border
  context.fillStyle="#FF0000";
  context.fillRect(0,0, canvas.width,canvas.height);
  context.fillStyle="#00FF00";
  context.fillRect(barwidth,barwidth, canvas.width-(barwidth*2),canvas.height-(barwidth*2));
  context.fillStyle="#0000FF";
  context.fillRect(barwidth,barwidth, canvas.width-(barwidth*2),bitwidth);

  // now draw the IP inside the green area in blue blocks
  var bytes =  deviceIP.split('.');
  for(var i=0;i<bytes.length;i++) {
    var xoffset=barwidth+i*barwidth;
    var yoffset=barwidth+bitwidth;
    drawbits(context, xoffset,yoffset, bytes[i], barwidth, bitwidth);
  }
}

// draw a byte as a sequence of rectangles in the current color
function drawbits(context, xoffset, yoffset, byteval, bitwidth, bitheight) {
  for(var i=0;i<8;i++) {
    var mask = 1<<i;
    var ypos = yoffset+bitheight*(i%8);
    if(byteval & mask) {
       context.fillRect(xoffset,ypos,bitwidth,bitheight);
    }
  }
}

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
