// read file names from path
var fs = require('fs');
var md5 = require('js-md5');

function fproc(storageDir){
    var self = this;
    this.STORAGE_DIR = storageDir;

    this.processFileBlocks = function(fBlocks){
        var lastHChunk;
        var hChunks = [];
        hChunks.push(md5(fBlocks[0]));
        for(var i = 0; i < fBlocks.length - 1; i++){
            hChunks.push(md5(hChunks[i] + fBlocks[0 + 1]));
        }
        return [hChunks, hChunks[fBlocks.length - 1]]; // hCHunks, file name (last hash)
    }

    this.processOneFile = function(file, chunkLength){
        var currentFileInfo = {};
        currentFileInfo['hChunks'] = [];
        currentFileInfo['fChunks'] = [];
        currentFileInfo['realName'] = file;

        var fd = fs.openSync(`${self.STORAGE_DIR}/${file}`, 'r');   // return file descriptor
        var size = fs.statSync(`${self.STORAGE_DIR}/${file}`).size;
        currentFileInfo['size'] = size;

        var remainder = size;
        var chunkSize;
        var numOfChunks = 0;
        while (remainder != 0){
            chunkSize = Math.min(remainder, chunkLength)
            var buffer = Buffer.alloc(chunkSize);   // buffer initializing 
            numOfRead = fs.readSync(fd, buffer, 0, chunkSize, null);

            lastIndex = currentFileInfo['hChunks'].length - 1;
            lastIndex < 0?
                currentFileInfo['hChunks'].push(md5(buffer)) :
                currentFileInfo['hChunks'].push(md5(currentFileInfo['hChunks'][lastIndex] + buffer));

            currentFileInfo['fChunks'].push(buffer);
            numOfChunks++;
            remainder -= numOfRead;
        }
        currentFileInfo['numOfChunks'] = numOfChunks;

        return [currentFileInfo, numOfChunks];
    }

    this.processFiles = function(chunkLength, keepSilent){
        if (chunkLength == undefined || chunkLength < 0 || !Number.isInteger(chunkLength)) chunkLength = 1024;
        if (keepSilent != true) keepSilent = false;
        var fileNames = [];
        var filesInfo = {};
        try{
            var files = fs.readdirSync(self.STORAGE_DIR);
            if (!keepSilent) console.log('FILES IN STORAGE:');
            var currentFileInfo;
            var numOfChunks;
            files.forEach(file => {
                [currentFileInfo, numOfChunks] = this.processOneFile(file, chunkLength);
                var currentFileName = currentFileInfo['hChunks'][numOfChunks - 1]; // name is hash value of last chunk
                filesInfo[currentFileName] = currentFileInfo;
                if (!keepSilent) console.log('fName: ' + file);
                fileNames.push(currentFileName);
            });
        }catch(err){
            console.log(err);
        }
        return [filesInfo, fileNames];
    };

    this.writeFile = function(fBlocks, filename){
        var fd = fs.openSync(`${self.STORAGE_DIR}/${filename}`, 'a');   // return file descriptor
        for(var i = 0; i < fBlocks.length; i ++){
            fs.writeSync(fd, fBlocks[i], 0, fBlocks[i].length, null);   // last param means position in file = current
        }
    };
}

module.exports = fproc;