//rmCloser
//<nowiki>
var rmCloser = {};
window.rmCloser = rmCloser;

$.when(
	mw.loader.using([ 'mediawiki.api', 'ext.gadget.morebits', 'ext.gadget.libExtraUtil' ]),
	$.ready
).then(function() {
	if (document.getElementById("requestedmovetag") !== null && Morebits.pageNameNorm.indexOf("alk:") !== -1 && mw.config.get('wgCategories').includes('Requested moves') && !document.getElementById("wikiPreview") && mw.config.get('wgDiffOldId') == null) {
		document.getElementById("requestedmovetag").innerHTML = "<button id='rmCloserClose'>Close</button><button id='rmCloserRelist'>Relist</button><button id='rmCloserNotify'>Notify WikiProjects</button><span id='rmCloserRelistOptions' style='display:none'><input id='rmCloserRelistComment' placeholder='Relisting comment' oninput='if(this.value.length>20){this.size=this.value.length} else{this.size=20}'/><br><button id='rmCloserConfirm'>Confirm relist</button><button id='rmCloserCancel'>Cancel relist</button></span>";
		$('#rmCloserClose').click(rmCloser.callback);
		$('#rmCloserRelist').click(rmCloser.confirmRelist);
		$('#rmCloserConfirm').click(rmCloser.relist);
		$('#rmCloserCancel').click(rmCloser.cancelRelist);
		$('#rmCloserNotify').click(rmCloser.notify);
	}
});

rmCloser.confirmRelist = function rmCloserConfirmRelist(e) {
	if (e) e.preventDefault();
	document.getElementById("rmCloserRelistOptions").style.display = "inline";
	document.getElementById("rmCloserClose").style.display = "none";
	document.getElementById("rmCloserRelist").style.display = "none";
	document.getElementById("rmCloserNotify").style.display = "none";
};

rmCloser.cancelRelist = function rmCloserCancelRelist(e) {
	if (e) e.preventDefault();
	document.getElementById("rmCloserRelistOptions").style.display = "none";
	document.getElementById("rmCloserClose").style.display = "inline";
	document.getElementById("rmCloserRelist").style.display = "inline";
	document.getElementById("rmCloserNotify").style.display = "inline";
};

rmCloser.advert = ' using [[User:TheTVExpert/rmCloser|rmCloser]]';

rmCloser.callback = function rmCloserCallback(e) {
	if (e) e.preventDefault();

	rmCloser.Window = new Morebits.simpleWindow(600, 450);
	rmCloser.Window.setTitle( "Close requested move" );
	rmCloser.Window.setScriptName('rmCloser');
	rmCloser.Window.addFooterLink('RM Closing instruction', 'WP:RMCI');
	rmCloser.Window.addFooterLink('Script documentation', 'User:TheTVExpert/rmCloser');
	rmCloser.Window.addFooterLink('Give feedback', 'User talk:TheTVExpert/rmCloser');

	var form = new Morebits.quickForm(rmCloser.evaluate);
	
	var resultField = form.append({
		type: 'field',
		label: 'Result'
	});

	resultField.append({
		type: 'radio',
		name: 'result',
		list: [
			{
				label: 'Moved',
				value: 'moved',
				event: function() {
					document.getElementsByName('customResult')[0].style.display = 'none';
					document.getElementsByName('customResult')[0].required = false;
				}
			},
			{
				label: 'Not moved',
				value: 'not moved',
				event: function() {
					document.getElementsByName('customResult')[0].style.display = 'none';
					document.getElementsByName('customResult')[0].required = false;
				}
			},
			{
				label: 'No consensus',
				value: 'no consensus',
				event: function() {
					document.getElementsByName('customResult')[0].style.display = 'none';
					document.getElementsByName('customResult')[0].required = false;
				}
			},
			{
				label: 'Custom',
				value: 'custom',
				event: function() {
					document.getElementsByName('customResult')[0].style.display = 'inline';
					document.getElementsByName('customResult')[0].required = true;
				}
			}
		]
	});
	
	resultField.append({
		type: 'input',
		name: 'customResult'
	});

	var closingCommentField = form.append({
		type: 'field',
		label: 'Closing comment'
	});
	
	closingCommentField.append({
		type: 'textarea',
		name: 'closingComment'
	});
	
	form.append({ type: 'submit', label: 'Submit' });

	var formResult = form.render();
	rmCloser.Window.setContent(formResult);
	rmCloser.Window.display();
	
	document.getElementsByName('customResult')[0].style.display = 'none';
	document.getElementsByName('result')[0].required = true;
};

rmCloser.evaluate = function(e) {
	var form = e.target;
	rmCloser.params = Morebits.quickForm.getInputData(form);

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	var title_obj = mw.Title.newFromText(Morebits.pageNameNorm);
	rmCloser.title = title_obj.getSubjectPage().toText();
	rmCloser.talktitle = title_obj.getTalkPage().toText();
	
	var result = rmCloser.params.result;
	if(result == 'custom'){
		result = rmCloser.params.customResult;
	}
	
	var closingComment = rmCloser.params.closingComment;
	if(closingComment != ""){
		closingComment = ' ' + closingComment;
		closingComment = closingComment.replace(/\|/g, "{{!}}");
		closingComment = closingComment.replace(/=/g, "{{=}}");
	}

	var talkpage = new Morebits.wiki.page(rmCloser.talktitle, 'Closing move.');
	talkpage.load(function(talkpage) {
		var text = talkpage.getPageText();
		
		var templatesOnPage = extraJs.parseTemplates(text,false);
		var oldMovesPresent = [];
		var template;
		for (var i = 0; i < templatesOnPage.length; i++) {
			if (templatesOnPage[i].name.toLowerCase() == "old moves" || templatesOnPage[i].name.toLowerCase() == "old move") {
				oldMovesPresent.push(templatesOnPage[i]);
			} else if (templatesOnPage[i].name.toLowerCase() == "requested move/dated") {
				template = templatesOnPage[i];
			}
		}

		var templateFound = false;
		var numberOfMoves = 0;
		var line;
		var templateIndex = -1;
		var parsedDate;
		var rmSection;
		var nextSection = false;
		var textToFind = text.split('\n');
		for (var i = 0; i < textToFind.length; i++) {	
			line = textToFind[i];
			if(templateFound == false){
				if(/{{[Rr]equested move\/dated/.test(line)){
					templateFound = true;
					templateIndex = i;
				}
			} else if(templateFound == true){
				if (/ \(UTC\)/.test(line)){
					line = line.substring(line.indexOf("This is a contested technical request"));
					parsedDate = line.match(/, ([0-9]{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) [0-9]{4}) \(UTC\)/)[1];
					break;
				} else if(/→/.test(line)){
					numberOfMoves++;
				}
			}
		}

		for (var i = templateIndex; i >= 0; i--) {
			line = textToFind[i];
			if (line.match(/^(==)[^=].+\1/)) {
				rmSection = line.match(/^(==)[^=](.+)\1/)[2].trim();
				break;
			}
		}

		for (var i = templateIndex+1; i < textToFind.length; i++) {
			line = textToFind[i];
			if (line.match(/^(==)[^=].+\1/)) {
				nextSection = true;
				var escapedLine = line.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
				var regex = new RegExp('(' + escapedLine + ')(?![\s\S]*(' + escapedLine + '))', 'm');
				text = text.replace(regex, '{{subst:RM bottom}}\n\n' + line);
				break;
			}
		}
		
		var userGroupText = "";
		if(Morebits.userIsInGroup('sysop')){
			userGroupText = "";
		} else if(Morebits.userIsInGroup('extendedmover')){
			userGroupText = "|pmc=y";
		} else{
			userGroupText = "|nac=y";
		}
		text = text.replace(/{{[Rr]equested move\/dated\|.*\n?[^\[]*}}/, "{{subst:RM top|'''" + result + ".'''" + closingComment + userGroupText +"}}");

		if (!nextSection) {
			text += '\n{{subst:RM bottom}}';
		}
		
		var multiMove = false;
		var moveSectionPlain = rmSection;

		var date = parsedDate;
		var from = '';

		var destination;
		for (var i = 0; i < template.parameters.length; i++) {
			if (template.parameters[i].name == "multiple") {
				multiMove = true;
			} else if (template.parameters[i].name == "new1") {
				destination = template.parameters[i].value;
				break;
			} else if (template.parameters[i].name == "1") {
				destination = template.parameters[i].value;
			}
		}
		if(destination == "?"){
			destination = "";
		}

		var link = 'Special:Permalink/' + talkpage.getCurrentID() + '#' + moveSectionPlain;

		var archives = text.match(/{{[Aa]rchives/);
		if(archives == null){
			archives = text.match(/{{[Aa]rchive box/);
			if(archives == null){
				archives = text.match(/{{[Aa]rchivebox/);
				if(archives == null){
					archives = text.match(/==.*==/);
				}
			}
		}

		if (oldMovesPresent.length == 0) {
			if(result == "moved"){
				from = '|from=' + rmCloser.title;
			}
			text = text.replace(archives[0], '{{old move'+ '|date=' + date + from + '|destination=' + destination + '|result=' + result + '|link=' + link +'}}\n\n' + archives[0]);
		} else if (oldMovesPresent.length == 1) {
			var isValidFormat = false;
			var isListFormat = false;
			var numOldMoves = 0;
			for (var i = 0; i < oldMovesPresent[0].parameters.length; i++) {
				var parameterName = oldMovesPresent[0].parameters[i].name;
				parameterName = parameterName.toString();
				if (parameterName == "list") {
					isListFormat = true;
					break;
				} else if (parameterName == "result1") {
					isValidFormat = true;
					numOldMoves++;
				} else if (parameterName.includes("result")) {
					numOldMoves++;
				}
			}

			if (isValidFormat && !isListFormat) {
				var oldMovesText = oldMovesPresent[0].wikitext;
				numOldMoves++;
				if(result == "moved"){
					from = '|from' + numOldMoves + '=' + rmCloser.title;
				}
				var newTextToAdd = '|date' + numOldMoves + '=' + date + from + '|destination' + numOldMoves + '=' + destination + '|result' + numOldMoves + '=' + result + '|link' + numOldMoves + '=' + link + '}}';
				oldMovesText = oldMovesText.substring(0, oldMovesText.length-2) + newTextToAdd;
				text = text.replace(oldMovesPresent[0].wikitext, oldMovesText);
			} else if (isListFormat) {
				if(result == "moved"){
					from = '|from=' + rmCloser.title;
				}
				text = text.replace(archives[0], '{{old move'+ '|date=' + date + from + '|destination=' + destination + '|result=' + result + '|link=' + link +'}}\n\n' + archives[0]);
			} else {
				var oldMovesText = '{{' + oldMovesPresent[0].name;
				for (var i = 0; i < oldMovesPresent[0].parameters.length; i++) {
					if (oldMovesPresent[0].parameters[i].name == "date") {
						oldMovesText += '|date1=' + oldMovesPresent[0].parameters[i].value;
					} else if (oldMovesPresent[0].parameters[i].name == "from") {
						oldMovesText += '|name1=' + oldMovesPresent[0].parameters[i].value;
					} else if (oldMovesPresent[0].parameters[i].name == "destination") {
						oldMovesText += '|destination1=' + oldMovesPresent[0].parameters[i].value;
					} else if (oldMovesPresent[0].parameters[i].name == "result") {
						oldMovesText += '|result1=' + oldMovesPresent[0].parameters[i].value;
					} else if (oldMovesPresent[0].parameters[i].name == "link") {
						oldMovesText += '|link1=' + oldMovesPresent[0].parameters[i].value;
					} else {
						oldMovesText += oldMovesPresent[0].parameters[i].wikitext;
					}
				}
				if(result == "moved"){
					from = '|from2=' + rmCloser.title;
				}
				var newTextToAdd = '|date2=' + date + from + '|destination2=' + destination + '|result2=' + result + '|link2=' + link + '}}';
				oldMovesText += newTextToAdd;
				text = text.replace(oldMovesPresent[0].wikitext, oldMovesText);
			}
			
		} else {
			var oldMovesText = '{{Old moves';
			var numOldMoves = 1;
			for (var i = 0; i < oldMovesPresent.length; i++) {
				for (var j = 0; j < oldMovesPresent[i].parameters.length; j++) {
					if (oldMovesPresent[i].parameters[j].name == "date") {
						oldMovesText += '|date' + numOldMoves + '=' + oldMovesPresent[i].parameters[j].value;
					} else if (oldMovesPresent[i].parameters[j].name == "from") {
						oldMovesText += '|name' + numOldMoves + '=' + oldMovesPresent[i].parameters[j].value;
					} else if (oldMovesPresent[i].parameters[j].name == "destination") {
						oldMovesText += '|destination' + numOldMoves + '=' + oldMovesPresent[i].parameters[j].value;
					} else if (oldMovesPresent[i].parameters[j].name == "result") {
						oldMovesText += '|result' + numOldMoves + '=' + oldMovesPresent[i].parameters[j].value;
					} else if (oldMovesPresent[i].parameters[j].name == "link") {
						oldMovesText += '|link' + numOldMoves + '=' + oldMovesPresent[i].parameters[j].value;
					} else {
						oldMovesText += oldMovesPresent[i].parameters[j].wikitext;
					}
				}
				numOldMoves++;
			}
			if(result == "moved"){
				from = '|from' + numOldMoves + '=' + rmCloser.title;
			}
			var newTextToAdd = '|date' + numOldMoves + '=' + date + from + '|destination' + numOldMoves + '=' + destination + '|result' + numOldMoves + '=' + result + '|link' + numOldMoves + '=' + link + '}}';
			oldMovesText += newTextToAdd;
			text = text.replace(oldMovesPresent[0].wikitext, oldMovesText);
			for (var i = 1; i < oldMovesPresent.length; i++) {
				text = text.replace(oldMovesPresent[i].wikitext, "");
			}
		}
	
		talkpage.setPageText(text);
		talkpage.setEditSummary('Closing requested move; ' + result + rmCloser.advert);
		talkpage.save(Morebits.status.actionCompleted('Moved closed.'));
		
		if(multiMove == true){
			var otherDestinations = [];
			var otherPages = [];
			for(i=2; i<(numberOfMoves+1); i++){
				var curr;
				var dest;
				for (var j = 0; j < template.parameters.length; j++) {
					if (template.parameters[j].name == ("current" + i)) {
						curr = template.parameters[j].value;
					} else if (template.parameters[j].name == ("new" + i)) {
						dest = template.parameters[j].value;
						break;
					}
				}
				
				if(curr != null && dest != null){
					otherPages.push(curr);
					otherDestinations.push(dest);
				}
			}
			
			var pagesLeft = otherPages.length;
			for(var j=0; j<otherPages.length; j++){
				var otherTitle_obj = mw.Title.newFromText(otherPages[j]);
				rmCloser.otherTalktitle = otherTitle_obj.getTalkPage().toText();
				var otherPage = new Morebits.wiki.page(rmCloser.otherTalktitle, 'Adding {{old move}} to ' + rmCloser.otherTalktitle + '.');
				otherPage.load(function(otherPage) {
					var otherText = otherPage.getPageText();

					var templatesOnOtherPage = extraJs.parseTemplates(otherText,false);
					var otherOldMovesPresent = [];
					for (var i = 0; i < templatesOnOtherPage.length; i++) {
						if (templatesOnOtherPage[i].name.toLowerCase() == "old moves" || templatesOnOtherPage[i].name.toLowerCase() == "old move") {
							otherOldMovesPresent.push(templatesOnOtherPage[i]);
						}
					}
					
					var title = mw.Title.newFromText(otherPage.getPageName()).getSubjectPage().toText();
					var OMcurr = otherPages[otherPages.indexOf(title)];
					var OMdest = otherDestinations[otherPages.indexOf(title)];
					var otherFrom = '';
					if(OMdest == "?"){
						OMdest == "";
					}
					var otherDestination = OMdest;
					var otherArchives = otherText.match(/{{[Aa]rchives/);
					if(otherArchives == null){
						otherArchives = otherText.match(/{{[Aa]rchive box/);
						if(otherArchives == null){
							otherArchives = otherText.match(/{{[Aa]rchivebox/);
							if(otherArchives == null){
								otherArchives = otherText.match(/==.*==/);
							}
						}
					}

					if (otherOldMovesPresent.length == 0) {
						if(result == "moved"){
							otherFrom = '|from=' + OMcurr;
						}
						otherText = otherText.replace(otherArchives[0], '{{old move'+ '|date=' + date + otherFrom + '|destination=' + otherDestination + '|result=' + result + '|link=' + link +'}}\n\n' + otherArchives[0]);
					} else if (otherOldMovesPresent.length == 1) {
						var isValidFormat = false;
						var isListFormat = false;
						var numOldMoves = 0;
						for (var i = 0; i < otherOldMovesPresent[0].parameters.length; i++) {
							var parameterName = otherOldMovesPresent[0].parameters[i].name;
							parameterName = parameterName.toString();
							if (parameterName == "list") {
								isListFormat = true;
								break;
							} else if (parameterName == "result1") {
								isValidFormat = true;
								numOldMoves++;
							} else if (parameterName.includes("result")) {
								numOldMoves++;
							}
						}
			
						if (isValidFormat && !isListFormat) {
							var oldMovesText = otherOldMovesPresent[0].wikitext;
							numOldMoves++;
							if(result == "moved"){
								otherFrom = '|from' + numOldMoves + '=' + OMcurr;
							}
							var newTextToAdd = '|date' + numOldMoves + '=' + date + otherFrom + '|destination' + numOldMoves + '=' + otherDestination + '|result' + numOldMoves + '=' + result + '|link' + numOldMoves + '=' + link + '}}';
							oldMovesText = oldMovesText.substring(0, oldMovesText.length-2) + newTextToAdd;
							otherText = otherText.replace(otherOldMovesPresent[0].wikitext, oldMovesText);
						} else if (isListFormat) {
							if(result == "moved"){
								otherFrom = '|from=' + OMcurr;
							}
							otherText = otherText.replace(otherArchives[0], '{{old move'+ '|date=' + date + otherFrom + '|destination=' + otherDestination + '|result=' + result + '|link=' + link +'}}\n\n' + otherArchives[0]);
						} else {
							var oldMovesText = '{{' + otherOldMovesPresent[0].name;
							for (var i = 0; i < otherOldMovesPresent[0].parameters.length; i++) {
								if (otherOldMovesPresent[0].parameters[i].name == "date") {
									oldMovesText += '|date1=' + otherOldMovesPresent[0].parameters[i].value;
								} else if (otherOldMovesPresent[0].parameters[i].name == "from") {
									oldMovesText += '|name1=' + otherOldMovesPresent[0].parameters[i].value;
								} else if (otherOldMovesPresent[0].parameters[i].name == "destination") {
									oldMovesText += '|destination1=' + otherOldMovesPresent[0].parameters[i].value;
								} else if (otherOldMovesPresent[0].parameters[i].name == "result") {
									oldMovesText += '|result1=' + otherOldMovesPresent[0].parameters[i].value;
								} else if (otherOldMovesPresent[0].parameters[i].name == "link") {
									oldMovesText += '|link1=' + otherOldMovesPresent[0].parameters[i].value;
								} else {
									oldMovesText += otherOldMovesPresent[0].parameters[i].wikitext;
								}
							}
							if(result == "moved"){
								otherFrom = '|from2=' + OMcurr;
							}
							var newTextToAdd = '|date2=' + date + otherFrom + '|destination2=' + otherDestination + '|result2=' + result + '|link2=' + link + '}}';
							oldMovesText += newTextToAdd;
							otherText = otherText.replace(otherOldMovesPresent[0].wikitext, oldMovesText);
						}
						
					} else {
						var oldMovesText = '{{Old moves';
						var numOldMoves = 1;
						for (var i = 0; i < otherOldMovesPresent.length; i++) {
							for (var j = 0; j < otherOldMovesPresent[i].parameters.length; j++) {
								if (otherOldMovesPresent[i].parameters[j].name == "date") {
									oldMovesText += '|date' + numOldMoves + '=' + otherOldMovesPresent[i].parameters[j].value;
								} else if (otherOldMovesPresent[i].parameters[j].name == "from") {
									oldMovesText += '|name' + numOldMoves + '=' + otherOldMovesPresent[i].parameters[j].value;
								} else if (otherOldMovesPresent[i].parameters[j].name == "destination") {
									oldMovesText += '|destination' + numOldMoves + '=' + otherOldMovesPresent[i].parameters[j].value;
								} else if (otherOldMovesPresent[i].parameters[j].name == "result") {
									oldMovesText += '|result' + numOldMoves + '=' + otherOldMovesPresent[i].parameters[j].value;
								} else if (otherOldMovesPresent[i].parameters[j].name == "link") {
									oldMovesText += '|link' + numOldMoves + '=' + otherOldMovesPresent[i].parameters[j].value;
								} else {
									oldMovesText += otherOldMovesPresent[i].parameters[j].wikitext;
								}
							}
							numOldMoves++;
						}
						if(result == "moved"){
							otherFrom = '|from' + numOldMoves + '=' + OMcurr;
						}
						var newTextToAdd = '|date' + numOldMoves + '=' + date + otherFrom + '|destination' + numOldMoves + '=' + otherDestination + '|result' + numOldMoves + '=' + result + '|link' + numOldMoves + '=' + link + '}}';
						oldMovesText += newTextToAdd;
						otherText = otherText.replace(otherOldMovesPresent[0].wikitext, oldMovesText);
						for (var i = 1; i < otherOldMovesPresent.length; i++) {
							otherText = otherText.replace(otherOldMovesPresent[i].wikitext, "");
						}
					}

					otherPage.setPageText(otherText);
					otherPage.setEditSummary('Closing requested move; ' + result + rmCloser.advert);
					otherPage.save(Morebits.status.actionCompleted('Moved closed.'));
					pagesLeft--;
				});
			}
			
			if(result == "moved"){
				var waitInterval = setInterval(function(){
					if(pagesLeft == 0){
						rmCloser.movePages(rmCloser.title,destination,otherPages,otherDestinations,link);
						clearInterval(waitInterval);
					}
				}, 500);
			} else{
				setTimeout(function(){ location.reload() }, 2000);
			}
		} else if(result == "moved"){
			var emptyArray = [];
			rmCloser.movePages(rmCloser.title,destination,emptyArray,emptyArray,link);
		} else{
			setTimeout(function(){ location.reload() }, 2000);	
		}
	});
};

rmCloser.movePages = function rmCloserMovePages(curr1,dest1,currList,destList,link){
	var numberToRemove = currList.length+1;
	
	rmCloser.talktitle = mw.Title.newFromText(Morebits.pageNameNorm).getTalkPage().toText();
	var pageAndSection = link;
	var moveSummary = 'Moved per [[' + pageAndSection + ']]';
	var rmtrReason = 'Per [[' + pageAndSection + ']].';
	
	var form = new Morebits.quickForm();
	
	form.append({
		type: 'header',
		label: 'Move pages'
	});

	form.append({
		type: 'div',
		className: 'rmCloserMovePages' + curr1,
		label: curr1 + ' → ' + dest1
	});
	
	form.append({
		type: 'button',
		className: 'rmCloserMovePages' + curr1,
		label: 'Move directly',
		event: function() {
			rmCloser.directMove(curr1,dest1,false,moveSummary);
			for(var i=0; i<document.getElementsByClassName('rmCloserMovePages' + curr1).length; i++){
				document.getElementsByClassName('rmCloserMovePages' + curr1)[i].style.display = 'none';
			}
			numberToRemove--;
		}
	});
	
	if(!Morebits.userIsInGroup('sysop') && !Morebits.userIsInGroup('extendedmover')){
		form.append({
			type: 'button',
			className: 'rmCloserMovePages' + curr1,
			label: 'Submit technical request',
			event: function() {
				rmCloser.submitRMTR(curr1,dest1,rmtrReason);
				for(var i=0; i<document.getElementsByClassName('rmCloserMovePages' + curr1).length; i++){
					document.getElementsByClassName('rmCloserMovePages' + curr1)[i].style.display = 'none';
				}
				numberToRemove--;
			}
		});
	} else{
		form.append({
			type: 'button',
			className: 'rmCloserMovePages' + curr1,
			label: 'Move directly without leaving a redirect',
			event: function() {
				rmCloser.directMove(curr1,dest1,true,moveSummary);
				for(var i=0; i<document.getElementsByClassName('rmCloserMovePages' + curr1).length; i++){
					document.getElementsByClassName('rmCloserMovePages' + curr1)[i].style.display = 'none';
				}
				numberToRemove--;
			}
		});
	}
	
	for(var i=0; i<currList.length; i++){
		form.append({
			type: 'div',
			className: 'rmCloserMovePages' + currList[i],
			label: currList[i] + ' → ' + destList[i]
		});
		form.append({
			type: 'button',
			className: 'rmCloserMovePages' + currList[i],
			name: currList[i],
			extra: destList[i],
			label: 'Move directly',
			event: function() {
				rmCloser.directMove(this.name,this.extra,false,moveSummary);
				for(var j=0; j<document.getElementsByClassName('rmCloserMovePages' + this.name).length; j++){
					document.getElementsByClassName('rmCloserMovePages' + this.name)[j].style.display = 'none';
				}
				numberToRemove--;
			}
		});
		if(!Morebits.userIsInGroup('sysop') && !Morebits.userIsInGroup('extendedmover')){
			form.append({
				type: 'button',
				className: 'rmCloserMovePages' + currList[i],
				name: currList[i],
				extra: destList[i],
				label: 'Submit technical request',
				event: function() {
					rmCloser.submitRMTR(this.name,this.extra,rmtrReason);
					for(var j=0; j<document.getElementsByClassName('rmCloserMovePages' + this.name).length; j++){
						document.getElementsByClassName('rmCloserMovePages' + this.name)[j].style.display = 'none';
					}
					numberToRemove--;
				}
			});
		} else{
			form.append({
				type: 'button',
				className: 'rmCloserMovePages' + currList[i],
				name: currList[i],
				extra: destList[i],
				label: 'Move directly without leaving a redirect',
				event: function() {
					rmCloser.directMove(this.name,this.extra,true,moveSummary);
					for(var j=0; j<document.getElementsByClassName('rmCloserMovePages' + this.name).length; j++){
						document.getElementsByClassName('rmCloserMovePages' + this.name)[j].style.display = 'none';
					}
					numberToRemove--;
				}
			});
		}
	}

	var formResult = form.render();
	rmCloser.Window.setContent(formResult);
	rmCloser.Window.display();
	
	var moveInterval = setInterval(function(){
		if(numberToRemove == 0){
			rmCloser.Window.close();
			clearInterval(moveInterval);
			setTimeout(function(){ location.reload() }, 2000);
		}
	}, 500);
};

rmCloser.directMove = function rmCloserDirectMove(curr,dest,suppressRedirect,editSummary) {
	var pageToMove = new Morebits.wiki.page(curr, 'Moving ' + curr + ' to ' + dest + '.');
	pageToMove.setMoveDestination(dest);
	pageToMove.setMoveSubpages(true);
	pageToMove.setMoveTalkPage(true);
	pageToMove.setMoveSuppressRedirect(suppressRedirect);
	pageToMove.setEditSummary(editSummary + rmCloser.advert);
	pageToMove.move(Morebits.status.actionCompleted('Moved.'));
};

rmCloser.submitRMTR = function rmCloserSubmitRMTR(curr,dest,reason) {
	var rmtr = new Morebits.wiki.page('Wikipedia:Requested moves/Technical requests', 'Submitting request at WP:RM/TR');
	rmtr.load(function(page) {
		var text = rmtr.getPageText();
		var textToFind = /\n{1,}(==== ?Requests to revert undiscussed moves ?====)/i;
		var rmtrText = '{{subst:RMassist|1=' + curr + '|2=' + dest + '|reason=' + reason + '}}';
		text = text.replace(textToFind, '\n' + rmtrText + '\n\n$1');
		rmtr.setPageText(text);
		rmtr.setEditSummary('Add request' + rmCloser.advert);
		rmtr.save(Morebits.status.actionCompleted('Requested.'));
	});
};

rmCloser.relist = function rmCloserRelist(e) {
	if (e) e.preventDefault();
	var title_obj = mw.Title.newFromText(Morebits.pageNameNorm);
	rmCloser.talktitle = title_obj.getTalkPage().toText();
	var talkpage = new Morebits.wiki.page(rmCloser.talktitle, 'Relisting.');
	
	var relistingComment = document.getElementById('rmCloserRelistComment').value;
	
	talkpage.load(function(talkpage) {
		var text = talkpage.getPageText();

		var templateFound = false;
		var sig;
		var line;
		var templateIndex = -1;
		var textToFind = text.split('\n');
		for (var i = 0; i < textToFind.length; i++) {	
			line = textToFind[i];
			if(templateFound == false){
				if(/{{[Rr]equested move\/dated/.test(line)){
					templateFound = true;
					templateIndex = i;
				}
			} else if(templateFound == true){
				if (/ \(UTC\)/.test(line)){
					sig = line;
					break;
				}
			}
		}
		
		text = text.replace(sig, sig + " {{subst:RM relist}}");
		
		if(relistingComment != ''){
			var nextSection = false;
			for (var i = templateIndex+1; i < textToFind.length; i++) {
				line = textToFind[i];
				if (line.match(/^(==)[^=].+\1/)) {
					nextSection = true;
					var escapedLine = line.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
					var regex = new RegExp('(' + escapedLine + ')(?![\s\S]*(' + escapedLine + '))', 'm');
					text = text.replace(regex, ':<small>\'\'\'Relisting comment\'\'\': ' + relistingComment + ' ~~~~</small>\n\n' + line);
					break;
				}
			}

			if (!nextSection) {
				text += '\n:<small>\'\'\'Relisting comment\'\'\': ' + relistingComment + ' ~~~~</small>';
			}
		}
		
		talkpage.setPageText(text);
		talkpage.setEditSummary('Relisted requested move' + rmCloser.advert);
		talkpage.save(Morebits.status.actionCompleted('Relisted.'));
		document.getElementById("requestedmovetag").innerHTML = "";
		setTimeout(function(){ location.reload() }, 2000);
	});
};

rmCloser.notify = function rmCloserNotify(e) {
	if (e) e.preventDefault();
	var wikiProjectTemplates = document.getElementsByClassName("wpb-project_link");
	var wikiProjectNames = [];
	var wikiProjects = [];
	for(var i=0; i<wikiProjectTemplates.length; i++){
		var wikiProjectName = wikiProjectTemplates[i].innerHTML;
		var wikiProjectTalk = mw.Title.newFromText(wikiProjectTemplates[i].innerHTML).getTalkPage().toText();
		if (!wikiProjectNames.includes(wikiProjectName)) {
			wikiProjectNames.push(wikiProjectName);
			wikiProjects.push(wikiProjectTalk);
		}
	}

	var wikiProjectBannerShellHeaders = document.getElementsByClassName("wpb-header-combined");
	for (var i=0; i<wikiProjectBannerShellHeaders.length; i++) {
		var subprojectList = wikiProjectBannerShellHeaders[i];
		if (subprojectList.hasChildNodes() && subprojectList.children.length > 2) {
			subprojectList = subprojectList.children[2];
			if (subprojectList.hasChildNodes() && subprojectList.children.length > 0) {
				subprojectList = subprojectList.children;
				for (var j=0; j<subprojectList.length; j++) {
					var wikiProjectName = subprojectList[j].title;
					var wikiProjectTalk = mw.Title.newFromText(subprojectList[j].title).getTalkPage().toText();
					if (!wikiProjectNames.includes(wikiProjectName)) {
						wikiProjectNames.push(wikiProjectName);
						wikiProjects.push(wikiProjectTalk);
					}
				}
			}
		}
	}
	
	if(wikiProjects.length == 0){
		mw.notify('No WikiProject banners found on this page');
	} else{
		var Window = new Morebits.simpleWindow(600, 450);
		Window.setTitle( "Notify WikiProjects about requested move" );
		Window.setScriptName('rmCloser');
		Window.addFooterLink('Script documentation', 'User:TheTVExpert/rmCloser');
		Window.addFooterLink('Give feedback', 'User talk:TheTVExpert/rmCloser');

		var form = new Morebits.quickForm(rmCloser.notifyCheck);

		form.append({
			type: 'div',
			label: 'WikiProjects with banners on this page:'
		});

		form.append({
			type: 'checkbox',
			name: 'wikiProject',
			list: wikiProjects.map(function (wp) {
				var wplabel = wikiProjectNames[wikiProjects.indexOf(wp)];
				return { type: 'option', label: wplabel, value: wp };
			})
		});

		if(wikiProjects[0] != 'none'){
			form.append({ type: 'submit', label: 'Notify selected WikiProject(s)' });
		}

		var formResult = form.render();
		Window.setContent(formResult);
		Window.display();
	}
};

rmCloser.notifyCheck = function(e) {
	var form = e.target;
	rmCloser.params = Morebits.quickForm.getInputData(form);

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);
	
	var wikiProjectsToNotify = rmCloser.params.wikiProject;

	if (wikiProjectsToNotify.length == 0) {
		Morebits.status.error('Error', 'No WikiProjects selected');
	} else {
		var uniqueWikiProjects = [];
		var wikiProjectCount = 0;
		for (var i=0; i<wikiProjectsToNotify.length; i++) {
			var talkpage = new Morebits.wiki.page(wikiProjectsToNotify[i], 'Checking ' + wikiProjectsToNotify[i] + '.');
			talkpage.setFollowRedirect(true);
			talkpage.load(function(talkpage) {
				var wikiProjectToNotify = talkpage.getPageName();
				if (!uniqueWikiProjects.includes(wikiProjectToNotify)) {
					uniqueWikiProjects.push(wikiProjectToNotify);
				}
				wikiProjectCount++;
				if (wikiProjectCount == wikiProjectsToNotify.length && uniqueWikiProjects.length > 0) {
					rmCloser.notifyGetSection(uniqueWikiProjects);
				}
			});
		}
	}
};

rmCloser.notifyGetSection = function(wikiProjectsToNotify) {
	var title_obj = mw.Title.newFromText(Morebits.pageNameNorm);
	rmCloser.talktitle = title_obj.getTalkPage().toText();
	var talkpage = new Morebits.wiki.page(rmCloser.talktitle, 'Getting section.');
	
	talkpage.load(function(talkpage) {
		var text = talkpage.getPageText();
		var line;
		var templateIndex = -1;
		var rmSection;
		var textToFind = text.split('\n');
		for (var i = 0; i < textToFind.length; i++) {	
			line = textToFind[i];
			if(/{{[Rr]equested move\/dated/.test(line)){
				templateIndex = i;
				break;
			}
		}

		for (var i = templateIndex; i >= 0; i--) {
			line = textToFind[i];
			if (line.match(/^(==)[^=].+\1/)) {
				rmSection = line.match(/^(==)[^=](.+)\1/)[2].trim();
				break;
			}
		}

		rmCloser.notifyEvaluate(wikiProjectsToNotify, rmSection);
	});
};

rmCloser.notifyEvaluate = function(wikiProjectsToNotify, moveSection) {
	var wikiProjectsNotified = [];
	var wikiProjectCount = 0;
	for (var j=0; j<wikiProjectsToNotify.length; j++) {
		var talkpage = new Morebits.wiki.page(wikiProjectsToNotify[j], 'Notifying ' + wikiProjectsToNotify[j] + '.');
		talkpage.setFollowRedirect(true);
		talkpage.load(function(talkpage) {
			var wikiProjectToNotify = talkpage.getPageName();
			var text = talkpage.getPageText();
	
			rmCloser.talktitle = mw.Title.newFromText(Morebits.pageNameNorm).getTalkPage().toText();
			var pageAndSection = rmCloser.talktitle + "#" + moveSection;
			
			var notified;
			
			if(confirm("\"" + wikiProjectToNotify + "\" may have already been notified of the discussion. Do you wish to proceed?")){
				text += "\n\n== Requested move at [[" + pageAndSection + "]] ==\n[[File:Information.svg|30px|left]] There is a requested move discussion at [[" + pageAndSection + "]] that may be of interest to members of this WikiProject. ~~~~";

				talkpage.setPageText(text);
				talkpage.setEditSummary('Notifying of [[' + pageAndSection + '\|requested move]]' + rmCloser.advert);
				talkpage.save(Morebits.status.actionCompleted('Notified.'));
				notified = true;
			} else{
				var cancelNotify = new Morebits.status('Error', 'Notification canceled', 'error');
				notified = false;
			}
			
			if(notified){
				wikiProjectsNotified.push(wikiProjectToNotify);
			}
			
			wikiProjectCount++;

			if (wikiProjectCount == wikiProjectsToNotify.length && wikiProjectsNotified.length > 0) {
				rmCloser.notifyListOnTalkPage(wikiProjectsNotified);
			}
		});
	}
};

rmCloser.notifyListOnTalkPage = function(wikiProjectsNotified) {
	var discussionPage = new Morebits.wiki.page(rmCloser.talktitle, 'Adding note about notification to requested move');
	discussionPage.load(function(discussionPage) {
		var discussionPageText = discussionPage.getPageText();
		
		var templateFound = false;
		var line;
		var nextSection = false;
		var textToFind = discussionPageText.split('\n');
		for (var i = 0; i < textToFind.length; i++) {	
			line = textToFind[i];
			if(templateFound == false){
				if(/{{[Rr]equested move\/dated/.test(line)){
					templateFound = true;
				}
			} else if(templateFound == true){
				if (line.match(/^(==)[^=].+\1/)) {
					nextSection = true;
					var escapedLine = line.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
					var regex = new RegExp('(' + escapedLine + ')(?![\s\S]*(' + escapedLine + '))', 'm');
					if (wikiProjectsNotified.length == 1) {
						var wikiProjectToNotify = wikiProjectsNotified[0];
						discussionPageText = discussionPageText.replace(regex, ':<small>Note: [[' + wikiProjectToNotify + '|' + wikiProjectToNotify.slice(15) + ']] has been notified of this discussion. ~~~~</small>\n\n' + line);
					} else {
						var textToInsert = ':<small>Note: ';
						for (var j=0; j<wikiProjectsNotified.length; j++) {
							var wikiProjectToNotify = wikiProjectsNotified[j];
							textToInsert += '[[' + wikiProjectToNotify + '|' + wikiProjectToNotify.slice(15) + ']]';
							if (j == wikiProjectsNotified.length-2) {
								if (wikiProjectsNotified.length == 2) {
									textToInsert += ' and ';
								} else {
									textToInsert += ', and ';
								}
							} else if (j != wikiProjectsNotified.length-1) {
								textToInsert += ', ';
							}
						}
						textToInsert += ' have been notified of this discussion. ~~~~</small>\n\n';
						discussionPageText = discussionPageText.replace(regex, textToInsert + line);
					}
					break;
				}
			}
		}

		if (!nextSection) {
			if (wikiProjectsNotified.length == 1) {
				var wikiProjectToNotify = wikiProjectsNotified[0];
				discussionPageText+='\n:<small>Note: [[' + wikiProjectToNotify + '|' + wikiProjectToNotify.slice(15) + ']] has been notified of this discussion. ~~~~</small>';
			} else {
				discussionPageText += '\n:<small>Note: ';
				for (var j=0; j<wikiProjectsNotified.length; j++) {
					var wikiProjectToNotify = wikiProjectsNotified[j];
					discussionPageText += '[[' + wikiProjectToNotify + '|' + wikiProjectToNotify.slice(15) + ']]';
					if (j == wikiProjectsNotified.length-2) {
						if (wikiProjectsNotified.length == 2) {
							discussionPageText += ' and ';
						} else {
							discussionPageText += ', and ';
						}
					} else if (j != wikiProjectsNotified.length-1) {
						discussionPageText += ', ';
					}
				}
				discussionPageText += ' have been notified of this discussion. ~~~~</small>';
			}
		}

		discussionPage.setPageText(discussionPageText);
		discussionPage.setEditSummary('Added note about notifying WikiProject about requested move' + rmCloser.advert);
		discussionPage.save(Morebits.status.actionCompleted('Note added.'));
		setTimeout(function(){ location.reload() }, 2000);
	});
};
//</nowiki>
