var dgram = require('dgram');
var PORT = 41230;
var mySocket = dgram.createSocket('udp4');
var fileHashHEX= 'b52bb26505fd42d1874950689512d68a'
var requestedFiles = {};

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

function askForFileH(hName, index, numOfBlocks, addr, port){
    addr = addr == 'broad'? '255.255.255.255' : addr;

    var hArr = [];
    hArr.length = index + numOfBlocks;
    var fArr = [];
    fArr.length = index + numOfBlocks;

    requestedFiles[hName] = {hBlocks: hArr, fBlocks: fArr, index: index, numOfBlocks: numOfBlocks};
    var fileHashBytes = Buffer.from(hexToBytes(hName));
    var message = Buffer.alloc(25);
    var metaLength = 17;
    var twoPartsBytes = Buffer.concat([Buffer.from('?'), fileHashBytes], metaLength);
    twoPartsBytes.copy(message, 0, 0, metaLength); // target, targetStart, srcStart, srcEnd
    var index = 0;  // offset
    var numOfBlocks = 2;
    message.writeUInt32BE(index, 17);
    message.writeUInt32BE(numOfBlocks, 21);
    mySocket.send(message, 0, message.length, +port, addr, function(err, bytes) {
        if(err) console.log(err);
    });
}

mySocket.on('message', function(rawMessage, remote){
    if(rawMessage.toString('utf8')[0] != '@'){
        console.log('First symbol: ' + rawMessage.toString('utf8')[0]);
    }
    var buf = Buffer(rawMessage);
    var fileHashBytes = buf.slice(1, 17);
    var hName = bytesToHex(fileHashBytes);

    // if(filesDB[fileHashHex] == undefined){
    //     console.log("I didn't request this file!");
    //     return;
    // }

    var index = requestedFiles[hName].index;
    var numOfBlocks = requestedFiles[hName].numOfBlocks;
    var hBlock;
    for(var i = index, j = 0; i < numOfBlocks; j++, i++){
        var hBlock = buf.slice(21+j*16, 21+(j+1)*16);
        requestedFiles[hName].hBlocks[i] = bytesToHex(hBlock);
    }
    
    console.log(JSON.stringify(requestedFiles));
});

mySocket.on("listening", function(){
    mySocket.setBroadcast(true);
    askForFileH(fileHashHEX, 0, 2, 'broad', 41234);
});

// ?<FILE HASH><index><number of blocks to get>         1 + 16 + 4 + 4 bytes?
mySocket.bind(PORT, function(){console.log('sent mess to 255.255.255.255:41234')});