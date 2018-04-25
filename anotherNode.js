var PORT = 41235;
var MY_NAME = "Another Node"
GENERAL_PORT = 41234

var dgram = require('dgram');
var server = dgram.createSocket('udp4');

var MY_ID = Math.floor(Math.random() * 1000);
var message1 = [];

var knownNodes = {};

function process_broad(data){
    // [0, ID, ADDR, PORT, NAME]
    newNodeInfo = {};
    newNodeInfo['ADDR'] = data[2];
    newNodeInfo['PORT'] = +data[3];
    newNodeInfo['NAME'] = data[4];

    // sending info about known nodes
    keys = Object.keys(knownNodes);
    for(i in keys){
        message = []
        message.push(1)
        message.push(+keys[i])
        message.push(knownNodes[keys[i]].ADDR)
        message.push(knownNodes[keys[i]].PORT)
        message.push(knownNodes[keys[i]].NAME)
        message = JSON.stringify(message);

        console.log('<- To "' + newNodeInfo['NAME'] + '":\t' + message);
        server.send(message, 0, message.length, +newNodeInfo['PORT'], newNodeInfo['ADDR'], function(err, bytes) {
            if (err) throw err;
        });
    }

    newNodeID = data[1];
    knownNodes[newNodeID] = newNodeInfo
}

function process_broad_answ(data){
    // [1, ID_node, ADDR, PORT, NAME]

    newNodeInfo = {};
    newNodeInfo['ADDR'] = data[2];
    newNodeInfo['PORT'] = +data[3];
    newNodeInfo['NAME'] = data[4];

    if(knownNodes[data[1]] == undefined){
        knownNodes[data[1]] = newNodeInfo;
        console.log("I memorised " + data[4])
    }
}

function put(data){
    // [6, ID, ADDR, PORT]

}

function process_ok(data){
    // [7, ID]

}

function process_get(data){
    // [2, ID]

    // look at
    // [3, ID, ADDR, PORT]

    // I have
    // [5, sID, NAME, LENGHT]
}

server.on('message', function (raw_message, remote) {
    console.log('Caught req from:\t' + remote.address + ':' + remote.port);
    
    // receiving and processing
    message = String(raw_message);

    message = message.replace('[', '').replace(']', '');
    data = message.split(",");
    for (i in data){
        data[i].trim();
    }

    console.log('Received message:\t' + String(raw_message));
    command = Number(data[0]);

    switch(command){
        case 0:
        process_broad(data);
        break;

        case 1:
        process_broad_answ(data);
        break;

        case 3:
        break;

        case 4: console.log('hello 2');
        break;

        case 5: console.log('hello 2');
        break;

        case 6: console.log('hello 2');
        break;

        case 7: console.log('hello 2');
        break;

        default: console.log('hello default');
    }
    console.log("______________________________________________________" + '\n');
//     server.send('hello', 0, 'hello'.length, PORT, HOST, function(err, bytes) {
//       if (err) throw err;
//       console.log('UDP message sent to ' + HOST +':'+ PORT);
//       server.close();
//   });


});

server.on('listening', function () {
    var address = server.address();
    server.setBroadcast(true);

    var thisNode = {};
    thisNode['ADDR'] = address.address;
    thisNode['PORT'] = address.port;
    thisNode['NAME'] = MY_NAME;

    knownNodes[+MY_ID] = thisNode;

    console.log('Address: ' + address.address + ":" + address.port + `. Name: ${MY_NAME}, ID: ${MY_ID}`);
    console.log("______________________________________________________" + '\n');
    broad() 
});

// BOOT
function broad(){
  var commandNum = 0;
  var MY_ID = 100;
  var address = server.address();
  var message = `[${commandNum},${MY_ID},${address.address},${address.port},${MY_NAME}]`;
    // var message = "[0,100,0.0.0.0,41235,AnotherNode]";
  server.send(message, 0, message.length, GENERAL_PORT, '255.255.255.255', function(err, bytes) {
      if (err) throw err;
      console.log('! BROADCAST DONE');
  });
}

server.bind(PORT);