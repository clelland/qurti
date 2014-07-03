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

function startServer() {
  logEvent("Starting server", "info");
  getListenAddress(function(addr) {
    document.getElementById('addr').innerHTML=addr;
  });
  chrome.socket.create('tcp', function(createInfo) {
    logEvent("Socket created: " + createInfo.socketId, "info");
    chrome.socket.listen(createInfo.socketId, '0.0.0.0', 8080, function(result) {
      if (result === 0) {
        listenForConnectionAndDispatchReceiver(createInfo.socketId);
      } else {
        logEvent("Error on socket.listen: " + result, "error");
      }
    });
  });
}

function listenForConnectionAndDispatchReceiver(socketId) {
  chrome.socket.accept(socketId, function(acceptInfo) {
    logEvent("Connection established on socket " + acceptInfo.socketId);
    commands[acceptInfo.socketId] = {state: "new", data: "", socketId: acceptInfo.socketId};
    receiveCommand(acceptInfo.socketId);
    listenForConnectionAndDispatchReceiver(socketId);
  });
}

/* Outstanding / in-process requests */
var commands = {};

function receiveCommand(socketId) {
  chrome.socket.read(socketId, function(readInfo) {
    var newData = "";
    var rawData = new Uint8Array(readInfo.data);
    for (var i=0; i < readInfo.data.byteLength; i++) {
      newData += String.fromCharCode(rawData[i]); // unicode
    }
    commands[socketId].data += newData;
    if (!processCommand(socketId)) {
      receiveCommand(socketId);
    }
  });
}

function sendResponse(socketId, response, callback) {
    var data = response + "\n";
    var buffer = new ArrayBuffer(data.length);
    var bufferView = new Uint8Array(buffer);
    for (var i=0; i <data.length; i++) bufferView[i] = data.charCodeAt(i); // unicode
    chrome.socket.write(socketId, buffer, callback);
}

function ok(socketId, callback) {
    sendResponse(socketId, "OK", callback);
}

function processCommand(socketId) {
  var command = commands[socketId];
  var splitPoint;
  switch (command.state) {
    case "new":
      splitPoint = command.data.indexOf("\r\n");
      if (splitPoint > -1) {
        command.commandLine = command.data.substring(0, splitPoint);
        command.data = command.data.substring(splitPoint+2);
        command.state = "requestReceived";
        return processCommand(socketId);
      }
      return false;
    case "requestReceived":
      splitPoint = command.data.indexOf("\r\n\r\n");
      if (splitPoint > -1) {
        //command.parameters = parseParameters(command.data.substring(0, splitPoint));
        command.parameters = command.data.substring(0, splitPoint);
        command.data = command.data.substring(splitPoint+4);
        command.state = "parametersReceived";
        return processCommand(socketId);
      }
      return false;
    case "parametersReceived":
      executeCommand(command, function() {
        ok(socketId);
        command.state = "new";
        command.data = "";
        receiveCommand(socketId);
      });
      return true;
  }
}

function executeCommand(command, callback) {
    logEvent("command received");
    var parts = command.commandLine.split(' ');
    var verb = parts[0];
    if (verb === "CLEAR") {
        clearDisplay(callback);
    } else if (verb === "REGISTER") {
        showRegistrationImage(callback);
    } else {
        logEvent("Unrecognized command: " + verb);
        callback();
    }
}


function clearDisplay(callback) {
  logEvent("Cleared display");
  callback();
}

function showRegistrationImage(callback) {
  logEvent("Showing registration image");
  callback();
}

window.onload = startServer;
