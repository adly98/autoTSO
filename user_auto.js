var AdventureManager = game.def("com.bluebyte.tso.adventure.logic::AdventureManager").getInstance();
var autoWindow;
var autoSettings = {
	expl: {
		autoStart: true,
		template: "",
		useTemplate: false
	},
	adv: {
		speedBuff: "GeneralSpeedBuff_Bronze",
		templates: [],
		reTrain: false
	},
	bookbinder: {
		autoStart: true,
		bookType: "Manuscript",
		autoBuff: true,
		buffType: "BookbinderBuffLvl1"
	},
	other: {
		cCollectables: true,
		applyTweaks: false
	}
}

const adventures = {
	Mini_Missions: [
		"MiadArcticExplosion",
		"MiadBastilleIsland",
		"MiadPirateLife",
		"MiadSleepyReef",
		"TheDarkPriests",
		"MiadTheLostSkull",
		"MiadTheSleepingVolcano",
		"MiadTikkiIsland",
		"MiadTropicalSun"
	],
	Missions: [
		"BanditNest",
		"BonabertiBusiness",
		"Gunpowder",
		"Horseback",
		"MoreSecludedExperiments",
		"MotherLove",
		"OldFriends",
		"Outlaws",
		"NewBanditNest",
		"RoaringBull",
		"SecludedExperiments",
		"SonsOfTheVeld",
		"StealingFromTheRich",
		"SurpriseAttack",
		"TheBlackKnights",
		"TheDarkBrotherhood",
		"TheNords2",
		"TheIslandOfThePirates",
		"TheNords",
		"Traitors",
		"VictorTheVicious",
		"MadHenry",
		"WitchOfTheSwamp"
	],
	FairyTales: [
		"TheValiantLittleTailor",
		"TheCleverLittleTailor",
		"TheSonsOfTheLittleTailor",
		"TheBetrayedLittleTailor",
		"TheHeroicLittleTailor"
	],
	Arabian_Nights: [
		"1001NightsWoodcutter",
		"1001NightsFirstThief",
		"1001NightsSecondThief",
		"1001NightsThirdThief",
		"1001NightsTreasureKnowledge",
		"1001NightsTreasureWisdom",
		"1001NightsBesiegedCity",
		"1001NightsOilLamp",
		"1001NightsSeaSnake",
		"1001NightsPrincess"
	],
	Ventures: [
		"BuffAdventures_ValuableIntel",
		"BuffAdventures_OfSongsAndCurses",
		"BuffAdventures_ElChupacabra",
		"BuffAdventures_RaidOfTheNords",
		"BuffAdventures_LostCity",
		"BuffAdventures_OneStepAhead"
	],
	Evil_Queen_Ventures: [
		"BuffAdventures_Evil_Queen_Fisherman",
		"BuffAdventures_Evil_Queen_Hansel_Gretel",
		"BuffAdventures_Evil_Queen_Piper_of_Hamelin",
		"BuffAdventures_Evil_Queen_Red_Riding_Hood",
		"BuffAdventures_Evil_Queen_Snow_White"
	]
}
const adventureItems = {
	BuffAdventures_Evil_Queen_Fisherman:{
		BattleBuffHurt_BuffAd_FishCurseLifter: [1030]
	},
	BuffAdventures_Evil_Queen_Hansel_Gretel:{
		BattleBuffHurt_BuffAd_WhiteStoneDetector: [2847, 4023, 5086, 5213, 4866, 4099, 3274],
		BattleBuffHurt_BuffAd_WitchSleeper: [2687]
	},
	BuffAdventures_Evil_Queen_Piper_of_Hamelin:{
		BattleBuffHurt_BuffAd_NormalRatCaves: [[601, 1604, 1844, 3200, 4850, 5327, 1560], 10],
		BattleBuffHurt_BuffAd_OversizedRatCaves: [[426, 856, 1563, 1517, 2962], 6]
	},
	BuffAdventures_Evil_Queen_Snow_White: {
		BattleBuffHurt_BuffAd_Bug_A: [1086, 2746],
		BattleBuffHurt_BuffAd_Bug_B: [1969, 2680, 1917, 1033],
		BattleBuffHurt_BuffAd_Bug_C: [1922]
	},
	BuffAdventures_Evil_Queen_Red_Riding_Hood: {
		BattleBuffHurt_BuffAd_Stones: [2495],
		BattleBuffHurt_BuffAd_Grandmothers_Hut: [2497]
	},
	BuffAdventures_safeTheTowns_easy: {
		ChangeSkin_BuffAd_Repairkit: [3774],
		ChangeSkin_BuffAd_Bread: [3091, 3356, 3491],
		ChangeSkin_BuffAd_Beer: [4786, 4655, 4792],
		ChangeSkin_BuffAd_Sausage: [3774]
	},
	BuffAdventures_twins_easy: {
		ChangeSkin_BuffAd_Broadsheet: [4863, 3981, 4396],
		ChangeSkin_BuffAd_Bridge: [3768, 2956, 4318],
		ChangeSkin_BuffAd_Rescueparty: [2215]
	},
	BuffAdventures_heartOfTheWood_medium: {
		ChangeSkin_BuffAd_wildlife: [4457, 3511, 3098, 2744, 4308],
		ChangeSkin_BuffAd_hearttree: [3365],
		ChangeSkin_BuffAd_woodhealing: [5276, 4592, 4259, 3645, 3506, 2896, 3359, 4105, 4859, 2887],
		ChangeSkin_BuffAd_Fertilizer: [3365]
	},
	BuffAdventures_Riches_of_the_Mountain: {
		ChangeSkin_BuffAd_PureOre: [6367],
		BattleBuffHurt_BuffAd_Dynamite: [4046, 3913, 3641, 3368],
		BattleBuffHurt_BuffAd_Shovel: [3708, 3366],
		ChangeSkin_BuffAd_TavernKit: [3913],
		ChangeSkin_BuffAd_StorageKit: [3641],
		ChangeSkin_BuffAd_MasonKit: [3708, 4046, 3368],
		BattleBuffHurt_BuffAd_MountainDynamite: [[3839], 5],
		ChangeSkin_BuffAd_ShaftConstruction: [3703],
		EmptyEffectBuff_BuffAd_FoodProvision: [4046, 3708],
		BattleBuffHurt_BuffAd_Glue: [2631],
		BattleBuffHurt_BuffAd_WaterSplash: [[2631], 10],
		BattleBuffHurt_BuffAd_Explosive: [2631],
		BattleBuffHurt_BuffAd_Specialist: [2631]
	},
	BuffAdventures_Storm_Recovery: {

	}
}

$.extend(true, autoSettings, readSettings(null, 'autoSettings'));
//Make Auto Menu
function autoMakeMenu()
{
	//Adventure Menu
	var existingAutoMenu = window.nativeWindow.menu.getItemByName("Automation");
	if(existingAutoMenu != null)
		window.nativeWindow.menu.removeItem(existingAutoMenu);
	
	MenuItemAutomation = new air.NativeMenuItem("~Automation~");
	MenuItemAutomation.name = "Automation";
	window.nativeWindow.menu.addItem(MenuItemAutomation);

	var existingAutoMenu = window.nativeWindow.menu.getItemByName("AutoAdvTrack");
	if(existingAutoMenu != null)
		window.nativeWindow.menu.removeItem(existingAutoMenu);
	
	MenuItemAutomation = new air.NativeMenuItem("Status: ---");
	MenuItemAutomation.name = "AutoAdvTrack";
	MenuItemAutomation.enabled = false;
	window.nativeWindow.menu.addItem(MenuItemAutomation);

	var m = [
		{ label: loca.GetText("LAB","ToggleOptionsPanel"), mnemonicIndex: 0, onSelect: autoOptionsHandler },
		{ label: auto.menuLabel('run_Explorers', 'menu'), mnemonicIndex: 0, onSelect: function(){
			auto.toggleSettings('run_Explorers');
			auto.menuLabel('run_Explorers', 'alert');
		} },
		{ label: auto.menuLabel('run_Adventure', 'menu'), mnemonicIndex: 0, onSelect: function(){
			if(!auto.adventure.fileName) return showGameAlert("No active Adventure. please select a new Adventure");
			auto.toggleSettings('run_Adventure');
			auto.menuLabel('run_Adventure', 'alert');
		} },
		{ label: "Stop Auto Adventure (endless)", enabled: auto.adventure.data.repeatCount == 0 ? false: true, mnemonicIndex: 0, onSelect: function(){
			auto.adventure.data.repeatCount = 1;
			showGameAlert("Auto Adventure will stop after finishing the current adventure");
		} }
	];
	autoAdvMenuRecursive(autoSettings.adv.templates, m);
	menu.nativeMenu.getItemByName("Automation").submenu = air.ui.Menu.createFromJSON(m);	
	//	window.nativeWindow.menu.removeItem(existingGridPosMenu);
	auto.toggleTweaks();
}
//Auto Adventure Menu Recursive
function autoAdvMenuRecursive(templates, m){
	$.each(adventures, function(cat, advs){
		var catAdvs = [];
		$.each(templates, function(index, template){
			if(advs.indexOf(template.name) > -1){
				var label = "{0}. {1}".format(
					catAdvs.length,
					template.label || loca.GetText('ADN', template.name)
				);
				catAdvs.push({ label: label, mnemonicIndex: 0, name: "{0}".format(template.template), onSelect: autoAdvMenuSelectedHandler });
			}
		});
		if(catAdvs.length)
			m.push({ label: cat.replace(/_/gi,' '), mnemonicIndex: 0, items: catAdvs });
		return;
	});
	/*$.each(templates, function(index, template){
		if(typeof template === 'object') {
			var category = "";
			$.each(adventures, function(cat, advs){
				if(advs.indexOf(template.name) > -1) category = cat;
			});
			var label = "{0}. {1}".format(
				index,
				template.label || loca.GetText('ADN', template.name)
			);
			m.push({ label: label, mnemonicIndex: 0, name: "{0}".format(template.template), onSelect: autoAdvMenuSelectedHandler });
			return;
		}
	});*/
}
//Auto Adventure Menu Handler
function autoAdvMenuSelectedHandler(event){
	try{
		var repeat = confirm("Repeat the adventure as many as you have?");
		auto.adventure.data.repeatCount = -1;
		if(!repeat){
			var userCount = parseInt(prompt("Repeat count !? default: 1"));
			auto.adventure.data.repeatCount = isNaN(userCount) ? 1 : userCount;
		}
		var loadedAdv = auto.readFile(event.target.name);
		//if(auto.adventure.fileName && !auto.adventureID(loadedAdv.name))
		//	return showGameAlert("Please cancel the running adventure if you want to start a new adventure!!!");
		
		auto.adventure.fileName = event.target.name;
		auto.resetAdventure();
		$.extend(auto.adventure, loadedAdv);
		showGameAlert(loca.GetText('ADN', auto.adventure.name) + " is selected");
		auto.settings.run_Adventure = true;
		autoMakeMenu();
		if(shortcutsLRUItem) {
			shortcutsLRUItem.label = shortcutsLRUItem.label.slice(2);
		}
		shortcutsLRUItem = event.target;
		shortcutsLRUItem.label = "->{0}".format(shortcutsLRUItem.label);
	}catch(e){ debug(e); }
}
//Option Modal
function autoOptionsHandler(){
	autoWindow = new Modal("autoModal", "Automation");
	
	var speedBuffs = ["GeneralSpeedBuff_Bronze","GeneralSpeedBuff_Platinum","GeneralSpeedBuff_Blackened_Titanium","GeneralSpeedBuff_Obsidian","GeneralSpeedBuff_Mystical"];
	
	autoWindow.size = '';
	autoWindow.create();
	//autoWindow.Title().html("{0} {1}".format(getImageTag('icon_settings.png'), loca.GetText("Automation Settings")));

	var autoAdventuresBool = auto.createSelect('autoAdventuresBool');
	$.each(autoSettings.adv.templates, function(i, adv){ autoAdventuresBool.append($('<option>', { value: i }).text(adv.label)); });	
	var autoSpeedBuffSelect = auto.createSelect("autoSpeedBuffSelect");
	$.each(speedBuffs, function(i, buff){
		var amount = auto.getBuff(buff) ? auto.getBuff(buff).amount : 0;
		autoSpeedBuffSelect.append($('<option>', { value: buff }).text("{0}({1}): {2}".format(loca.GetText('RES', buff), amount, loca.GetText('DES', buff))));
	});
	var autoBBBook = auto.createSelect("autoBBBook");
	$.each(["Manuscript", "Tome", "Codex"], function(i, buff){
		autoBBBook.append($('<option>', { value: buff }).text(buff));
	});

	var autoBBBuff = auto.createSelect("autoBBBuff");
	for(var i = 1; i < 7; i++) { 
		var buffName = "BookbinderBuffLvl" + i;
		var amount = auto.getBuff(buffName) ? auto.getBuff(buffName).amount : 0;
		if(amount)
			autoBBBuff.append($('<option>', { value: buffName }).text("{0}({1}): {2}".format(loca.GetText('RES', buffName), amount, loca.GetText('DES', buffName)))); 
		else
			autoBBBuff.append($('<option>', { value: buffName, disabled: "disabled" }).text("{0}({1}): {2}".format(loca.GetText('RES', buffName), amount, loca.GetText('DES', buffName)))); 
	}
	var html = '<div class="container-fluid" style="user-select: all;">';
	
	
	autoWindow.Body().append(
		$('<div>', { 'class': 'container-fluid', 'style' : 'user-select: all;' }).append([
			createTableRow([[12, "Auto Explorers"]], true),
			createTableRow([[9, "Auto start"], [3, createSwitch('explAutoStart', autoSettings.expl.autoStart)]]),
			createTableRow([[9, "Template: " + auto.createSpan('explAutoTemp', autoSettings.expl.template)], [3, auto.createButton('selectExplAutoTemp', loca.GetText("LAB", "Select"))]]),
			createTableRow([[9, "Override default task with template: "], [3, createSwitch('explUseTemp', autoSettings.expl.useTemplate)]]),
			createTableRow([[12, '+ On use template/Off use default task from Explorer tab']]),
			$('<br>'),
			createTableRow([[8, "Auto Adventures"], [4, $('<a>', { href: '#', text: "Create new auto template!", 'id': 'autoCreateTemplate' })]], true),
			createTableRow([[2, "Adventures: "],[6, autoAdventuresBool.prop('outerHTML')], [2, auto.createButton('autoAddAdv','Add')],[2, auto.createButton('autoRemAdv','Remove')]]),
			createTableRow([[2, "Speed Buff:"], [10, autoSpeedBuffSelect.prop('outerHTML')]]),
			createTableRow([[9, "Retrain lost units"], [3, createSwitch('autoReTrain', autoSettings.adv.reTrain)]]),
			$('<br>'),
			createTableRow([[12, "BookBinder Monitoring"]], true),
			createTableRow([[9, 'Auto Start'], [3, createSwitch('autoStartBB', autoSettings.bookbinder.autoStart)]]),
			createTableRow([[4, "Which Book to produce:"], [8, autoBBBook.prop('outerHTML')]]),
			createTableRow([[5, "Auto Buff BookBinder?"], [2, createSwitch('autoBuffBB', autoSettings.bookbinder.autoBuff)], [5, autoBBBuff.prop('outerHTML')]]),
			$('<br>'),
			createTableRow([[12, "Others"]], true),
			createTableRow([[9, 'Auto Collect Collectibles (Home Island)'], [3, createSwitch('autoCollectCollectibles', autoSettings.other.cCollectables)]]),
			createTableRow([[9, 'Tweaks'], [3, createSwitch('autoApplyTweaks', autoSettings.other.applyTweaks)]]),
			createTableRow([[12, '+ Increase quantities in trade window (ONLY use in private trade)']]),
			createTableRow([[6, '+ More optimizations for client speed'], [6, ""]]),
		]));
	autoWindow.withBody('#explAutoTime').change(function(e){
		autoSettings.expl.time = parseInt($(e.target).val());
	}).val(autoSettings.expl.time);
	autoWindow.withBody('#autoSpeedBuffSelect').change(function(e){
		autoSettings.adv.speedBuff = $(e.target).val();
	}).val(autoSettings.adv.speedBuff);
	autoWindow.withBody('#autoBBBook').change(function(e){
		autoSettings.bookbinder.bookType = $(e.target).val();
	}).val(autoSettings.bookbinder.bookType);
	autoWindow.withBody('#autoBBBuff').change(function(e){
		autoSettings.bookbinder.buffType = $(e.target).val();
	}).val(autoSettings.bookbinder.buffType);
	//explUseTemp
	autoWindow.withBody('#explAutoStart').change(function(e) { autoSettings.expl.autoStart = $(e.target).is(':checked');});
	autoWindow.withBody('#explUseTemp').change(function(e) {
		if(autoSettings.expl.template == ""){
			alert("You must choose a template first!");
			return;
		}
		autoSettings.expl.useTemplate = $(e.target).is(':checked');
	});
	autoWindow.withBody('#autoStartBB').change(function(e) { autoSettings.bookbinder.autoStart = $(e.target).is(':checked');});
	autoWindow.withBody('#autoReTrain').change(function(e) { autoSettings.adv.reTrain = $(e.target).is(':checked');});
	autoWindow.withBody('#autoBuffBB').change(function(e) { autoSettings.bookbinder.autoBuff = $(e.target).is(':checked');});
	autoWindow.withBody('#autoCollectCollectibles').change(function(e) { autoSettings.other.cCollectables = $(e.target).is(':checked');});
	autoWindow.withBody('#autoApplyTweaks').change(function(e) { autoSettings.other.applyTweaks = $(e.target).is(':checked');});

	
	autoWindow.withBody('#autoCreateTemplate').click(function(e) {
		autoTempMakerHandler();
	});
	autoWindow.withBody('#autoAddAdv').click(function(e) {
		auto.chooseFile(function(event){
			var text = prompt("Custom adventure name");
			var defaultTemp = auto.readFile(event.currentTarget.nativePath);
			var hashed = defaultTemp.hash;
			delete defaultTemp.hash;
			if(!defaultTemp.name || !defaultTemp.steps || hash(JSON.stringify(defaultTemp)) != hashed){
				return alert(getText("bad_template"));
			}
			autoSettings.adv.templates.push({
				label: text,
				name: defaultTemp.name,
				template: event.currentTarget.nativePath
			});
			auto.saveSettings();
			$("#autoAdventuresBool").empty();
			$.each(autoSettings.adv.templates, function(i, adv){ $("#autoAdventuresBool").append($('<option>', { value: i }).text(adv.label)); });	
			autoMakeMenu();
		});
	});
	autoWindow.withBody('#autoRemAdv').click(function(e) { 
		autoSettings.adv.templates.splice(parseInt($("#autoAdventuresBool").val()), 1);
		$("#autoAdventuresBool").empty();
		$.each(autoSettings.adv.templates, function(i, temp){
			$("#autoAdventuresBool").append($('<option>', { value: i }).text(temp.label));
		});
	});
	autoWindow.withBody('#selectExplAutoTemp').click(function(e) { 
		auto.chooseFile(function(event){
			$("#explAutoTemp").html(event.currentTarget.nativePath);
			autoSettings.expl.template = event.currentTarget.nativePath;
		});
	});
	autoWindow.Footer().prepend($("<button>").attr({'class':"btn btn-primary pull-left"}).text(loca.GetText("LAB","Save")).click(function(){
		auto.settings.run_Explorers = autoSettings.expl.autoStart;
		auto.saveSettings();
		autoMakeMenu();
		autoWindow.hide();
	}));
	autoWindow.show();
}
//New Auto Template Maker

//Auto Template Maker Modal
function autoTempMakerHandler(){
	try{
		var autoAdvTemp = [];
			
		var saveTemp = function(){
			var defaultTemp = {
				name: $('#autoAdvTempSelect').val(),
				steps: {
					"S0_StartAdventure": null,
					"S1_InHomeLoadGenerals": $('#homeLoadTemp').text(),
					"S2_SendGeneralsToAdventure": null
				}
			};
			autoAdvTemp.forEach(function(item){
				var step = "S{0}_{1}".format(Object.keys(defaultTemp.steps).length, item[0]);
				var data = null;
				var trueData = ["AdventureTemplate", "ProduceItem", "ApplyBuff"];
				if(trueData.indexOf(item[0]) != -1)
					data = item[1];
				
				defaultTemp.steps[step] = data;
			});
			defaultTemp.steps["S{0}_LoadGeneralsToEnd".format(Object.keys(defaultTemp.steps).length)] = null;
			
			auto.saveTemplate(defaultTemp);
			autoWindow.shide();
		}
		autoWindow.settings(saveTemp);
		function checkStringInArray(str, arr) {
			for (var i = 0; i < arr.length; i++) {
				if (arr[i][0] === str) {
					return true;
				}
			}
			return false;
		}
		var autoAdvTempUpdateView = function(){
			autoWindow.withsBody('#autoTempRows').html("");
			var out = "";
			
			autoAdvTemp.forEach(function(i, idx) {
				switch(i[0]){
					case 'AdventureTemplate':
						var typename = i[1].split("\\").pop();
						out += createTableRow([
							[3, '&#8597;&nbsp;&nbsp;' + 'Adventure'],
							[7, 'Excute: ' + typename],
							[2, $('<button>', { 'type': 'button', 'class': 'close', 'value': idx }).html($('<span>').html('&times;'))],
						], false);
						break;
					case 'ProduceItem':
					case 'ApplyBuff':
						var amount = adventureItems[$("#autoAdvTempSelect").val()][i[1]];
							amount = Array.isArray(amount[0]) ? amount[1] : amount.length;
						out += createTableRow([
							[3, '&#8597;&nbsp;&nbsp;' + 'Home'],
							[7, '{0}: {1} x{2}'.format(i[0]=="ApplyBuff" ? "Apply" : "Produce", loca.GetText('RES', i[1]), amount )],
							[2, $('<button>', { 'type': 'button', 'class': 'close', 'value': idx, 'disabled': 'disabled' }).html($('<span>').html('&times;'))],
						], false);
						break;
					default:
						out += createTableRow([
							[3, '&#8597;&nbsp;&nbsp;' + 'Bot'],
							[7, i[1]],
							[2,  $('<button>', { 'type': 'button', 'class': 'close', 'value': idx }).html($('<span>').html('&times;'))],
						], false);
				}
				
			});
			autoWindow.withsBody('#autoTempRows').html($('<div>', { 'class': "container-fluid", 'style': "user-select: none;cursor:move;" }).html(out));
			autoWindow.withsBody('.close').click(function(e){
				autoAdvTemp.splice(parseInt($(this).val()), 1);
				autoAdvTempUpdateView();
			});
			autoWindow.withsBody('#autoTempRows .container-fluid').sortable({
				update: function( event, ui ) {
					var prevIndex = $(ui.item).find('.close').val();
					shortcutsMoveElement(autoAdvTemp, prevIndex, ui.item.index());
					autoAdvTempUpdateView();
				} 
			});
		}
		var autoAdvTempRowUpdate = function(){
			autoAdvTemp = [];
			autoAdvTemp.push(["VisitAdventure", "Load Adventure Island!"]);
			autoAdvTemp.push(["StarGenerals", "Star Generals after they arrive!"]);
			autoAdvTemp.push(["UseSpeedBuff", "Use Speed Buff!"]);
			$.each(adventureItems[$("#autoAdvTempSelect").val()], function(k, v){
				autoAdvTemp.push(["CollectPickups", "Collect Pickups"]);
				autoAdvTemp.push(["ReturnHome", "Return Home"]);
				autoAdvTemp.push(["ProduceItem", k]);
				autoAdvTemp.push(["VisitAdventure", "Visit Adventure Island"]);
				autoAdvTemp.push(["ApplyBuff", k]);
			});
			autoAdvTempUpdateView();
		}
		autoWindow.sDialog().css("height", "80%");
		autoWindow.sTitle().html("{0} {1}".format(
			getImageTag('icon_general.png'),
			"Auto Adventure Template maker")
		);
		var autoAdvTempSelect = auto.createSelect('autoAdvTempSelect');
		$.each(adventures, function(key, value){
			var optGroup = $('<optgroup>', { label: key.replace(/_/gi,' ') });
			$.each(value, function(i, adv){
				optGroup.append($('<option>', { value: adv }).text(loca.GetText('ADN', adv)));
			});
			autoAdvTempSelect.append(optGroup);
		});
		

		autoWindow.sData().append($('<div>', { 'class': 'container-fluid', 'style' : 'height:auto;' }).append([
			createTableRow([[12, "Template Options"]], true),
			createTableRow([[4, "Adventure:"], [8, autoAdvTempSelect]]),
			createTableRow([[9, "Home load template: " + auto.createSpan('homeLoadTemp')],[3, auto.createButton("selectHomeLoadTemp", "Select")]]),
			createTableRow([[12, "+ Template that load generals to send"]]),
			//createTableRow([[10, "Use speed buff: (change type from options)"],[2, createSwitch("useSpeedBuff")]]),
			//createTableRow([[10, "Star Generals: (star generals at the beginning)"],[2, createSwitch("starGenerals")]]),
			$('<br>'),
			createTableRow([[12, "Notes:"]], true),
			createTableRow([[12, "*This section starts when adventure island is loaded! (order is important)"]]),
			createTableRow([[12, "*Loading adventure island isn't auto in (Ventures & Senarios) so add below accordingly"]]),
			createTableRow([[12, "*Tool Autimatcally (load your units, finish quests and end adveture)\n after doing what is listed below!"]]),
			$('<br>'),
			createTableRow([[3, loca.GetText("LAB", "Type")],[5, getText('shortcutsFilename')],[4, '']], true)
		]));
		
		var autoAdvCmds = $('<div>', { 'class': 'btn-group dropup autoAdvCmds' }).append([
			$('<button>').attr({ 
				"class": "btn btn-success dropdown-toggle",
				'aria-haspopup': 'true',
				'style': 'margin-left: 4px;',
				'aria-expanded': 'false',
				'data-toggle': "dropdown"
			}).text(getText('shortcutsAddItem')), 
			$('<ul>', { 'class': 'dropdown-menu' }).append([
				$('<li>').html($('<a>', {'href': '#', 'name': 'ReturnHome'}).text("Return Home")),
				$('<li>').html($('<a>', {'href': '#', 'name': 'VisitAdventure'}).text("Visit Adventure Island")),
				$('<li>').html($('<a>', {'href': '#', 'name': 'CollectPickups'}).text("Collect Pickups")),
				$('<li>').html($('<a>', {'href': '#', 'name': 'AdventureTemplate'}).text("Adventure Steps")),
				//$('<li>').html($('<a>', {'href': '#', 'name': 'FinishQuests'}).text("Finish Active Quests")),
			])
		]);

		autoWindow.withsBody('#selectHomeLoadTemp').click(function(e) { 
			auto.chooseFile(function(event){
				$('#homeLoadTemp').html(event.currentTarget.nativePath);
			});
		});

		autoWindow.sFooter().prepend(autoAdvCmds);
		autoWindow.sFooter().append([
			$('<button>').attr({ "id": "autoTempLoad", "class": "btn btn-primary pull-left autoTempLoad" }).text(getText('load_template'))
		]);
		autoWindow.sFooter().find('.dropdown-menu a').click(function() {
			switch(this.name){
				case 'AdventureTemplate':
					var txtFilter = new air.FileFilter("Template", "*.*");
					var root = new air.File();
					root.browseForOpenMultiple("Open", new window.runtime.Array(txtFilter)); 
					root.addEventListener(window.runtime.flash.events.FileListEvent.SELECT_MULTIPLE, function(event) {
						event.files.forEach(function(item) {
							autoAdvTemp.push(["AdventureTemplate", item.nativePath]);
						});
						autoAdvTempUpdateView();
					});
					break;
				case 'ProduceItem':
				case 'ApplyBuff':
					autoAdvTemp.push([this.name, $(this).attr('href').replace("#","")]);
					break;
				default:
					//if(!checkStringInArray(this.name, autoAdvTemp)){
						autoAdvTemp.push([this.name, $(this).text()]);
						//autoAdvTemp.splice(1, 0, this.name);
					//}
			}
			autoAdvTempUpdateView();
		});
		autoWindow.withsBody('#selectHomeLoadTemp').click(function(e) { 
			auto.chooseFile(function(event){
			$('#homeLoadTemp').html(event.currentTarget.nativePath);
				//autoSettings.expl.template = event.currentTarget.nativePath;
			});
		});
		autoWindow.withsBody('#autoAdvTempSelect').change(function(e) { 
			autoAdvTempRowUpdate();
		});

		autoWindow.sFooter().find('.autoTempSave').click(function(){
			
			//save
		});
		
		autoWindow.sData().append($('<div>', { 'id': 'autoTempRows' }));
		autoWindow.sshow();
		autoAdvTempRowUpdate();
	} catch(e){ debug(e); }
	
}
// Initalize Auto Object
var auto = {
    settings: {
        run_Adventure: false,
        run_Deposits: false,
        run_Explorers: false,
        run_Short_Quests: false
    },
    timedQueue: null,
    timerID: null,
	adventure: {
		fileName: null,
		name: null,
		data: {
			generals: [],
			enemies: [],
			army:{},
			index: null,
			action: null,
			repeatCount: -1,
			lastTime: null
		},
		steps: {}
	},
    start: function(time){
		showGameAlert("Automation Started!");
        auto.timerID = setTimeout(auto.runCycle, time ? time : auto.settings.interval_Time);
    },
    stop: function(){ 
        clearTimeout(auto.timerID); 
    },
	runCycle: function(){
		auto.stop();
		auto.timedQueue = new TimedQueue(1000);
		var stepInterval = 10000;
		try{
			if(auto.settings.run_Explorers){ auto.autoExplorers(); }
			if(autoSettings.bookbinder.autoStart) { auto.autoBookBinder(); }
			if(autoSettings.other.cCollectables && game.gi.isOnHomzone()){
				var isThereCollectiables = auto.checkForCollectables(true);
				if(isThereCollectiables === true){
					shortcutsPickupAll();
				} else if(isThereCollectiables && isThereCollectiables !== true) {
					game.showAlert("Collect Collectibles quest is finished!"); 
					game.gi.mNewQuestManager.RewardOkButtonPressedFromGui(isThereCollectiables);
					globalFlash.gui.mQuestBook.Show();
					auto.timedQueue.add(function() {globalFlash.gui.mQuestBook.Hide();}, 2000);
				}
			}
			if(auto.settings.run_Adventure){
				if(!auto.adventure.steps) { showGameAlert("Please reselect the adventure!!"); }
				else if(auto.adventure.data.repeatCount == 0){ auto.settings.run_Adventure = false; }
				else if(auto.adventure.data.index < Object.keys(auto.adventure.steps).length){
					//Complete Active Quests in adventure
					auto.finishQuests(false);
					var stepResult = auto.autoAdventure();
					if(!stepResult){ 
						auto.settings.run_Adventure = false; 
					} else {
						if(stepResult[0]){ auto.adventure.data.index++; }
						if(stepResult[1]){ auto.updateStatus(stepResult[1]); }
						if(stepResult[2]){ stepInterval = stepResult[2] * 1000; }
					}
				} else {
					auto.timedQueue.add(function(){ auto.finishQuests(true); }, 10000);
				}
			}else{
				auto.updateStatus("idle...");
			}
		}catch(e){}
		auto.timedQueue.add(function(){
			auto.timerID = setTimeout(auto.runCycle, stepInterval);
		}); 
		auto.timedQueue.run();
	},
	customCompare: function(a, b){
		const numA = parseInt(a.slice(1));
		const numB = parseInt(b.slice(1));
		// Compare the numeric values
		return numA - numB;
	},
	autoAdventure: function(){
		try{
			var action = Object.keys(auto.adventure.steps).sort(auto.customCompare)[auto.adventure.data.index];
			var data = auto.adventure.steps[action];
			debug(action);
			switch(action.split("_")[1]){
				case 'StartAdventure':
					if(!game.gi.isOnHomzone())
						return [false, "You must be on home island!"];
					if(auto.adventure.lastTime && (new Date().getTime() - auto.adventure.lastTime <= 180000))
						return [false, "Chill, Next Adventure starts at: {0}".format(new Date(auto.adventure.lastTime + 180000).toLocaleTimeString())];
					if(auto.adventureID())
						return [true, "Adventure ({0}) is active".format(loca.GetText('ADN', auto.adventure.name)), 3];
					else if(auto.getBuff(auto.adventure.name)){
						auto.applyBuff(auto.getBuff(auto.adventure.name), 8825);
						return [false, "Starting ({0})".format(loca.GetText('ADN', auto.adventure.name))]
					} else 
						return null;
				case 'SendGeneralsToAdventure':
					if(!game.gi.isOnHomzone())
						return [false, "You must be on home island!"];
					else if(!auto.areSpecsFree(auto.adventure.data.generals))
						return [false, null];
					else if(auto.sendGeneralsToAdventure(auto.adventure.data.generals))
						return [true, 'Sending generals to ({0}) '.format(loca.GetText('ADN', auto.adventure.name))]
					else
						return [false, "Can't send generals"]
				case 'StarGenerals':
					if(game.gi.mCurrentViewedZoneID != auto.adventureID())
						return [false, "You must be on adventure island!"];
					else if(!auto.areSpecsFree(auto.adventure.data.generals))
						return [false, "Waiting for generals to arrive!"];
					else{
						shortcutsReturnAll();
						return [true, null]
					}
				
				case 'VisitAdventure':
					if (!auto.adventureID())
						return [false, "Can't find ({0}) in active adventures".format(loca.GetText('ADN', auto.adventure.name))]
					if(game.gi.isOnHomzone()){
						auto.timedQueue.add(function(){
							game.gi.visitZone(auto.adventureID());
						});
						return null;
					}
				case 'CollectPickups':
					if(game.gi.mCurrentViewedZoneID != auto.adventureID())
						return [false, "You must be on adventure island!"];
					if(auto.adventure.data.action == "collected"){
						auto.adventure.data.action = null;
						return [true, "Pickups collected!"];
					}
					var collectables = auto.checkForCollectables();
					if(collectables){
						auto.collectPickups();
						return [false, "Collecting pickups!"];
					//} else if(collectables === null) { 
					//	return [false, "No collectable mission active"];
					} else {
						return [false, "There is no pickups yet!"];
					}
				case 'ReturnHome':
					if(!game.gi.isOnHomzone()){
						auto.timedQueue.add(function(){
							game.gi.visitZone(game.gi.mCurrentPlayer.GetHomeZoneId());
						});
						return null;
					}
				case 'ProduceItem':
					if(!game.gi.isOnHomzone())
						return [false, "You must be on home island!"];
					if(auto.getBuff(data))
						return [true, "{0} produced successfully".format(loca.GetText('RES', data)), 3];
					else if(auto.checkInPH(data))
						return [false, "{0} is being produced".format(loca.GetText('RES', data)), 3];
					else {
						var itemData = adventureItems[auto.adventure.name][data];
						var amount = itemData.length;
						if(Array.isArray(itemData[0])){
							amount = itemData[1];
						}
						auto.timedQueue.add(function(){
							auto.startProduction(data, 1, amount, 1, "ProvisionHouse");
						});
						return [false, "Start producing {0} x{1}".format(loca.GetText('RES', data), amount)];
					}
				case 'ApplyBuff':
					if(game.gi.mCurrentViewedZoneID != auto.adventureID())
						return [false, "You must be on adventure island!"];
					if(auto.getBuff(data)){
						var itemData = adventureItems[auto.adventure.name][data];
							itemData = Array.isArray(itemData[0]) ? itemData[0] : itemData;
						$.each(itemData, function(i, grid){
							auto.timedQueue.add(function(){
								auto.applyBuff(auto.getBuff(data), grid, 1);
							});
						});
						return [true, "{0} applied".format(loca.GetText('RES', data))];
					} else {
						return [false, "{0} is not available".format(loca.GetText('RES', data))];
					}
				case 'UseSpeedBuff':
					if(game.gi.mCurrentViewedZoneID != auto.adventureID())
						return [false, null];
					else if(auto.getBuff(autoSettings.adv.speedBuff)){
						auto.timedQueue.add(function(){
							auto.applyBuff(auto.getBuff(autoSettings.adv.speedBuff), 0);
						});
						return [true, "Applying: " + loca.GetText('RES', autoSettings.adv.speedBuff), 1];
					}
					else 
						return [true, "Can't find Buff in star menu, continuing without buff", 1];
				case 'InHomeLoadGenerals':
					data = auto.readFile(data);
					if(!game.gi.isOnHomzone()) return [false, "You must be on home island!"];
					if(!auto.areSpecsFree(Object.keys(data))) return [false, "Generals not ready yet!"];
					auto.adventure.data.generals = Object.keys(data);
					battlePacket = battleLoadDataCheck(data);
					updateFreeArmyInfo(true);
					var checkedPacket = armyLoadDataCheck(battlePacket);
					var armyPacketMatch = Object.keys(battlePacket).map(function(g){ return armyPacketMatches[g]});
					if(checkedPacket.canSubmit){
						auto.playSound('UnitProduced');
						auto.armyLoadGenerals(true);
						return [true, "Loading all untis for adventure"];
					} else if(armyPacketMatch.indexOf(false) == -1){
						return [true, "Units Loaded!", 3]; 
					} else {
						shortcutsFreeAllUnits();
						return [false, "Unloading all Units"];
					}
				case 'AdventureTemplate':
					if(game.gi.mCurrentViewedZoneID != auto.adventureID()) return [false, "You must be on adventure island!"];
					//if(auto.adventure.data.action[0] > data.length) return [true, null, 1000];
					var fileName = data.split('\\');
						fileName = fileName[fileName.length - 1];
					data = auto.readFile(data);
					$.each(data, function(key, value){
						if(auto.adventure.data.enemies.indexOf(value.target) == -1 && value.target)
							auto.adventure.data.enemies.push(value.target);
					});
					if(!auto.adventure.data.action) auto.adventure.data.action = "move";
					
					if(!auto.areSpecsFree(Object.keys(data))) { 
						return [false, "[{0}] Generals not ready yet!".format(fileName)]; 
					}
					battlePacket = battleLoadDataCheck(data);

					if(auto.adventure.data.action == "move"){ // Move generals
						var verify = auto.bgBattleLoadData();
						if(!verify.canMove && !verify.allOnSameGrid){
							//stepError(battlePacket);
							return [false, "[{0}] Can't move generals yet!".format(fileName)];
						}else if(!verify.canMove && verify.allOnSameGrid){
							auto.adventure.data.action = "load";
						}else if(verify.canMove){
							auto.adventure.data.action = "load";
							auto.excuteAction("move");
							return [false, "[{0}] Moving generals to position!".format(fileName)];
						}
					}
					if(auto.adventure.data.action == "load"){ // FreeUnits & Load Units
						updateFreeArmyInfo(true);
						var checkedPacket = armyLoadDataCheck(battlePacket);
						var armyPacketMatch = Object.keys(battlePacket).map(function(g){ return armyPacketMatches[g]});
						if(checkedPacket.canSubmit) {
							auto.playSound('UnitProduced');
							auto.armyLoadGenerals(false);
							auto.adventure.data.action = "attack";
							return [false, "[{0}] Loading template units".format(fileName)];
						}else if(armyPacketMatch.indexOf(false) == -1){
							auto.adventure.data.action = "attack";
						} else {
							shortcutsFreeAllUnits();
							return [false, "[{0}] Unloading all Units".format(fileName)];
						}
					}
					if(auto.adventure.data.action == "attack"){ // Attack enemy
						var verify = auto.bgBattleLoadData();
						if(!verify.canAttack && verify.attacksAvailable){
							//stepError(battlePacket);
							auto.adventure.data.action = verify.allOnSameGrid ? "load" : "move";
							return [false, "Can't Attack!"];
						}else if(verify.canAttack) {
							auto.adventure.data.action = null;
							auto.excuteAction("attack");
							auto.playSound('GeneralAttack');
							return [true, "[{0}] Attacking enemy camps".format(fileName)];
						}else{
							return [true, null];
						}
					}
				break;
				case 'LoadGeneralsToEnd':			
					if(game.gi.mCurrentViewedZoneID != auto.adventureID())
						return [false, "You must be on adventure island to load all units"];
					if(auto.adventure.data.enemies.filter(function(e){return game.zone.GetBuildingFromGridPosition(e) && game.zone.GetBuildingFromGridPosition(e).getPlayerID() == -1; }).length > 0)
						return [false, null];
					var freeArmy = auto.isThereUnAssignedUnits();
					if(freeArmy[0]){
						auto.wrapUnitsToFinish(freeArmy[1]);
						return [false, "Loading all units to finish adventure"];
					} else {
						game.getSpecialists().forEach(function(general){
							general.GetArmy().GetSquads_vector().forEach(function(squad){
								auto.adventure.data.army[squad.GetType()] -= squad.amount;
							});
						});
						return [true, "No unassigned units, ready to finish"];
					}
			}
			return [false, "Something is wrong, retrying!"];
		}catch(e){ debug(e); return[false, "Error: " + e.message]; }
	},
	excuteAction: function(action){
		try{
			$.each(battlePacket, function(item) {
				var spec = armyGetSpecialistFromID(item);
				switch(action){
					case "attack":
						if(!battlePacket[item].canAttack) { return; }
						auto.timedQueue.add(function(){ 
							auto.sendGenerals(spec, battlePacket[item].name, battlePacket[item].targetName, 5, battlePacket[item].target); 
						}, battlePacket[item].time);
					break;
					case "move":
						if(!battlePacket[item].canMove) { return; }
						if(battlePacket[item].grid > 0) {
							auto.timedQueue.add(function(){ auto.sendGenerals(spec, battlePacket[item].name, battlePacket[item].grid, 4, battlePacket[item].grid); });
						} else {
							auto.timedQueue.add(function(){ armySendGeneralToStar(spec); });
						}
					break;
				}
			});
		}catch(e){ debug(e); }
	},
	sendGenerals: function(spec, name, targetName, type, target){
		try
		{
			game.gi.mCurrentCursor.mCurrentSpecialist = spec;
			var stask = new armySpecTaskDef();
			stask.uniqueID = spec.GetUniqueID();
			stask.subTaskID = 0;
			swmmo.application.mGameInterface.SendServerAction(95, type, target, 0, stask);
			//game.chatMessage("({0}/{1}) {2} {3} {4}".format(battleTimedQueue.index, battleTimedQueue.len() - 1, name.replace(/(<([^>]+)>)/gi, ""), (type == 5 ? ' x ' : ' > '), targetName), 'battle');
		}
		catch (error) { debug(error); }
	},
	finishQuests: function(finishAdventure){
		var finishedQuests = game.quests.GetQuestPool().GetQuest_vector().toArray().filter(function(e){return e && e.isFinished();});
		$.each(finishedQuests, function(i, quest){
			if(quest.GetQuestDefinition().specialType_string.indexOf('lastQuest') > -1){
				if(finishAdventure){
					quest.SetQuestMode(1);
					var dSA = new (game.def("Communication.VO::dServerAction"))();
					dSA.type = 1;
					dSA.data = quest.GetUniqueId();
					var Responder = game.createResponder(function(){
						AdventureManager.removeAdventure(auto.adventureID());
						game.gi.visitZone(game.gi.mCurrentPlayer.GetHomeZoneId());
						auto.settings.run_Adventure = false;
						auto.adventure.data.action = "train";
						auto.adventure.lastTime = new Date().getTime();
					}, function(){});
					auto.sendServerMessage(100, game.gi.mCurrentViewedZoneID, dSA, Responder);
					auto.playSound('QuestComplete');
				}
			}else {
				auto.timedQueue.add(function(){ 
					game.quests.RewardOkButtonPressedFromGui(quest); 
					auto.playSound('QuestComplete');
				});
			}
		});
	},
	trainLostTroops: function(){
		var trainQ = new TimedQueue(1500);
		trainQ.add(function(){
			var population = auto.getBuff("Population");
			auto.applyBuff(population, 8825, population.amount);
		});
		trainQ.add(function(){
			//Just a delay for population
			showGameAlert("Training Lost Troops!");
		}, 15000);
		Object.keys(auto.adventure.data.army).forEach(function (unitName) {
			var unitsNeeded = auto.adventure.data.army[unitName];
			if (unitsNeeded == 0 || isNaN(unitsNeeded)) { return; }
			if (auto.unitsAffordable(unitName, unitsNeeded)) {
				var eliteUnits = ["MountedMarksman", "MountedSwordsman", "Knight", "Besieger", "ArmoredMarksman", "Swordsman", "Marksman"];
				var isElite = eliteUnits.indexOf(unitName) > -1 ? true : false;
				var prodType = isElite ? 8 : 0,
					barracks = isElite ? "EliteBarracks" : "Barracks";
				game.chatMessage("Training {0} x{1}".format(unitName, unitsNeeded));
				if (unitsNeeded > 25) {
					trainQ.add(function () {
						auto.startProduction(unitName, prodType, 25, Math.floor(unitsNeeded / 25), barracks);
					});
				}
				if (unitsNeeded % 25) {
					trainQ.add(function () {
						auto.startProduction(unitName, prodType, unitsNeeded % 25, 1, barracks);
					});
				}	
			}
		});
		if(trainQ.len() > 0)
			trainQ.run();
	},
	unitCost: function(unitName){
		var unitCosts = {
			"Recruit": 			{"Population": 1, "Beer": 5, "BronzeSword": 10},
			"Bowman": 			{"Population": 1, "Beer": 10, "Bow": 10},
			"Militia": 			{"Population": 1, "Beer": 10, "IronSword": 10},
			"Cavalry": 			{"Population": 1, "Beer": 30, "Horse": 40},
			"Longbowman":		{"Population": 1, "Beer": 20, "Longbow": 10},
			"Soldier": 			{"Population": 1, "Beer": 15, "SteelSword": 10},
			"Crossbowman": 		{"Population": 1, "Beer": 50, "Crossbow": 10},
			"EliteSoldier": 	{"Population": 1, "Beer": 50, "TitaniumSword": 10},
			"Cannoneer": 		{"Population": 1, "Beer": 50, "Cannon": 10},
	
			"Swordsman": 		{"Population": 1, "Beer": 50, "PlatinumSword": 1},
			"MountedSwordsman": {"Population": 1, "Beer": 50, "PlatinumSword": 2, "BattleHorse": 2},
			"Knight":			{"Population": 1, "Beer": 50, "BattleHorse": 1},
			"Marksman": 		{"Population": 1, "Beer": 50, "Archebuse": 1},
			"ArmoredMarksman": 	{"Population": 1, "Beer": 50, "PlatinumSword": 1, "Archebuse": 1},
			"MountedMarksman": 	{"Population": 1, "Beer": 50, "Archebuse": 2, "BattleHorse": 2},
			"Besieger": 		{"Population": 1, "Beer": 50, "Mortar": 1}
		};
		return unitCosts[unitName];
	},
	unitsAffordable: function(unitName, amount){
		var playerRes = game.zone.GetResourcesForPlayerID(game.player.GetPlayerId());
		var unitCost = auto.unitCost(unitName);
		var affordable = [];
		for(var res in unitCost){
			var totalCost = unitCost[res] * amount;
			var resAmount = res == "Population" ? playerRes.GetFree() : playerRes.GetResourceAmount(res);
			if(totalCost > resAmount){
				game.chatMessage("Not enough {0}: {1}/{2} required".format(res, resAmount, totalCost));
				affordable.push(false);
			} else
				affordable.push(true);
		}
		return affordable.indexOf(false) == -1 ? true : false;
	},
	saveTemplate: function(template){
		template.hash = hash(JSON.stringify(template));
		var lastDir = settings.read("autoAdvlastDir");
        file = new air.File(lastDir ? lastDir : air.File.documentsDirectory.nativePath)
            .resolvePath("{0}Template.txt".format("autoAdv")), file.addEventListener(air.Event.COMPLETE, (function(t) {
                if (mainSettings.changeTemplateFolder) {
                    var a = {};
                    a["autoAdvlastDir"] = t.target.parent.nativePath,
					mainSettings["autoAdvlastDirlastDir"] = t.target.parent.nativePath,
					settings.store(a);
                };
				var text = prompt("Custom adventure name");
				autoSettings.adv.templates.push({
					label: text,
					name: template.name,
					template: t.target.nativePath
				});
				auto.saveSettings();
				$("#autoAdventuresBool").empty();
				$.each(autoSettings.adv.templates, function(i, adv){ $("#autoAdventuresBool").append($('<option>', { value: i }).text(adv.label)); });	
				autoMakeMenu();
            })), file.save(JSON.stringify(template, null, " "))
	},
    autoExplorers: function(){
        try{
			if(!game.gi.isOnHomzone()){ return; }
			var expls = game.getSpecialists().filter(function(e){return e && e.GetTask() == null && e.GetBaseType() == 1});
			$.each(expls, function(i, expl){
				var task = mainSettings.explDefTaskByType[expl.GetType()] ? mainSettings.explDefTaskByType[expl.GetType()] : mainSettings.explDefTask;
				if(autoSettings.expl.useTemplate && autoSettings.expl.template != ""){
					var taskTemplate = auto.readFile(autoSettings.expl.template);
					var ttExplID = expl.GetUniqueID().toKeyString().replace(".","_");
					task = taskTemplate[ttExplID] ? taskTemplate[ttExplID] : task;
				}
				task = task.split(",");
				auto.timedQueue.add(function(){ 
					try{
						auto.sendSpecPacket(expl.GetUniqueID(), task[0], task[1]);
					}catch(e){ debug(e); }
				});
			});
            if(expls.length > 0){ showGameAlert("Sending: {0} Explorers".format(expls.length)); }
        }catch(e){ debug(e); }
    },
	autoBookBinder: function(){
		if(!game.gi.isOnHomzone()) return;
		var bookBinder = game.zone.mStreetDataMap.getBuildingByName("Bookbinder");
		//var bookBinder = game.getBuildings().filter(function(b){ return b && b.GetBuildingName_string() == "Bookbinder"})[0];
		if(!bookBinder) return showGameAlert("No Bookbinder found!");
		//Check if Bookbinder is buffed
		if(!bookBinder.productionBuff && autoSettings.bookbinder.autoBuff){
			auto.timedQueue.add(function(){ 
				auto.applyBuff(auto.getBuff(autoSettings.bookbinder.buffType), bookBinder.GetGrid()); 
			});
		}
		//Check BookBinder production Queue
		var bbProductionQ = game.zone.GetProductionQueue(2);
		if(bbProductionQ.mTimedProductions_vector.length != 0){
			var item = bbProductionQ.mTimedProductions_vector[0];
			var productionVO = item.GetProductionOrder().GetProductionVO();
			if(productionVO.producedItems == 0){
				return; //showGameAlert("{0} is being produced!".format(productionVO.type_string));
			}
			if(productionVO.producedItems == 1){
				auto.timedQueue.add(function(){
					bbProductionQ.finishProduction(game.gi.mHomePlayer, true);
					game.gi.mClientMessages.SendMessagetoServer(141, game.gi.mCurrentViewedZoneID, 2);
					showGameAlert("{0} produced successfully.".format(productionVO.type_string));
				});
			}
		}
		//Check if player have enough resources
		var EnoughRess = game.zone.GetResources(game.gi.mHomePlayer);
		var EnoughRessBool = true;
		var requirements = {
		"Manuscript": {
			"SimplePaper": 590,
			"Nib": 470,
			"Coin": 24
		},
		"Tome": {
			"IntermediatePaper": 605,
			"Letter": 415,
			"Manuscript": 5
		},
		"Codex": {
			"AdvancedPaper": 375,
			"BookFitting": 300,
			"Tome": 2
		}
		};
		
		var selectedBook = requirements[autoSettings.bookbinder.bookType];
		
		$.each(EnoughRess.GetResources_Vector(), function(i, item) {
			if (selectedBook.hasOwnProperty(item.name_string) && item.amount < selectedBook[item.name_string]) {
				EnoughRessBool = false;
			}
		});
		if(!EnoughRessBool) return showGameAlert("Not enough resources to produce {0}".format(autoSettings.bookbinder.bookType));
		auto.timedQueue.add(function(){	
			auto.startProduction(autoSettings.bookbinder.bookType, 2, 1, 1, "Bookbinder");				
			game.showAlert("Start producing {0}".format(autoSettings.bookbinder.bookType));	
		}, 10000);
	},
    getBuff: function(rName, bName){
        var buffs =  game.gi.mCurrentPlayer.getAvailableBuffs_vector().filter(function(buff) {
            var voBuff = buff.CreateBuffVOFromBuff();
            return (bName ? voBuff.buffName_string == bName && voBuff.resourceName_string == rName : voBuff.buffName_string == rName || voBuff.resourceName_string == rName);
        });
        return buffs.length > 0 ? buffs[0] : null;
    },
    applyBuff: function(buff, grid, amount){
        game.gi.SendServerAction(61, 0, grid, amount ? amount : 0, buff.GetUniqueId());
    },
	sendSpecPacket:  function(uniqueId, taskId, subTaskId){
		if(!uniqueId) return;
		try{
			var specTask = game.def("Communication.VO::dStartSpecialistTaskVO", true);
			specTask.subTaskID = subTaskId;
			specTask.paramString = "";
			specTask.uniqueID = uniqueId;
			game.gi.SendServerAction(95, taskId, 0, 0, specTask);
		} catch (ex) {
			debug(ex);
		}
	},
    menuLabel: function(setting, mode){
		var sLabel = setting.split("_").splice(1).join(" ");
		if(mode == "menu"){
			return "{0} Auto {1}".format(auto.settings[setting] ? "Stop" : "Start", sLabel);
		}else if(mode == "alert"){
			return showGameAlert("Auto {1} is {0}".format(auto.settings[setting] ? "On" : "Off", sLabel));
		}
        
    },
	toggleSettings: function(setting){
		auto.settings[setting] = auto.settings[setting] ? false : true;
		autoMakeMenu();
	},
    readFile: function(fileName) {
        try {
            var file = new air.File(fileName);
            if (!file.exists) {
                showGameAlert("File doesn't Exist");
                return;
            }
            var fileStream = new air.FileStream();
            fileStream.open(file, air.FileMode.READ);
            var data = fileStream.readUTFBytes(file.size);
            fileStream.close();
            if (data == "") { return; }
            return JSON.parse(data);
        } catch (e) {
            showGameAlert(e.message);
            return {};
        }
    },
    chooseFile: function(callback){
		try{
			var file = new air.File();
            file.browseForOpen("Select a Template"); 
            file.addEventListener(air.Event.SELECT, callback);
		} catch (e){ }

    },
    playSound: function(sound){
        sound = sound.split("_");
		var SoundManager = game.def("Sound::cSoundManager").getInstance(); 
		return (sound.length == 1) ? SoundManager.playEffect(sound[0]) : SoundManager.playEffect(sound[0], sound[1]);
    },
	createSelect: function(id){
		return $('<select>', {'class' : 'form-control','id' : id});
	},
	createButton: function(id, text) {
		return $('<button>', { 
			'style': 'cursor: pointer;text-decoration:none;color:#000;height: 20px;padding: 0px;',
			'class': 'btn form-control',
			'id': id
		}).text(text)
	},
	createSpan: function(id, text) {
		return $('<span>', { 
			'id': id
		}).text(text).prop('outerHTML');
	},
	adventureID: function(adventureName){
		var adventureID = 0;
		adventureName = adventureName ? adventureName : auto.adventure.name;
		AdventureManager.getAdventures().forEach(function(adv){
			if (adv.adventureName == adventureName && AdventureManager.isMyAdventure(adv)){
				adventureID = adv.zoneID;
			}
		});
		return adventureID;
	},
	armyLoadGenerals: function(countArmy){
		$.each(battlePacket, function(item) { 
			var dRaiseArmyVO = new dRaiseArmyVODef();
			var spec = armyGetSpecialistFromID(item);
			if(spec == null) { 
				return;
			}
			dRaiseArmyVO.armyHolderSpecialistVO = spec.CreateSpecialistVOFromSpecialist();
			$.each(battlePacket[item].army, function(res) {
				var dResourceVO = new dResourceVODef();
				dResourceVO.name_string = res;
				if(countArmy)
					auto.adventure.data.army[res] = auto.adventure.data.army[res] ? auto.adventure.data.army[res] + battlePacket[item].army[res] : battlePacket[item].army[res];
				dResourceVO.amount = battlePacket[item].army[res];
				dRaiseArmyVO.unitSquads.addItem(dResourceVO);
			});
			auto.timedQueue.add(function(){
				auto.sendServerMessage(1031, game.gi.mCurrentViewedZoneID, dRaiseArmyVO);
			});
		});
	},
	bgBattleLoadData: function() {
		var canSubmitAttack = true,
			canSubmitMove = [],
			attackSubmitChecker = [],
			attacksAvailable = false,
			allOnSameGrid = [];
		$.each(battlePacket, function (item, val) {
			if (val.spec == null) {
				(canSubmitAttack = false), (canSubmitMove = false);
				return;
			}
			allOnSameGrid.push(val.onSameGrid);
			canSubmitMove.push(val.canSubmitMove || val.onSameGrid);
			attacksAvailable = attacksAvailable || val.target > 0;
			if(!val.canSubmitAttack && val.target > 0) { canSubmitAttack = false; }
			if(val.target > 0) { attackSubmitChecker.push(val.canSubmitAttack); }
		});
		return {
			canMove: (canSubmitMove.indexOf(false) == -1),
			allOnSameGrid: (allOnSameGrid.indexOf(false) == -1),
			canAttack: (canSubmitAttack && attackSubmitChecker.indexOf(false) == -1 && attackSubmitChecker.length > 0),
			attacksAvailable: attacksAvailable
		}
	},
	sendGeneralsToAdventure: function(gens){
		$.each(gens, function(i, general){
			auto.timedQueue.add(function(){ 
				armyServices.specialist.sendToZone(armyGetSpecialistFromID(general), auto.adventureID());
			});
		});
		return gens.length ? true : false;
	},
	isThereUnAssignedUnits: function(){
		var armyCategory = { elite: {}, normal: {} };
		game.zone.GetArmy(game.player.GetPlayerId()).GetSquadsCollection_vector().sort(game.def("MilitarySystem::cSquad").SortByCombatPriority).forEach(function(item){
			if(item.GetUnitBase().GetUnitCategory() != 0) { return; }
			armyCategory[item.GetUnitBase().GetIsElite() ? "elite":"normal"][item.GetType()] = item.GetAmount();
		});
		return [game.zone.GetArmy(game.player.GetPlayerId()).HasUnits(), armyCategory]
	},
	wrapUnitsToFinish: function(armyCategory){
		auto.playSound('UnitProduced');
		game.getSpecialists().forEach(function(general){
			if(!armySPECIALIST_TYPE.IsGeneral(general.GetType()) || general.getPlayerID() != game.player.GetPlayerId() || general == null || typeof general == 'undefined' || general.GetTask() != null) { return; }
			var cat = Object.keys(armyCategory.elite).length > 0 ? "elite" : Object.keys(armyCategory.normal).length > 0 ? "normal" : null;
			var remainingCapacity = general.GetMaxMilitaryUnits() - general.GetArmy().GetUnitsCount();
			if(remainingCapacity == 0 || cat == null){ return; }
			if(cat == 'normal' && general.GetArmy().HasEliteUnits()){ return; }
			if(cat == 'elite' && !general.GetArmy().HasEliteUnits() && general.GetArmy().GetUnitsCount()) { return; }
			var newArmy = [];
			var dRaiseArmyVO = new dRaiseArmyVODef();
			dRaiseArmyVO.armyHolderSpecialistVO = general.CreateSpecialistVOFromSpecialist();
			$.each(armyCategory[cat], function(unit, num){
				var dResourceVO = new dResourceVODef();
				dResourceVO.name_string = unit;
				var currentSquad = general.GetArmy().GetSquad(unit) ? general.GetArmy().GetSquad(unit).GetAmount() : 0;
				if(remainingCapacity >= num){
					dResourceVO.amount = currentSquad + num;
					delete armyCategory[cat][unit];
					remainingCapacity -= num;
				} else {
					dResourceVO.amount = currentSquad + remainingCapacity;
					armyCategory[cat][unit] = num - remainingCapacity;
					remainingCapacity = 0;
				}
				if(dResourceVO.amount > 0){
					dRaiseArmyVO.unitSquads.addItem(dResourceVO);
					newArmy.push(unit);
				}
			});
			general.GetArmy().GetSquadsCollection_vector().forEach(function(squad){
				if(newArmy.indexOf(squad.GetType()) > -1) { return; }
				var dResourceVO = new dResourceVODef();
				dResourceVO.name_string = squad.GetType();
				dResourceVO.amount = squad.GetAmount();
				dRaiseArmyVO.unitSquads.addItem(dResourceVO);
			});
			auto.timedQueue.add(function(){
				auto.sendServerMessage(1031, game.gi.mCurrentViewedZoneID, dRaiseArmyVO);
			});
		});
		//return sendPack;
	},
	areSpecsFree: function(generals){
		return generals.map(function(general){
			general = armyGetSpecialistFromID(general);
			return general ? (!general.IsInUse() && !general.isTravellingAway()) : false;
		}).indexOf(false) == -1 ? true : false;
	},
	checkInPH: function(buff){
		var provisionHs = game.zone.GetProductionQueue_vector().filter(function(b){ return b.productionBuilding.GetBuildingName_string() == "ProvisionHouse" || b.productionBuilding.GetBuildingName_string() == "ProvisionHouse2"});
		var exists = false;
		provisionHs.forEach(function(ph){
			ph.mTimedProductions_vector.forEach(function(tp){
				if(tp.GetType() == buff) exists	= ph.productionBuilding.GetBuildingName_string();
			})
		});
		return exists;
	},
	startProduction: function(item, type, amount, stack, building){
		var dTimedProductionVODef = game.def("Communication.VO::dTimedProductionVO");
		var dTimedProductionVO = new dTimedProductionVODef();
			dTimedProductionVO.productionType = type;
			dTimedProductionVO.type_string = item;
			dTimedProductionVO.amount = amount;
			dTimedProductionVO.stacks = stack;
			dTimedProductionVO.buildingGrid = game.zone.mStreetDataMap.getBuildingByName(building).GetGrid();
		auto.sendServerMessage(91, game.gi.mCurrentViewedZoneID, dTimedProductionVO);
	},
	isQuestActive: function(questName){
		var result = false;
		$.each(game.gi.mNewQuestManager.GetQuestPool().GetQuest_vector(), function(i, item) {
			if(item.getQuestName_string() == questName){
				if (item.isFinished() || !item.IsQuestActive())  
					game.quests.RewardOkButtonPressedFromGui(item);
				else 
					result = true;
			}
		});
		return result;
	},
	checkForCollectables: function(home){
		var isThere = null;
		try{
			if(home && game.gi.isOnHomzone()){
				$.each(game.gi.mNewQuestManager.GetQuestPool().GetQuest_vector(), function(i, item) {
					if(!item.isFinished() && item.GetQuestDefinition().questName_string.toString() == "CollectAllCollectibles" && item.GetQuestMode().toString() != "12")
					{
						isThere = true;
					}
					else if(item.isFinished() && item.GetQuestDefinition().questName_string.toString() == "CollectAllCollectibles")
					{
						isThere = item;
					}
				});
				return isThere;
			}
			game.quests.GetQuestPool().GetQuest_vector().toArray().forEach(function(quest){
				if(quest.IsQuestActive())
					$.each(quest.mQuestDefinition.endConditions_vector, function(n, condition){
						if(condition.action_string == "buildingdestroyed" && condition.loca_string == "pickup"){
							if(auto.isQuestActive("CollectAllEventCollectibles") && quest.mQuestTriggersFinished_vector[n].status == 0){
								isThere = true;
							} else {
								isThere = false;
							}
						}
					});
			});
		}catch(e){};
		return isThere;
	},
	collectPickups: function(){
		var collectionsManager = swmmo.getDefinitionByName("Collections::CollectionsManager").getInstance(),
        questTriggersMap = {},
        itemGOContainer,
		count = 0;
		if (game.gi.mCurrentPlayer.mIsAdventureZone && game.gi.mNewQuestManager.GetQuestPool().IsAnyQuestsActive()) {
			$.each(game.gi.mNewQuestManager.GetQuestPool().GetQuest_vector(), function(i, item) {
				if (item.isFinished() || !item.IsQuestActive()) { return; }
				$.each(item.mQuestDefinition.questTriggers_vector, function(n, trigger) {
					if(trigger.name_string != null && trigger.name_string != '')
						questTriggersMap[trigger.name_string] = true;
				});
			});
		}

		game.zone.mStreetDataMap.GetBuildings_vector().forEach(function(item){
			if (item === null) { return; }
			itemGOContainer = item.GetGOContainer();
			if (
				collectionsManager.getBuildingIsCollectible(item.GetBuildingName_string()) ||
				(
					questTriggersMap[item.GetBuildingName_string()] &&
					item.mIsSelectable &&
					itemGOContainer.mIsAttackable &&
					!itemGOContainer.mIsLeaderCamp &&
					itemGOContainer.ui !== "enemy" &&
					(item.GetArmy() == null || !item.GetArmy().HasUnits())
				)
			) {
				count++;
				auto.timedQueue.add(function(){
					game.gi.SelectBuilding(item);
				});
			}
		});
		if(count > 0)
			auto.timedQueue.add(function(){ auto.adventure.data.action = "collected"; });
	},
	zoneRefreshed: function() {
		/*if(autoSettings.other.cCollectables){
			var isThereCollectiables = auto.checkForCollectables(true);
			if(isThereCollectiables === true){
				auto.collectPickups();
				showGameAlert("Collecting...");
			}
		}*/
		try{
			if(game.gi.isOnHomzone() && auto.adventure.data.action == "train"){
				if(autoSettings.adv.reTrain)
					auto.trainLostTroops();
				
				auto.resetAdventure();
				auto.adventure.data.repeatCount--;
				auto.settings.run_Adventure = true;
				autoMakeMenu();
			}
			var action = Object.keys(auto.adventure.steps).sort(auto.customCompare)[auto.adventure.data.index];
			var advStep = action ? action.split("_")[1] : "";
			if(advStep == "VisitAdventure" && game.gi.mCurrentViewedZoneID == auto.adventureID()){
				showGameAlert("Adventure Island Loaded!");
				auto.adventure.data.index++;
				auto.settings.run_Adventure = true;
			}else if(advStep == "ReturnHome" && game.gi.isOnHomzone()){
				showGameAlert("Home Island Loaded!");
				auto.adventure.data.index++;
				auto.settings.run_Adventure = true;
			}
		}catch(e){ debug(e); }
		//Collect Collectiables
		
	},
	sendServerMessage: function(actionCode, zone, data, callBackResponder){
		try
		{	
			callBackResponder = callBackResponder ?  callBackResponder : null;
			game.gi.mClientMessages.SendMessagetoServer(actionCode, zone, data, callBackResponder);
		}
		catch (e){ debug(e); }
	},
	toggleTweaks: function(){
		try 
		{
			var Glob = swmmo.getDefinitionByName("global");
			if (autoSettings.other.applyTweaks) 
			{
				globalFlash.gui.mChatPanel.getViewComponent().messageHistory.maxEntries = 100;
				Glob.tradeMaxAdventureAmount = 100;
				Glob.tradeMaxBuildingAmount = 100;
				Glob.tradeMaxBuffAmount = 10000;
				Glob.tradeRefreshInterval = 10;
				Glob.maxAnimalsOnMap = 50;
				Glob.mailboxPageSize = 100;
			}
			else 
			{
				globalFlash.gui.mChatPanel.getViewComponent().messageHistory.maxEntries = 300;
				Glob.tradeMaxAdventureAmount = 10;
				Glob.tradeMaxBuildingAmount = 10;
				Glob.tradeMaxBuffAmount = 1000;
				Glob.tradeRefreshInterval = 30;
				Glob.maxAnimalsOnMap = 100;
				Glob.mailboxPageSize = 50;
			}
		} catch(e){ debug(e); }
	},
	updateStatus: function(status){
		menu.nativeMenu.getItemByName("AutoAdvTrack").label = "Status: " + status;
	},
	saveSettings: function(){
		try
		{
			settings.settings['autoSettings'] = [];
			storeSettings(autoSettings, 'autoSettings');
		} catch(e){ debug(e); }
	},
	resetAdventure: function(){
		auto.adventure.data.army = {};
		auto.adventure.data.generals = [];
		auto.adventure.data.enemies = [];
		auto.adventure.data.action = null;
		auto.adventure.data.index = 0;
	}
}


//Initalize Auto Menu
auto.settings.run_Explorers = autoSettings.expl.autoStart;
autoMakeMenu();
auto.start();
//Auto Zone Refresh 
game.gi.channels.ZONE.addPropertyObserver("ZONE_REFRESHED", game.getTracker('ZR', auto.zoneRefreshed));
