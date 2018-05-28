var dgram = require('dgram');
var md5 = require('js-md5');
var fproc = require('./fileProcessing.js');

function printSeparator(){
    console.log("______________________________________________________" + '\n');
};

var PORT = 41236;
var F_CHUNK_SIZE = 1024;    // size of chunk in our dicstributed system
const STORAGE_DIR_NAME = 'anotherStorage'
var MY_NAME = "anotherNode";
// var MY_ID = String(md5(String(Math.floor(Math.random() * 1e5))));
var MY_ID = 'a24c1742acc08a5da8f3dd4053e38b27';
var MY_ADDR = "";
var exportCallback;         // callback passed by server

var requestedFiles = {};
var GENERAL_PORT = 41234;
var mySocket = dgram.createSocket('udp4');
const STORAGE_PATH = `${__dirname}/${STORAGE_DIR_NAME}`

fproc = new fproc(STORAGE_PATH);

// If you want to switch off broadcast: pass 'no-broad' as 1st parameter with calling myNode.py script by terminal
var noBroadcast = false;
if(process.argv[2] == 'no-broad'){
    noBroadcast = true;
}
var keepSilent = true;
if(process.argv[2] == 'debug'){
    keepSilent = false;
}

if(Number.isInteger(process.argv[2])){
    GENERAL_PORT = +process.argv[2];
}

var knownNodes = {};        // nodes store

var filesDB = {};           // store files 
var fileSet = new Set();      // set of stored files on current node

// [0, ID, ADDR, PORT, NAME]
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

    // now we have to send info about own stored files
    shareInfoAboutMyFiles(filesDB);
}

// [1, IDsource, ID_node, ADDR, PORT, NAME]
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

    // **************_HARDCODE BELOW_**************
    // **************_HARDCODE BELOW_**************
    // **************_HARDCODE BELOW_**************

    // HARDCODE_FILEID = Object.keys(knownNodes)[1];
    // HARDCODE_FILEID = '59ca0efa9f5633cb0371bbc0353378d8';
    // var nearestHolder = getNearestNodes(HARDCODE_FILEID, 1)['nodes'][0][0];

    // var nearAddr = knownNodes[nearestHolder]['ADDR'];
    // var nearPort = knownNodes[nearestHolder]['PORT'];
    // findFileInSystem(HARDCODE_FILEID, nearestHolder, nearAddr, nearPort)
    // **************_HARDCODE ABOVE_**************
    // **************_HARDCODE ABOVE_**************
    // **************_HARDCODE ABOVE_**************
}

// [2, ID]
function processGetFile(data, addrRes, portRes){
    // [2, ID]
    var searchID = data[1];
    contain = fileSet.has(searchID);

    if (contain){   // i have
        // ANSW: [5,ID,IDholder,filename,length]
        var message = [5, searchID, MY_ID, searchID, filesDB[searchID].size];
        message = JSON.stringify(message);
        console.log('<- To "' + `${addrRes}:${portRes}` + '":\t' + message);
        mySocket.send(message, 0, message.length, +portRes, addrRes, function(err, bytes) {
            if (err) {
                throw err
            };
        });
    }
    else{
        // ANSW: [3,ID,IDholder,address,port]
        var nearestNodes = getNearestNodes(searchID, 2)['nodes'];
        for (var i = 0; i < Math.min(nearestNodes.length, 2); i++){
            console.log('port here: ' + mySocket.address.port);

            var message = [3, searchID, nearestNodes[i][0], mySocket.address.address, mySocket.address.port];
            message = JSON.stringify(message);
            console.log('<- To "' + `${addrRes}:${portRes}` + '":\t' + message);
            mySocket.send(message, 0, message.length, +portRes, addrRes, function(err, bytes) {
                if (err) {
                    throw err
                };
            });
        }
    }
}
// [3,ID,IDholder,address,port]
function processLookAt(data){
    // [3,ID,IDholder,address,port]
    console.log(`It said look for ${data[3]} at holder ${knownNodes[data[2]]['NAME']}`);
    // findFileInSystem(data[1], data[2], data[3], data[4]);
}

// [5,ID,IDholder,filename,length]
function processIHave(data){
    // [5,ID,IDholder,filename,length]
    console.log('WE FOUND THE FILE!');
    console.log(`filename: ${data[3]}, holder: ${knownNodes[data[2]]['NAME']}`);

    var fileNameH = data[3];    // hash name
    var length = data[4];
    var numOfBlocks = Math.ceil(length/F_CHUNK_SIZE);
    var nodeInfo = knownNodes[data[2]];
    console.log(`filenameH: ${fileNameH}, blocks num: ${numOfBlocks}`);
    askForFile(fileNameH, 0, numOfBlocks, knownNodes[data[2]]['ADDR'], knownNodes[data[2]]['PORT']);
}

// [6,ID,IDholder,address,port]
function saveFileHolder(data){
    // [6,ID,IDholder,address,port]
    //       ID - file ID
    // IDholder - holder ID
    var ID = data[1];
    filesDB[ID] = {};

    var holderInfo = {}
    holderInfo['ID'] = data[2];
    holderInfo['ADDR'] = data[3];
    holderInfo['PORT'] = data[4];

    filesDB[ID]['holder'] = holderInfo;

    var message = [7, MY_ID];
    message = JSON.stringify(message);
    console.log('<- To "' + knownNodes[holderInfo['ID']].NAME + '":\t' + message);
    mySocket.send(message, 0, message.length, +holderInfo['PORT'], holderInfo['ADDR'], function(err, bytes) {
        if (err) {
            throw err
        };
    });

    console.log(`I know that ${knownNodes[data[2]]["NAME"]} has a file ${data[1]}`);
}

// [7,ID]
function saveFileHolderAnsw(data, addr, port){
    // [7,ID]
    console.log(`${addr}:${port} knows that i have file ${data[1]}`)
    // проверяем: все ли получили?!
}

// received: ?<FILE HASH><index><number of blocks to get>         1 + 16 + 4 + 4 bytes?
function giveHashBlocks(buf, addr, port){
    var fileHashBytes = buf.slice(1, 17);
    var fileHashHex = bytesToHex(fileHashBytes);

    if(filesDB[fileHashHex] == undefined){
        console.log('I have not requested file!');
        return;
    }

    var indexBytes = buf.slice(17,21);
    var index = indexBytes.readUInt32BE(0);
    var numOfBlocks = buf.readUInt32BE(21);

    if(!keepSilent) console.log('from giveBLocks fileHashHEX: ' + fileHashHex)
    
    if (numOfBlocks + i > filesDB[fileHashHex].numOfChunks){
        console.log("ATTENTION!!!! requested more num of blocks then i have! => return");
        return
    }

    // send <- '@<FILE HASH><index><HASH OF BLOCK><HASH OF BLOCK> 1 + 16 + 4 + fileSize
    var carriage = 0;       // carriage for message
    var metaLength = 21;
    var hChunkSize = 16;    // 16 bytes for hash
    var fileSize = filesDB[fileHashHex].numOfChunks * hChunkSize;
    var message = Buffer.alloc(metaLength + fileSize);
    var twoPartsBytes = Buffer.concat([Buffer.from('@'), fileHashBytes, indexBytes], metaLength);    
    twoPartsBytes.copy(message, 0, 0, metaLength); // target, targetStart, srcStart, srcEnd
    carriage += metaLength;

    for(var i = index; i < Math.min(filesDB[fileHashHex].numOfChunks, numOfBlocks); i++){
        var chunkHex = filesDB[fileHashHex].hChunks[i];
        var chunkBytes = hexToBytes(chunkHex);
        chunkBytes.copy(message, carriage, 0, hChunkSize); // target, targetStart, srcStart, srcEnd
        carriage += hChunkSize;
    }

    mySocket.send(message, 0, carriage, +port, addr, function(err, bytes){
        if(err) throw err;
    });
}

// received: -<FILE HASH><index><number of blocks to get>         1 + 16 + 4 + 4 bytes?
function giveFileBlocks(buf, addr, port){
    var fileHashBytes = buf.slice(1, 17);
    var fileHashHex = bytesToHex(fileHashBytes);

    if(filesDB[fileHashHex] == undefined){
        console.log('I have not requested file!');
        return;
    }

    var indexBytes = buf.slice(17,21);
    var index = indexBytes.readUInt32BE(0);
    var numOfBlocks = buf.readUInt32BE(21);

    if(!keepSilent) console.log('from giveBLocks fileHashHEX: ' + fileHashHex)
    
    if (numOfBlocks + i > filesDB[fileHashHex].numOfChunks){
        console.log("ATTENTION!!!! requested more num of blocks then i have! => return");
        return
    }

    // send <- '+<FILE HASH><index><BLOCK><BLOCK> 1 + 16 + 4 + fileSize
    var carriage = 0;       // carriage for message
    var metaLength = 21;
    var fileSize = filesDB[fileHashHex].numOfChunks * F_CHUNK_SIZE;
    var message = Buffer.alloc(metaLength + fileSize);
    var twoPartsBytes = Buffer.concat([Buffer.from('+'), fileHashBytes, indexBytes], metaLength);    
    twoPartsBytes.copy(message, 0, 0, metaLength); // target, targetStart, srcStart, srcEnd
    carriage += metaLength;

    for(var i = index; i < Math.min(filesDB[fileHashHex].numOfChunks, numOfBlocks); i++){
        var chunkBytes = filesDB[fileHashHex].fChunks[i];
        chunkBytes.copy(message, carriage, 0, F_CHUNK_SIZE); // target, targetStart, srcStart, srcEnd
        carriage += F_CHUNK_SIZE;
    }

    mySocket.send(message, 0, carriage, +port, addr, function(err, bytes){
        if(err) throw err;
    });
}

// received: '@<FILE HASH><index><HASH OF BLOCK><HASH OF BLOCK> 1 + 16 + 4 + fileSize
function getHashChunks(buf, addr, port){
    var fileHashBytes = buf.slice(1, 17);
    var hName = bytesToHex(fileHashBytes);

    if(filesDB[hName] == undefined){
        console.log("I didn't request this file!");
        return;
    }

    var index = requestedFiles[hName].index;
    var numOfBlocks = requestedFiles[hName].numOfBlocks;
    var hBlock;

    console.log("&&&&&&&&&&&&&&&&&&&");
    for(var i = index, j = 0; i < numOfBlocks; j++, i++){
        var hBlock = buf.slice(21+j*16, 21+(j+1)*16);
        requestedFiles[hName].hBlocks[i] = bytesToHex(hBlock);
    }
    requestedFiles[hName]['hBlocksReceived'] = true;
    if(requestedFiles[hName]['fBlocksReceived'] & requestedFiles[hName]['hBlocksReceived']){
        tryToSaveFile(hName);
    }
    console.log("&&&&&&&&&&&&&&&&&&&");
}

// received: '+<FILE HASH><index><BLOCK><BLOCK> 1 + 16 + 4 + fileSize
function getFileChunks(buf, addr, port){
    var fileHashBytes = buf.slice(1, 17);
    var hName = bytesToHex(fileHashBytes);

    if(filesDB[hName] == undefined){
        console.log("I didn't request this file!");
        return;
    }

    var index = requestedFiles[hName].index;
    var numOfBlocks = requestedFiles[hName].numOfBlocks;
    var metaSize = 21;
    var fileSize = buf.length - metaSize;  // for last part size calculating
    var remainderSize = fileSize;

    console.log("%%%%%%%%%%%%%%%%%%");


    var chunkSize = Math.min(remainderSize, F_CHUNK_SIZE);
    for(var i = index, j = 0; i < numOfBlocks; j++, i++){
        var fBlock = buf.slice(21+j*chunkSize, 21+(j+1)*chunkSize);
        requestedFiles[hName].fBlocks[i] = fBlock;
        chunkSize = Math.min(remainderSize - F_CHUNK_SIZE, F_CHUNK_SIZE);
    }
    requestedFiles[hName]['fBlocksReceived'] = true;
    if(requestedFiles[hName]['fBlocksReceived'] & requestedFiles[hName]['hBlocksReceived']){
        tryToSaveFile(hName);
    }
    console.log("%%%%%%%%%%%%%%%%%%");
}

mySocket.on('message', function (raw_message, remote) {
    var buf = Buffer(raw_message);
    // if (remote.address == MY_ADDR && buf.toString('utf8')[0] == '[') return   // message by myself
    console.log('Caught req from:\t' + remote.address + ':' + remote.port);
    
    var buf = Buffer(raw_message);
    if (/^[\+\-\?\@]/.test(buf)){    // work with files
        switch(buf.toString('utf8')[0]){
            case '?':
            console.log('received "?..."')
            giveHashBlocks(buf, remote.address, remote.port);
            break;
            case '@':
            console.log('received "@..."')
            getHashChunks(buf, remote.address, remote.port);
            break;
            case '+':
            console.log('received "+..."')
            getFileChunks(buf, remote.address, remote.port);
            break;
            case '-':
            console.log('received "-..."')
            giveFileBlocks(buf, remote.address, remote.port);
            break;
            default: console.log('useless string :)')
        }
        return  // request is processed
    }

    var data = JSON.parse(raw_message);

    console.log('Received message:\t' + String(raw_message));
    var command = Number(data[0]);

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
        saveFileHolderAnsw(data, remote.address, remote.port);
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

    knownNodes[MY_ID] = thisNode;

    console.log('Address: ' + address.address + ":" + address.port + `. Name: ${MY_NAME}, ID: ${MY_ID}`);
    printSeparator()

    var res = fproc.processFiles(1024, true);
    var builtInFilesInfo = res[0];
    console.log('fileNames here: ' + JSON.stringify(res[1]));
    for (i in res[1]){
        fileSet.add(res[1][i]);
    }

    filesDB = builtInFilesInfo;

    if (noBroadcast) return
    broad();
});

// broadcast
function broad(){
    var address = mySocket.address();
    var message = [0, MY_ID, MY_ADDR, address.port, MY_NAME ];
    message = JSON.stringify(message);
    mySocket.send(message, 0, message.length, GENERAL_PORT, '255.255.255.255', function(err, bytes) {
        if (err) {
            throw err
        };
        console.log('BROADCAST DONE');
         printSeparator()
    });
}

function shareInfoAboutMyFiles(filesInfo){
    var keys = Object.keys(filesInfo);
    for(i in keys){
        //  [6,ID,IDholder,address,port]
        var message = [6, keys[i], MY_ID, mySocket.address().address, mySocket.address().port];
        message = JSON.stringify(message);

        var KNOWN_IDS = Object.keys(knownNodes)
        for(i in KNOWN_IDS){
            if(KNOWN_IDS[i] != MY_ID){
                var portRes = knownNodes[KNOWN_IDS[i]]['PORT'];
                var addrRes = knownNodes[KNOWN_IDS[i]]['ADDR'];
                console.log('<- To "' + `${addrRes}:${portRes}` + '":\t' + message);
                mySocket.send(message, 0, message.length, +portRes, addrRes, function(err, bytes) {
                    if (err) {
                        throw err
                    };
                });
            }
        }
    }
}
  

function findFileInSystem(fileID, callback){
    exportCallback = callback;

    // exportCallback('hello');

    var nearestHolder = getNearestNodes(fileID, 1)['nodes'][0][0];
    var nearAddr = knownNodes[nearestHolder]['ADDR'];
    var nearPort = knownNodes[nearestHolder]['PORT'];

    var message = [2, fileID];
    message = JSON.stringify(message);
    console.log('<- To "' + `${nearAddr}:${nearPort}` + '":\t' + message);
    mySocket.send(message, 0, message.length, +nearPort, nearAddr, function(err, bytes) {
        if (err) {
            throw err
        };
    });
}

function askForFile(hName, index, numOfBlocks, addr, port){
    var hArr = [];
    hArr.length = index + numOfBlocks;
    var fArr = [];
    fArr.length = index + numOfBlocks;

    // ask for Hashes:
    requestedFiles[hName] = {hBlocks: hArr, 
                             fBlocks: fArr, 
                             index: index, 
                             numOfBlocks: numOfBlocks,
                             fBlocksReceived: false,
                             hBlocksReceived: false};

    var fileHashBytes = Buffer.from(hexToBytes(hName));
    var message = Buffer.alloc(25);
    var metaLength = 17;
    var twoPartsBytes = Buffer.concat([Buffer.from('?'), fileHashBytes], metaLength);
    twoPartsBytes.copy(message, 0, 0, metaLength); // target, targetStart, srcStart, srcEnd
    message.writeUInt32BE(index, 17);
    message.writeUInt32BE(numOfBlocks, 21);
    mySocket.send(message, 0, message.length, +port, addr, function(err, bytes) {
        if(err) console.log(err);
    });

    // ask for File chunks:
    var messageF = Buffer.alloc(25);
    var twoPartsBytes = Buffer.concat([Buffer.from('-'), fileHashBytes], metaLength);
    twoPartsBytes.copy(messageF, 0, 0, metaLength); // target, targetStart, srcStart, srcEnd
    messageF.writeUInt32BE(index, 17);
    messageF.writeUInt32BE(numOfBlocks, 21);
    mySocket.send(messageF, 0, messageF.length, +port, addr, function(err, bytes) {
        if(err) console.log(err);
    });
}

  function getNearestNodes(searchID, count){
    if (keepSilent != true) keepSilent = false;
    if (!keepSilent) console.log('****');

    var keys = Object.keys(knownNodes);
    if (!keepSilent) console.log('keys: ' + keys);
    var distances = [];
    for(i in keys){
        if (keys[i] != MY_ID){
            if (!keepSilent) console.log(`keys[${i}]: ` + keys[i] + ' len=' + keys[i].length);
            if (!keepSilent) console.log('searchID: ' + searchID + ' len=' + searchID.length);
            if (!keepSilent) console.log('XOR: ' + xorString(keys[i], searchID));
            distances.push([keys[i], xorString(keys[i], searchID)]);    // hash, xor
        }
    }
    if (!keepSilent) console.log('unsorted distances: ' + distances);
    // sort by distances
    distances.sort((a,b) => {return a[1] > b[1]})
    if (!keepSilent) console.log('sorted distances: ' + distances);

    var returnedSize = Math.min(distances.length, count)
    if (!keepSilent) console.log('****');

    return {
        'size': returnedSize,
        'nodes': distances.slice(0, returnedSize)
    }
  }

  function xorString(a, b){
    var xorLen = Math.min(a.length, b.length);
    a = a.slice(0, xorLen);
    b = b.slice(0, xorLen);
    var res = "";

    for (var i = 0; i < xorLen / 2; i++){ 
        var preres = (parseInt(a.slice(2*i,2*i+2), 16) ^ parseInt(b.slice(2*i,2*i+2), 16)).toString(16);
        preres = preres.length == 1? '0' + preres : preres;

        res += preres;
        console.log('res from xor: ' + res);
    }
    return res;
  }

  function bytesToHex(byteArray) {
    return Array.from(byteArray, function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
  }

  // not clear parser from hex to bytes
  function hexToBytes(hex){
    var buf = Buffer.alloc(hex.length/2);   // 2 symbols are 1 byte 0f -> 0000|1111
    for (var i = 0; i < hex.length / 2; i++){ 
        var preres = parseInt(hex.slice(2*i,2*i+2), 16)
        buf.writeUInt8(preres, i);
    }
    return buf;
  }

function checkCorrectness(hName){
    console.log('FLAG 2228')
    var fChunks = requestedFiles[hName].fBlocks;
    var hChunks = requestedFiles[hName].hBlocks;
    var receivedHChunks = [];
    var lastHChunk; 
    [receivedHChunks, lastHChunk] = fproc.processFileBlocks(fChunks);

    if (hName == lastHChunk) 
        return true;
    else 
        return false;
}

function tryToSaveFile(hName){
    console.log('we are trying to save file!')
    if (checkCorrectness(hName)){
        var fChunks = requestedFiles[hName].fBlocks;
        fproc.writeFile(fChunks, 'received.txt');
        console.log(`FILE ${hName} is saved in my storage`);
        exportCallback(requestedFiles);
        return true
    }
    else{
        exportCallback(null);
        return false;
    }
}

const ifaces = require('os').networkInterfaces()
Object.keys(ifaces).forEach(dev => {
    ifaces[dev].filter(details => {
        if (details.family === 'IPv4' && details.internal === false) {
            MY_ADDR = details.address;
        }
    })
});

mySocket.bind(PORT);

module.exports = {
    findFile: findFileInSystem
};