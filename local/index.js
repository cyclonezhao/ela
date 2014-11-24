$(function(){

var msgArea = $("#msgArea");

var btn_add = $("#btn_add");
var btn_updateRelation = $("#btn_updateRelation");

var handleArea = $('#handleArea');
var wordname = $('#tx_name');
var relations = $("#tx_relations");
var btn_submit = $("#btn_submit");
var btn_cancel = $("#btn_cancel");

var wordlist = $('#wordlist');
var wordtree = $('#wordtree');
var _showWordlist = false;

var frame_youdao = $('#frame');
var span_relations = $('#relationWords');

var listh = [], maxh = 10, curh = -1;
var btn_back = $("#back"), btn_forward = $("#forward");

var currentWord;
var pauseKeyListen = false;

var tree, list; 

btn_add.on("click", function(e){
	add_click();
});
btn_updateRelation.on("click", function(e){
	if(currentWord){
		showHandleArea(true, "updateRelation");
		wordname.attr("disabled", true);
		wordname.val(currentWord);
		relations.val(span_relations.data("relations"));
	}else{
		showinfo("Please select a word first!");
	}
});
btn_cancel.on("click", function(e){
	showHandleArea(false);
});
btn_submit.on("click", function(e){
	var word = $.trim(wordname.val());
	var relateword = relations.val();
	var action = handleArea.data("action");

	if("add" == action){
		if(!word){
			showinfo("Word must be entered!");
			return;
		}

		var exist = false;
		if(_showWordlist){
			var list = wordlist.children("a");
			for(var i=0, len=list.length; i<len; i++){
				if(word == list[i].innerHTML){
				exist = true;
				break;
			}
		}
		}else{
			if(tree.getNodeByParam("name", word)){
				exist = true;
			}
		}
		if(exist){
			showinfo("the word [" + word + "] was already existed!");
			return;
		}
		if(relateword){
			relateword = $.trim(relateword).replace(/ *, */g, ",");
		}

		$.post("/action/add", {
			"name": word,
			"relations": relateword
		}, function(result){
			showinfo("Added Successfully!");
			handleArea.css("display", "none");
			disableNav(false);
			fillword();
		});	
	} else if ("updateRelation" == action){

		if(relateword){
			relateword = $.trim(relateword).replace(/ *, */g, ",");
		}

		$.get("/action/updateRelation", {
			"name": word,
			"relations": relateword
		}, function(result){
			showinfo("Updated Successfully!");
			wordname.attr("disabled", false);
			showHandleArea(false);
			fillRelation({"relations": relateword}, true);
		});	
	}
	
	
});

btn_back.on("click", function(){
	var word = backh();
	if(word)
		fillContent(word);
});
btn_forward.on("click", function(){
	var word = forwardh();
	if(word)
		fillContent(word);
});

$("body").keyup(function(eventObj){
	if(pauseKeyListen){
		if(eventObj.keyCode == 27){ // ESC
			showHandleArea(false);
		}else if(eventObj.keyCode == 13){ // Enter
			btn_submit.trigger("click");
		}
		return;
	}
	switch(eventObj.keyCode){
		case 37: // left
			btn_back.trigger("click");
			break;
		case 39: // right
			btn_forward.trigger("click");
			break;
		case 65: // A
			add_click();
			wordname.focus();
			break;
	};
});

fillword(true);
window.fillContenth = fillContenth;

function add_click(){
	wordname.val("");
	relations.val("");
	wordname.attr("disabled", false);
	showHandleArea(true, "add");
}

function showHandleArea(isshow, action){
	if(isshow){
		pauseKeyListen = true;
		handleArea.css("display", "block");
		handleArea.data("action", action);
	}else{
		pauseKeyListen = false;
		handleArea.css("display", "none");
	}
	disableNav(isshow);
}
function disableNav(disable){
	btn_add.attr("disabled", disable);
	btn_updateRelation.attr("disabled", disable);
}


function fillContent(word){
	currentWord = word;
	frame_youdao.attr("src", "http://dict.youdao.com/search?le=eng&q=" + word);
	// query and show relation words if it had
	$.get("/action/getRelation", {"name": word}, function(result){
		fillRelation(result);
	});
	showHandleArea(false);
	setTimeout(function(){
		$("#btn_add").focus();
	}, 1000);
}

function fillRelation(result, noteval){
	var notnull = true;
	if(result) {
		if(!noteval)
			result = eval('(' + result + ')');
		if((result instanceof Array) && result.length
				&& (result[0].relations || result[0].relations == "")){
			result = result[0].relations
		}else if(!(result instanceof Array) && result.relations){
			result = result.relations;
		}else{
			notnull = false;
		}
	}else{
		notnull = false;
	}
	span_relations.data("relations", result);
	if(!notnull) {
		span_relations.html("");
		return;
	}
	result = result.split(",");
	var html = [];
	for(var i=0, len=result.length; i<len; i++){
		html = html.concat([_genAnchor(result[i]), "&nbsp"]);
	}
	span_relations.html(html.join(""));
}

function fillword(init){
	$.post("/action/fillWordlist", {}, function(result){
		result = eval('(' + result + ')');
		//result = eval("var json='"+result+"';");
		if(result instanceof Array){
			if(init){
				fillWordlist(result)
				fillWordtree(result)
			}else if(_showWordlist){
				fillWordlist(result)
			}else{
				fillWordtree(result)
			}
			
		}
	});
}

function fillWordlist(result){
	var html = [], jsStr;
	for(var i = 0, len = result.length; i < len; i++){
		html.push(_genAnchor(result[i].name), "<br>");
	}
	html = html.join("");
	wordlist.html(html);
}

// generate word anchor which can query contents and relations of the word
// by call [fillContenth] function when user clicked
function _genAnchor(word){
	var html = [], jsStr;
	jsStr = [
		"'javascript:fillContenth(",
		'"', word, '"',
		");'"
	].join("");
	html = html.concat(["<a href=", jsStr, ">"]);
	html.push(word);
	html.push("</a>");
	return html.join("");
}

function fillWordtree(result){
	var setting = {
		data: {
			simpleData: {
				enable: true
			}
		},
		callback: {
			onClick: clicktree
		}
	};
	var zNodes = [], one, date;
	for(var i = 0, len = result.length; i < len; i++){
		one = result[i];
		if(!date || date != (new Date(one.createDate)).toLocaleDateString()){
			date = (new Date(one.createDate)).toLocaleDateString();
			zNodes.push({
				id: date,
				pId: 0,
				name: date
			});
		}
		zNodes.push({
			id: one._id,
			pId: date,
			name: one.name
		});
	}
	$.fn.zTree.init($("#tree"), setting, zNodes);
	tree = $.fn.zTree.getZTreeObj("tree");
}

function dochangeview(isShowlist){
	_showWordlist = isShowlist;
	wordlist.css("display", isShowlist ? "inline-block": "none");
	wordtree.css("display", isShowlist ? "none": "inline-block");
}

function clicktree(event, treeId, treeNode, clickFlag){
	if(treeNode.level == 1 ){
		fillContenth(treeNode.name);
	}
}

function fillContenth(word){
	addh(word);
	fillContent(word);
}

function addh(word){
	listh.push(word);
	curh++;
	if(listh.length > maxh){
		listh.shift();
	}
}
function backh(){
	if(curh <= 0){
		showinfo("already reached the first one!");
		return;
	}else{
		curh--;
	}
	
	return listh[curh];
}
function forwardh(){
	if(curh == listh.length-1){
		showinfo("already reached the last one!");
		return;
	}else{
		curh++;
	}
	
	return listh[curh];
}
function showinfo(msg){
	msgArea.html(msg);
	msgArea.css("display", "block");
	setTimeout(function(){
		msgArea.css("display", "none");
	}, 3000);
}
});
