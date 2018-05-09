# Distributed file system
Single node for one computer. To create distributed system run this script in several machines within a local network and change node's info namely `MY_ID` and `MY_NAME` for each nodes. 

## Getting started
Install required packages from   [package.json](https://chrome.google.com/webstore/detail/tabdown/edhcokobegnpjbjhkpoadfeonghjcecn?hl=zh-CN&gl=001)
```
$ npm install
```

Startup the server
```
$ node myNode.js
```
Or use [nodemon](https://www.npmjs.com/package/nodemon) for auto restarting:
```
$ sudo npm install nodemon
$ nodemon myNode.js
```

Also you can play with system on your own device only. Run `myNode.js` in first terminal window, `otherNode.js` in second and `anotherNode.js` in third, that uses ports number 41234, 41235 and 41236 respectively. This nodes will use same IP and different ports, because of this you can't perform broadcast by `myNode.js`, this signal requires port assignment (while we use different ports for each node). Therefore pass argument `no-broad` into script:
``` 
$ node myNode.js no-broad
```
in separate terminal:
``` 
$ node otherNode.js
```
and in another:
``` 
$ node anotherNode.js
```

### Default values
``` js
var PORT = 41234;
var MY_ID = Math.floor(Math.random() * 1000);
var MY_NAME = "sadomango777"
```

## Message protocol
This distributed file system
