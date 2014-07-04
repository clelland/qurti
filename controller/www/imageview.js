
function showimage () {
  var canvas = document.getElementById('myCanvas');
  var context = canvas.getContext('2d');
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);

  var inp = document.getElementById('px');
  var did = inp.value;
  if(did=="") did =0;
  var dk = Object.keys(mapdata.devices)[did];
  var d = mapdata.devices[dk];
  drawImage(d,context,'assets/chrome_logo.png');

}
 
function showmap() {
  var canvas = document.getElementById('myCanvas');
  var context = canvas.getContext('2d');
  canvas.style.transform="";
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);

  var mymap = scaleMap(mapdata, 800,600);
    for( dk in mymap.devices) {
      if(mymap.devices.hasOwnProperty(dk)) {
        var d= mymap.devices[dk];
        drawDevice(d,context);
      }
    }
}

// map data is the actual points of the outer corners of the device screen
// the points are ordered top left, top right, bottom left, bottom right
// so the first two points define the top edge of the device
// note that the 'top' is as defined by the device,
// so if it auto-rotates - that might be a side

var mapdata = {
  "width": 1024,
  "height": 1024,
  "devices": {
  "d1": { "points" : [[0,0],[100,0],[100,200],[0,200]]},
  "d2": { "points" : [[150,3],[250,20],[220,220],[120,200]]},
  "d3": { "points" : [[240,203],[470,203],[470,320],[240,320]]}
  }
} 


  window.onload = function() {
    document.querySelector('input#bshow').onclick=showimage; 
    document.querySelector('input#bmap').onclick=showmap; 
  }

