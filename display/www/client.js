var REG_SERVER="http://xx.xx.com/";
var REGISTRATION_URL = REG_SERVER;
var SERVER_URL = REG_SERVER+"control";
var MAP_URL = REG_SERVER+"map";
var SERVER_PORT = 8080;

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

var clientId;

function getClientId() {
  return Q.promise(function(y,n) {
    if (clientId) {
    logEvent("Got clientId from var: " + clientId);
      y(clientId);
    } else {
      chrome.storage.local.get("clientId", function(items) {
        if (items.clientId) {
    logEvent("Got clientId from local storage: " + items.clientId);
          clientId = items.clientId;
          y(items.clientId);
        } else {
    logEvent("Not got clientId");
          y(null);
        }
      });
    }
  });
}

function setClientId(id) {
  return Q.promise(function(y,n) {
    chrome.storage.local.set({"clientId": id}, function() {
        y();
    });
  });
}

function register(addr, clientId) {
  return Q.promise(function(y,n) {
    var xhr = new XMLHttpRequest();
    var formData = new FormData();

    xhr.open("POST", REGISTRATION_URL);
    xhr.setRequestHeader('Accept', 'text/json');
    xhr.onload = function() {
      y(xhr.response);
    };
    xhr.onerror = function() {
      n(xhr);
    };
    formData.append("ip", addr);
    if (clientId) {
      formData.append("clientId", clientId);
    }
    logEvent("Registering at " + REGISTRATION_URL);
    xhr.send(formData);
  });
}

function getServerInfo() {
  logEvent("getting server info");
  return Q.promise(function(y,n) {
    var xhr = new XMLHttpRequest();

    xhr.open("GET", REGISTRATION_URL);
    xhr.setRequestHeader('Accept', 'text/json');
    xhr.onload = function() {
      logEvent("Server-Got response");
      server_info = JSON.parse(xhr.response);
      var server_ip;
      server_info.forEach(function(item) {
        if (item.ip === my_addr) {
          logEvent("Server-Found controller");
          server_ip = item.controller_ip;
        }
      });
      if (server_ip) {
          //y(JSON.parse('{ "ip" : "192.168.1.127"}'));
          y({ip: server_ip});
      }
    };
    xhr.onerror = function() {
      logEvent("Failed to get server ip");
      n(xhr);
    };
    xhr.send();
  });
}

var CONTROLLER_SERVER_PORT = 8080;
var serversocket;
var serverTimer;
var my_addr;

function startClient() {
  logEvent("Starting client", "info");
  Q.all([getListenAddress(), getClientId()]).then(function(items) {
    var addr = items[0];
    my_addr = addr;
    var clientId = items[1];
    document.getElementById('addr').innerHTML=addr;
    return register(addr, clientId);
  }).then(function(clientId) {
    logEvent("Got clientId: " + clientId);
    setClientId(clientId);
  }).then(function() {
    connectServer();
  }).done();
}

function connectServer() {
  getServerInfo().then( function(serverinfo) {
    chrome.socket.create('tcp', function(createInfo) {
      logEvent("Socket created: " + createInfo.socketId, "info");
      logEvent("Connecting to " + serverinfo.ip);
      chrome.socket.connect(createInfo.socketId, serverinfo.ip, CONTROLLER_SERVER_PORT, function(result) {
        if (result === 0) {
          serversocket = createInfo.socketId;
          logEvent("Connected to " + serversocket);
          commands[createInfo.socketId] = {state: "new", data: "", socketId: createInfo.socketId};
          receiveCommand(createInfo.socketId);
          serverTick();
        } else {
          logEvent("Error on socket.connect: " + result, "error");
          serverTick();
        }
      });
    });
  }, function (reason) {
    logEvent("No server available");
    showRegistrationImage(serverTick);
  });
}

function serverTimeout() {
   if(serversocket) {
     chrome.socket.disconnect(serversocket);
     chrome.socket.destroy(serversocket);
   }
   connectServer();
}
function serverTick() {
  if(serverTimer) clearTimeout(serverTimer);
  serverTimer = setTimeout(serverTimeout,10000);
}

/* Outstanding / in-process requests */
var commands = {};

function receiveCommand(socketId) {
  serverTick();
  chrome.socket.read(socketId, function(readInfo) {
    var newData = "";
    var rawData = new Uint8Array(readInfo.data);
    for (var i=0; i < readInfo.data.byteLength; i++) {
      newData += String.fromCharCode(rawData[i]); // unicode
    }
    commands[socketId].data += newData;
    processCommand(socketId);
    receiveCommand(socketId);
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
//  logEvent("PC: "); logEvent(command);
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
        try {
          command.parameters = JSON.parse(command.data.substring(0, splitPoint));
        } catch (e) {
          command.parameters = command.data.substring(0, splitPoint);
        }
        command.data = command.data.substring(splitPoint+4);
        command.state = "parametersReceived";
        return processCommand(socketId);
      }
      return false;
    case "parametersReceived":
      executeCommand(command, function() {
        ok(socketId);
        command.state = "new";
        if(command.data.length>0) {
          return  processCommand(socketId);
        }
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
    } else if (verb === "MAP") {
        updateMap(command.parameters, callback);
    } else if (verb === "DRAWFULL") {
        drawFullImageFromURL(command.parameters, callback);
    } else if (verb === "DEBUG") {
        showDebugDisplay(callback);
    } else if (verb === "PING") {
        logEvent("Ping rx");
        callback();
    } else {
        logEvent("Unrecognized command: " + verb);
        callback();
    }
}


function clearDisplay(callback) {
  logEvent("Cleared display");
  blankImage();
  callback();
}

function showDebugDisplay(callback) {
  logEvent("Displayed debug info");
  showDebug();
  callback();
}

function showRegistrationImage(callback) {
  logEvent("Showing registration image");
  getListenAddress().then( function(ipv4) {
    drawRegistrationImage(ipv4);
    callback();
  });
}

function updateMap(map, callback) {
  if (map.width && map.height) {
    logEvent("Set area to : " + map.width + " x " + map.height);
    if (map.devices[clientId]) {
      mapdata = map;
      logEvent("Set screen to " + JSON.stringify(map.devices[clientId]));
    } else {
     logEvent("Bad Map: No entry for this device");
    }
  } else {
    logEvent("Bad Map: No width or height");
  }
  callback();
}

function drawFullImageFromURL(url, callback) {
  logEvent("Draw full image: " + url);
  showimage(url);
  callback();
}

//window.addEventListener('load', startServer);
window.addEventListener('load', startClient);
