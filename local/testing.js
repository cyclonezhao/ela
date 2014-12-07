$(function(){
	var txt_word = $('#txt_word'),
		article_desc = $('#article_desc'),
		btn_prev = $('#btn_prev'),
		btn_next = $('#btn_next'),
		btn_submit = $('#btn_submit'),
		btn_showWordInfo = $('#btn_showWordInfo'),
		
		msgArea = $('#msgArea'),
		
		span_currentCount = $("#currentCount"),
		span_totalCount = $("#totalCount"),
		
		section_test = $("#section_test"),
		section_showResult = $("#section_showResult"),
		
		div_rightInfo = $('#rightInfo');
		div_wordInfo = $('#wordInfo');
		table_wordInfo = $('#table_wordInfo');
		btn_retest = $('#btn_retest');
		
	var testQueue, errorQueue, retest,
		totalCount, currentIndex = 0;
		
	section_showResult.css('display', 'none');
		
	$.post("/action/getTestQueue", {}, function(result){
		result = eval('(' + result + ')');
		testQueue = result;
		span_totalCount.html(testQueue.length);
		showTest(0);
	});
	
	btn_retest.on('click', function(){
		testQueue = errorQueue;
		span_totalCount.html(testQueue.length);
		showTest(0);
		section_showResult.css('display', 'none');
		section_test.css('display', 'block');
	});
	
	btn_showWordInfo.on('click', function(){
		div_wordInfo.css('display', 'block');
	});
	
	btn_prev.on('click', function(){
		showTest(currentIndex - 1);
	});
	btn_next.on('click', function(){
		storeTest();
		// show next test
		showTest(currentIndex + 1);
	});
	
	btn_submit.on('click', function(){
		storeTest();
		
		if(retest){
			showTestResult();
		}else{
			// build the commit data
			var i, len, commitData = {};
			for(i = 0, len = testQueue.length; i < len; i++){
				commitData[testQueue[i].name] = testQueue[i].isRight;
			}
			commitData.count = len;

			// commit test result
			$.post("/action/submitTesting", commitData, function(result){
				showTestResult();
				retest = true;
			});
		}
		function showTestResult(){
			// show test result
			var oneTest, strArr = [], desc;
			errorQueue = [], errorIdx = -1;
			for(i = 0, len = testQueue.length; i < len; i++){
				oneTest = testQueue[i];
				if(!oneTest.isRight){
					errorIdx++;
					errorQueue.push(oneTest);
					strArr.push("<tr errorIdx='"+ errorIdx +"'>");
					// word
					strArr.push("<td>");
					strArr.push(oneTest.name);
					strArr.push("</td>");
					
					// your answer
					strArr.push("<td>");
					strArr.push(oneTest.answer);
					strArr.push("</td>");
					
					// description
					strArr.push("<td class='desc'>");
					strArr.push(_shortDesc(oneTest.desc));
					strArr.push("</td>");
					strArr.push("</tr>");
				}
			}
			
			if(errorQueue.length == 0){
				div_rightInfo.css('display', 'block');
				div_wordInfo.css('display', 'none');
				btn_retest.css('display', 'none');
				btn_showWordInfo.css('display', 'inline-block');
				div_rightInfo.html("<h1>Congratulation, Test Passed!</h1>");
			}else{
				btn_showWordInfo.css('display', 'none');
				btn_retest.css('display', 'inline-block');
				div_rightInfo.css('display', 'none');
				div_wordInfo.css('display', 'block');
			}
			table_wordInfo.html(strArr.join(""));
			table_wordInfo.off('click');
			table_wordInfo.on('click', function(e){
				var tr_error = $(_getTarget(e, "tr")),
					errorIdx = parseInt(tr_error.attr('errorIdx')),
					expanded = tr_error.data("expanded"),
					td_desc = tr_error.find("td:last-child");
				if(!expanded){
					desc = errorQueue[errorIdx].desc.split("\n");
					td_desc.html(getDescHtml(desc));
					tr_error.data("expanded", true);
				}else{
					td_desc.html(_shortDesc(errorQueue[errorIdx].desc));
					tr_error.data("expanded", false);
				}
					
			});
			section_showResult.css('display', 'block');
			section_test.css('display', 'none');
		}
		
		function _getTarget(e, tagName){
			var target = e.target;
			while(target.tagName.toLowerCase() != tagName.toLowerCase()){
				target = target.parentElement;
				if(target.tagName.toLowerCase() == "body")
					throw new Error("Target [" + tagName + "] unfound!");
			}
			return target;
		}
		function _shortDesc(desc){
			if(desc.length > 100)
				desc = desc.substring(0, 100) + "...";
			return desc;
		}
	});
	
	txt_word.keyup(function(eventObj){
		if(eventObj.keyCode == 13){ // Enter
			btn_next.trigger('click');
		}
	});
	
	function showTest(queueIndex){
		if(queueIndex < 0) {
			showInfo("already reached the first one!");
			return;
		}
		
		if(queueIndex >= testQueue.length){
			showInfo("already reached the last one!");
			return;
		}
		
		currentIndex = queueIndex;
		var currentTest = testQueue[queueIndex],
			desc = currentTest.desc.split("\n");
		article_desc.html(getDescHtml(desc, true));
		span_currentCount.html(queueIndex + 1);
		txt_word.val(currentTest.answer || "");
		txt_word.focus();
	}
	
	function getDescHtml(desc, isShowRandomOne){
		var strArr, i, len, j, len_j, one;
		var structDesc = [], definition;
		for(i = 0, len = desc.length; i < len; i++){
			one = desc[i];
			if(!one) continue;
			if(one.trim().indexOf("e.g.") == 0){
				definition.eg.push(one);
			}else{
				definition = {};
				definition.def = one;
				definition.eg = [];
				structDesc.push(definition);
			}
		}
		
		if(isShowRandomOne){
			if(structDesc[structDesc.length - 1].def.trim().toLowerCase()
				.indexOf("to know more") == 0){
					structDesc.pop();
			}
			var seed = Math.floor(Math.random() * structDesc.length);
			return _html([structDesc[seed]]);
		}else{
			return _html(structDesc);
		}
		
		function _html(arg){
			strArr = ["<ul>"];
			for(i = 0, len = arg.length; i < len; i++){
				if(!arg[i]) continue;
				one = arg[i];
				strArr.push("<li>");
				strArr.push(one.def);
				for(j = 0, len_j = one.eg.length; j < len_j; j++){
					strArr.push("</br>");
					strArr.push(one.eg[j]);
				}
				strArr.push("</li>");
			}
			strArr.push("</ul>");
			return strArr.join("");
		}
	}
	
	function storeTest(){
		// store current test
		var currentTest = testQueue[currentIndex],
			answer = txt_word.val();
		currentTest.answer = answer;
		currentTest.isRight = 
			$.trim(answer).toLowerCase() == testQueue[currentIndex].name.toLowerCase();
	}
	
	function showInfo(msg){
		msgArea.html(msg);
		msgArea.css("display", "block");
		setTimeout(function(){
			msgArea.css("display", "none");
		}, 3000);
	}
});

