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

var currentWord;

var tree, list; 

btn_add.on("click", function(e){
	wordname.val("");
	relations.val("");
	wordname.attr("disabled", false);
	showHandleArea(true, "add");
});
btn_updateRelation.on("click", function(e){
	if(currentWord){
		showHandleArea(true, "updateRelation");
		wordname.attr("disabled", true);
		wordname.val(currentWord);
		relations.val(span_relations.data("relations"));
	}else{
		alert("Please select a word first!");
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
			alert("Word must be entered!");
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
			alert("the word [" + word + "] was already existed!");
			return;
		}
		if(relateword){
			relateword = $.trim(relateword).replace(/ *, */g, ",");
		}

		$.post("/action/add", {
			"name": word,
			"relations": relateword
		}, function(result){
			alert("Added Successfully!");
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
			alert("Updated Successfully!");
			wordname.attr("disabled", false);
			showHandleArea(false);
			fillRelation({"relations": relateword}, true);
		});	
	}
	
	
});

function showHandleArea(isshow, action){
	if(isshow){
		handleArea.css("display", "block");
		handleArea.data("action", action);
	}else{
		handleArea.css("display", "none");
	}
	disableNav(isshow);
}
function disableNav(disable){
	btn_add.attr("disabled", disable);
	btn_updateRelation.attr("disabled", disable);
}

fillword(true);

function fillContent(word){
	currentWord = word;
	frame_youdao.attr("src", "http://dict.youdao.com/search?le=eng&q=" + word);
	// query and show relation words if it had
	$.get("/action/getRelation", {"name": word}, function(result){
		fillRelation(result);
	});
	showHandleArea(false);
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
// by call [fillContent] function when user clicked
function _genAnchor(word){
	var html = [], jsStr;
	jsStr = [
		"'javascript:fillContent(",
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
		fillContent(treeNode.name);
	}
}
