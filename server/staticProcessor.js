var fs = require('fs');
var path = require('path');
var mime = require("./mime").types;
function process(pathname, req, res){
	var realPath = ".." + pathname;
    path.exists(realPath, function (exists) {

        if (!exists) {

            res.writeHead(404, {'Content-Type': 'text/plain'});

            res.write("This request URL " + pathname + " was not found on this server.");

            res.end();

        } else {

            fs.readFile(realPath, "binary", function(err, file) {

                if (err) {

                    res.writeHead(500, {'Content-Type': 'text/plain'});

                    res.end(err);

                } else {
					var ext = path.extname(realPath);
					ext = ext ? ext.slice(1) : 'unknown';
					var contentType = mime[ext] || "text/plain";
                    res.writeHead(200, {'Content-Type': contentType});

                    res.write(file, "binary");

                    res.end();

                }

             });

          }

      });
}
exports.process = process;
