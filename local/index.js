$(function(){

var msgArea = $("#msgArea");

var btn_add = $("#btn_add");
var btn_search = $("#btn_search");
var btn_updateRelation = $("#btn_updateRelation");
var btn_updateDesc = $("#btn_updateDesc");
// history
var listh = [], maxh = 10, curh = -1;
var btn_back = $("#back"), btn_forward = $("#forward");

var handleArea = $('#handleArea');
var txt_word = $('#tx_name');
var txt_relations = $("#tx_relations");
var txt_desc = $("#txt_desc");
var inputs = [txt_word, txt_relations, txt_desc];

var btn_submit = $("#btn_submit");
var btn_cancel = $("#btn_cancel");

var span_btns = $("#span_btns");
var label_action = $("#label_action");

var tree;
var span_wordcount = $('#wordcount');
var dom_descShow = $('#descShow');

var frame_youdao = $('#frame');
var span_relations = $('#relationWords');

// global data
var currentWord, currentRelations, currentDesc;
var pauseKeyListen = false;



btn_add.on("click", function(e){
	showHandleArea(true, "add");
	txt_word.val("");
	txt_word.focus();
	txt_relations
	txt_desc.val("");
});
btn_search.on("click", function(e){
	txt_word.val("");
	txt_relations.val("");
	showHandleArea(true, "search");
	txt_word.focus();
});
btn_updateDesc.on("click", function(e){
	if(currentWord){
		showHandleArea(true, "updateDesc");
		txt_word.val(currentWord);
		txt_desc.val(currentDesc);
		txt_desc.focus();
	}else{
		showinfo("Please select a word first!");
	}

}); 
btn_updateRelation.on("click", function(e){
	if(currentWord){
		showHandleArea(true, "updateRelation");
		txt_word.val(currentWord);
		txt_relations.val(currentRelations);
		txt_relations.focus();
	}else{
		showinfo("Please select a word first!");
	}
});
btn_cancel.on("click", function(e){
	showHandleArea(false);
});
btn_submit.on("click", function(e){
	var word = $.trim(txt_word.val());
	var relateword = txt_relations.val();
	var desc = txt_desc.val();
	var action = handleArea.data("action");
	if(!word){
		showinfo("Word must be entered!");
		return;
	}
	
	var reg = new RegExp(word, 'g');
	desc = desc.replace(reg, "___");
	
	if("add" == action){
		var node = tree.getNodeByParam("name", word);
		if(node){
			showinfo("the word [" + word + "] was already existed!"
				+" created on " + node.pId);
			return;
		}
		if(relateword){
			relateword = $.trim(relateword).replace(/ *, */g, ",");
		}

		$.post("/action/add", {
			"name": word,
			"relations": relateword,
			"desc": desc
		}, function(result){
			showinfo("Added Successfully!");
			handleArea.css("display", "none");
			showHandleArea(false);
			fillword();
			fillContenth(word);
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
			txt_word.attr("disabled", false);
			showHandleArea(false);
			fillword();
			fillRelation(relateword);
		});	
	} else if("updateDesc" == action){
		$.post("action/updateDesc", {
			"name": word,
			"desc": desc
		}, function(){
			showinfo("Updated Successfully!");
			showHandleArea(false);
			currentDesc = desc;
		});	
	} else if("search" === action){
		showHandleArea(false);
		fillContenth(word);
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
			if("TEXTAREA" != eventObj.target.tagName)
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
			btn_add.trigger('click');
			break;
		case 83: // S
			btn_search.trigger("click");
			break;
	};
});

fillword(true);
window.fillContenth = fillContenth;

frame_youdao.on('load', function(){
	btn_add.focus();
});

function showHandleArea(isshow, action){
	if(isshow){
		pauseKeyListen = true;
		handleArea.css("display", "block");
		handleArea.data("action", action);
		span_btns.css("display", "none");
		label_action.css("display", "inline");
		label_action.html("Operation: "+action);
		
		// set editable of input widgets for action
		// var inputs = [txt_word, txt_relations, txt_desc];
		var disableIdx, disable;
		if(action == 'search') disableIdx = [1,2];
		if(action == 'updateRelation') disableIdx = [0,2];
		if(action == 'updateDesc') disableIdx = [0,1];
		for(var i=0, len=inputs.length; i<len; i++){
			disable = $.inArray(i, disableIdx) >= 0;
			inputs[i].attr("disabled", disable);
		}
	}else{
		pauseKeyListen = false;
		handleArea.css("display", "none");
		span_btns.css("display", "inline");
		label_action.css("display", "none");
	}
}
function fillContent(word){
	currentWord = word;
	frame_youdao.attr("src", "http://dict.youdao.com/search?le=eng&q=" + word);
	// query and show relation words if it had
	$.get("/action/getRelationAndDesc", {"name": word}, function(result){
		result = eval('(' + result + ')');
		fillRelation(result[0].relations);
		currentRelations = result[0].relations;
		currentDesc = result[0].desc;
	});
}


function fillRelation(result){
	if(!result) {
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
			fillWordtree(result)
		}
	});
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
		},
		view: {
			addHoverDom: function(treeId, treeNode){
				if(treeNode.level != 1) return;
				if(!treeNode.desc) return;
				
				dom_descShow.html(treeNode.desc.replace(/\n/g, "</br>"));
				dom_descShow.css("display", "inline-block");
			},
			removeHoverDom: function(treeId, treeNode){
				if(treeNode.level != 1) return;
				if(!treeNode.desc) return;
				dom_descShow.css("display", "none");
			}
		}
	};
	var zNodes = [], one, relation, date;
	var i, len, j, len_j;
	var wordcount = 0, relationCount = 0;
	for(i = 0, len = result.length; i < len; i++){
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
			name: one.name,
			desc: one.desc
		});
		wordcount++;
		if(one.relations){
			one.relations = one.relations.split(",");
			for(j = 0, len_j = one.relations.length; j < len_j; j++){
				relation = one.relations[j];
				zNodes.push({
					id: one._id + "-" + relation,
					pId: one._id,
					name: relation
				});
				relationCount++;
			}
		}
	}
	$.fn.zTree.init($("#tree"), setting, zNodes);
	tree = $.fn.zTree.getZTreeObj("tree");
	span_wordcount.html([
		"词汇数量：", wordcount,
		"；相关词数量：", relationCount
	].join(""));
}

function clicktree(event, treeId, treeNode, clickFlag){
	if(treeNode.level >= 1 ){
		fillContenth(treeNode.name);
	}
}

function fillContenth(word){
	addh(word);
	fillContent(word);
}

function addh(word){
	if(curh + 1 >= maxh){
		if(word === listh[listh.length-1])
			return;
		listh.shift();
		listh.push(word);
	}else{
		if(word === listh[curh])
			return;
		curh++;
		listh[curh] = word;
		listh = listh.slice(0, curh + 1);
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
	if(!listh[curh + 1] || curh == listh.length-1){
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
