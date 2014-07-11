var REG_SERVER="http://xx.xx.com/";
var REGISTRATION_URL = REG_SERVER;;
var SERVER_URL = REG_SERVER+"control";
var MAP_URL = REG_SERVER+"map/"
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


function getMap() {
  return Q.promise(function(y,n) {
    var xhr = new XMLHttpRequest();
    var formData = new FormData();

    xhr.open("GET", MAP_URL);
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

function getDisplays() {
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

function registerServer(addr) {
    return Q.promise(function(y,n) {
    var xhr = new XMLHttpRequest();
    var formData = new FormData();

    xhr.open("POST", REGISTER_SERVER_URL);
    xhr.setRequestHeader('Accept', 'text/json');
    xhr.onload = function() {
      y(xhr.response);
    };
    xhr.onerror = function() {
      n(xhr);
    };
    formData.append("ip", addr);
    logEvent("Registering at " + REGISTER_SERVER_URL);
    xhr.send(formData);
  });
}

var displays;
var currentImageUrl="Chrome_logo.png";

function startController() {
  logEvent("Starting controller", "info");
  getListenAddress().then(function(addr) {
    document.getElementById('addr').innerHTML=addr;
    registerServer(addr);
  });
  getMap().then(function(map) {
    mapdata = map;
    console.log(map);
    logEvent("Got a map");
  });
  getDisplays().then(function(displayList) {
    displays = displayList;
  });
  startServer();

  document.getElementById('drawURL').addEventListener('click', function(ev) {
    currentImageUrl = document.getElementById('url').value;
    Q.all(drawUrlOnAllClients(currentImageUrl));
  });
  document.getElementById('bblank').addEventListener('click', function(ev) {
    Q.all(clearAllDisplays());
  });
  document.getElementById('brefimage').addEventListener('click', function(ev) {
    Q.all(displayAllRegistrationImages());
  });
  document.getElementById('bdebug').addEventListener('click', function(ev) {
    Q.all(debugAllDisplays());
  });
  document.getElementById('bmap').addEventListener('click', function(ev) {
    showmap();
    Q.all(sendMapToClients(mapdata));
  });
}

function startServer() {
  chrome.socket.create('tcp', function(createInfo) {
    logEvent("Socket created: " + createInfo.socketId, "info");
    chrome.socket.listen(createInfo.socketId, '0.0.0.0', DISPLAY_SERVER_PORT, function(result) {
      if (result === 0) {
        listenForConnectionAndDispatchReceiver(createInfo.socketId);
      } else {
        logEvent("Error on socket.listen: " + result, "error");
      }
    });
  });
  setInterval( function() {
    sendAllPing();
  },5000);
}

function listenForConnectionAndDispatchReceiver(socketId) {
  chrome.socket.accept(socketId, function(acceptInfo) {
    logEvent("Connection established on socket " + acceptInfo.socketId);
    chrome.socket.getInfo(acceptInfo.socketId, function (socketinfo) {
      attachDisplay(acceptInfo.socketId, socketinfo);
    });
    listenForConnectionAndDispatchReceiver(socketId);
  });
}

function attachDisplay(socketid, socketinfo) {
  var found=0;
  logEvent("Attaching display: "+socketinfo.peerAddress);
  for(var d=0;d<displays.length;d++) {
    var display=displays[d];
    if(display.ip === socketinfo.peerAddress) {
      display.socketId=socketid;
      displayRegistrationImage(socketid);
      sendMap(socketid,mapdata);
      found=1;
    }
  }
  if(found==0) {
    logEvent("Unknown display attached");
  }
}
/*
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
*/

function test(index) {
  displayRegistrationImage(displays[index], function(msg) { logEvent(msg); });
}

function displayRegistrationImage(socketId) {
    return sendCommand(socketId, "REGISTER");
}

function clearDisplay(socketId) {
    return sendCommand(socketId, "CLEAR");
}

function sendMap(socketId, map) {
    return sendCommand(socketId, "MAP", map);
}

function drawFullPicture(socketId, url) {
    return sendCommand(socketId, "DRAWFULL", url);
}

function sendDebug(socketId) {
    return sendCommand(socketId, "DEBUG");
}

function sendPing(socketId) {
    return sendCommand(socketId, "PING");
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

// Returns an array of promises
sendAllPing = function() {
  return forEachConnectedDisplay(function(display) {
    return sendPing(display.socketId);
  });
}

// Returns an array of promises
clearAllDisplays = function() {
  return forEachConnectedDisplay(function(display) {
    return clearDisplay(display.socketId);
  });
};

// Returns an array of promises
displayAllRegistrationImages = function() {
  return forEachConnectedDisplay(function(display) {
    return displayRegistrationImage(display.socketId);
  });
};

// Returns an array of promises
sendMapToClients = function(map) {
  return forEachConnectedDisplay(function(display) {
    return sendMap(display.socketId, map);
  });
};

// Returns an array of promises
drawUrlOnAllClients = function(url) {
  return forEachConnectedDisplay(function(display) {
    return drawFullPicture(display.socketId, url);
  });
};

// Returns an array of promises
debugAllDisplays = function(url) {
  return forEachConnectedDisplay(function(display) {
    return sendDebug(display.socketId);
  });
};


// Returns a promise
function sendCommand(socketId, command, params) {
  // Something about
logEvent("writing " + command + " to socket " + socketId);
  return write(socketId, buildCommand(command, params)).then(function() {
    return read(socketId, 1024);
  }).then(function(data) {
    if (data.substring(0,2) == "OK") {
      return("OK");
    } else {
      throw new Error("Error reading socket after command");
    }
  });
}

function buildCommand(command, params) {
  var data = command + "\r\n" + (typeof params === "undefined" ? "" : JSON.stringify(params)) + "\r\n\r\n";
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
