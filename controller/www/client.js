//var REGISTRATION_SERVER = "http://192.168.1.136:8080/";
var REGISTRATION_URL = "http://192.168.0.22:8080/";
var MAP_URL = "http://192.168.0.22:8080/map";
//var REGISTRATION_SERVER = "http://qurti.googleplex.com/";
var DISPLAY_SERVER_PORT = 8080;

function logEvent(text, level) {
  var logLine = document.createElement('li');
  if (level) {
    logLine.className = level;
  }
  logLine.innerHTML = text;
  document.querySelector("#logs ul").appendChild(logLine);
  console.log(text);
}

function getListenAddress(cb) {
            chrome.socket.getNetworkList(function(interfaces) {
                // Filter out ipv6 addresses.
                var ret = interfaces.filter(function(i) {
                    return i.address.indexOf(':') === -1;
                }).map(function(i) {
                    return i.address;
                }).join(', ');
                listenAddress = ret;
                cb(ret);
            });
}


function getMap(callback) {
  var xhr = new XMLHttpRequest();
  var formData = new FormData();

  xhr.open("GET", MAP_URL);
  xhr.setRequestHeader('Accept', 'text/json');
  xhr.onload = function() {
    if (callback) {
      callback(xhr.response);
    }
  };
  xhr.send();
}

function getDisplays(callback) {
  var xhr = new XMLHttpRequest();
  var formData = new FormData();

  xhr.open("GET", REGISTRATION_URL);
  xhr.setRequestHeader('Accept', 'text/json');
  xhr.onload = function() {
    if (callback) {
      callback(JSON.parse(xhr.response));
    }
  };
  xhr.send();
}

var displays;

function startController() {
  logEvent("Starting controller", "info");
  getListenAddress(function(addr) {
    document.getElementById('addr').innerHTML=addr;
  });
  getDisplays(function(displayList) {
    displays = displayList;
    connectAll(function() {
       displayAllRegistrationImages(function() {
         // take picture, send map, then
         getMap(function(map) {
           console.log(map);
           logEvent("Got a map");
         });
       });
    });
  });
// here
}

connectAll = function() {
    forEachDisplay(function(display) {
  chrome.socket.create('tcp', function(createInfo) {
    logEvent("Socket created: " + createInfo.socketId, "info");
logEvent("Connecting to " + display.ip);
    chrome.socket.connect(createInfo.socketId, display.ip, 8080, function(result) {
      if (result === 0) {
        display.socketId = createInfo.socketId;
        logEvent("Connected to " + display.ip);
      } else {
        logEvent("Error on socket.connect: " + result, "error");
      }
    });
  });
    });
};

function test(index) {
  displayRegistrationImage(displays[index], function(msg) { logEvent(msg); });
}

function displayRegistrationImage(socketId, callback) {
    sendCommand(socketId, "REGISTER", callback);
}

function clearDisplay(socketId, callback) {
    sendCommand(socketId, "CLEAR", callback);
}

function forEachDisplay(fn) {
    Object.keys(displays).forEach(function(key, index) {
        fn(displays[key]);
    });
}

function forEachConnectedDisplay(fn) {
    Object.keys(displays).forEach(function(key, index) {
        if (displays[key].socketId) { fn(displays[key].socketId); }
    });
}

clearAllDisplays = function() { forEachConnectedDisplay(function(display) { clearDisplay(display, function() {}); }); };
displayAllRegistrationImages = function() { forEachConnectedDisplay(function(display) { displayRegistrationImage(display, function() {}); }); };

function sendCommand(socketId, command, callback) {
    var data = command + "\r\n\r\n\r\n";
    var buffer = new ArrayBuffer(data.length);
    var bufferView = new Uint8Array(buffer);
    for (var i=0; i <data.length; i++) bufferView[i] = data.charCodeAt(i); // unicode
    chrome.socket.write(socketId, buffer, function(writeInfo) {
      if (writeInfo.bytesWritten >= 0) {
        var readData = "";
        chrome.socket.read(socketId, 1024, function(readInfo) {
          var rawData = new Uint8Array(readInfo.data);
          for (var i=0; i < readInfo.data.byteLength; i++) {
            readData += String.fromCharCode(rawData[i]); // unicode
          }
          if (readData.substring(0,2) == "OK") {
            callback("OK");
          } else {
            callback("Something");
          }
        });
      } else {
        callback("ERROR!");
      }
    });
}

window.addEventListener('load', startController);
