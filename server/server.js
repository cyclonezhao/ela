var http = require('http');
var url = require('url');
var staticProcessor = require("./staticProcessor.js");
var actionProcessor = require("./actionProcessor.js");
http.createServer(function(req, res) {
	var obj = url.parse(req.url);
	var pathname = obj.pathname;
	if("/action" === pathname.substring(0, pathname.indexOf("/", 1))){
		console.log("action request: " + pathname);
		actionProcessor.process(req, res);
	}else{
		staticProcessor.process(pathname, req, res);
	}
}).listen(3000);
console.log("HTTP server is listening at port 3000.");
