var dgram = require('dgram');
var md5 = require('js-md5');
const fs = require('fs');

function printSeparator(){
    console.log("______________________________________________________" + '\n');
};

var PORT = 41234;
var GENERAL_PORT = 41234;
var MY_ID = md5(String(Math.floor(Math.random() * 1e5)));
var MY_NAME = "sadomango777";
var mySocket = dgram.createSocket('udp4');

// If you want to switch off broadcast: pass 'no-broad' as 1st parameter with calling myNode.py script by terminal
noBroadcast = false;
if(process.argv[2] == 'no-broad'){
    noBroadcast = true;
}
if(Number.isInteger(process.argv[2])){
    GENERAL_PORT = +process.argv[2];
}

// read file names from path
const storagePath = './storage';
fs.readdir(storagePath, (err, files) => {
    console.log('FILES IN STORAGE:');
    files.forEach(file => {
      console.log(file);
    });
    printSeparator();
  })

// nodes store
var knownNodes = {};

function process_broad(data){
    // [0, ID, ADDR, PORT, NAME]
    newNodeInfo = {};
    newNodeInfo['ADDR'] = data[2];
    newNodeInfo['PORT'] = +data[3]; // STORE INTEGER VALUE!!! NOT STRING
    newNodeInfo['NAME'] = data[4];

    // sending info about known nodes
    keys = Object.keys(knownNodes);
    for(i in keys){
        var message = [1, MY_ID, +keys[i], knownNodes[keys[i]].ADDR, knownNodes[keys[i]].PORT, knownNodes[keys[i]].NAME ];
        message = JSON.stringify(message);
        console.log('<- To "' + newNodeInfo['NAME'] + '":\t' + message);
        mySocket.send(message, 0, message.length, +newNodeInfo['PORT'], newNodeInfo['ADDR'], function(err, bytes) {
            if (err) {
                console.log('\n********************************'); 
                console.log('*** Looks like you tried to make broadcast, but GENERAL_PORT is occupied.'); 
                console.log('*** Try to run script with parameter "myNode.js no-broad" from terminal.'); 
                console.log('********************************\n'); 
                throw err
            };
        });
    }

    newNodeID = data[1];
    knownNodes[newNodeID] = newNodeInfo
    console.log(`I memorised ${newNodeInfo['NAME']}`)
}

function process_broad_answ(data){
    // [1, IDsource, ID_node, ADDR, PORT, NAME]

    newNodeInfo = {};
    newNodeInfo['ADDR'] = data[3];
    newNodeInfo['PORT'] = +data[4];
    newNodeInfo['NAME'] = data[5];

    if(knownNodes[data[1]] == undefined){
        knownNodes[data[1]] = newNodeInfo;
        console.log(`I memorised ${newNodeInfo['NAME']}`)
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

mySocket.on('message', function (raw_message, remote) {
    console.log('Caught req from:\t' + remote.address + ':' + remote.port);
    
    data = JSON.parse(raw_message);

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
     printSeparator()
});

mySocket.on('listening', function () {
    var address = mySocket.address();
    mySocket.setBroadcast(true);

    var thisNode = {};
    thisNode['ADDR'] = address.address;
    thisNode['PORT'] = address.port;
    thisNode['NAME'] = MY_NAME;

    knownNodes[+MY_ID] = thisNode;

    console.log('Address: ' + address.address + ":" + address.port + `. Name: ${MY_NAME}, ID: ${MY_ID}`);
     printSeparator()
    if (noBroadcast) return
    
    broad();
});

// broad
function broad(){
    var commandNum = 0;
    var MY_ID = 100;
    var address = mySocket.address();
    var message = [commandNum, MY_ID, address.address, address.port, MY_NAME ];
    message = JSON.stringify(message);
    mySocket.send(message, 0, message.length, GENERAL_PORT, '255.255.255.255', function(err, bytes) {
        if (err) {
            console.log('***Looks like you tried to make broadcast, but GENERAL_PORT is occupied.***'); 
            console.log('***Try to run script with parameter "myNode.js no-broad" in terminal.***'); 
            throw err
        };
        console.log('BROADCAST DONE');
         printSeparator()
    });
  }

mySocket.bind(PORT);