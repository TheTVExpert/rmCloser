//rmCloser
//<nowiki>
var rmCloser = {};
window.rmCloser = rmCloser;

$.when(
	mw.loader.using([ 'mediawiki.api', 'ext.gadget.morebits' ]),
	$.ready
).then(function() {
	if (document.getElementById("reqmovetag") !== null) {
		document.getElementById("reqmovetag").innerHTML = "<button id='rmCloserClose'>Close</button><button id='rmCloserRelist'>Relist</button><button id='rmCloserConfirm' style='display:none'>Confirm relist</button><button id='rmCloserCancel' style='display:none'>Cancel relist</button><button id='rmCloserNotify'>Notify WikiProjects</button>";
		$('#rmCloserClose').click(rmCloser.callback);
		$('#rmCloserRelist').click(rmCloser.confirmRelist);
		$('#rmCloserConfirm').click(rmCloser.relist);
		$('#rmCloserCancel').click(rmCloser.cancelRelist);
		$('#rmCloserNotify').click(rmCloser.notify);
	} else if(Morebits.pageNameNorm == "Wikipedia:Requested moves/Technical requests"){
		var externalText = document.getElementsByClassName("external text");
		var moveLinks = [];
		for(var i=0; i<externalText.length; i++){
			if(externalText[i].innerHTML == "move"){
				moveLinks.push(externalText[i].parentElement.parentElement);
			}
		}
		var parserOutputChildren = document.getElementsByClassName('mw-parser-output')[0].children;
		var childrenList = [];
		for(var i=0; i<parserOutputChildren.length; i++){
			childrenList.push(parserOutputChildren[i].innerHTML);
		}
		var contestedHeader = childrenList.indexOf('<span class="mw-headline" id="Contested_technical_requests">Contested technical requests</span><span class="mw-editsection"><span class="mw-editsection-bracket">[</span><a href="/w/index.php?title=Wikipedia:Requested_moves/Technical_requests&amp;action=edit&amp;section=3" title="Edit section: Contested technical requests">edit source</a><span class="mw-editsection-bracket">]</span></span>');
		var revertUndiscussedHeader = childrenList.indexOf('<span class="mw-headline" id="Requests_to_revert_undiscussed_moves">Requests to revert undiscussed moves</span><span class="mw-editsection"><span class="mw-editsection-bracket">[</span><a href="/w/index.php?title=Wikipedia:Requested_moves/Technical_requests&amp;action=edit&amp;section=4" title="Edit section: Requests to revert undiscussed moves">edit source</a><span class="mw-editsection-bracket">]</span></span>');
		for(var i=0; i<moveLinks.length; i++){
			var rmAssistIndex = childrenList.indexOf(moveLinks[i].parentElement.innerHTML);
			var rmtrButtonSpan = document.createElement("SPAN");
			if(rmAssistIndex > contestedHeader && rmAssistIndex < revertUndiscussedHeader){
				rmtrButtonSpan.innerHTML = "<button id='rmCloserRMassistDi" + i + "' onclick='rmCloser.rmtrEvaluate(this.id)'>Discuss</button>";
			} else{
				rmtrButtonSpan.innerHTML = "<button id='rmCloserRMassistMD" + i + "' onclick='rmCloser.rmtrEvaluate(this.id)'>Move directly</button><button id='rmCloserRMassistSP" + i + "' onclick='rmCloser.rmtrEvaluate(this.id)'>Swap Pages</button>";
				rmtrButtonSpan.innerHTML += "<button id='rmCloserRMassistCo" + i + "' onclick='rmCloser.rmtrEvaluate(this.id)'>Contest</button>";
			}
			rmtrButtonSpan.innerHTML += "<button id='rmCloserRMassistRe" + i + "' onclick='rmCloser.rmtrEvaluate(this.id)'>Remove</button><br><span id='rmCloserRMassistHiddenSpan" + i + "'></span><br><hr><br>";
			moveLinks[i].parentElement.insertBefore(rmtrButtonSpan,moveLinks[i].nextElementSibling);
		}
	}
});

rmCloser.confirmRelist = function rmCloserConfirmRelist(e) {
	if (e) e.preventDefault();
	document.getElementById("rmCloserConfirm").style.display = "inline";
	document.getElementById("rmCloserCancel").style.display = "inline";
	document.getElementById("rmCloserClose").style.display = "none";
	document.getElementById("rmCloserRelist").style.display = "none";
};

rmCloser.cancelRelist = function rmCloserCancelRelist(e) {
	if (e) e.preventDefault();
	document.getElementById("rmCloserConfirm").style.display = "none";
	document.getElementById("rmCloserCancel").style.display = "none";
	document.getElementById("rmCloserClose").style.display = "inline";
	document.getElementById("rmCloserRelist").style.display = "inline";
};

rmCloser.advert = ' using [[User:TheTVExpert/rmCloser|rmCloser]]';

rmCloser.callback = function rmCloserCallback(e) {
	if (e) e.preventDefault();

	rmCloser.Window = new Morebits.simpleWindow(600, 450);
	rmCloser.Window.setTitle( "Close requested move" );
	rmCloser.Window.setScriptName('rmCloser');
	rmCloser.Window.addFooterLink('RM Closing instruction', 'WP:RMCI');
	rmCloser.Window.addFooterLink('Script documentation', 'User:TheTVExpert/rmCloser');

	var form = new Morebits.quickForm(rmCloser.evaluate);
	
	form.append({
		type: 'div',
		label: 'Result'
	});

	form.append({
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
	
	form.append({
		type: 'input',
		name: 'customResult'
	});

	form.append({ type: 'submit', label: 'Submit' });

	var formResult = form.render();
	rmCloser.Window.setContent(formResult);
	rmCloser.Window.display();
	
	document.getElementsByName('customResult')[0].style.display = 'none';
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

	var talkpage = new Morebits.wiki.page(rmCloser.talktitle, 'Closing move.');
	talkpage.load(function(talkpage) {
		var text = talkpage.getPageText();
		var template = text.match(/{{[Rr]equested move\/dated\|.*\n?.*}}/)[0];

		var templateFound = false;
		var numberOfMoves = 0;
		var line;
		var textToFind = text.split('\n');
		for (var i = 0; i < textToFind.length; i++) {	
			line = textToFind[i];
			if(templateFound == false){
				if(/{{[Rr]equested move\/dated/.test(line)){
					templateFound = true;
				}
			} else if(templateFound == true){
				if (/ \(UTC\)/.test(line)){
					break;
				} else if(/→/.test(line)){
					numberOfMoves++;
				}
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
		text = text.replace(/{{[Rr]equested move\/dated\|.*\n?.*}}/, "{{subst:RM top|'''" + result + ".'''"+ userGroupText +"}}");
		
		var sections = text.match(/^(==)[^=].+\1/gm);
		var sectionToFind = /== Requested move.*==/;
		sections.reverse();
		var moveSection;
		if(sectionToFind.test(sections[0])){
			text+='\n{{subst:RM bottom}}';
			moveSection = sections[0];
		} else{
			var i;
			for(i=0;i<sections.length;i++){
				if(sectionToFind.test(sections[i])){
					text = text.replace(sections[i-1], '\n{{subst:RM bottom}}\n' + sections[i-1]);
					moveSection = sections[i];
					break;
				}
			}
		}
		
		var multiMove = false;
		
		var date = '|date=' + moveSection.slice(18,34);
		var from = '';
		if(result == "moved"){
			from = '|from=' + rmCloser.title;
		}
		var destination = template.match(/\|new1=(.*)\|current2=/);
		if(destination != null){
			multiMove = true;
			destination = destination[1];
		} else{
			destination = template.match(/\|(.*)}}/);
			if(destination != null){
				destination = destination[1];
			}
		}
		var moveSectionPlain = moveSection.slice(3,-3);
		var link = '|link=Special:Permalink/' + talkpage.getCurrentID() + '#' + moveSectionPlain;
		
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
		text = text.replace(archives[0], '{{old move'+ date + from + '|destination=' + destination + '|result=' + result + link +'}}\n\n' + archives[0]);
	
		talkpage.setPageText(text);
		talkpage.setEditSummary('Closing requested move; ' + result + rmCloser.advert);
		talkpage.save(Morebits.status.actionCompleted('Moved closed.'));
		
		if(multiMove == true){
			var otherDestinations = [];
			var otherPages = [];
			for(i=2; i<(numberOfMoves+1); i++){
				var text1 = "\\|current" + i + "=(.*)\\|new" + i;
				var reg1 = new RegExp(text1);
				var curr = template.match(reg1);
				var dest;
				if(i != numberOfMoves){
					var nextNum = i+1;
					var text2 = "\\|new" + i + "=(.*)\\|current" + nextNum;
					var reg2 = new RegExp(text2);
					dest = template.match(reg2);
				} else{
					var text3 = "\\|new" + i + "=(.*)\\|}}";
					var reg3 = new RegExp(text3);
					dest = template.match(reg3);
				}
				
				if(curr != null && dest != null){
					otherPages.push(curr[1]);
					otherDestinations.push(dest[1]);
				}
			}
			
			var pagesLeft = otherPages.length;
			for(var j=0; j<otherPages.length; j++){
				var otherTitle_obj = mw.Title.newFromText(otherPages[j]);
				rmCloser.otherTalktitle = otherTitle_obj.getTalkPage().toText();
				var otherPage = new Morebits.wiki.page(rmCloser.otherTalktitle, 'Adding {{old move}} to ' + rmCloser.otherTalktitle + '.');
				otherPage.load(function(otherPage) {
					var otherText = otherPage.getPageText();
					var title = mw.Title.newFromText(otherPage.getPageName()).getSubjectPage().toText();
					var OMcurr = otherPages[otherPages.indexOf(title)];
					var OMdest = otherDestinations[otherPages.indexOf(title)];
					var otherFrom = '';
					if(result == "moved"){
						otherFrom = '|from=' + OMcurr;
					}
					var otherDestination = '|destination=' + OMdest;
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
					otherText = otherText.replace(otherArchives[0], '{{old move'+ date + otherFrom + otherDestination + '|result=' + result + link +'}}\n\n' + otherArchives[0]);

					otherPage.setPageText(otherText);
					otherPage.setEditSummary('Closing requested move; ' + result + rmCloser.advert);
					otherPage.save(Morebits.status.actionCompleted('Moved closed.'));
					pagesLeft--;
				});
			}
			
			if(result == "moved"){
				var waitInterval = setInterval(function(){
					if(pagesLeft == 0){
						rmCloser.movePages(rmCloser.title,destination,otherPages,otherDestinations);
						clearInterval(waitInterval);
					}
				}, 500);
			} else{
				setTimeout(function(){ location.reload() }, 2000);
			}
		} else if(result == "moved"){
			var emptyArray = [];
			rmCloser.movePages(rmCloser.title,destination,emptyArray,emptyArray);
		} else{
			setTimeout(function(){ location.reload() }, 2000);	
		}
	});
};

rmCloser.movePages = function rmCloserMovePages(curr1,dest1,currList,destList){
	var numberToRemove = currList.length+1;
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
			rmCloser.directMove(curr1,dest1,false);
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
				rmCloser.submitRMTR(curr1,dest1);
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
				rmCloser.directMove(curr1,dest1,true);
				for(var i=0; i<document.getElementsByClassName('rmCloserMovePages' + curr1).length; i++){
					document.getElementsByClassName('rmCloserMovePages' + curr1)[i].style.display = 'none';
				}
				numberToRemove--;
			}
		});
	}
	
	for(var i=0; i<currList.length; i++){
		form.append({ type: 'div', className: 'rmCloserMovePages' + currList[i], label: currList[i] + ' → ' + destList[i] });
		form.append({ type: 'button', className: 'rmCloserMovePages' + currList[i], name: currList[i], extra: destList[i], label: 'Move directly', event: function() { rmCloser.directMove(this.name,this.extra,false); for(var j=0; j<document.getElementsByClassName('rmCloserMovePages' + this.name).length; j++){ document.getElementsByClassName('rmCloserMovePages' + this.name)[j].style.display = 'none'; } numberToRemove--; } });
		if(!Morebits.userIsInGroup('sysop') && !Morebits.userIsInGroup('extendedmover')){
			form.append({ type: 'button', className: 'rmCloserMovePages' + currList[i], name: currList[i], extra: destList[i], label: 'Submit technical request', event: function() { rmCloser.submitRMTR(this.name,this.extra); for(var j=0; j<document.getElementsByClassName('rmCloserMovePages' + this.name).length; j++){ document.getElementsByClassName('rmCloserMovePages' + this.name)[j].style.display = 'none'; } numberToRemove--; } });
		} else{
			form.append({ type: 'button', className: 'rmCloserMovePages' + currList[i], name: currList[i], extra: destList[i], label: 'Move directly without leaving a redirect', event: function() { rmCloser.directMove(this.name,this.extra,true); for(var j=0; j<document.getElementsByClassName('rmCloserMovePages' + this.name).length; j++){ document.getElementsByClassName('rmCloserMovePages' + this.name)[j].style.display = 'none'; } numberToRemove--; } });
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

rmCloser.directMove = function rmCloserDirectMove(curr,dest,suppressRedirect) {
	var pageToMove = new Morebits.wiki.page(curr, 'Moving ' + curr + ' to ' + dest + '.');
	pageToMove.setMoveDestination(dest);
	pageToMove.setMoveSubpages(true);
	pageToMove.setMoveTalkPage(true);
	pageToMove.setMoveSuppressRedirect(suppressRedirect);
	var sections = document.getElementsByClassName("mw-headline");
	var sectionArray = [];
	for(var i=0; i<sections.length; i++){
		sectionArray.push(sections[i].innerHTML);	
	}
	sectionArray.reverse();
	var sectionToFind = /Requested move.*/;
	var moveSection;
	for(var i=0; i<sectionArray.length; i++){
		if(sectionToFind.test(sectionArray[i])){
			moveSection = sectionArray[i];
			break;
		}
	}
	rmCloser.talktitle = mw.Title.newFromText(Morebits.pageNameNorm).getTalkPage().toText();
	var pageAndSection = rmCloser.talktitle + "#" + moveSection;
	pageToMove.setEditSummary('Moved per [[' + pageAndSection + ']]' + rmCloser.advert);
	pageToMove.move(Morebits.status.actionCompleted('Moved.'));
};

rmCloser.submitRMTR = function rmCloserSubmitRMTR(curr,dest) {
	var rmtr = new Morebits.wiki.page('Wikipedia:Requested moves/Technical requests', 'Submitting request at WP:RM/TR');
	rmtr.load(function(page) {
		var text = rmtr.getPageText();
		var textToFind = /---- and enter on a new line.* -->/;
		var sections = document.getElementsByClassName("mw-headline");
		var sectionArray = [];
		for(var i=0; i<sections.length; i++){
			sectionArray.push(sections[i].innerHTML);	
		}
		sectionArray.reverse();
		var sectionToFind = /Requested move.*/;
		var moveSection;
		for(var i=0; i<sectionArray.length; i++){
			if(sectionToFind.test(sectionArray[i])){
				moveSection = sectionArray[i];
				break;
			}
		}
		rmCloser.talktitle = mw.Title.newFromText(Morebits.pageNameNorm).getTalkPage().toText();
		var pageAndSection = rmCloser.talktitle + "#" + moveSection;
		var rmtrText = '{{subst:RMassist|1=' + curr + '|2=' + dest + '|reason=Per [[' + pageAndSection + ']].}}';
		text = text.replace(textToFind, '$&\n' + rmtrText);
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
	talkpage.load(function(talkpage) {
		var text = talkpage.getPageText();

		var templateFound = false;
		var sig;
		var line;
		var textToFind = text.split('\n');
		for (var i = 0; i < textToFind.length; i++) {	
			line = textToFind[i];
			if(templateFound == false){
				if(/{{[Rr]equested move\/dated/.test(line)){
					templateFound = true;
				}
			} else if(templateFound == true){
				if (/ \(UTC\)/.test(line)){
					sig = line;
					break;
				}
			}
		}
		text = text.replace(sig, sig + " {{subst:relisting}}");
		
		talkpage.setPageText(text);
		talkpage.setEditSummary('Relisted requested move' + rmCloser.advert);
		talkpage.save(Morebits.status.actionCompleted('Relisted.'));
		document.getElementById("reqmovetag").innerHTML = "";
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
		wikiProjectNames.push(wikiProjectName);
		wikiProjects.push(wikiProjectTalk);
	}
	
	if(wikiProjects.length == 0){
		mw.notify('No WikiProject banners found on this page');
	} else{
		var Window = new Morebits.simpleWindow(600, 450);
		Window.setTitle( "Notify WikiProjects about requested move" );
		Window.setScriptName('rmCloser');
		Window.addFooterLink('Script documentation', 'User:TheTVExpert/rmCloser');

		var form = new Morebits.quickForm(rmCloser.notifyEvaluate);

		form.append({
			type: 'div',
			label: 'WikiProjects with banners on this page:'
		});

		form.append({
			type: 'radio',
			name: 'wikiProject',
			list: wikiProjects.map(function (wp) {
				var wplabel = wikiProjectNames[wikiProjects.indexOf(wp)];
				return { type: 'option', label: wplabel, value: wp };
			})
		});

		if(wikiProjects[0] != 'none'){
			form.append({ type: 'submit', label: 'Notify selected WikiProject' });
		}

		var formResult = form.render();
		Window.setContent(formResult);
		Window.display();
	}
};

rmCloser.notifyEvaluate = function(e) {
	var form = e.target;
	rmCloser.params = Morebits.quickForm.getInputData(form);

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);
	
	var wikiProjectToNotify = rmCloser.params.wikiProject;
	if(wikiProjectToNotify == undefined){
		var noWP = new Morebits.status('Error', 'No WikiProject selected', 'error');
	} else{
		var talkpage = new Morebits.wiki.page(wikiProjectToNotify, 'Notifying ' + wikiProjectToNotify + '.');
		talkpage.setFollowRedirect(true);
		talkpage.load(function(talkpage) {
			var text = talkpage.getPageText();

			var sections = document.getElementsByClassName("mw-headline");
			var sectionArray = [];
			for(var i=0; i<sections.length; i++){
				sectionArray.push(sections[i].innerHTML);	
			}
			sectionArray.reverse();
			var sectionToFind = /Requested move.*/;
			var moveSection;
			for(var i=0; i<sectionArray.length; i++){
				if(sectionToFind.test(sectionArray[i])){
					moveSection = sectionArray[i];
					break;
				}
			}
			rmCloser.talktitle = mw.Title.newFromText(Morebits.pageNameNorm).getTalkPage().toText();
			var pageAndSection = rmCloser.talktitle + "#" + moveSection;
			
			if(text.match(pageAndSection) != null){
				if(confirm("Selected WikiProject may have already been notified of the discussion. Do you wish to proceed?")){
					text += "\n\n== Requested move at [[" + pageAndSection + "]] ==\n[[File:Information.svg|30px|left]] There is a requested move discussion at [[" + pageAndSection + "]] that may be of interest to members of this WikiProject. ~~~~";

					talkpage.setPageText(text);
					talkpage.setEditSummary('Notifying of requested move' + rmCloser.advert);
					talkpage.save(Morebits.status.actionCompleted('Notified.'));
				} else{
					var cancelNotify = new Morebits.status('Error', 'Notification canceled', 'error');	
				}
			} else{
				text += "\n\n== Requested move at [[" + pageAndSection + "]] ==\n[[File:Information.svg|30px|left]] There is a requested move discussion at [[" + pageAndSection + "]] that may be of interest to members of this WikiProject. ~~~~";

				talkpage.setPageText(text);
				talkpage.setEditSummary('Notifying of requested move' + rmCloser.advert);
				talkpage.save(Morebits.status.actionCompleted('Notified.'));	
			}
		});
	}
};

rmCloser.rmtrEvaluate = function rmCloserRMTREvaluate(id) {
	var type = id.slice(16,18);
	var number = id.slice(18,id.length);
	
	var rmtrPage = new Morebits.wiki.page('Wikipedia:Requested moves/Technical requests', 'Closing technical request');
	rmtrPage.load(function(rmtrPage) {
		var text = rmtrPage.getPageText();

		var rmAssistList = text.match(/\* {{RMassist\/core.*}}/g);
		var rmAssistToFind = rmAssistList[number];
		var currentTitle = rmAssistToFind.match(/\| 1 = (.*) \| 2 =/)[1];
		var destinationTitle = rmAssistToFind.match(/\| 2 = (.*) \| discuss =/)[1];
		var rmtrReason = rmAssistToFind.match(/\| reason = (.*) \| sig =/)[1];
		var requesterSig = rmAssistToFind.match(/\| sig = (.*) \| requester =/)[1];
		var requester = rmAssistToFind.match(/\| requester = (.*)}}/)[1];
		var rmAssistToFindEscaped = rmAssistToFind.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
		var rmAssistToFindRegex = new RegExp(rmAssistToFindEscaped + '(\\n\|.)*?(====\|\\* {{RMassist\\/core)');
		if(text.match(rmAssistToFindRegex) == null){
			rmAssistToFindRegex = new RegExp(rmAssistToFindEscaped + '(\\n\|.)*');
		}
		var replacementString = text.match(rmAssistToFindRegex)[2]
		if(replacementString == undefined){
			replacementString = "";
			var rmAssistToFindFull = text.match(rmAssistToFindRegex);
			rmAssistToFindFull = rmAssistToFindFull[0];
		} else{
			var rmAssistToFindFull = text.match(rmAssistToFindRegex);
			rmAssistToFindFull = rmAssistToFindFull[0].slice(0,-(replacementString.length+1));
		}
		var rmAssistToFindFullTrimmed = rmAssistToFindFull.trim();
		
		var temporaryText = text.replace('\n' + rmAssistToFindFullTrimmed,"");
		if(temporaryText == text){
			text = text.replace(rmAssistToFind,"");
		} else{
			text = temporaryText;
		}
		
		if(type == "MD"){
			document.getElementById('rmCloserRMassistHiddenSpan' + number).innerHTML = "";
			
			rmtrPage.setPageText(text);
			rmtrPage.setEditSummary('Closing request' + rmCloser.advert);
			
			var pageToMove = new Morebits.wiki.page(currentTitle, 'Moving ' + currentTitle + ' to ' + destinationTitle + '.');
			pageToMove.setMoveDestination(destinationTitle);
			pageToMove.setMoveSubpages(true);
			pageToMove.setMoveTalkPage(true);
			pageToMove.setEditSummary('[[Special:Permalink/' + rmtrPage.getCurrentID() + '|Requested]] by ' + requester + ' at  [[WP:RM/TR]]: ' + rmtrReason + rmCloser.advert);
			pageToMove.move(rmtrPage.save(location.reload()));
		} else if(type == "SP"){//Swap pages
			document.getElementById('rmCloserRMassistHiddenSpan' + number).innerHTML = "";
			console.log(text);
			//rmtrPage.setPageText(text);
			//rmtrPage.setEditSummary('Closing request' + rmCloser.advert);
			//rmtrPage.save(location.reload());
		} else if(type == "Di"){
			document.getElementById('rmCloserRMassistHiddenSpan' + number).innerHTML = "";
			
			rmtrPage.setPageText(text);
			rmtrPage.setEditSummary('Discussing request' + rmCloser.advert);
			
			rmCloser.talktitle = mw.Title.newFromText(currentTitle).getTalkPage().toText();
			var talkpage = new Morebits.wiki.page(rmCloser.talktitle, 'Creating requested move');
			talkpage.load(function(talkpage) {
				var rmPageText = talkpage.getPageText();
				
				rmPageText += "\n\n{{subst:Requested move|" + destinationTitle + "|reason=" + rmtrReason + " " + requesterSig + "\n:<small>This is a contested technical request ([[Special:Permalink/" + rmtrPage.getCurrentID() + "|permalink]]).</small>}}";
				
				talkpage.setPageText(rmPageText);
				talkpage.setEditSummary('Creating requested move from technical request' + rmCloser.advert);
				talkpage.save(rmtrPage.save(window.location = mw.util.getUrl(rmCloser.talktitle);));
			});
		} else if(type == "Re"){
			document.getElementById('rmCloserRMassistHiddenSpan' + number).innerHTML = "<button id='rmCloserWithdrawn'>Withdrawn</button><button id='rmCloserAlreadyDone'>Already done</button>";
			$('#rmCloserWithdrawn').click(function(){
				
				rmtrPage.setPageText(text);
				rmtrPage.setEditSummary('Removing withdrawn request' + rmCloser.advert);
				rmtrPage.save(location.reload());
			});
			$('#rmCloserAlreadyDone').click(function(){
				
				rmtrPage.setPageText(text);
				rmtrPage.setEditSummary('Removing completed request' + rmCloser.advert);
				rmtrPage.save(location.reload());
			});
		} else if(type == "Co"){
			document.getElementById('rmCloserRMassistHiddenSpan' + number).innerHTML = "**{{ping|" + requester + "}} <input id='rmCloserContestReason' placeholder='Contest reason' oninput='if(this.value.length>20){this.size=this.value.length} else{this.size=20}'/> ~~~~ <button id='rmCloserSubmitContestReason'>Submit</button><br>";
			$('#rmCloserSubmitContestReason').click(function(){
				text = text.replace("==== Contested technical requests ====","$&\n" + rmAssistToFindFullTrimmed + "\n**{{ping|" + requester + "}} " + document.getElementById('rmCloserContestReason').value + " ~~~~");
				
				rmtrPage.setPageText(text);
				rmtrPage.setEditSummary('Contesting request' + rmCloser.advert);
				rmtrPage.save(location.reload());
			});
		}
	});
}
//</nowiki>
