// read file names from path
var fs = require('fs');
var md5 = require('js-md5');

function fproc(storageDir){
    var self = this;

    this.STORAGE_DIR = storageDir;

    this.processFiles = function(chunkLength){
        if (chunkLength == undefined || chunkLength < 0 || !Number.isInteger(chunkLength)) chunkLength = 1024;

        var filesInfo = {};
        try{
            var files = fs.readdirSync(self.STORAGE_DIR);
            console.log('FILES IN STORAGE:');
            files.forEach(file => {
                var currentFileInfo = {};
                currentFileInfo['hchunks'] = [];
                currentFileInfo['fchunks'] = [];
                currentFileInfo['realName'] = file;

                var fd = fs.openSync(`${self.STORAGE_DIR}/${file}`, 'r');   // return file descriptor
                var size = fs.statSync(`${self.STORAGE_DIR}/${file}`).size;
                currentFileInfo['size'] = size;

                var remainder = size;
                var chunkSize;
                var numOfChunks = 0;
                while (remainder != 0){
                    chunkSize = Math.min(remainder, chunkLength)
                    var buffer = Buffer.alloc(chunkSize);
                    numOfRead = fs.readSync(fd, buffer, 0, chunkSize, null);

                    currentFileInfo['hchunks'].push(md5(buffer));
                    currentFileInfo['fchunks'].push(buffer);
                    numOfChunks++;
                    remainder -= numOfRead;
                }
                currentFileInfo['numOfChunks'] = numOfChunks;
                var currentFileName = currentFileInfo['hchunks'][numOfChunks - 1]; // name is hash value of last chunk
                filesInfo[currentFileName] = currentFileInfo;
            });
        }catch(err){
            console.log(err);
        }
        return filesInfo;
    };
}

module.exports = fproc;