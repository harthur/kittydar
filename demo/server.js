var connect = require('connect');

connect.createServer(connect.static(__dirname)).listen(3000);

console.log("visit http://127.0.0.1:3000/index.html");