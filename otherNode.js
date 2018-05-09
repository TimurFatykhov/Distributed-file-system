var dgram = require('dgram');
var md5 = require('js-md5');
var fproc = require('./fileProcessing.js');

function printSeparator(){
    console.log("______________________________________________________" + '\n');
};

var PORT = 41235;
var GENERAL_PORT = 41234;
var MY_ID = md5(String(Math.floor(Math.random() * 1e5)));
var MY_NAME = "sadomango777";
var mySocket = dgram.createSocket('udp4');
const STORAGE_DIR_NAME = 'storage'
const STORAGE_PATH = `${__dirname}/${STORAGE_DIR_NAME}`

fproc = new fproc(STORAGE_PATH);

// If you want to switch off broadcast: pass 'no-broad' as 1st parameter with calling myNode.py script by terminal
noBroadcast = false;
if(process.argv[2] == 'no-broad'){
    noBroadcast = true;
}
if(Number.isInteger(process.argv[2])){
    GENERAL_PORT = +process.argv[2];
}

// nodes store
var knownNodes = {};

// store info about file holders
var fileHolderDB = {};

// store files 
var fileDB = {};

function processBroad(data){
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
                throw err
            };
        });
    }

    newNodeID = data[1];
    knownNodes[newNodeID] = newNodeInfo
    console.log(`I memorised ${newNodeInfo['NAME']}`)
}

function processBroadAnsw(data){
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

function saveFileHolder(data){
    // [6,ID,IDholder,address,port]
    // ID - file ID
    // IDholder - holder ID

    fileDB[ID] = {};

    var holderInfo = {}
    holderInfo['ID'] = data[2];
    holderInfo['ADDR'] = data[3];
    holderInfo['PORT'] = data[4];

    fileDB[ID]['holderInfo'] = holderInfo;

    var message = [7, MY_ID];
    message = JSON.stringify(message);
    console.log('<- To "' + knownNodes[holderInfo['ID']].NAME + '":\t' + message);
    mySocket.send(message, 0, message.length, +holderInfo['PORT'], holderInfo['ADDR'], function(err, bytes) {
        if (err) {
            throw err
        };
    });
}

function saveFileHolderAnsw(data){
    // [7,ID]

    // проверяем: все ли получили?!
}

function processGetFile(data, addrRes, portRes){
    // [2, ID]
    // maybe [2, ID, IDs]
    var searchID = data[1];

    keys = Object.keys(fileDB);
    for(i in keys){
        if (searchID == keys[i]){ // contain
            // ANSW: [5,ID,IDholder,filename,length]
            var message = [5, searchID, MY_ID, fileDB[searchID].realName, fileDB[searchID].size];
            message = JSON.stringify(message);
            console.log('<- To "' + `${addrRes}:${portRes}` + '":\t' + message);
            mySocket.send(message, 0, message.length, +portRes, addrRes, function(err, bytes) {
                if (err) {
                    throw err
                };
            });
        }
        else{ // doesn't contain
        // ANSW: [3,ID,IDholder,address,port]

        }
    }
}

function processLookAt(data){
    // [3, ID, ADDR, PORT]

}

function processIHave(data){
    // [5, sID, NAME, LENGHT]

}

mySocket.on('message', function (raw_message, remote) {
    console.log('Caught req from:\t' + remote.address + ':' + remote.port);
    
    data = JSON.parse(raw_message);

    console.log('Received message:\t' + String(raw_message));
    command = Number(data[0]);

    switch(command){
        case 0:
        processBroad(data);
        break;

        case 1:
        processBroadAnsw(data);
        break;

        case 2:
        processGetFile(data, remote.address, remote.port);
        break;

        case 3:
        processLookAt(data);
        break;

        case 5:
        processIHave(data);
        break;

        case 6: 
        saveFileHolder(data);
        break;

        case 7:
        saveFileHolderAnsw(data);
        break;

        default: console.log('command is incorrect');
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

    var builtInFilesInfo = fproc.processFiles(1024);
    fileDB = builtInFilesInfo;
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
            throw err
        };
        console.log('BROADCAST DONE');
         printSeparator()
    });
  }

mySocket.bind(PORT);