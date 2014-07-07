var REGISTRATION_URL = "http://192.168.1.136:8080/";
//var REGISTRATION_URL = "http://192.168.0.18:8080/";
var MAP_URL = "http://192.168.1.136:8080/map";
//var MAP_URL = "http://192.168.0.18:8080/map";
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

function getListenAddress() {
  return Q.promise(function(y,n) {
    chrome.socket.getNetworkList(function(interfaces) {
      if (chrome.runtime.lastError) {
        n(chrome.runtime.lastError);
      } else {
        // Filter out ipv6 addresses.
        var ret = interfaces.filter(function(i) {
          return i.address.indexOf(':') === -1;
        }).map(function(i) {
          return i.address;
        }).join(', ');
        listenAddress = ret;
        y(ret);
      }
    });
  });
}


function getMap(callback) {
  return Q.promise(function(y,n) {
    var xhr = new XMLHttpRequest();
    var formData = new FormData();

    xhr.open("GET", MAP_URL);
    xhr.setRequestHeader('Accept', 'text/json');
    xhr.onload = function() {
console.log(xhr.response);
      y(xhr.response);
    };
    xhr.onerror = function() {
      n(xhr);
    };
    xhr.send();
  });
}

function getDisplays(callback) {
  return Q.promise(function(y,n) {
    var xhr = new XMLHttpRequest();
    var formData = new FormData();

    xhr.open("GET", REGISTRATION_URL);
    xhr.setRequestHeader('Accept', 'text/json');
    xhr.onload = function() {
      y(JSON.parse(xhr.response));
    };
    xhr.onerror = function() {
      n(xhr);
    };
    xhr.send();
  });
}

var displays;

function startController() {
  logEvent("Starting controller", "info");
  getListenAddress().then(function(addr) {
    document.getElementById('addr').innerHTML=addr;
  });
  getDisplays().then(function(displayList) {
    displays = displayList;
    Q.all(connectAll()).then(function() {
       Q.all(displayAllRegistrationImages()).then(function() {
         // take picture, send map, then
         getMap().then(function(map) {
           console.log(map);
           logEvent("Got a map");
         });
       });
    });
  });
// here
}

function connect(display) {
  return Q.promise(function (y,n) {
    chrome.socket.create('tcp', function(createInfo) {
      logEvent("Socket created: " + createInfo.socketId, "info");
      logEvent("Connecting to " + display.ip);
      chrome.socket.connect(createInfo.socketId, display.ip, DISPLAY_SERVER_PORT, function(result) {
        if (result === 0) {
          display.socketId = createInfo.socketId;
          logEvent("Connected to " + display.ip);
          y(display);
        } else {
          logEvent("Error on socket.connect: " + result, "error");
          n(result);
        }
      });
    });
  });
}

// Returns an array of promises
connectAll = function() {
  return forEachDisplay(connect);
};

function test(index) {
  displayRegistrationImage(displays[index], function(msg) { logEvent(msg); });
}

function displayRegistrationImage(socketId, callback) {
    return sendCommand(socketId, "REGISTER", callback);
}

function clearDisplay(socketId, callback) {
    return sendCommand(socketId, "CLEAR", callback);
}

// Returns an array of results (in the case where the passed-in function
// returns a promise, returns an array of promises)
function forEachDisplay(fn) {
  return displays.map(function(display) {
    return fn(display);
  });
}

// Returns an array of results (in the case where the passed-in function
// returns a promise, returns an array of promises)
function forEachConnectedDisplay(fn) {
  var x = displays.filter(function(display) {
    return !!(display.socketId);
  }).map(function(display) {
    return fn(display); // was display.socketId
  });
  return x;
}

clearAllDisplays = function() { forEachConnectedDisplay(function(display) { clearDisplay(display, function() {}); }); };
displayAllRegistrationImages = function() {
  return forEachConnectedDisplay(function(display) {
    return displayRegistrationImage(display.socketId);
  });
};

// Returns a promise
function sendCommand(socketId, command) {
  // Something about
logEvent("writing " + command + " to socket " + socketId);
  return write(socketId, buildCommand(command)).then(function() {
logEvent("reading from socket " + socketId);
    return read(socketId, 1024);
  }).then(function(data) {
logEvent("Got data: " + data);
    if (data.substring(0,2) == "OK") {
      return("OK");
    } else {
      throw new Error("Something");
    }
  });
}

function buildCommand(command) {
  var data = command + "\r\n\r\n\r\n";
  var buffer = new ArrayBuffer(data.length);
  var bufferView = new Uint8Array(buffer);
  for (var i=0; i <data.length; i++) bufferView[i] = data.charCodeAt(i); // unicode
  return buffer;
}

function write(socketId, buffer) {
  return Q.promise(function(y, n) {
    chrome.socket.write(socketId, buffer, function(writeInfo) {
      if (writeInfo.bytesWritten >= 0) {
        y(writeInfo);
      } else {
        n(writeInfo);
      }
    });
  });
}

function read(socketId, bufferSize) {
  return Q.promise(function(y, n) {
    var readData = "";
    chrome.socket.read(socketId, bufferSize, function(readInfo) {
      var rawData = new Uint8Array(readInfo.data);
      for (var i=0; i < readInfo.data.byteLength; i++) {
        readData += String.fromCharCode(rawData[i]); // unicode
      }
      y(readData);
    });
  });
}
window.addEventListener('load', startController);
