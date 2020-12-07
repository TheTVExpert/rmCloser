//rmCloser
//<nowiki>
var rmCloser = {};
window.rmCloser = rmCloser;

$.when(
	mw.loader.using([ 'mediawiki.api', 'ext.gadget.morebits' ]),
	$.ready
).then(function() {
	if (document.getElementById("reqmovetag") !== null) {
		document.getElementById("reqmovetag").innerHTML = "<button id='rmCloserClose'>Close</button><button id='rmCloserRelist'>Relist</button><button id='rmCloserConfirm' style='display:none'>Confirm relist</button><button id='rmCloserCancel' style='display:none'>Cancel relist</button>";
		$('#rmCloserClose').click(rmCloser.callback);
		$('#rmCloserRelist').click(rmCloser.confirmRelist);
		$('#rmCloserConfirm').click(rmCloser.relist);
		$('#rmCloserCancel').click(rmCloser.cancelRelist);
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

	var Window = new Morebits.simpleWindow(600, 450);
	Window.setTitle( "Close requested move" );
	Window.setScriptName('rmCloser');
	Window.addFooterLink('RM Closing instruction', 'WP:RMCI');
	Window.addFooterLink('Script documentation', 'User:TheTVExpert/rmCloser');

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
	Window.setContent(formResult);
	Window.display();
	
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
		destination = '|destination=' + destination;
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
		text = text.replace(archives[0], '{{old move'+ date + from + destination + '|result=' + result + link +'}}\n\n' + archives[0]);
	
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
			
			for(var j=0; j<otherPages.length; j++){
				var otherTitle_obj = mw.Title.newFromText(otherPages[j]);
				rmCloser.otherTalktitle = otherTitle_obj.getTalkPage().toText();
				var otherPage = new Morebits.wiki.page(rmCloser.otherTalktitle, 'Added {{old move}} to ' + rmCloser.otherTalktitle + '.');
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
				});
			}
		}
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
	});
};
//</nowiki>
