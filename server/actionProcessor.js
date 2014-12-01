var url = require('url');
var querystring = require('querystring');
var util= require('util');
var nedb = require("nedb");

var today = new Date();
var db = new nedb({filename: "database", autoload: true});
var handleGet = function(req, res){
	debugger;
	route(url.parse(req.url, true).query, req, res);	
},
handlePost = function(req, res){
	var post = '';
	req.on('data', function(chunk) { 
		post += chunk;
	});
	req.on('end', function() {
		post = querystring.parse(post); 
		route(post, req, res);
	});
};
exports.process = function(req, res) {
	if("get" == req.method.toLowerCase()){
		handleGet(req, res);
	} else if("post" == req.method.toLowerCase()){
		handlePost(req, res);
	} else{
		res.end("unsupport request method: " + req.method);
	}
}

function route(data, req, res){
	var obj = url.parse(req.url);
	var pathname = obj.pathname;
	var action = pathname.substring(pathname.indexOf("/", 1) + 1);
	switch(action){
		case 'add':
			add(data, req, res);
			break;
		case 'fillWordlist':
			fillWordlist(data, req, res);
			break;
		case 'getRelation':
			getRelation(data, req, res);
			break;
		case 'updateRelation':
			updateRelation(data, req, res);
			break;
		case 'getTestQueue':
			getTestQueue(data, req, res);
			break;
		case 'submitTesting':
			submitTesting(data, req, res);
			break;
		default:
			console.log("unsupport action: " + action);
			res.end("unsupport action: " + action);
	};
}

function add(data, req, res){
	data.createDate = today;
	db.insert(data, function(err, doc){
		if(err){
			res.end(util.inspect({
				errMsg: "an error occured when [insert]."
			}));
			console.log(err);
		}
		res.end(util.inspect(doc));
	});
}
function fillWordlist(data, req, res){
	db.find({}, {"name": 1, "createDate": 1, "relations": 1})
		.sort({"createDate": -1}).exec(function(err, docs){
		if(err){
			res.end(util.inspect({
				errMsg: "an error occured when [find]."
			}));
			console.log(err);
		}
		
		// handle date because "util.inspect" could not surround date string with 
		// '' and this would occur an error when 'eval' invoked
		var date;
		for(var i=0, len=docs.length; i<len; i++){
			if(docs[i].createDate){
				date = docs[i].createDate.toString();
				docs[i].createDate = date;
			}
		}
		res.end(util.inspect(docs));
	});
}
function getRelation(data, req, res){
	db.find({"name": data.name}, {"relations": 1, "_id": 0}, function(err, docs){
		if(err){
			res.end(util.inspect({
				errMsg: "an error occured when [find]."
			}));
			console.log(err);
		}
		res.end(util.inspect(docs));
	});
}
function updateRelation(data, req, res){
	console.log(util.inspect(data));
	db.update({"name": data.name}, {$set: {"relations": data.relations}}, function(err, numplaced){
		if(err){
			res.end(util.inspect({errMsg: "db error: update relations failed!"}));
			console.log(err);
		}
		console.log("updateRelation: numplaced " + numplaced);
		if(0 == numplaced){
			add({
				"name": data.name,
				"relations": data.relations
			}, req, res);
		}else{
			res.end(data.relations);
		}
	});
}

function getTestQueue(data, req, res){
	db.find({desc: {$exists: true}}, {"name": 1, "desc": 1})
		.sort({ hp: 1 , fightCount: 1, lastFightDate: 1, createDate: 1})
		.limit(30).exec(function (err, docs) { 
			if(err){
				res.end(util.inspect({
					errMsg: "an error occured when [find]."
				}));
				console.log(err);
			}
			res.end(util.inspect(docs));
		});
}

function submitTesting(data, req, res){
	var i = 0, len = data.length,
		one,
		updatedCount = 0,
		_callback = function(err, numReplaced){
			updatedCount += numReplaced;
			if(updatedCount >= len){
				res.end(updatedCount);
			}
		};
	for(; i < len; i++){
		one = data[i];
		db.update({name: one.name}, { 
			$inc: { 
				hp: (one.isRight ? 1 : -1),
				fightCount: 1
			},
			$set: {
				lastFightDate: today
			}}, 
			_callback);
	}
}
