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

var displays = {};
displays[1] = {"clientIp": "192.168.1.130"};
displays[2] = {"clientIp": "192.168.1.124"};

function startController() {
  logEvent("Starting controller", "info");
  getListenAddress(function(addr) {
    document.getElementById('addr').innerHTML=addr;
  });
connectAll();
// here
}

connectAll = function() {
    forEachDisplay(function(display) {
  chrome.socket.create('tcp', function(createInfo) {
    logEvent("Socket created: " + createInfo.socketId, "info");
    chrome.socket.connect(createInfo.socketId, display.clientIp, 8080, function(result) {
      if (result === 0) {
        display.socketId = createInfo.socketId;
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

window.onload = startController;
