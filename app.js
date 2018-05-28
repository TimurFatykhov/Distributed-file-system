const express = require('express');
var parser = require('body-parser');
var otherNode = require('./otherNode.js');
var fp = require('./fileProcessing.js');
// var dgram = require('dgram');

var appPort = 2001;
// var socketPort = 4444;

var app = express();
// var socket = dgram.createSocket('udp4');

app.use(parser.urlencoded({ extended: false }));
app.use(parser.json())
app.use(express.static("public"));

app.set('view engine', 'pug');

app.get('/', function(req, res){
    res.render('mainPage');
});

app.post('/findFile', function(req, res){
    var hName = req.body.hName;
    var requestedFileInfo;
    otherNode.findFile(hName, function(filesInfo){
        if(filesInfo != null){
            requestedFileInfo = filesInfo[hName];
            data = {requestedFileInfo: requestedFileInfo, hName: hName}
            data = JSON.stringify(data);
            res.send(data);
        }
        else{
            data = {requestedFileInfo: null, hName: null}
            data = JSON.stringify(data);
            res.send(data);
        }
    });
});


app.listen(appPort);
