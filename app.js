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
    var requestedFiles = otherNode.findFile(hName);
    setTimeout(function(){res.send(JSON.stringify(requestedFiles));}, 1500);
    res.send('hello');
});


app.listen(appPort);
