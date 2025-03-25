var AdventureManager = game.def("com.bluebyte.tso.adventure.logic::AdventureManager").getInstance();
var autoWindow, aWindow, aZoneAction = null;
const aData = {
    adventureItems: {
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
            ChangeSkin_BuffAd_Seeds: [5882, 4259, 2427, 2562, 2358, 2223, 2079, 1942, 2145],
            EmptyEffectBuff_BuffAd_Fertilizer: [5882, 4259, 2427, 2562, 2358, 2223, 2079, 1942, 2145],
            BattleBuffHurt_BuffAd_SmallDynamite: [[5680, 4394, 2152, 2070], 10],
            BattleBuffHurt_BuffAd_MediumDynamite: [[5680, 2152, 2014, 5814], 6],
            BattleBuffHurt_BuffAd_BigDynamite: [[2275, 2014, 5814], 5],
            BattleBuffHurt_BuffAd_Poison: [[5884, 3988, 3387, 2150, 1880, 1935], 20],
            BattleBuffHurt_BuffAd_Shovel1: [[1880, 2424, 3387, 3988, 5884, 2342, 1935], 16],
            BattleBuffHurt_BuffAd_StinkyPotion: [[5884, 5614, 3321, 2150, 1935], 11],
            BattleBuffHurt_BuffAd_Decomposer: [[2342, 1880, 2424, 3988], 11],
            ChangeSkin_BuffAd_SchoolKit: [5614],
            ChangeSkin_BuffAd_NobleResidenceKit: [5884, 3988],
            ChangeSkin_BuffAd_TavernKit1: [3387, 2342],
            ChangeSkin_BuffAd_ResidenceKit: [3321, 2424, 2150, 1880],
            EmptyEffectBuff_BuffAd_StickyFluid: [3440]
        }
    },
    savedSenarios: {
        "SenarioGrainConflict" : {
			"name": "BuffAdventures_safeTheTowns_easy",
			"steps": [
				{ name: "StartAdventure" },
				{ name: "VisitAdventure" },
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_Repairkit"},
				{ name: "VisitAdventure" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_Repairkit"},
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_Bread"},
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_Beer"},
				{ name: "VisitAdventure" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_Bread"},
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_Beer"},
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_Sausage"},
				{ name: "VisitAdventure" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_Sausage"}
			]
		},
        "SenarioTwins": {
			"name": "BuffAdventures_twins_easy",
			"steps": [
				{ name: "StartAdventure" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_Broadsheet" },
				{ name: "VisitAdventure" },
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_Bridge" },
				{ name: "VisitAdventure" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_Bridge" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_Broadsheet" },
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_Rescueparty" },
				{ name: "VisitAdventure" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_Rescueparty" }
			]
		},
        "SenarioHeartOfTheWoods": {
			"name": "BuffAdventures_heartOfTheWood_medium",
			"steps": [
				{ name: "StartAdventure" },
				{ name: "VisitAdventure" },
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_wildlife" },
				{ name: "VisitAdventure" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_wildlife" },
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_hearttree" },
				{ name: "VisitAdventure" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_hearttree" },
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_woodhealing" },
				{ name: "VisitAdventure" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_woodhealing" },
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_Fertilizer" },
				{ name: "VisitAdventure" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_Fertilizer" }
			]
		},
        "SenarioRichesOfTheMountain": {
			"name": "BuffAdventures_Riches_of_the_Mountain",
			"steps": [
				{ name: "StartAdventure" },
				{ name: "VisitAdventure" },
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_PureOre" },
				{ name: "ProduceItem", data: "BattleBuffHurt_BuffAd_Dynamite" },
				{ name: "ProduceItem", data: "BattleBuffHurt_BuffAd_Shovel" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_TavernKit" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_StorageKit" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_MasonKit" },
				{ name: "VisitAdventure" },
				{ name: "ApplyByff", data: "ChangeSkin_BuffAd_PureOre" },
				{ name: "ApplyByff", data: "BattleBuffHurt_BuffAd_Dynamite" },
				{ name: "ApplyByff", data: "BattleBuffHurt_BuffAd_Shovel" },
				{ name: "ApplyByff", data: "ChangeSkin_BuffAd_TavernKit" },
				{ name: "ApplyByff", data: "ChangeSkin_BuffAd_StorageKit" },
				{ name: "ApplyByff", data: "ChangeSkin_BuffAd_MasonKit" },
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "BattleBuffHurt_BuffAd_MountainDynamite" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_ShaftConstruction" },
				{ name: "ProduceItem", data: "EmptyEffectBuff_BuffAd_FoodProvision" },
				{ name: "VisitAdventure" },
				{ name: "ApplyByff", data: "BattleBuffHurt_BuffAd_MountainDynamite" },
				{ name: "ApplyByff", data: "ChangeSkin_BuffAd_ShaftConstruction" },
				{ name: "ApplyByff", data: "EmptyEffectBuff_BuffAd_FoodProvision" },
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "BattleBuffHurt_BuffAd_Glue" },
				{ name: "ProduceItem", data: "BattleBuffHurt_BuffAd_WaterSplash" },
				{ name: "ProduceItem", data: "BattleBuffHurt_BuffAd_Explosive" },
				{ name: "ProduceItem", data: "BattleBuffHurt_BuffAd_Specialist" },
				{ name: "VisitAdventure" },
				{ name: "ApplyByff", data: "BattleBuffHurt_BuffAd_Glue" },
				{ name: "ApplyByff", data: "BattleBuffHurt_BuffAd_WaterSplash" },
				{ name: "ApplyByff", data: "BattleBuffHurt_BuffAd_WaterSplash" },
				{ name: "ApplyByff", data: "BattleBuffHurt_BuffAd_Explosive" },
				{ name: "ApplyByff", data: "BattleBuffHurt_BuffAd_Specialist" }
			]
		},
        "SenarioStormRecovery": {
			"name": "BuffAdventures_Storm_Recovery",
			"steps": [
				{ name: "StartAdventure" },
				{ name: "VisitAdventure" },
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_Seeds" },
				{ name: "ProduceItem", data: "EmptyEffectBuff_BuffAd_Fertilizer" },
				{ name: "ProduceItem", data: "BattleBuffHurt_BuffAd_SmallDynamite" },
				{ name: "ProduceItem", data: "BattleBuffHurt_BuffAd_MediumDynamite" },
				{ name: "ProduceItem", data: "BattleBuffHurt_BuffAd_BigDynamite" },
				{ name: "VisitAdventure" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_Seeds" },
				{ name: "ApplyBuff", data: "EmptyEffectBuff_BuffAd_Fertilizer" },
				{ name: "ApplyBuff", data: "BattleBuffHurt_BuffAd_SmallDynamite" },
				{ name: "ApplyBuff", data: "BattleBuffHurt_BuffAd_MediumDynamite" },
				{ name: "ApplyBuff", data: "BattleBuffHurt_BuffAd_BigDynamite" },
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "BattleBuffHurt_BuffAd_Poison" },
				{ name: "ProduceItem", data: "BattleBuffHurt_BuffAd_Shovel1" },
				{ name: "ProduceItem", data: "BattleBuffHurt_BuffAd_StinkyPotion" },
				{ name: "ProduceItem", data: "BattleBuffHurt_BuffAd_Decomposer" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_SchoolKit" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_NobleResidenceKit" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_TavernKit1" },
				{ name: "ProduceItem", data: "ChangeSkin_BuffAd_ResidenceKit" },
				{ name: "VisitAdventure" },
				{ name: "ApplyBuff", data: "BattleBuffHurt_BuffAd_Poison" },
				{ name: "ApplyBuff", data: "BattleBuffHurt_BuffAd_Shovel1" },
				{ name: "ApplyBuff", data: "BattleBuffHurt_BuffAd_StinkyPotion" },
				{ name: "ApplyBuff", data: "BattleBuffHurt_BuffAd_Decomposer" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_SchoolKit" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_NobleResidenceKit" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_TavernKit1" },
				{ name: "ApplyBuff", data: "ChangeSkin_BuffAd_ResidenceKit" },
				{ name: "CollectPickups" },
				{ name: "ReturnHome" },
				{ name: "ProduceItem", data: "EmptyEffectBuff_BuffAd_StickyFluid" },
				{ name: "VisitAdventure" },
				{ name: "ApplyBuff", data: "EmptyEffectBuff_BuffAd_StickyFluid" }
			]
		}
    },
	Adventures: function(){
		var Result = {};
		game.def('AdventureSystem::cAdventureDefinition').map_AdventureName_AdventureDefinition.valueSet().forEach(function(adv){
			if(adv.mName_string.indexOf('Expedition') == -1 && adv.GetRequiresEvent() == ''){
				const Cat = adv.GetCampaign_string() == 'None'? adv.GetType_string() : loca.GetText('LAB','Campaign_{0}'.format(adv.GetCampaign_string()));
				if(Cat == 'Scenario' && adv.mName_string.indexOf('Easter') != -1 && adv.mName_string.indexOf('BuffAdventures') == -1) return;
				if(loca.GetText('ADN', adv.mName_string).indexOf('undefined') != -1) return;
				if(!Result[Cat])
					Result[Cat] = [];
				Result[Cat].push(adv.mName_string);
			}
		})
		return Result;
	},
	SpeedBuffs: function(toOptions){
		const buffs = ["Bronze", "Platinum", "Blackened_Titanium", "Obsidian", "Mystical"];
		if(toOptions)
			return buffs.map(function(buff){
				buff = 'GeneralSpeedBuff_' + buff;
				var buffVO = aUtils.getBuff(buff)
				var amount = buffVO ? buffVO.amount : 0;
				return $('<option>', { value: buff, disabled: buffVO ? false : true }).text("{0}({1}): {2}".format(loca.GetText('RES', buff), amount, loca.GetText('DES', buff).split("Target")[0]));
			});
		else
			return buffs.map(function(buff){ return 'GeneralSpeedBuff_' + buff; });
	},
	Units: function(Unit){
		const Data = game.def('MilitarySystem::cMilitaryUnitBase').GetAllUnit(1);
		if(!Unit) return Data;
		return Data.filter(function(unit){ return unit.GetType() == Unit; })[0] || null;
	},
	Resources: function(AllResources, toOptions){
		var Result = [];
		const Resources = game.getResources().GetPlayerResources_vector("").sort(function(a,b){
			return loca.GetText("RES", a).localeCompare(loca.GetText("RES", b))
		});
		$.each(Resources, function(i, Resource){
			const event = game.def('ServerState::gEconomics').mMap_EventResourceDefaultDefinition[Resource.name_string];
			if (game.def('ServerState::gEconomics').GetResourcesDefaultDefinition(Resource.name_string).tradable && ((event == null) || (game.gi.mEventManager.isEventStarted(event.requiredEventName_string) || AllResources))){
				Result.push(Resource.name_string);
			};
		});
		return Result;
	},
	Excelsior: function(){
		const Definitions = game.def('converted.bluebyte.tso.contentgenerator.logic::ContentGeneratorDefinitions').getInstance().getDefinitions();
		return Definitions;
	}
}
const aAdventure = {
	data: {
		fileName: null,
		name: null,
		generals: [],
		enemies: [],
		army:{},
		lostArmy:{},
		rEnemies: 0,
		index: 0,
		action: null,
		repeatCount: 0,
		lastTime: null,
		steps: []
	},
	exec: function(){
		try{
			var action = aAdventure.data.steps[aAdventure.data.index];
			aAdventure.ModalUpdateSteps();
			//debug(action);
			if(aAdventure[action.name])
				return aAdventure[action.name](action);
			else
				return aAdventure.result(false, "Something is wrong, retrying!");
		}catch(e){ 
			return debug(e), aAdventure.result(false, "Error: " + e.message); 
		}
	},
	result: function(next, message, interval){
		return {
			next: next || false,
			message: message || null,
			interval: interval || 10
		}
	},
	reset: function(){
		var repeat = aAdventure.data.repeatCount > 0 ? true: false;
		this.data = {
			fileName: repeat ? aAdventure.data.fileName : null,
			name: repeat ? aAdventure.data.name : null,
			generals: repeat ? aAdventure.data.generals : [],
			enemies: repeat ? aAdventure.data.enemies : [],
			army: repeat ? aAdventure.data.army : {},
			lostArmy: {},
			rEnemies: 0,
			index: 0,
			action: null,
			repeatCount: repeat ? aAdventure.data.repeatCount : 0,
			lastTime: null,
			steps: repeat ? aAdventure.data.steps : []
		}
	},
	ControlModal: function(){
		if(!aAdventure.data.name && !aAdventure.data.fileName)
			return aUI.alert('Please select an adventure first','ARMY');
		try {
			aWindow = new Modal("aAdventureModal", getImage(assets.GetBuffIcon("MapPart").bitmapData) + " Auto Adventure");
			var aAdventure_SpeedBuffs = aUtils.createSelect("aAdventure_SpeedBuffs").append(aData.SpeedBuffs(1));
			//aWindow.size = '';
			aWindow.create();
			aWindow.Body().empty().append(
				$('<div>', { 'class': 'container-fluid', 'style' : 'user-select: all;' }).append([
					aUtils.createPanel([
						aUtils.createRow([
							[1,
							$('<div>', { 'class': 'text-center' }).append([
									$('<div>', { 'id': 'aAdventureImg'}),
							])
							],
							[11,
							$('<div>').append([
								aUtils.createRow([
									[1, "Name: "], 
									[3, $('<label>', { 'id': 'aAdventureName', 'class':'small'})],
									[2, "Inventory: " + $('<span>', { 'id': 'aAdventureAmount' }).prop('outerHTML')],
									[2, 'Speed Buff:'],
									[4, aAdventure_SpeedBuffs],
								], 'remTable'),
								aUtils.createRow([
									[1, "File: "], 
									[3,  $('<label>', { 'id': 'aAdventureFile', 'class':'text-muted small'})],
									[2, "Repeats: " + $('<label>', { 'id': 'aAdventureRepeats' }).prop('outerHTML')],
									[2, "Black Vortex ({0}):".format(aUtils.getBuff("PropagationBuff_AdventureZoneTravelBoost_BlackTree").amount)],
									[1, createSwitch('aAdventure_BlackVortex', aSettings.Adventures.blackVortex)],
									[2, "Retrain lost units:"],
									[1, createSwitch('aAdventure_RetrainUnits', aSettings.Adventures.reTrain)],
								], 'remTable'),
							]).css("padding","-20px 15px")
						]], 'remTable')
					]),
					$('<div>', { 'class': 'small'}).html('* Finishing quests and ending the adventure are done automatically!'),
					aUtils.createPanel([
						aUtils.createRow([
							[7, $('<div>', { 'id': 'aAdventureStepsDiv' }).css("padding","-20px 15px")],
							[5, 
								$('<div>', { 'class': 'small'}).css("padding","-20px 15px").append([
									aUtils.createRow([[4, "Generals:"],[8, aUtils.createSpan('aAdventureTotalGenerals', '0')]], 'remTable'),
									aUtils.createRow([[4, "Targets:"], [2, aUtils.createSpan('aAdventureTotalEnemies', '0')], [4, 'Remaining:'], [2, aUtils.createSpan('aAdventureRemainingEnemies', '0')]], 'remTable'),
									aUtils.createRow([[4, "Lost Units:"],[8, aUtils.createSpan('aAdventureTotalLost', '0')]], 'remTable'),
									$('<div>', { 'id': 'aAdventureLostUnitsDiv'}),
								])
							]
						], 'remTable'),
					]).css('border', '0px'),
			]));
			
			aWindow.Footer().empty().prepend([
				$("<button>", { 'id': 'aAdventureToggle', 'data-cmd': auto.isOn.Adventure ? 'stop':'start', 'class': "btn btn-primary pull-left" }).text(auto.isOn.Adventure ? 'Stop':"Start"),
				$("<label>", { 'id': 'aAdventureStatus', 'style': 'margin: 7px;', 'class': "small pull-left" }).text("Status: ---")
			]).append(
				$("<button>", { 'class': "btn btn-primary btnClose", 'data-dismiss': 'modal' }).text("Close")
			);
			aWindow.withBody('#aAdventure_BlackVortex').change(function(e) { aSettings.Adventures.blackVortex = $(e.target).is(':checked');});
			aWindow.withBody('#aAdventure_RetrainUnits').change(function(e) { aSettings.Adventures.reTrain = $(e.target).is(':checked');});
			$('#aAdventureModal').on('click','#aAdventureToggle', function(e) {
				switch($(this).data('cmd')){
					case 'start':
						auto.isOn.Adventure = true;
						$(this).data('cmd', 'stop').text('Stop');
						break;
					case 'startfrom':
					case 'continuefrom':
						var indexTxt = $('#aAdventureStepsDiv').find(".stepSelected").data('step');
						aAdventure.data.index = parseInt(indexTxt);
						auto.isOn.Adventure = true;
						$(this).data('cmd', 'stop').text('Stop');
						break;
					case 'stop':
						auto.isOn.Adventure = false;
						$(this).data('cmd', 'start').text('Start');
						break;
				}
			});
			aAdventure.ModalLoadInfo();
			aWindow.withBody(".remTable").css({"background": "inherit", "margin-top": "5px"});
			aWindow.show();
			$('#aAdventure_SpeedBuffs').val(aSettings.Adventures.speedBuff);
		} catch (e) { debug(e); }
	},
	ModalLoadInfo: function(){
		try {
			var buffAmount = aUtils.getBuff(aAdventure.data.name) ? aUtils.getBuff(aAdventure.data.name).amount : 0;
			$("#aAdventureImg").html(getImage(assets.GetBuffIcon(aAdventure.data.name).bitmapData, '50px'));
			$("#aAdventureName").html(loca.GetText("ADN", aAdventure.data.name));
			$("#aAdventureAmount").html(buffAmount);
			$("#aAdventureRepeats").html(aAdventure.data.repeatCount);
			$("#aAdventureFile").html(aAdventure.data.fileName);
			$("#aAdventureToggle").prop("disabled", buffAmount == 0);
			$('#aAdventureTotalGenerals').text(aAdventure.data.generals.length);
			$('#aAdventureTotalEnemies').text(aAdventure.data.enemies.length);
			aAdventure.ModalUpdateInfo();			
			aAdventure.ModalUpdateSteps();
		} catch (e) {}
	},
	ModalUpdateSteps: function(){
		try {
			if(!auto.isOn.Adventure)
				$("#aAdventureToggle").data("cmd", "start").text("Start");
			
			$('#aAdventureStepsDiv').empty()
			.append(aUtils.createRow([[6, "Adventure Steps"], [6, "Details"]], "text-center", true))
			.append(
				aAdventure.data.steps.map(function(step, index){
					var selected = '';
					if(index == aAdventure.data.index)
						selected = auto.isOn.Adventure ? 'background: #FF7700;' : 'background: #377fa8;';
					var text = step.name.replace(/([A-Z])/g, ' $1').trim();
					var details = step.data || "";
					if(details.indexOf("BuffAd") > -1){
						details = getImage(assets.GetBuffIcon(details).bitmapData, '22px', '22px') + loca.GetText("RES", details);
					}
					
					return aUtils.createRow([
						[6, text],
						[6, details, details.indexOf('\\') > -1 ? "text-muted": ""]
					], "text-center small").attr('style', 'cursor:pointer;{0}'.format(selected)).attr('data-step', index).click(aAdventure.ModalStepSelected)
				})
			)

		} catch (e) {}
	},
	ModalStepSelected: function(e){
		try {
			e = $(e.target).hasClass('row') ? e.target : $(e.target).parent('.row');
			var data = $(e).data('step');
			aAdventure.ModalUpdateSteps();

			if($(e).hasClass('stepSelected')){
				$("#aAdventureToggle").data("cmd", auto.isOn.Adventure ? 'stop':'start').text(auto.isOn.Adventure ? 'Stop':'Start');
			} else {
				$('#aAdventureStepsDiv').find("[data-step='{0}']".format(data)).addClass('stepSelected').css('background', 'brown');
				$("#aAdventureToggle").data("cmd", auto.isOn.Adventure ? "continuefrom" : 'startfrom')
				.text("{0} from this step".format(auto.isOn.Adventure ? 'Continue' : 'Start'))
			}
		} catch (e) { }
	},
	ModalUpdateInfo: function(){
		try {
			$('#aAdventureRemainingEnemies').text(aAdventure.data.rEnemies);
			$('#aAdventureLostUnitsDiv').empty();
			var totalLost = 0;
			$.each(aAdventure.data.lostArmy, function(uName, lost){
				totalLost += lost;
				$('#aAdventureLostUnitsDiv').append(aUtils.createRow([
					[1, "&#10551;"],
					[6,  getImage(assets.GetMilitaryIcon(uName).bitmapData, "22px") + " {0}:".format(loca.GetText('RES', uName))],
					[5, lost]
				]));
			});
			$('#aAdventureTotalLost').text(totalLost);
			$('#aAdventureLostUnitsDiv .row').css({"background": "inherit"});
		}catch(e){ debug(e) }
	},
	CheckLostUnits: function(){
		try {
			aAdventure.data.rEnemies = aUtils.remainingEnemies();
			var freeArmy = aUtils.GetFreeArmy(0) || {};
			var assignedArmy = aUtils.assignedArmy();
			aData.Units().forEach(function(uName){
				uName = uName.GetType();
				const initial = aAdventure.data.army[uName];
				if(!initial) return;
				const free = freeArmy[uName] ? freeArmy[uName] : 0;
				const assigned = assignedArmy[uName] ? assignedArmy[uName] : 0;
				const lost = initial - (free + assigned);
				if(lost <= 0) return;
				aAdventure.data.lostArmy[uName] = lost; 
			});
		}catch(e){ debug(e) }
	},
	StartAdventure: function(){
		try {
			if(!game.gi.isOnHomzone())
				return aAdventure.result(false, "You must be on home island!");
			if(aAdventure.data.lastTime && (new Date().getTime() - aAdventure.data.lastTime <= 180000))
				return aAdventure.result(false, "Next Adventure starts at: {0}".format(new Date(aAdventure.data.lastTime + 180000).toLocaleTimeString()));
			
			if(aSettings.Adventures.blackVortex &&
				!aAdventure.data.action &&  aAdventure.data.fileName != "senario" &&
				!game.gi.mZoneBuffManager.isBuffRunning("PropagationBuff_AdventureZoneTravelBoost_BlackTree")
			) {
				const BVBuff = aUtils.getBuff("PropagationBuff_AdventureZoneTravelBoost_BlackTree");
				if(BVBuff) {
					aUtils.applyBuff(BVBuff, 0);
					aAdventure.data.action = "blackVortex";
					return aAdventure.result(false, "Starting Black Vortex");
				}
			}

			if(aUtils.adventureID())
				return aAdventure.result(true, "Adventure ({0}) is active".format(loca.GetText('ADN', aAdventure.data.name)), 3);
			else if(aUtils.getBuff(aAdventure.data.name)){
				aUtils.applyBuff(aUtils.getBuff(aAdventure.data.name), 8825);
				aAdventure.data.action = null;
				return aAdventure.result(false, "Starting ({0})".format(loca.GetText('ADN', aAdventure.data.name)));
			} else 
				return null;
		}catch(er){ return debug(er), aAdventure.result(false, 'Error: ' + er.message); }
    },
	InHomeLoadGenerals: function(step){
		try{
			if(!game.gi.isOnHomzone()) 
				return this.result(false, "You must be on home island!");

			if(aUtils.areGensBusy(step.loaded)) 
				return this.result(false, "Waiting for Generals{0}".format(aUtils.gTaskTime(step.loaded)));

			battlePacket = battleLoadDataCheck(step.loaded);
			updateFreeArmyInfo(true);
			var checkedPacket = armyLoadDataCheck(battlePacket);
			var armyPacketMatch = Object.keys(battlePacket).map(function(g){ return armyPacketMatches[g]});
			if(checkedPacket.canSubmit){
				aUtils.playSound('UnitProduced');
				aUtils.armyLoadGenerals(true);
				return this.result(true, "Loading all untis for adventure");
			} else if(armyPacketMatch.indexOf(false) == -1){
				return this.result(true, "Units Loaded!", 3); 
			} else {
				shortcutsFreeAllUnits();
				return this.result(false, "Unloading all Units");
			}
		}catch(er){}
	},
	SendGeneralsToAdventure: function(){
		try{
			if(!game.gi.isOnHomzone())
				return this.result(false, "You must be on home island!");

			if(aUtils.areGensBusy(this.data.generals))
				return this.result(false, null);
			else if(aUtils.sendGeneralsToAdventure(this.data.generals))
				return this.result(true, "Sending generals to ({0})".format(loca.GetText('ADN', this.data.name)));
			else
				return this.result(false, "Can't send generals");
		}catch(er){}
	},
	UseSpeedBuff: function(){
		try{
			if(game.gi.mCurrentViewedZoneID != aUtils.adventureID())
				return this.result(false, null);
			const buff = aSettings.Adventures.speedBuff;
			if(aUtils.getBuff(buff)){
				auto.timedQueue.add(function(){
					try {
						aUtils.applyBuff(aUtils.getBuff(buff), 0);
					} catch (e) {}
				});
				return this.result(true, "Applying: " + loca.GetText('RES', buff), 1);
			}
			else 
				return this.result(true, "Can't find Buff in star menu, continuing without buff", 1);
		}catch(er){}
	},
	StarGenerals: function(){
		try{
			if(game.gi.mCurrentViewedZoneID != aUtils.adventureID())
				return this.result(false, "You must be on adventure island!");
			else if(aUtils.areGensBusy(this.data.generals))
				return this.result(false, "Waiting for Generals{0}".format(aUtils.gTaskTime(aAdventure.data.steps[0].loaded)));
			else if(aUtils.areAllGeneralsInStar()){
				return this.result(true);
			}else{
				aUtils.starGenerals();
				return this.result(false, 'Sending generals to star');
			}
		}catch(er){ debug(er) }
	},
	VisitAdventure: function(){
		try{
			if (!aUtils.adventureID())
				return this.result(false, "Can't find ({0}) in active adventures".format(loca.GetText('ADN', this.data.name)));
			
			if(game.gi.isOnHomzone()){
				aUtils.updateStatus("Travelling to Adventure island!");
				auto.timedQueue.add(function(){
					try {
						game.gi.visitZone(aUtils.adventureID());
					} catch (e) {}
				});
				return null;
			}
		}catch(er){}
	},
	CollectPickups: function(){
		return this.result(false, "Waiting for pickups!");
	},
	ReturnHome: function(){
		try{
			if(!game.gi.isOnHomzone()){
				aUtils.updateStatus("Travelling to Home island!");
				auto.timedQueue.add(function(){
					try {
						game.gi.visitZone(game.gi.mCurrentPlayer.GetHomeZoneId());
					} catch (e) {}
				});
				return null;
			}
		}catch(er){}
	},
	ProduceItem: function(step){
		try{
			var data = step.data;
			if(!game.gi.isOnHomzone())
				return this.result(false, "You must be on home island!");
			if(aUtils.getBuff(data))
				return this.result(true, "{0} produced successfully".format(loca.GetText('RES', data)), 3);
			else if(aUtils.CheckInProduction(data))
				return this.result(false, "{0} is being produced".format(loca.GetText('RES', data)), 3);
			else {
				var itemData = aData.adventureItems[aAdventure.data.name][data];
				var amount = itemData.length;
				if($.isArray(itemData[0])){
					amount = itemData[1];
				}
				auto.timedQueue.add(function(){
					try {
						aUtils.startProduction("ProvisionHouse", data, amount, 1);
					} catch (e) {}
				});
				return this.result(false, "Start producing {0} x{1}".format(loca.GetText('RES', data), amount));
			}
		}catch(er){}
	},
	ApplyBuff: function(step){
		try{
			var data = step.data;
			if(game.gi.mCurrentViewedZoneID != aUtils.adventureID())
				return this.result(false, "You must be on adventure island!");
			if(aUtils.getBuff(data)){
				var itemData = aData.adventureItems[aAdventure.data.name][data];
					itemData = $.isArray(itemData[0]) ? itemData[0] : itemData;
				$.each(itemData, function(i, grid){
					auto.timedQueue.add(function(){
						try {
							aUtils.applyBuff(aUtils.getBuff(data), grid, 1);
						} catch (e) {}
					});
				});
				return this.result(true, "{0} applied".format(loca.GetText('RES', data)));
			} else {
				return this.result(false, "{0} is not available".format(loca.GetText('RES', data)));
			}
		}catch(er){}
	},
	AdventureTemplate: function(step){
		try {
			if(game.gi.mCurrentViewedZoneID != aUtils.adventureID()) 
				return aAdventure.result(false, "You must be on adventure island!");
	
			var fileName = step.data.split('\\');
				fileName = fileName[fileName.length - 1];
			if(!aAdventure.data.action) aAdventure.data.action = "move";
			
			if(aUtils.areGensBusy(step.loaded, !aAdventure.data.action == "move"))
				return aAdventure.result(false, "[{0}] Waiting for Generals{1}".format(fileName, aUtils.gTaskTime(step.loaded)));
			
			battlePacket = battleLoadDataCheck(step.loaded);
	
			if(aAdventure.data.action == "move"){ // Move generals				
				var verify = aUtils.verifyData();
				if(!verify.canMove && !verify.allOnSameGrid){
					//stepError(battlePacket);
					return aAdventure.result(false, "[{0}] Can't move generals yet!".format(fileName));
				}else if(!verify.canMove && verify.allOnSameGrid){
					aAdventure.data.action = "load";
				}else if(verify.canMove){
					aAdventure.data.action = "load";
					// Excute Moving
					$.each(battlePacket, function(id, general){
						var spec = armyGetSpecialistFromID(id);
						if(!general.canMove) { return; }
						if(general.grid > 0) {
							auto.timedQueue.add(function(){
								try {
									aUtils.sendGenerals(spec, general.name, general.grid, 4, general.grid); 
								} catch (e) {}
							});
						} else {
							auto.timedQueue.add(function(){ 
								try {
									armySendGeneralToStar(spec);
								} catch (e) {}
							});
						}
					});
					return aAdventure.result(false, "[{0}] Moving generals to position!".format(fileName));
				}
			}
			if(aAdventure.data.action == "load"){ // FreeUnits & Load Units
				updateFreeArmyInfo(true);
				var checkedPacket = armyLoadDataCheck(battlePacket);
				var armyPacketMatch = Object.keys(battlePacket).map(function(g){ return armyPacketMatches[g]});
				if(checkedPacket.canSubmit) {
					aUtils.playSound('UnitProduced');
					aUtils.armyLoadGenerals(false);
					aAdventure.data.action = "attack";
					return aAdventure.result(false, "[{0}] Loading template units".format(fileName));
				}else if(armyPacketMatch.indexOf(false) == -1){
					aAdventure.data.action = "attack";
				} else {
					shortcutsFreeAllUnits();
					return aAdventure.result(false, "[{0}] Unloading all Units".format(fileName));
				}
			}
			if(aAdventure.data.action == "attack"){
				var verify = aUtils.verifyData();
				if(!verify.canAttack && verify.attacksAvailable){
					aAdventure.data.action = verify.allOnSameGrid ? "load" : "move";
					return aAdventure.result(false, "Can't Attack!");
				}else if(verify.canAttack) {
					aAdventure.data.action = null;
					// Excute Attack
					$.each(battlePacket, function(id, general){
						var spec = armyGetSpecialistFromID(id);
						if(!general.canAttack) { return; }
						auto.timedQueue.add(function(){
							try {
								aUtils.sendGenerals(spec, general.name, general.targetName, 5, general.target); 
							} catch (e) {}
						}, general.time);
					});
					$.each(battlePacket, function(id, attacker) {
						if(!attacker.canAttack) { return; }
						if(attacker.type == 'buff') {
							var aBuff = aUtils.getBuff(attacker.name);
							if(!aBuff || aBuff.amount < 1) { return aUI.alert('{0} not available!'.format(loca.GetText("RES", attacker.name)), 'ERROR'); }
							auto.timedQueue.add(function(){
								aUtils.applyBuff(aBuff, attacker.target);
								game.chatMessage('apply ' + loca.GetText("RES", attacker.name) + ' to ' + attacker.target, 'battle');
							}, attacker.time);
							return;
						}
						var spec = armyGetSpecialistFromID(id);
						auto.timedQueue.add(function(){
							try {
								aUtils.sendGenerals(spec, attacker.name, attacker.targetName, 5, attacker.target); 
							} catch (e) {}
						}, attacker.time);
					});
					aUtils.playSound('GeneralAttack');
					return aAdventure.result(true, "[{0}] Attacking enemy camps".format(fileName));
				}else{
					return aAdventure.result(true, null);
				}
			}
		}catch(er){}
	},
	LoadGeneralsToEnd: function(){
		try{
			if(game.gi.mCurrentViewedZoneID != aUtils.adventureID())
				return aAdventure.result(false, "You must be on adventure island to load all units");
			const enemies = aAdventure.data.enemies.filter(function(e){return game.zone.GetBuildingFromGridPosition(e) && game.zone.GetBuildingFromGridPosition(e).getPlayerID() == -1; });
			if(enemies.length > 0){
				return aAdventure.result(false, "Waiting for generals to kill enemies!!");
			}
				
			var freeArmy = aUtils.GetFreeArmy(1);
			if(freeArmy){
				aUtils.assignFreeArmy(freeArmy);
				return aAdventure.result(false, "Loading all units to finish adventure");
			} else {
				return aAdventure.result(true, "No unassigned units, ready to finish");
			}
		}catch(er){}
	}
}
const aUtils = {
    // Files 
    readFile: function(fileName) {
        try {
            var file = new air.File(fileName);
            if (!file.exists)
                return aUI.alert("File doesn't Exist", 'ERROR'), false;

            var fileStream = new air.FileStream();
            fileStream.open(file, air.FileMode.READ);
            var data = fileStream.readUTFBytes(file.size);
            fileStream.close();
            if (data == "") { return; }
            return JSON.parse(data);
        } catch (e) {
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
	capitalize: function(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},
    // Play Sound
    playSound: function(sound){
        sound = sound.split("_");
		var SoundManager = game.def("Sound::cSoundManager").getInstance(); 
		return (sound.length == 1) ? SoundManager.playEffect(sound[0]) : SoundManager.playEffect(sound[0], sound[1]);
    },

    // HTML Bootstrap code generator
	createPanel: function(content){
		return $('<div>', { 'class': 'panel panel-default', 'style': 'background: inherit;' }).append([
			// $('<div>', { 'class': 'panel-heading' }).append(header),
			$('<div>', { 'class': 'panel-body' }).append(content)
	])
	},
	createSelect: function(id){
		return $('<select>', {'class' : 'form-control', 'id' : id});
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
    createRow: function(colums, rowClass, header) {
		rowClass = rowClass ? rowClass : '';
        var rowDiv = $("<div>", { 'class': "row {0}".format(rowClass) })
        return colums.forEach(function(colum) {
            var columDiv = $("<div>", {
                    'class': "col-xs-{0} col-sm-{0} col-lg-{0}".format(colum[0])
                }).html(colum[1]);
				header && columDiv.addClass("tblHeader"),
			colum[2] && columDiv.addClass(colum[2]),
			columDiv.attr("style", header ? "border-radius:10px 10px 10px 10px;line-height: 23px" : ""),
			rowDiv.append(columDiv)
        }), rowDiv
    },
	createSettingsImg: function(id){
		return $('<img>', { id: id, src: 'images/icon_settings.png' , style: 'height: 23px; cursor: pointer;'})
	},
    // Auto Adventure Utils
	adventureID: function(adventureName){
		try{
			var adventureID = 0;
			adventureName = adventureName ? adventureName : aAdventure.data.name;
			AdventureManager.getAdventures().forEach(function(adv){
				if (adv.adventureName == adventureName && AdventureManager.isMyAdventure(adv)){
					adventureID = adv.zoneID;
				}
			});
			return adventureID;
		}catch(er){ return 0; }
	},
	areGensBusy: function(generals, attackersOnly){
		try{
			var checkList = $.isArray(generals) ? generals : Object.keys(generals);
			if(attackersOnly) {
				checkList = checkList.filter(function(general){
					return generals[general].target > 0;
				});
			}
			return checkList.map(function(general){
				if(general.substr(0,4) == 'buff'){
					return aUtils.getBuff(general) ? aUtils.getBuff(general).amount > 0 : aUI.alert('{0} not available!'.format(loca.GetText("RES", general))), false;
				}
				general = armyGetSpecialistFromID(general);
				return general ? (!general.IsInUse() && !general.isTravellingAway()) : false;
			}).indexOf(false) > -1;
		}catch(er){}
	},

    sendGeneralsToAdventure: function(gens){
		try{
			$.each(gens, function(i, general){
				auto.timedQueue.add(function(){ 
					try {
						armyServices.specialist.sendToZone(armyGetSpecialistFromID(general), aUtils.adventureID());
					} catch (e) {}
				});
			});
			return gens.length ? true : false;
		}catch(er){}
	},
	starGenerals: function(){
		try{
			game.getSpecialists().forEach(function(item){
				if (game.player.GetPlayerId() == item.getPlayerID() && 
					armySPECIALIST_TYPE.IsGeneral(item.GetType()) && 
					item.GetGarrisonGridIdx() > 0  && !item.IsInUse() && !item.isTravellingAway())
				{
					auto.timedQueue.add(function(){ 
						try {
							aUtils.execStarGenerals(item);
						} catch (e) {}
					});
				}
			});
		}catch(er){}
	},
	execStarGenerals: function(spec){
		try
		{
			game.gi.mCurrentCursor.mCurrentSpecialist = spec;
			var sTask = new armySpecTaskDef();
			sTask.uniqueID = spec.GetUniqueID();
			sTask.subTaskID = 0;
			game.gi.SendServerAction(95,12,game.gi.mCurrentCursor.GetGridPosition(),0,sTask);
			spec.SetTask(new armySpecTravelDef(game.gi,spec,0,12));
		}catch(er){}
	},
	areAllGeneralsInStar: function(){
		try{
			const generals = game.getSpecialists().filter(function(item){
				return game.player.GetPlayerId() == item.getPlayerID() && 
					armySPECIALIST_TYPE.IsGeneral(item.GetType()) && 
					item.GetGarrisonGridIdx() > 0  && !item.IsInUse() && !item.isTravellingAway()
			});
			return generals.length == 0 ? true : false;
		}catch(er){}
	},
	GetFreeArmy: function(Categorized){
		try{
			if (!game.zone.GetArmy(game.player.GetPlayerId()).HasUnits())
				return null;
			var armyCategory = Categorized ? {'elite':{}, 'normal':{}} : {};
			game.zone.GetArmy(game.player.GetPlayerId()).GetSquadsCollection_vector().sort(game.def("MilitarySystem::cSquad").SortByCombatPriority).forEach(function(item){
				if(item.GetUnitBase().GetUnitCategory() != 0) { return; }
				if(Categorized){
					armyCategory[item.GetUnitBase().GetIsElite() ? "elite":"normal"][item.GetType()] = item.GetAmount();
				}
				else
					armyCategory[item.GetType()] = item.GetAmount();
			});
			return armyCategory;
		}catch(er){ debug(er) }
	},
	gTaskTime: function(generals){
		try{
			var last = 0;
			$.each(generals, function(id, val){
				const general = armyGetSpecialistFromID(id);
				if(!general) return;
				if(general.GetTask()){
					last = general.GetTask().GetRemainingTime() > last ? general.GetTask().GetRemainingTime() : last;
				}
			});
			return last > 0 ? ", Continue in {0}".format(aUtils.formatTime(last)) : "!!";
		}catch(e){ debug(e) }
	},
	assignedArmy: function(){
		var army = {};
		game.getSpecialists().forEach(function(general){
			general.GetArmy().GetSquads_vector().forEach(function(squad){
				army[squad.GetType()] = (army[squad.GetType()] || 0) + squad.amount;
			});
		});
		return army;
	},
	assignFreeArmy: function(armyCategory){
		try{
			debug(armyCategory);
			aUtils.playSound('UnitProduced');
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
					try {
						aUtils.sendServerMessage(1031, game.gi.mCurrentViewedZoneID, dRaiseArmyVO);
					} catch (e) {}
				});
			});
		}catch(er){ debug(er) }
		//return sendPack;
	},
	armyLoadGenerals: function(countArmy){
		try{
			$.each(battlePacket, function(item) { 
				var dRaiseArmyVO = new dRaiseArmyVODef();
				var spec = armyGetSpecialistFromID(item);
				if(spec == null) return;
				
				dRaiseArmyVO.armyHolderSpecialistVO = spec.CreateSpecialistVOFromSpecialist();
				$.each(battlePacket[item].army, function(res) {
					var dResourceVO = new dResourceVODef();
					dResourceVO.name_string = res;
					//if(countArmy)
					//	aAdventure.data.army[res] = (aAdventure.data.army[res] || 0) + battlePacket[item].army[res];
					dResourceVO.amount = battlePacket[item].army[res];
					dRaiseArmyVO.unitSquads.addItem(dResourceVO);
				});
				aUtils.playSound('UnitProduced');
				auto.timedQueue.add(function(){
					try {
						aUtils.sendServerMessage(1031, game.gi.mCurrentViewedZoneID, dRaiseArmyVO);
					} catch (e) {}
				});
			});
		}catch(er){}
	},
	verifyData: function() {
		var canSubmitAttack = true,
			canSubmitMove = [],
			attackSubmitChecker = [],
			attacksAvailable = false,
			allOnSameGrid = [],
			attackersOnGrid = [];
		$.each(battlePacket, function (id, val) {
			if(val.type == 'buff'){
				if(!val.canSubmitAttack || !aUtils.getBuff(val.name)){
					aUI.alert("Can't use {0}!".format(loca.GetText("RES", val.name)), 'ERROR');
					canSubmitAttack = false;
				}
				return;
			}
			if (val.spec == null) {
				(canSubmitAttack = false), (canSubmitMove = false);
				return;
			}
			allOnSameGrid.push(val.onSameGrid);
			if(val.target > 0)
				attackersOnGrid.push(val.onSameGrid)
			canSubmitMove.push(val.canSubmitMove || val.onSameGrid);
			attacksAvailable = attacksAvailable || val.target > 0;
			if(!val.canSubmitAttack && val.target > 0) { canSubmitAttack = false; }
			if(val.target > 0) { attackSubmitChecker.push(val.canSubmitAttack); }
		});
		return {
			canMove: (canSubmitMove.indexOf(false) == -1),
			allOnSameGrid: (allOnSameGrid.indexOf(false) == -1),
			canAttack: (canSubmitAttack && attackSubmitChecker.indexOf(false) == -1 && attackSubmitChecker.length > 0),
			attacksAvailable: attacksAvailable,
			attackersOnGrid: (attackersOnGrid.indexOf(false) == -1)
		}
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
		}catch(er){}
	},
	finishQuests: function(finishAdventure){
		try{
			var finishedQuests = game.quests.GetQuestPool().GetQuest_vector().toArray().filter(function(e){return e && e.isFinished();});
			$.each(finishedQuests, function(i, quest){
				if(quest.GetQuestDefinition().specialType_string.indexOf('lastQuest') > -1){
					if(finishAdventure){
						quest.SetQuestMode(1);
						var dSA = game.def("Communication.VO::dServerAction", true);
							dSA.type = 1;
							dSA.data = quest.GetUniqueId();
						var Responder = game.createResponder(function(){
							AdventureManager.removeAdventure(aUtils.adventureID());
							game.gi.visitZone(game.gi.mCurrentPlayer.GetHomeZoneId());
							auto.isOn.Adventure = false;
							aAdventure.data.action = "FinishAdventure";
							aAdventure.data.lastTime = new Date().getTime();
						}, function(){});
						aUtils.sendServerMessage(100, game.gi.mCurrentViewedZoneID, dSA, Responder);
						aUtils.playSound('QuestComplete');
					}
				}else {
					auto.timedQueue.add(function(){ 
						try {
							game.quests.RewardOkButtonPressedFromGui(quest); 
							aUtils.playSound('QuestComplete');
						} catch (e) {}
					});
				}
			});
		}catch(er){}
	},
	updateStatus: function(status){
		menu.nativeMenu.getItemByName("aStatus").label = "Status: " + status;
		$("#aAdventureStatus").text("Status: " + status);
	},
    CheckInProduction: function(item, buildings){
		try{
			buildings = buildings ? (typeof buildings == 'string' ? [buildings] : buildings) : ['ProvisionHouse', 'ProvisionHouse2']
			var pQueues = $.map(buildings, function(building){
				return game.zone.mStreetDataMap.getBuildingByName(building).productionQueue;
			});
			var result = 0;
			pQueues.forEach(function(q){
				q.mTimedProductions_vector.forEach(function(tp){
					if(tp.GetType() == item) result += tp.GetAmount();
				})
			});
			return result;
		}catch(er){ return debug('No Buildings'), 0; }
	},
	startProduction: function(building, item, amount, stack){
		try{
			building = game.zone.mStreetDataMap.getBuildingByName(building);
			var dTimedProductionVO = game.def("Communication.VO::dTimedProductionVO", true);
				dTimedProductionVO.productionType = building.productionType;
				dTimedProductionVO.type_string = item;
				dTimedProductionVO.amount = amount;
				dTimedProductionVO.stacks = stack;
				dTimedProductionVO.buildingGrid = building.GetGrid();
			aUtils.sendServerMessage(91, game.gi.mCurrentViewedZoneID, dTimedProductionVO);
		}catch(er){}
	},
	GetBuffCost: function(name){
		try{
			return game.def('global').map_BuffName_BuffDefinition[name].GetCosts_vector();
		}catch(e){ debug(name), debug(e) }
	},
	ProduceInPH: function(name, amount){
		if(!name) return;
		const inProduction = aUtils.CheckInProduction(name, 'ProvisionHouse');
		if(inProduction >= amount) return;
		amount -= inProduction;
		if(!aUtils.CanAfford(aUtils.GetBuffCost(name), amount)) 
			return aUI.alert("Not enough resources to produce x{1} {0}".format(loca.GetText("RES", name), amount), name);
		var productionQueue = new TimedQueue(1500)
		if (amount > 25) {
			productionQueue.add(function () {
				try {
					aUtils.startProduction("ProvisionHouse", name, 25, Math.floor(amount / 25));
				} catch (e) {}
			});
		}
		if (amount % 25) {
			productionQueue.add(function () {
				try {
					aUtils.startProduction("ProvisionHouse", name, amount % 25, 1);
				} catch (e) {}
			});
		}
		productionQueue.run();
		aUI.alert("Start production of {0} x{1}".format(loca.GetText("RES", name), amount), name);
	},
    getMinefromDepositGrid: function(grid)
	{
		try{
			var BuildingsDep = null;
			game.getBuildings().forEach(function(building) {
				if(building == null) return;
				if(building.GetResourceCreation().GetDepositBuildingGridPos() == grid)
					BuildingsDep = building;
			});	
			return BuildingsDep;
		}catch(er){}
	},
    getBuff: function(rName, bName){
        var buffs =  game.gi.mCurrentPlayer.getAvailableBuffs_vector().filter(function(buff) {
            var voBuff = buff.CreateBuffVOFromBuff();
            return (bName ? voBuff.buffName_string == bName && voBuff.resourceName_string == rName : voBuff.buffName_string == rName || voBuff.resourceName_string == rName);
        });
        return buffs.length > 0 ? buffs[0] : null;
    },
	getWYBuffs: function(){
		return game.gi.mCurrentPlayer.getAvailableBuffs_vector().filter(function(b){ 
			return b && b.GetBuffDefinition().GetTargetDescription_string() == "Workyard";
		});
	},
    applyBuff: function(buff, grid, amount){
		try{
			if(buff)
				game.gi.SendServerAction(61, 0, grid, amount ? amount : 0, buff.GetUniqueId());
		}catch(e){}
    },
    sendSpecPacket:  function(uniqueId, taskId, subTaskId){
		if(!uniqueId) return;
		try{
			var specTask = game.def("Communication.VO::dStartSpecialistTaskVO", true);
			specTask.subTaskID = subTaskId;
			specTask.paramString = "";
			specTask.uniqueID = uniqueId;
			game.gi.SendServerAction(95, taskId, 0, 0, specTask);
		} catch (e) {}
	},
    sendServerMessage: function(actionCode, zone, data, callBackResponder){
		try
		{	
			callBackResponder = callBackResponder ? callBackResponder : null;
			game.gi.mClientMessages.SendMessagetoServer(actionCode, zone, data, callBackResponder);
		}
		catch (e){}
	},
	remainingEnemies: function(){
		return aAdventure.data.enemies.filter(function(e){return game.zone.GetBuildingFromGridPosition(e) && game.zone.GetBuildingFromGridPosition(e).getPlayerID() == -1; }).length;
	},
	CanAfford: function(data, amount){
		try{
			var canAfford = true;
			$.each(data, function(i, res){
				const resource = res.name_string == 'Population' ? game.getResources().GetFree() : game.getResources().GetResourceAmount(res.name_string)
				if(resource < (res.amount * amount)){
					canAfford = false;
					if(aSettings.Quests.Config.GatherfromStar){
						const buffVO = aUtils.getBuff(res.name_string, 'AddResource');
						if(buffVO && buffVO.amount >= (res.amount * amount)){
							auto.timedQueue.add(function(){
								aUtils.applyBuff(buffVO, 8825, (res.amount * amount));
							});
						}
					}
				}
			});
			return canAfford;
		} catch(e){ debug(e) }
	},
	EnoughResource: function(name, amount, alert){
		if(game.getResources().GetPlayerResource(name).amount < amount){
			if(alert)
				aUI.alert('You need to have {0} {1}'.format(amount, loca.GetText('RES', name)), assets.GetResourceIcon(name));
			return false;
		}	 
		else
			return true;
	},
	TrainUnit: function(name, amount, abs){
		const unitData = aData.Units(name);
		const barracksType = unitData.GetIsElite() ? "EliteBarracks" : "Barracks";
		const inProduction = aUtils.CheckInProduction(name, barracksType);
		if(!abs){
			if(inProduction >= amount) return;
			amount -= inProduction;
		}
		if(!aUtils.CanAfford(unitData.GetCosts_vector(), amount)) 
			return aUI.alert("Not enough resources to produce {0} x{1}".format(loca.GetText("RES", name), amount), name);
		
		var trainQ = new TimedQueue(1500);
		trainQ.add(function(){ 
			aUI.alert("Training {0} x{1}".format(name, amount), assets.GetMilitaryIcon(name));
			game.chatMessage("Training {0} x{1}".format(name, amount)); 
		});
		if (amount > 25) {
			trainQ.add(function() {
				aUtils.startProduction(barracksType, name, 25, Math.floor(amount / 25));
			});
		}
		if (amount % 25) {
			trainQ.add(function() {
				aUtils.startProduction(barracksType, name, amount % 25, 1);
			});
		}
		trainQ.run();
	},
	trainLostTroops: function(){
		const lArmy = aAdventure.data.lostArmy;
		if(!Object.keys(lArmy).length) return;
		var all = 0;
		$.each(lArmy, function(k, v){ all += v; });
		var trainQ = new TimedQueue(1500);
		if(game.getResources().GetFree() < all){
			trainQ.add(function(){
				var population = aUtils.getBuff("Population");
				aUtils.applyBuff(population, 8825, population.amount);
			});
		}
		trainQ.add(function(){
			aUI.alert("Training Lost Troops!", 'ARMY');
			$.each(lArmy, function(unitName, unitsNeeded){
				aUtils.TrainUnit(unitName, unitsNeeded, true);
			});
		}, 15000);
		trainQ.run();
	},
	zoneRefreshed: function() {
		try{
			if(game.gi.isOnHomzone() && aAdventure.data.action == "FinishAdventure"){
				if(aSettings.Adventures.reTrain)
					aUtils.trainLostTroops();

				aAdventure.data.repeatCount--;
				aAdventure.reset();
				aAdventure.ModalLoadInfo();
				auto.isOn.Adventure = true;
				aUI.makeMenu();
			}
			var step = aAdventure.data.steps[aAdventure.data.index];
			if(step && step.name == "VisitAdventure" && game.gi.mCurrentViewedZoneID == aUtils.adventureID()){
				aUI.alert("Adventure Island Loaded!", 'QUEST');
				aAdventure.data.index++;
				auto.isOn.Adventure = true;
			}else if(step && step.name == "ReturnHome" && game.gi.isOnHomzone()){
				aUI.alert("Home Island Loaded!", 'QUEST');
				aAdventure.data.index++;
				auto.isOn.Adventure = true;
			}
		}catch(e){}
		//Collect Collectiables
		
	},
	getItemAmount: function(name){
		var result = 0;
		game.zone.GetResources(game.gi.mHomePlayer).GetResources_Vector().forEach(function(res){
			if(res.name_string == name) result = res.amount
		});
		return result;
	},
	findTextOf: function(s)
	{
		const textTypes = ["RES","BUI","SPE","COL","LAB","ADN","ALM","SHI","ACL"];
		if (s == "") return "";
		for(var idx = 0 ; idx < textTypes.length; idx++)
		{
			var n = loca.GetText(textTypes[idx], s);
			if (n.toLowerCase().indexOf("undefined") < 0)
				return n;
		}
		return s;
	},
	saveTemplate: function(template){
		template.hash = hash(JSON.stringify(template));
		var lastDir = settings.read("autoAdvlastDir");
        file = new air.File(lastDir ? lastDir : air.File.documentsDirectory.nativePath)
            .resolvePath("autoAdvTemplate.txt"), file.addEventListener(air.Event.COMPLETE, (function(t) {
                if (mainSettings.changeTemplateFolder) {
                    var a = {};
                    a["autoAdvlastDir"] = t.target.parent.nativePath,
					mainSettings["autoAdvlastDirlastDir"] = t.target.parent.nativePath,
					settings.store(a);
                };
				var text = prompt("Custom adventure name");
				aSettings.Adventures.templates.push({
					label: text,
					name: template.name,
					template: t.target.nativePath
				});
				auto.SaveSettings(1);
				$("#aAdventure_SavedPool").empty().append(aSettings.Adventures.templates.map(function(adv, i){
					return $('<option>', { value: i }).text(adv.label);
				}));
				aUI.makeMenu();
            })), file.save(JSON.stringify(template, null, " "))
	},
	battleFinished: function(e){
		try{
			if(game.gi.mCurrentViewedZoneID == aUtils.adventureID()){
				aAdventure.CheckLostUnits();
				aAdventure.ModalUpdateInfo(e.data.getCasualties());
			}
		} catch(er){ debug(er) }
	},
	formatTime: function(ms){
		const tSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(tSeconds / 60);
		const seconds = tSeconds % 60;
		return "{0}:{1}".format(minutes, seconds < 10 ? '0' + seconds : seconds);
	},
	formatDate: function(milliseconds) {
		var date = new Date(milliseconds);
		var day = String(date.getDate());
		if (day.length < 2) { 
			day = '0' + day;
		}
		var month = date.getMonth() + 1;
		var year = String(date.getFullYear()).slice(-2);
		var hours = date.getHours();
		var minutes = String(date.getMinutes());
		if (minutes.length < 2) {
			minutes = '0' + minutes;
		}
		var ampm = hours >= 12 ? 'PM' : 'AM';
		hours %= 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes + ' ' + ampm;
	},
	cExtend: function(target, source) {
		for (var prop in source) {
			if (source.hasOwnProperty(prop) && target.hasOwnProperty(prop)) {
				if ($.isArray(source[prop])) {
					if (source[prop].length === 0) {
						target[prop] = []; // Assign empty array if needed
					} else {
						if ($.isArray(target[prop])) {
							target[prop] = source[prop].slice(); // copy the array.
						} else if (typeof target[prop] !== 'object' || target[prop] === null) {
							target[prop] = $.isArray(source[prop]) ? [] : {};
						} else {
							target[prop] = source[prop];
						}
					}
				} else if (typeof source[prop] === 'object' && source[prop] !== null) {
					if (typeof target[prop] !== 'object' || target[prop] === null) {
						target[prop] = $.isArray(source[prop]) ? [] : {};
					}
					aUtils.cExtend(target[prop], source[prop]);
				} else {
					target[prop] = source[prop];
				}
			}
		}
		return target;
	}
}
const aCycle = {
	wQueue: [],
	cInterval: 10000,
	features: [
		'Explorers',
		'Deposits',
		'Quests',
		'BookBinder',
		'CollectPickups',
		'WeeklyQuest',
		'Adventure',
		'Mail',
		'Star2Store',
		'StarBoxs'
	],
    run: function(){
		auto.stop();
		auto.timedQueue = new TimedQueue(1000);
		if(aCycle.wQueue.length > 0){
			aCycle.wQueue.forEach(function(item){
				if($.isArray(item))
					auto.timedQueue.add(item[0], item[1]);
				else
					auto.timedQueue.add(item);
			});
			aCycle.wQueue = [];
		}
		try{
			aCycle.features.forEach(function(feature){
				aCycle[feature]();
			})
		}catch(e){}

		auto.timedQueue.add(function(){
			auto.timerID = setTimeout(aCycle.run, aCycle.cInterval);
		}); 
		auto.timedQueue.run();
		auto.lastExec = new Date().getTime();
	},
	Adventure: function(){
		if(!auto.isOn.Adventure) return aUtils.updateStatus("idle...");
		if(!aAdventure.data.steps) { 
			aUI.alert("Please reselect the adventure!!", 'ARMY'); 
		} else if(aAdventure.data.repeatCount == 0){ 
			auto.isOn.Adventure = false;
			aSettings.Adventures.lastAdv = aAdventure.data;
			auto.SaveSettings();
			aUI.alert('Auto Adventure Completed!', 'ARMY');
			aAdventure.ModalLoadInfo();
		} else if(aAdventure.data.index < aAdventure.data.steps.length){
			//Complete Active Quests in adventure
			if(game.gi.mCurrentViewedZoneID == aUtils.adventureID()) 
				aUtils.finishQuests(false);
			var result = aAdventure.exec();
			if(!result){
				auto.isOn.Adventure = false; 
			} else {
				if(result.next){ aAdventure.data.index++; }
				if(result.message){ aUtils.updateStatus(result.message); }
				if(result.interval){ aCycle.cInterval = result.interval * 1000; }
				aSettings.Adventures.lastAdv = aAdventure.data;
				auto.SaveSettings();
			}
		} else {
			auto.timedQueue.add(function(){ 
				try {
					aUtils.finishQuests(true);
				} catch (e) {}
			}, 10000);
		}
	},
    Explorers: function(){
		aExplorers.exec();
    },
	Deposits: function(){
		aDeposits.exec();
    },
	CollectPickups: function(){
		aCollect.exec();
	},
	Quests: function(){
		if(auto.isOn.Quests) aQuests.test();
	},
    BookBinder: function(){
		aBookBinder.exec();
	},
	WeeklyQuest: function(){
		aWeeklyQuest.exec();
	},
	Mail: function(){
		if(!game.gi.isOnHomzone() || !auto.isOn.Mail) return;
		if(aMail.nextRun < new Date().getTime())
			aMail.run();
	},
	Star2Store: function(){
		aStar2Store.exec();
	},
	StarBoxs: function(){
		aStarBoxs.exec();
	}
}
const aUI = {
	MenuAdventure: null,
	makeMenu: function(first){
		if(first){
			this.initMenuItem("aStatus", 'Status: ---', false);
			return;
		}
		this.initMenuItem("Automation", '~Automation~', true);
		this.initMenuItem("aStatus", 'Status: ---', false);
		

		var m = [
			{ label: "v{0}".format(auto.version), mnemonicIndex: 0, onSelect: auto.Changelog },
			{ type: 'separator' },
			{ label: "Settings", mnemonicIndex: 0, onSelect: aUI.SettingsHandler },
			{ label: "Check for update", mnemonicIndex: 0, onSelect: auto.CheckforUpdate },
			{ type: 'separator' },
			{ label: 'Tools', mnemonicIndex: 0, items: [
				{ label: "Auto Adventure", mnemonicIndex: 0, onSelect: aAdventure.ControlModal },
				{ label: "Auto Trade", mnemonicIndex: 0, onSelect: aTrade.Modal },
				{ label: "Auto Mail: Trades Log", mnemonicIndex: 0, onSelect: aMail.SavedTradesModal },
				{ label: "Event Deposits Needed", enabled: aEvent.EventWithDepo(), mnemonicIndex:0, onSelect: aEvent.DepositNeeded }
			]},
			{ type: 'separator' },
			{ label: aUI.mFeatureLabel('Explorers'), name: "auto_Explorers", mnemonicIndex: 0, onSelect: function(){
				aUI.toggleFeature('Explorers');
			} },
			{ label: aUI.mFeatureLabel('Quests'), name: "auto_Quests", mnemonicIndex: 0, onSelect: function(){
				aUI.toggleFeature('Quests');
			} },
			{ label: aUI.mFeatureLabel('Deposits'), name: "auto_Deposits", mnemonicIndex: 0, onSelect: function(){
				aUI.toggleFeature('Deposits');
			} },
			{ label: aUI.mFeatureLabel('Book_Binder'), name: "auto_BookBinder", mnemonicIndex: 0, onSelect: function(){
				aUI.toggleFeature('Book_Binder');
			} },
			{ label: aUI.mFeatureLabel('Mail'), name: "auto_Mail", mnemonicIndex: 0, onSelect: function(){
				aUI.toggleFeature('Mail');
			} },
			{ label: aUI.mFeatureLabel('Adventure'), name: "auto_Adventure", mnemonicIndex: 0, onSelect: function(){
				if(!aAdventure.data.fileName) 
					return aUI.alert("No active Adventure. please select a new Adventure", 'ERROR');
				aUI.toggleFeature('Adventure');
			} },
			{ label: "Stop auto adventering after this", enabled: [0, 1].indexOf(aAdventure.data.repeatCount) != -1 ? false: true, mnemonicIndex: 0, onSelect: function(){
				aAdventure.data.repeatCount = 1;
				aUI.alert("Auto Adventure will stop after finishing the current adventure");
			} },
			{ type: 'separator' },
			{ label: 'Senarios', mnemonicIndex: 0, items: [
				{ label: "The Grain Conflict", name: "SenarioGrainConflict", onSelect: aUI.SelectedAdventureHandler },
				{ label: "Twins", name: "SenarioTwins", onSelect: aUI.SelectedAdventureHandler },
				{ label: "Heart Of The Wood", name: "SenarioHeartOfTheWoods", onSelect: aUI.SelectedAdventureHandler },
				{ label: "Riches Of The Mountain", name: "SenarioRichesOfTheMountain", onSelect: aUI.SelectedAdventureHandler },
				{ label: "Storm Recovery", name: "SenarioStormRecovery", onSelect: aUI.SelectedAdventureHandler }
			]}
		].concat(aUI.addAdventuresItems());
		menu.nativeMenu.getItemByName("Automation").submenu = air.ui.Menu.createFromJSON(m);

		var existingGridPosMenu = window.nativeWindow.menu.getItemByName("GridPosMenu");
		if(aSettings.misc.showGrid){
			if(existingGridPosMenu == null){
				MenuItem = new air.NativeMenuItem("Grid : ---");
				MenuItem.name = "GridPosMenu";
				MenuItem.enabled = false;
				window.nativeWindow.menu.addItem(MenuItem);
				window.nativeWindow.stage.addEventListener("click", auto.generateGrid);
			}
		}else{
			if(existingGridPosMenu){
				window.nativeWindow.menu.removeItem(existingGridPosMenu);
				window.nativeWindow.stage.removeEventListener(64, auto.generateGrid);
			}
		}
	},
	initMenuItem: function(name, label, enabled){
		var menuItem = window.nativeWindow.menu.getItemByName(name);
		if(menuItem != null) window.nativeWindow.menu.removeItem(menuItem);
		var newItem = new air.NativeMenuItem(label);
			newItem.name = name;
			newItem.enabled = enabled ? true: false;
		window.nativeWindow.menu.addItem(newItem);

	},
	mFeatureLabel: function(feature){
		const name = feature.replace("_", "");
		const label = aUtils.capitalize(feature.replace("_", " "))
		return "{0} Auto {1}".format(auto.isOn[name] ? "Stop" : "Start", label);
    },
	toggleFeature: function(feature){
		const name = feature.replace("_", "");
		const isOn = !auto.isOn[name];
		const label = aUtils.capitalize(feature.replace("_", " "));
		auto.isOn[name] = isOn;
		var menuItem = menu.nativeMenu.getItemByName("Automation")
			.submenu.getItemByName('auto_{0}'.format(name));
		if(menuItem)
			menuItem.label = "{0} Auto {1}".format(isOn ? "Stop" : "Start", label)
		aUI.alert("Auto {1} is {0}".format(isOn ? "On" : "Off", label), 'QUEST');
	},
	addAdventuresItems: function(){
		var items = [];
		$.each(aData.Adventures(), function(cat, advs){
			var catAdvs = [];
			$.each(aSettings.Adventures.templates, function(index, template){
				if(advs.indexOf(template.name) > -1){
					const name = "Saved_{0}".format(index);
					const label = "{0}{1}. {2}".format(
						name = aUI.MenuAdventure ? "-> " : "",
						(catAdvs.length + 1),
						template.label || loca.GetText('ADN', template.name)
					);
					catAdvs.push({ label: label, mnemonicIndex: 0, name: name, onSelect: aUI.SelectedAdventureHandler });
				}
			});
			if(catAdvs.length)
				items.push({ label: cat, mnemonicIndex: 0, items: catAdvs });
		});
		return items;
	},
	SettingsHandler: function(){
		try{
			autoWindow = new Modal('mainSettings', utils.getImageTag('icon_dice.png', '45px') + ' Auto Settings');
			autoWindow.size = 'modal-sg';
			autoWindow.create();
			var container = function(){
				return $('<div>', { 'class': 'container-fluid', 'style' : 'user-select: all;' });
			}
			var tabs = $('<ul>', { 'class': 'nav nav-pills nav-justified', 'style': 'width: 100%' });
			var tabcontent = $('<div>', { 'class': 'tab-content' });
			tabs.append([
				$('<li>', { 'class': 'active' }).append($('<a>', { 'data-toggle': 'tab', 'href': '#menu_Specialists' }).text('Specialists')),
				$('<li>').append($('<a>', { 'data-toggle': 'tab', 'href': '#menu_MailTrade' }).text('Mail/Trades')),
				$('<li>').append($('<a>', { 'data-toggle': 'tab', 'href': '#menu_Quests' }).text('Quests')),
				$('<li>').append($('<a>', { 'data-toggle': 'tab', 'href': '#menu_Buildings' }).text('Buildings')),
				$('<li>').append($('<a>', { 'data-toggle': 'tab', 'href': '#menu_Tools' }).text('Tools')),
				$('<li>').append($('<a>', { 'data-toggle': 'tab', 'href': '#menu_Misc' }).text('Misc')),
			]);
			// Auto Adventure Settings
			var aAdventure_SavedPool = aUtils.createSelect('aAdventure_SavedPool').append(aSettings.Adventures.templates.map(function(adv, i){
				return $('<option>', { value: i }).text(adv.label);
			}));
			var aAdventure_SpeedBuffs = aUtils.createSelect("aAdventure_SpeedBuffs").append(aData.SpeedBuffs(1));
			const BV = aUtils.getBuff("PropagationBuff_AdventureZoneTravelBoost_BlackTree");
			var aBuildings_BB_Book = aUtils.createSelect("aBuildings_BB_Book").append(["Manuscript", "Tome", "Codex"].map(function(buff){
				return $('<option>', { value: buff }).text(buff);
			}));
			var aBuildings_BB_Buff = aUtils.createSelect("aBuildings_BB_Buff").append([1,2,3,4,5,6].map(function(i){
				buff = "BookbinderBuffLvl" + i;
				var buffVO = aUtils.getBuff(buff);
				var amount = buffVO ? buffVO.amount : 0;
				return $('<option>', { value: buff, disabled: buffVO ? false:true }).text("{0}({1}): {2}".format(loca.GetText('RES', buff), amount, loca.GetText('DES', buff).split("Target")[0]));
			}));
			const specialistsMenu = container().append([
				createTableRow([[8, "Auto Adventures"], [4, $('<a>', { href: '#', text: "Create new auto template!", 'id': 'aAdventure_TemplateMaker' })]], true),
				createTableRow([[3, "Adventures: "],[5, aAdventure_SavedPool], [2, aUtils.createButton('aAdventure_AddTemplate','Add')],[2, aUtils.createButton('aAdventure_RemoveTemplate','Remove')]]),
				createTableRow([[3, "Speed Buff:"], [9, aAdventure_SpeedBuffs]]),
				createTableRow([[9, "Retrain lost units?:"], [3, createSwitch('aAdventure_RetrainUnits', aSettings.Adventures.reTrain)]]),
				createTableRow([[5, "Use Black Vortex?:"], [4, "Own: {0}".format(BV ? BV.amount : 0)], [3, createSwitch('aAdventure_BlackVortex', aSettings.Adventures.blackVortex)]]),
				$('<br>'),
				createTableRow([[9, 'Explorers'], [3, '&nbsp;']], true),
				createTableRow([
					[9, "Run on Startup"],
					[2, createSwitch('aExplorers_AutoStart', aSettings.Explorers.autoStart)],
					[1, aUtils.createSettingsImg('aExplorers_Menu')]
				]),
				createTableRow([[9, "Template: " + aUtils.createSpan('aExplorers_Template', aSettings.Explorers.template)], [3, aUtils.createButton('aExplorers_SelectTemplate', loca.GetText("LAB", "Select"))]]),
				createTableRow([[9, "Override default task with template: "], [3, createSwitch('aExplorers_UseTemplate', aSettings.Explorers.useTemplate)]]),
				createTableRow([[6, '&#10551; On: Use template'],[6, 'Off: Use default task']]),
				$('<br>'),
				createTableRow([[9, 'Geologists & Deposits'], [3, '&nbsp;']], true),
				createTableRow([
					[9, "Run on Startup"],
					[2, createSwitch('aDeposits_AutoStart', aSettings.Deposits.autoStart)],
					[1, aUtils.createSettingsImg('aDeposits_Menu')]
				]),
				$('<br>')
			]);
			var mMonitor = aUtils.createSelect("aMail_Monitor");
			for(var i = 3; i < 11; i++) { 
				mMonitor.append($('<option>', { value: i }).text("{0} Minutes".format(i))); 
			}
			const mailTradeMenu = container().append([
				createTableRow([[9, 'Mail & Trades'], [3, '&nbsp;']], true),
				createTableRow([
					[9, "Run on Startup"],
					[3, createSwitch('aMail_AutoStart', aSettings.Mail.AutoStart)],
				]),
				createTableRow([
					[9, "Check every:"],
					[3, mMonitor],
				]),
				createTableRow([
					[5, '&#10551; Accept Explorers loots'],
					[1, createSwitch("aMail_Loots", aSettings.Mail.AcceptLoots) ],
					[5, '&#10551; Accept Geologist messages'],
					[1, createSwitch("aMail_Geologist", aSettings.Mail.AcceptGeologistMsg) ],
				], false),
				createTableRow([
					[5, "&#10551; Accept Adventures loot"],
					[1, createSwitch("aMail_AdvLoots", aSettings.Mail.AcceptAdventureLoot) ],
					[5, "&#10551; Accept Adventures messages"],
					[1, createSwitch("aMail_AdvMsg", aSettings.Mail.AcceptAdventureMessage) ],
				], false),
				createTableRow([
					[5, "&#10551; Decline unacceptable trades (no resources)"],
					[1, createSwitch("aMail_Decline", aSettings.Mail.DeclineTrades) ],
					[5, "&#10551; Send resources to STAR MENU"],
					[1, createSwitch("aMail_Star", aSettings.Mail.ToStar) ],
				], false),
				createTableRow([
					[5, "&#10551; Complete Accepted & declined trades"],
					[1, createSwitch("aMail_Complete", aSettings.Mail.CompleteTrades) ],
					[5, '&#10551; Accept Gifts'],
					[1, createSwitch('aMail_Gifts', aSettings.Mail.AcceptGifts)]
				], false),
				createTableRow([
					[5, "&#10551; Trade: Filter Friends"],
					[1,  aUtils.createSettingsImg('aMail_FriendsFilter')],
					[5, "&#10551; Trade: Filter Resources"],
					[1,  aUtils.createSettingsImg('aMail_ResourcesFilter')]
				], false),
				createTableRow([
					[5, "&#10551; Save Accepted/Declined Trades"],
					[1, createSwitch("aMail_SaveTrades", aSettings.Mail.SaveFriendsTrades) ],
					[6, ''],
				], false),
				$('<label>').text('More Filters and options in future updates ^^')
			]);
			const questsMenu = container().append([
				createTableRow([[9, 'Quests Settings'], [3, '&nbsp;']], true),
				createTableRow([[9, "Run on Startup"], [3, createSwitch('aQuests_Config_AutoStart', aSettings.Quests.Config.utoStart)]]),
				createTableRow([
					[5, "&#10551; Gather Resources from STAR:"],
					[1,  createSwitch('aQuests_Config_Gather', aSettings.Quests.Config.GatherfromStar)],
					[5, "&#10551; Pay Resources & Units:"],
					[1,  createSwitch('aQuests_Config_Pay', aSettings.Quests.Config.PayResources)]
				], false),
				createTableRow([
					[5, "&#10551; Produce Buffs:"],
					[1, createSwitch('aQuests_Config_ProduceBuffs', aSettings.Quests.Config.ProduceBuffs)],
					[5, "&#10551; Apply Buffs:"],
					[1,  createSwitch('aQuests_Config_ApplyBuffs', aSettings.Quests.Config.ApplyBuffs)]
				]),

				createTableRow([
					[5, "&#10551; Sell: Resources on Trade office"],
					[1, createSwitch('aQuests_Config_Sell', aSettings.Quests.Config.SellinTO)],
					[5, "&#10551; Train Units: "],
					[1, createSwitch('aQuests_Config_TrainUnits', aSettings.Quests.Config.TrainUnits)]
				]),
				createTableRow([
					[5, '&#10551; Explorers Treasure Search:'], 
					[1, aUtils.createSettingsImg('aQuests_ExplorerTask_Treasure')],
					[5, '&#10551; Explorers Adventure Search:'],
					[1, aUtils.createSettingsImg('aQuests_ExplorerTask_Adventure')]
				]),
				createTableRow([[9, "&#10551; Geologists Task: is the same as Auto Deposits settings!"], [3, aUtils.createSettingsImg('aQuests_GeologistTask')]]),
				$('<br>'),
				createTableRow([[9, 'Quests'], [3, '&nbsp;']], true),
				createTableRow([
					[5, getImage(assets.GetResourceIcon("QuestShort").bitmapData, "23px") + 'Daily Quests'], 
					[1, createSwitch('aQuests_Daily', aSettings.Quests.Other.Daily)],
					[5, getImage(assets.GetResourceIcon("QuestMedium").bitmapData, "23px") + 'Guild Daily Quests'],
					[1, createSwitch('aQuests_DailyGuild', aSettings.Quests.Other.DailyGuild)]
				]),
				createTableRow([
					[5, getImage(assets.GetBuildingIcon("EventMonster_WeeklyChallengeShip").bitmapData, "23px") + 'Weekly Quests'], 
					[1, createSwitch('aQuests_Weekly', aSettings.Quests.Other.Weekly)],
					[5, ''],
					[1, '']
				]),
				$('<br>'),
				createTableRow([[9, 'Excelsior Letter Quests'], [3, '&nbsp;']], true),
				createTableRow([
					[5, getImage(assets.GetBuffIcon("QuestStart_SharpClaw").bitmapData, "23px") + loca.GetText('RES', "QuestStart_SharpClaw")], 
					[1, createSwitch('aQuests_Letters_SharpClaw', aSettings.Quests.Letters.SharpClaw)],
					[5, getImage(assets.GetBuffIcon("QuestStart_StrangeIdols").bitmapData, "23px") + loca.GetText('RES', "QuestStart_StrangeIdols")],
					[1, createSwitch('aQuests_Letters_StrangeIdols', aSettings.Quests.Letters.StrangeIdols)]
				]),
				createTableRow([
					[5, getImage(assets.GetBuffIcon("QuestStart_Annoholics").bitmapData, "23px") + loca.GetText('RES', "QuestStart_Annoholics")],
					[1, createSwitch('aQuests_Letters_Annoholics', aSettings.Quests.Letters.Annoholics)],
					[5, getImage(assets.GetBuffIcon("QuestStart_SilkCat").bitmapData, "23px") + loca.GetText('RES', "QuestStart_SilkCat")],
					[1, createSwitch('aQuests_Letters_SilkCat', aSettings.Quests.Letters.SilkCat)]
				]),
				createTableRow([
					[5, getImage(assets.GetBuffIcon("QuestStart_Miranda").bitmapData, "23px") + loca.GetText('RES', "QuestStart_Miranda")],
					[1, createSwitch('aQuests_Letters_Miranda', aSettings.Quests.Letters.Miranda)],
					[5, getImage(assets.GetBuffIcon("QuestStart_BartTheBarter").bitmapData, "23px") + loca.GetText('RES', "QuestStart_BartTheBarter")],
					[1, createSwitch('aQuests_Letters_BartTheBarter', aSettings.Quests.Letters.BartTheBarter)]
				]),
				createTableRow([
					[5, getImage(assets.GetBuffIcon("QuestStart_Vigilante").bitmapData, "23px") + loca.GetText('RES', "QuestStart_Vigilante")],
					[1, createSwitch('aQuests_Letters_Vigilante', aSettings.Quests.Letters.Vigilante)],
					[5, getImage(assets.GetBuffIcon("QuestStart_SettlersBandits").bitmapData, "23px") + loca.GetText('RES', "QuestStart_SettlersBandits")],
					[1, createSwitch('aQuests_Letters_SettlersBandits', aSettings.Quests.Letters.SettlersBandits)]
				]),
				createTableRow([
					[5, getImage(assets.GetBuffIcon("QuestStart_LostCompass").bitmapData, "23px") + loca.GetText('RES', "QuestStart_LostCompass")],
					[1, createSwitch('aQuests_Letters_LostCompass', aSettings.Quests.Letters.LostCompass)],
					[5, getImage(assets.GetBuffIcon("QuestStart_AThreat").bitmapData, "23px") + loca.GetText('RES', "QuestStart_AThreat")],
					[1, createSwitch('aQuests_Letters_AThreat', aSettings.Quests.Letters.AThreat)]
				]),
				$('<br>'),
				createTableRow([[9, 'Mini Quests'], [3, '&nbsp;']], true),
				createTableRow([
					[5, getImage(assets.GetBuffIcon("QuestStart_TheLittlePanda").bitmapData, "23px") + loca.GetText('RES', "QuestStart_TheLittlePanda")], 
					[1, createSwitch('aQuests_Letters_TheLittlePanda', aSettings.Quests.Mini.TheLittlePanda)],
					[5, getImage(assets.GetBuffIcon("QuestStart_MysteriousCoin").bitmapData, "23px") + loca.GetText('RES', "QuestStart_MysteriousCoin")],
					[1, createSwitch('aQuests_Letters_MysteriousCoin', aSettings.Quests.Mini.MysteriousCoin)]
				]),
				createTableRow([
					[5, getImage(assets.GetBuffIcon("QuestStart_WeddingInvitation").bitmapData, "23px") + loca.GetText('RES', "QuestStart_WeddingInvitation")], 
					[1, createSwitch('aQuests_Letters_WeddingInvitation', aSettings.Quests.Mini.WeddingInvitation)],
					[5, getImage(assets.GetBuffIcon("QuestStart_ANewStone").bitmapData, "23px") + loca.GetText('RES', "QuestStart_ANewStone")],
					[1, createSwitch('aQuests_Letters_ANewStone', aSettings.Quests.Mini.ANewStone)]
				]),
				createTableRow([
					[5, getImage(assets.GetBuffIcon("QuestStart_SaveTheDeers").bitmapData, "23px") + loca.GetText('RES', "QuestStart_SaveTheDeers")], 
					[1, createSwitch('aQuests_Letters_SaveTheDeers', aSettings.Quests.Mini.SaveTheDeers)],
					[5, getImage(assets.GetBuffIcon("QuestStart_WolfPuppy").bitmapData, "23px") + loca.GetText('LAB', "QuestStart_WolfPuppy")],
					[1, createSwitch('aQuests_Letters_WolfPuppy', aSettings.Quests.Mini.WolfPuppy)]
				]),
			]);
			//
			const buildingsMenu = container().append([
				createTableRow([[9, 'Book Binder'], [3, '&nbsp;']], true),
				createTableRow([[9, 'Run on Startup'], [3, createSwitch('aBuildings_BB_AutoStart', aSettings.Buildings.BookBinder.autoStart)]]),
				createTableRow([[4, "Which Book to produce:"], [8, aBuildings_BB_Book]]),
				createTableRow([[5, "Auto Buff BookBinder?"], [2, createSwitch('aBuildings_BB_AutoBuff', aSettings.Buildings.BookBinder.autoBuff)], [5, aBuildings_BB_Buff]]),
			]);
			const toolsMenu = container().append([
				createTableRow([[9, 'Auto Star to Store'], [3, '&nbsp;']], true),
				createTableRow([
					[9, 'Run on Startup'],
					[2, createSwitch('aStar2Store_AutoStart', aSettings.Star2Store.autoStart)],
					[1, aUtils.createSettingsImg('aStar2Store_Menu')]
				]),
				$('<br>'),
				createTableRow([[9, 'Auto Open Mystery Boxs'], [3, '&nbsp;']], true),
				createTableRow([
					[9, 'Run on Startup'], 
					[2, createSwitch('aStarBoxes_AutoStart', aSettings.StarBoxs.autoStart)],
					[1, aUtils.createSettingsImg('aStarBoxes_Menu')]
				]),
				$('<br>'),
				createTableRow([[9, 'Auto Collect'], [3, '&nbsp;']], true),
				createTableRow([
					[9, "Pickups"],
					[3, createSwitch('aCollect_Pickups', aSettings.Collect.Pickups)],
				]),
				createTableRow([[12, '&#10551; When on Adventures/Senarios it is always On']]),
				createTableRow([
					[9, "Loot/Mystery Boxes"],
					[3, createSwitch('aCollect_LootBoxes', aSettings.Collect.LootBoxes)],
				]),
				createTableRow([[12, '&#10551; From Gift Chrismtas Tree, etc']]),
				$('<br>'),
			]);
			const miscMenu = container().append([
				createTableRow([[9, 'Script'], [3, '&nbsp;']], true),
				createTableRow([
					[9, "Auto Update on start up"],
					[3, createSwitch('aScript_AutoUpdate', aSettings.Auto.AutoUpdate)],
				]),
				$('<br>'),
				createTableRow([[9, 'Tweaks'], [3, '&nbsp;']], true),
				createTableRow([
					[9, "&#10551; Chat: Reduce Message Histroy"],
					[3, createSwitch('aTweaks_ChatMax', aSettings.Tweaks.ChatMax)],
				]),
				createTableRow([
					[9, "&#10551; Trade: Increase Adventures Max to 100"],
					[3, createSwitch('aTweaks_TradeAdventureMax', aSettings.Tweaks.TradeAdventureMax)],
				]),
				createTableRow([
					[9, "&#10551; Trade: Increase Buildings Max to 100"],
					[3, createSwitch('aTweaks_TradeBuildingMax', aSettings.Tweaks.TradeBuildingMax)],
				]),
				createTableRow([
					[9, "&#10551; Trade: Increase Buffs Max to 10000"],
					[3, createSwitch('aTweaks_TradeBuffMax', aSettings.Tweaks.TradeBuffMax)],
				]),
				createTableRow([
					[9, "&#10551; Trade: Reduce Refresh Interval to 10s"],
					[3, createSwitch('aTweaks_TradeFreshInterval', aSettings.Tweaks.TradeFreshInterval)],
				]),
				createTableRow([
					[9, "&#10551; GUI: Reduce Animals to 50 (Enhance Performance)"],
					[3, createSwitch('aTweaks_GUIMaxAnimals', aSettings.Tweaks.GUIMaxAnimals)],
				]),
				createTableRow([
					[9, "&#10551; Mail: Increase Page Size to 100 (Each page have more mails)"],
					[3, createSwitch('aTweaks_MailPageSize', aSettings.Tweaks.MailPageSize)],
				]),
				$('<br>'),
				createTableRow([[9, 'Developpers'], [3, '&nbsp;']], true),
				createTableRow([[9, 'Show Grid'], [3, createSwitch('autoShowGrid', aSettings.misc.showGrid)]]),

			]);
			tabcontent.append([
				$('<div>', { 'class': 'tab-pane fade in active', 'id': 'menu_Specialists' }).append(specialistsMenu),
				$('<div>', { 'class': 'tab-pane fade', 'id': 'menu_MailTrade' }).append(mailTradeMenu),
				$('<div>', { 'class': 'tab-pane fade', 'id': 'menu_Quests' }).append(questsMenu),
				$('<div>', { 'class': 'tab-pane fade', 'id': 'menu_Buildings' }).append(buildingsMenu),
				$('<div>', { 'class': 'tab-pane fade', 'id': 'menu_Tools' }).append(toolsMenu),
				$('<div>', { 'class': 'tab-pane fade', 'id': 'menu_Misc' }).append(miscMenu)
			]);
			autoWindow.Body().html(tabs.prop("outerHTML") + '<br>' + tabcontent.prop("outerHTML"));
			autoWindow.withBody('div.row').addClass('nohide');
			autoWindow.withBody('.nav-justified > li').css("width", "20%");
			autoWindow.withBody('#aAdventure_TemplateMaker').click(aUI.advTemplateMaker);
			autoWindow.withBody('#aExplorers_Menu').click(aExplorers.Modal);
			autoWindow.withBody('#aDeposits_Menu').click(aDeposits.Modal);
			autoWindow.withBody('#aQuests_GeologistTask').click(aDeposits.Modal);
			autoWindow.withBody('#aQuests_ExplorerTask_Treasure').click(function(){ aQuests.ExplorersModal('Treasure') });
			autoWindow.withBody('#aQuests_ExplorerTask_Adventure').click(function(){ aQuests.ExplorersModal('AdventureZone') });
			autoWindow.withBody('#aStar2Store_Menu').click(aStar2Store.Modal);
			autoWindow.withBody('#aStarBoxes_Menu').click(aStarBoxs.Modal);
			autoWindow.withBody('#aMail_Monitor').val(aSettings.Mail.TimerMinutes);
			autoWindow.withBody('#aMail_FriendsFilter').click(function(){ aMail.Modal('Friends') });
			autoWindow.withBody('#aMail_ResourcesFilter').click(function(){ aMail.Modal('Resources') });
			autoWindow.withBody('#aAdventure_AddTemplate').click(function(e) { 
				aUtils.chooseFile(function(event){
					var text = prompt("Custom adventure name");
					var defaultTemp = aUtils.readFile(event.currentTarget.nativePath);
					var hashed = defaultTemp.hash;
					delete defaultTemp.hash;
					if(!defaultTemp.name || !defaultTemp.steps || hash(JSON.stringify(defaultTemp)) != hashed){
						return alert(getText("bad_template"));
					}
					if(!$.isArray(defaultTemp.steps)) return alert('Invalid Template, please make a new one ^^');

					aSettings.Adventures.templates.push({
						label: text,
						name: defaultTemp.name,
						template: event.currentTarget.nativePath
					});
					auto.SaveSettings();
					$("#aAdventure_SavedPool").empty().append(aSettings.Adventures.templates.map(function(adv, i){
						return $('<option>', { value: i }).text(adv.label);
					}));
					aUI.makeMenu();
				});
			});
			autoWindow.withBody('#aAdventure_RemoveTemplate').click(function(e) { 
				autoSettings.adv.templates.splice(parseInt($("#aAdventure_SavedPool").val()), 1);
				$("#aAdventure_SavedPool").empty().append(aSettings.Adventures.templates.map(function(adv, i){
					return $('<option>', { value: i }).text(adv.label);
				}));
			});
			autoWindow.withBody('#aExplorers_SelectTemplate').click(function(e) { 
				aUtils.chooseFile(function(event){
					$("#aExplorers_Template").html(event.currentTarget.nativePath);
					aSettings.Explorers.template = event.currentTarget.nativePath;
				});
			});
			autoWindow.Footer().prepend($("<button>").attr({'class':"btn btn-primary pull-left"}).text('Save').click(function(){
				//Script
				aSettings.Auto.AutoUpdate = $('#aScript_AutoUpdate').is(':checked');
				// Auto Adventures
				aSettings.Adventures.reTrain = $('#aAdventure_RetrainUnits').is(':checked');
				aSettings.Adventures.blackVortex = $('#aAdventure_BlackVortex').is(':checked');
				aSettings.Adventures.speedBuff = $('#aAdventure_SpeedBuffs').val();
				// Explorers
				aSettings.Explorers.autoStart = $('#aExplorers_AutoStart').is(':checked');
				aSettings.Explorers.useTemplate = $('#aExplorers_UseTemplate').is(':checked');
				aSettings.Explorers.template = $('#aExplorers_Template').text();
				// Deposits
				aSettings.Deposits.autoStart = $('#aDeposits_AutoStart').is(':checked');
				// Quests
				aSettings.Quests.Config.AutoStart = $('#aQuests_Config_AutoStart').is(':checked');
				aSettings.Quests.Config.GatherfromStar = $('#aQuests_Config_Gather').is(':checked');
				aSettings.Quests.Config.PayResources = $('#aQuests_Config_Pay').is(':checked');
				aSettings.Quests.Config.SellinTO = $('#aQuests_Config_Sell').is(':checked');
				aSettings.Quests.Config.TrainUnits = $('#aQuests_Config_TrainUnits').is(':checked');
				aSettings.Quests.Config.ProduceBuffs = $('#aQuests_Config_ProduceBuffs').is(':checked');
				aSettings.Quests.Config.ApplyBuffs = $('#aQuests_Config_ApplyBuffs').is(':checked');
				aSettings.Quests.Other.Daily = $('#aQuests_Daily').is(':checked');
				aSettings.Quests.Other.DailyGuild = $('#aQuests_DailyGuild').is(':checked');
				aSettings.Quests.Other.Weekly = $('#aQuests_Weekly').is(':checked');
				//Letter Quests
				aSettings.Quests.Letters.SharpClaw = $('#aQuests_Letters_SharpClaw').is(':checked');
				aSettings.Quests.Letters.StrangeIdols = $('#aQuests_Letters_StrangeIdols').is(':checked');
				aSettings.Quests.Letters.Annoholics = $('#aQuests_Letters_Annoholics').is(':checked');
				aSettings.Quests.Letters.SilkCat = $('#aQuests_Letters_SilkCat').is(':checked');
				aSettings.Quests.Letters.Miranda = $('#aQuests_Letters_Miranda').is(':checked');
				aSettings.Quests.Letters.BartTheBarter = $('#aQuests_Letters_BartTheBarter').is(':checked');
				aSettings.Quests.Letters.Vigilante = $('#aQuests_Letters_Vigilante').is(':checked');
				aSettings.Quests.Letters.SettlersBandits = $('#aQuests_Letters_SettlersBandits').is(':checked');
				aSettings.Quests.Letters.LostCompass = $('#aQuests_Letters_LostCompass').is(':checked');
				aSettings.Quests.Letters.AThreat = $('#aQuests_Letters_AThreat').is(':checked');
				//Mini Quests
				aSettings.Quests.Mini.TheLittlePanda = $('#aQuests_Letters_TheLittlePanda').is(':checked');
				aSettings.Quests.Mini.MysteriousCoin = $('#aQuests_Letters_MysteriousCoin').is(':checked');
				aSettings.Quests.Mini.WeddingInvitation = $('#aQuests_Letters_WeddingInvitation').is(':checked');
				aSettings.Quests.Mini.ANewStone = $('#aQuests_Letters_ANewStone').is(':checked');
				aSettings.Quests.Mini.SaveTheDeers = $('#aQuests_Letters_SaveTheDeers').is(':checked');
				aSettings.Quests.Mini.WolfPuppy = $('#aQuests_Letters_WolfPuppy').is(':checked');


				//Book binder
				aSettings.Buildings.BookBinder.autoStart = $('#aBuildings_BB_AutoStart').is(':checked');
				aSettings.Buildings.BookBinder.bookType = $('#aBuildings_BB_Book').val();
				aSettings.Buildings.BookBinder.autoBuff = $('#aBuildings_BB_AutoBuff').is(':checked');
				aSettings.Buildings.BookBinder.buffType = $('#aBuildings_BB_Buff').val();
				//Tweaks
				aSettings.Tweaks.ChatMax = $('#aTweaks_ChatMax').is(':checked');
				aSettings.Tweaks.TradeAdventureMax = $('#aTweaks_TradeAdventureMax').is(':checked');
				aSettings.Tweaks.TradeBuildingMax = $('#aTweaks_TradeBuildingMax').is(':checked');
				aSettings.Tweaks.TradeBuffMax = $('#aTweaks_TradeBuffMax').is(':checked');
				aSettings.Tweaks.TradeFreshInterval = $('#aTweaks_TradeFreshInterval').is(':checked');
				aSettings.Tweaks.GUIMaxAnimals = $('#aTweaks_GUIMaxAnimals').is(':checked');
				aSettings.Tweaks.MailPageSize = $('#aTweaks_MailPageSize').is(':checked');
				//Mail
				aSettings.Mail.AutoStart = $('#aMail_AutoStart').is(':checked');
				aSettings.Mail.AcceptAdventureLoot = $('#aMail_AdvLoots').is(':checked');
				aSettings.Mail.AcceptAdventureMessage = $('#aMail_AdvMsg').is(':checked');
				aSettings.Mail.AcceptLoots = $('#aMail_Loots').is(':checked');
				aSettings.Mail.AcceptGifts = $('#aMail_Gifts').is(':checked');
				aSettings.Mail.AcceptGeologistMsg = $('#aMail_Geologist').is(':checked');
				aSettings.Mail.DeclineTrades = $('#aMail_Decline').is(':checked');
				aSettings.Mail.CompleteTrades = $('#aMail_Complete').is(':checked');
				aSettings.Mail.ToStar = $('#aMail_Star').is(':checked');
				aSettings.Mail.TimerMinutes = parseInt($('#aMail_Monitor').val());
				aSettings.Mail.SaveFriendsTrades = $('#aMail_SaveTrades').is(':checked');
				//Misc
				aSettings.Collect.Pickups = $('#aCollect_Pickups').is(':checked');
				aSettings.Collect.LootBoxes = $('#aCollect_LootBoxes').is(':checked');
				aSettings.Star2Store.autoStart = $('#aStar2Store_AutoStart').is(':checked');
				auto.isOn.Star2Store = aSettings.Star2Store.autoStart;
				aSettings.StarBoxs.autoStart = $('#aStarBoxes_AutoStart').is(':checked');
				auto.isOn.StarBoxs = aSettings.StarBoxs.autoStart;
				aSettings.misc.showGrid = $('#autoShowGrid').is(':checked');
				auto.SaveSettings(1);
				aTweaks.Apply();
				autoWindow.hide();
			}));
			autoWindow.show();
			$('#aAdventure_SpeedBuffs').val(aSettings.Adventures.speedBuff);
			$('#aBuildings_BB_Book').val(aSettings.Buildings.BookBinder.bookType);
			$('#aBuildings_BB_Buff').val(aSettings.Buildings.BookBinder.buffType );
			$('#aMail_Monitor').val(aSettings.Mail.TimerMinutes);
		} catch (e){ debug(e) }
	},
	advTemplateMaker: function (){
		try{
			var aTemplate = [];
				
			var aTemplate_Save = function(){
				var defaultTemp = {
					name: $('#aTemplate_AdventureMap').val(),
					steps: [
						{ name: 'InHomeLoadGenerals', data: $('#aTemplate_HomeTemplate').text() },
						{ name: 'StartAdventure' },
						{ name: 'SendGeneralsToAdventure' },
					]
				};
				aTemplate.push(["LoadGeneralsToEnd"]);
				aTemplate.forEach(function(item){
					var trueData = ["AdventureTemplate", "ProduceItem", "ApplyBuff"];
					if(trueData.indexOf(item[0]) != -1)
						defaultTemp.steps.push({ name: item[0], data: item[1] });
					else
						defaultTemp.steps.push({ name: item[0] });
				});
				
				aUtils.saveTemplate(defaultTemp);
				autoWindow.shide();
			}
			autoWindow.settings(aTemplate_Save);
			var aTemplate_UpdateView = function(){
				autoWindow.withsBody('#aTemplate_Steps').empty();
				var out = [];
				
				aTemplate.forEach(function(i, idx) {
					switch(i[0]){
						case 'AdventureTemplate':
							var typename = i[1].split("\\").pop();
							out.push(createTableRow([
								[3, '&#8597;&nbsp;&nbsp;' + 'Adventure'],
								[7, 'Excute: ' + typename],
								[2, $('<button>', { 'type': 'button', 'class': 'close', 'value': idx }).html($('<span>').html('&times;'))],
							], false));
							break;
						case 'ProduceItem':
						case 'ApplyBuff':
							var amount = aData.adventureItems[$("#aTemplate_AdventureMap").val()][i[1]];
								amount = $.isArray(amount[0]) ? amount[1] : amount.length;
							out.push(createTableRow([
								[3, '&#8597;&nbsp;&nbsp;' + 'Bot'],
								[7, '{0}: {1}{2} x{3}'.format(i[0]=="ApplyBuff" ? "Apply" : "Produce", getImage(assets.GetBuffIcon(i[1]).bitmapData, "23px"), loca.GetText('RES', i[1]), amount )],
								[2, $('<button>', { 'type': 'button', 'class': 'close', 'value': idx, 'disabled': 'disabled' }).html($('<span>').html('&times;'))],
							], false));
							break;
						default:
							out.push(createTableRow([
								[3, '&#8597;&nbsp;&nbsp;' + 'Bot'],
								[7, i[1]],
								[2,  $('<button>', { 'type': 'button', 'class': 'close', 'value': idx }).html($('<span>').html('&times;'))],
							], false));
					}
					
				});
				autoWindow.withsBody('#aTemplate_Steps').append($('<div>', { 'class': "container-fluid", 'style': "user-select: none;cursor:move;" }).append(out));
				autoWindow.withsBody('.close').click(function(e){
					aTemplate.splice(parseInt($(this).val()), 1);
					aTemplate_UpdateView();
				});
				autoWindow.withsBody('#aTemplate_Steps .container-fluid').sortable({
					update: function( event, ui ) {
						var prevIndex = $(ui.item).find('.close').val();
						shortcutsMoveElement(aTemplate, prevIndex, ui.item.index());
						aTemplate_UpdateView();
					} 
				});
			}
			var aTemplate_Update = function(){
				aTemplate = [];
				aTemplate.push(["VisitAdventure", "Load Adventure Island!"]);
				aTemplate.push(["StarGenerals", "Star Generals after they arrive!"]);
				aTemplate.push(["UseSpeedBuff", "Use Speed Buff!"]);
				$.each(aData.adventureItems[$("#aTemplate_AdventureMap").val()], function(k, v){
					aTemplate.push(["CollectPickups", "Collect Pickups"]);
					aTemplate.push(["ReturnHome", "Return Home"]);
					aTemplate.push(["ProduceItem", k]);
					aTemplate.push(["VisitAdventure", "Visit Adventure Island"]);
					aTemplate.push(["ApplyBuff", k]);
				});
				aTemplate_UpdateView();
			}
			autoWindow.sDialog().css("height", "80%");
			autoWindow.sTitle().html("{0} {1}".format(
				getImageTag('icon_general.png'),
				"Auto Adventure Template maker")
			);
			var aTemplate_AdventureMap = aUtils.createSelect('aTemplate_AdventureMap');
			$.each(aData.Adventures(), function(key, value){
				if(['Scenario', 'Coop'].indexOf(key) != -1) return;
				var optGroup = $('<optgroup>', { label: key });
				$.each(value, function(i, adv){
					optGroup.append($('<option>', { value: adv }).text(loca.GetText('ADN', adv)));
				});
				aTemplate_AdventureMap.append(optGroup);
			});
			
	
			autoWindow.sData().append($('<div>', { 'class': 'container-fluid', 'style' : 'height:auto;' }).append([
				createTableRow([[12, "Template Options"]], true),
				createTableRow([[4, "Adventure:"], [8, aTemplate_AdventureMap]]),
				createTableRow([[9, "Home load template: " + aUtils.createSpan('aTemplate_HomeTemplate')],[3, aUtils.createButton("aTemplate_HomeTemplateSelect", "Select")]]),
				createTableRow([[12, "+ Template that load generals to send"]]),
				$('<br>'),
				createTableRow([[12, "Notes:"]], true),
				createTableRow([[12, "*Tool Autimatcally (load units, finish quests, end adventure) after finishing the list!"]]),
				$('<br>'),
				createTableRow([[3, loca.GetText("LAB", "Type")],[5, getText('shortcutsFilename')],[4, '']], true)
			]));
			
			var aTemplate_Commands = $('<div>', { 'class': 'btn-group dropup aTemplate_Commands' }).append([
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
	
			autoWindow.withsBody('#aTemplate_HomeTemplateSelect').click(function(e) { 
				aUtils.chooseFile(function(event){
					$('#aTemplate_HomeTemplate').html(event.currentTarget.nativePath);
				});
			});
	
			autoWindow.sFooter().prepend(aTemplate_Commands);
			autoWindow.sFooter().append([
				$('<button>').attr({ "id": "aTemplate_Load", "class": "btn btn-primary pull-left" }).text(getText('load_template'))
			]);
			autoWindow.sFooter().find('.dropdown-menu a').click(function() {
				switch(this.name){
					case 'AdventureTemplate':
						var txtFilter = new air.FileFilter("Template", "*.*");
						var root = new air.File();
						root.browseForOpenMultiple("Open", new window.runtime.Array(txtFilter)); 
						root.addEventListener(window.runtime.flash.events.FileListEvent.SELECT_MULTIPLE, function(event) {
							event.files.forEach(function(item) {
								aTemplate.push(["AdventureTemplate", item.nativePath]);
							});
							aTemplate_UpdateView();
						});
						break;
					default:
						aTemplate.push([this.name, $(this).text()]);
				}
				aTemplate_UpdateView();
			});
			autoWindow.withsBody('#aTemplate_HomeTemplateSelect').click(function(e) { 
				aUtils.chooseFile(function(event){
					$('#aTemplate_HomeTemplate').html(event.currentTarget.nativePath);
				});
			});
			autoWindow.withsBody('#aTemplate_AdventureMap').change(function(e) { 
				try {
					$('#aTemplate_HomeTemplate').empty();
					aTemplate_Update();
				}catch(e){ debug(e) }
			});
			$('#aTemplate_Load').click(function(e) { 
				aUtils.chooseFile(function(event){
					try{
						var Template = aUtils.readFile(event.currentTarget.nativePath);
						var Hash = Template.hash;
						delete Template.hash;
						if(!Template.name || !Template.steps || hash(JSON.stringify(Template)) != Hash){
							return alert(getText("bad_template"));
						}
						aTemplate = [];
						if(!$.isArray(Template.steps)) return alert('Invalid Template, please make a new one ^^');
						$('#aTemplate_AdventureMap').val(Template.name);
						$('#aTemplate_HomeTemplate').html(Template.steps[0].data);
						var Steps = Template.steps.slice(3);
						Steps.pop();
						Steps.forEach(function(step){
							switch(step.name){
								case 'AdventureTemplate':
								case 'ProduceItem':
								case 'ApplyBuff':
									aTemplate.push([step.name, step.data]);
									break;
								default:
									aTemplate.push([step.name, step.name.replace(/([A-Z])/g, ' $1').trim()])
							}
						});
						//aTemplate = Template.steps.slice(3);
						aTemplate_UpdateView();
					} catch(e) { debug(e) }
				});
			});
			autoWindow.sData().append($('<div>', { 'id': 'aTemplate_Steps' }));
			autoWindow.sshow();
			aTemplate_Update();
		} catch(e){}
		
	},
	SelectedAdventureHandler: function(event){
		try{
			aAdventure.data.repeatCount = 0;
			aAdventure.reset();
			var adventure = null;
			var data = event.target.name;
			if(data.indexOf('Senario') > -1)
				adventure = aData.savedSenarios[data];
			else {
				data = aSettings.Adventures.templates[parseInt(data.split("_")[1])].template;
				adventure = aUtils.readFile(data);
			}
			const mapCount = aUtils.getBuff(adventure.name) ? aUtils.getBuff(adventure.name).amount : 0;
			if(mapCount < 1)
				return aUI.alert("You don't have any adventure maps for this adventure!!!", "ERROR");

			var repeat = confirm("Repeat the adventure as many as you have? x{0}".format(mapCount));
			aAdventure.data.repeatCount = mapCount;
			if(!repeat){
				var userCount = parseInt(prompt("Repeat count !? default: 1"));
				aAdventure.data.repeatCount = isNaN(userCount) ? 1 : userCount;
			}
			aAdventure.data.fileName = data;
			$.extend(aAdventure.data, adventure);
			$.each(aAdventure.data.steps, function(i, step){
				if(step.name == "AdventureTemplate"){
					var data = aUtils.readFile(step.data);
					aAdventure.data.steps[i]['loaded'] = aUtils.readFile(step.data);
					$.each(data, function(key, value){
						if(aAdventure.data.enemies.indexOf(value.target) == -1 && value.target)
							aAdventure.data.enemies.push(value.target);
					});
				}else if(step.name == 'InHomeLoadGenerals'){
					var data = aUtils.readFile(step.data);
					aAdventure.data.steps[i]['loaded'] = data;
					aAdventure.data.generals = Object.keys(data);
					$.each(data, function(key, value){
						$.each(value.army, function(unit, count){
							aAdventure.data.army[unit] = (aAdventure.data.army[unit] || 0) + count;
						});
					});
				}
			});
			aUI.alert(loca.GetText('ADN', adventure.name) + " is selected", adventure.name);

			auto.isOn.Adventure = true;
			aAdventure.ModalLoadInfo();
			aUI.MenuAdventure = event.target.name;
			aUI.makeMenu();
		}catch(e){ debug(e) }
	},
	alert: function(message, icon)
	{
		try
		{
			icon = icon ? icon : '1-Up.png';
			if(typeof icon == 'string'){
				const icons = {
					'ERROR': 'Boss.png',
					'MEMORY': 'eventmarketbuff2_rabbid.png',
					'RESOURCE': 'buff_bridge_repair_kit.png',
					'EXPLORER': 'icon_explorer.png',
					'GEOLOGIST': 'icon_geologist.png',
					'QUEST': 'advanced_strategies_zone_buff_icon.png',
					'MISSION': 'icon_crisis_quest.png',
					'MAIL_TRADE': 'icon_task_building.png',
					'MAIL_LOOT': 'icon_streetwise_negotiator.png',
					'ARMY': 'buff_hire_swordsmen.png',
					'COMBAT': 'CombatGeneral.png',
					'UNLOAD_UNIT': 'remove_general_skin.png',
				}
				icon = icons[icon] || icon;
				icon = icon.indexOf(".png") != -1 ? assets.GetBitmap(icon) : assets.GetBuffIcon(icon);
			}
			
			var t = game.def("GUI.Components.ItemRenderer::AvatarMessageItemRenderer",!0);
			globalFlash.gui.mAvatarMessageList.mClientMessages.addChild(t);
			t.headlineLabel.text = "Auto Copilot";
			t.messageBody.text = message;
			t.image.source = icon;
		} catch (e){}
	}
}
//-------------- Auto Explorers --------------
const aExplorers = {
	exec: function(){
		if(!game.gi.isOnHomzone() || !auto.isOn.Explorers) return;
		try{
			const explorers = game.getSpecialists().filter(function(e){
                return e && e.GetTask() == null && e.GetBaseType() == 1
            });

            if(explorers.length == 0) return;
			const settings = aSettings.Explorers;

            explorers.forEach(function(expl){
				var task = mainSettings.explDefTaskByType[expl.GetType()] || "1,0";
				if(settings.useTemplate && settings.template != ""){
					var taskTemplate = aUtils.readFile(settings.template);
					var ttExplID = expl.GetUniqueID().toKeyString().replace(".","_");
					task = taskTemplate[ttExplID] || task;
				}
				task = task.split(",");
				auto.timedQueue.add(function(){ 
					try{
						aUtils.sendSpecPacket(expl.GetUniqueID(), task[0], task[1]);
					}catch(e){}
				});
			});
            aUI.alert("Sending: {0} Explorers".format(explorers.length), 'EXPLORER');
        }catch(e){ debug('There has been an error while sending explorers'); }
	},
	Modal: function(){
		var save = function(){
			var result = {};
			autoWindow.sData().find("div[class*='specdef_']").each(function(i, item) {
				var type = $(item).attr('class').split(' ').pop();
				var value = $(item).children('select').val();
				if(value != 0 && value != mainSettings.explDefTask) {
					result[type.split("_").pop()] = value;
				}
			});
			mainSettings.explDefTaskByType = result;
			settings.settings["global"] = {};
			settings.store(mainSettings);
			autoWindow.shide();
		}
		autoWindow.settings(save, '');
		autoWindow.sTitle().html("{0} {1}".format(
			getImageTag('icon_explorer.png'),
			"Explorers Default Task")
		);
		autoWindow.sDialog().css("height", "80%");
		specType = 1;
		var html = '<div class="container-fluid" style="user-select: all;">';
		html += utils.createTableRow([
			[10, getText('expldeftask_desc')],
			[2, $('<a>', { href: '#', text: getText('btn_reset'), 'class': 'settingsreset' })]
		], true);
		html += utils.createTableRow([[6, loca.GetText("LAB", "Name")], [6, loca.GetText("LAB", "AvatarCurrentSelection")]], true);
		$.each(specGetTypesForType(), function(type, name) {
			html += utils.createTableRow([
				[6, getImageTag("icon_" + armySPECIALIST_TYPE.toString(type).toLowerCase() + ".png", '8%')  + loca.GetText("SPE", name)], 
				[6, createExplorerDropdown(0, 0, 0, true), 'specdef_'+type]
			]);
		});
		autoWindow.sData().html(html + '<div>');
		autoWindow.sData().find('select').each(function(i, item) { 
			$(item).find('option:first').text("{0} -> {1}".format(loca.GetText("ACL", "BuffAdventuresGeneral"), loca.GetText("LAB", "ToggleOptionsPanel")));
		});
		autoWindow.sData().find('.settingsreset').click(function(){
			autoWindow.sData().find('select').val(0);
		});
		$.each(mainSettings.geoDefTaskByType, function(type, value) { autoWindow.sData().find('.specdef_'+type).children('select').val(value); });
		$.each(mainSettings.explDefTaskByType, function(type, value) { autoWindow.sData().find('.specdef_'+type).children('select').val(value); });
		autoWindow.sFooter().find('.pull-left').removeClass('pull-left');
		autoWindow.sFooter().prepend([
			$('<button>').attr({ "class": "btn btn-primary pull-left specSettingsSaveTemplate" }).text(getText('save_template')),
			$('<button>').attr({ "class": "btn btn-primary pull-left specSettingsLoadTemplate" }).text(getText('load_template')).click(function() { specSettingsTemplates.load(); })
		]);
		autoWindow.sFooter().find('.specSettingsSaveTemplate').click(function(){
			var dataToSave = { type: 'specsettings', data: {}};
			autoWindow.sData().find('select').map(function() { 
				var id = $(this).closest('div').attr('class').split(' ').pop().split("_").pop();
				dataToSave['data'][id] = $(this).val();
			});
			specSettingsTemplates.save(dataToSave);
		});
		autoWindow.sshow();
	}
}
//-------------- Auto Deposits --------------
const aDeposits = {
	dRemoved: false,
	dTypes: ["Stone", "BronzeOre", "Marble", "IronOre", "Coal", "GoldOre", "Granite", "TitaniumOre", "Salpeter"],
	Modal: function(){
		try{
			if(!game.gi.isOnHomzone()){ return showGameAlert(getText('not_home')); }
			var saveTemp = function(){
				//options [findDepo, buildMine, upgradeMine, MineLevel, buffMine]
				aDeposits.dTypes.forEach(function(type){ aSettings.Deposits.data[type].geos = []; });
				$('.depoOption').each(function(i, checkBox){
					var op = $(this).attr("id").split("_");
					if($(this).is(":disabled")) return;
					if(op[0] == "depo"){
						var val = isNaN(parseInt($(this).val())) ? $(this).val() : parseInt($(this).val());
						aSettings.Deposits.data[op[1]].options[op[2]] = $(this).attr("type") == "checkbox" ? $(this).is(":checked") : val;
					}else if(op[0] == "geo"){
						if($(this).is(":checked"))
							aSettings.Deposits.data[op[1]].geos.push(parseInt(op[2]));
					}
				});
				auto.SaveSettings();
				autoWindow.shide();
			}
			autoWindow.settings(saveTemp);

			var createCheck = function(id){
				return $('<input>', { 'type': 'checkbox', 'class': 'depoOption', 'id' : id, 'style': 'display: block;margin: 4px auto;' });
			}
			var createLvlSelect = function(id){
				var select = aUtils.createSelect(id).addClass("depoOption");
				for(var i = 0; i < 8; i++){
					select.append($('<option>', { value: i}).text(i));
				}
				return select;
			}
			var createBuffSelect = function(id){
				var select = aUtils.createSelect(id).addClass("depoOption");
				aUtils.getWYBuffs().forEach(function(buff){
					if(!buff) return;
					select.append(
						$('<option>', { value: buff.GetType()})
						.text("{0}({1})".format(buff.getName(), buff.amount))
						);
				});
				return select.html(select.find('option').sort(function (a, b) {
					return $(a).text() < $(b).text() ? -1 : 1;
				}));
			}
			var table = [];
			var types = aDeposits.dTypes;
			table.push(createTableRow([ [3, 'Settings'] ].concat(types.map(function(r){ return  [1, getImageTag(r, '23px', '23px')]})), true));
			table.push(createTableRow([ [3, "Find Deposit:"] ].concat(types.map(function(r){ return [1, createCheck("depo_{0}_0".format(r))]}))));
			table.push(createTableRow([ [3, "Build Mine:"] ].concat(types.map(function(r){ return [1, createCheck("depo_{0}_1".format(r))]}))));
			table.push(createTableRow([ [3, "Upgrade Mine:"] ].concat(types.map(function(r){ return [1, createCheck("depo_{0}_2".format(r))]}))));
			table.push(createTableRow([ [3, "Mine Level:"] ].concat(types.map(function(r){ return [1, createLvlSelect("depo_{0}_3".format(r))]}))));
			table.push(createTableRow([ [3, "Buff Mine/Mason:"] ].concat(types.map(function(r){ return [1, createCheck("depo_{0}_4".format(r))]}))));
			table.push(createTableRow([ [3, "Buff Type:"] ].concat(types.map(function(r){ return [1, createBuffSelect("depo_{0}_5".format(r))]}))));
			table.push($('<br>'));
			table.push(createTableRow([
				[9, 'Which geologists search for the deposit?'],
				[2, $('<a>', { href: '#', text: 'Recommendation', 'id': 'aDeposits_Recommend' })],
				[1, $('<a>', { href: '#', text: 'Reset', 'id': 'aDeposits_Reset' })] 
			], true));
			var geos = [];
			game.getSpecialists().sort(specNameSorter).forEach(function(geo){
				try{
					if(!geo || geo.GetBaseType() != 2 || geos.indexOf(geo.GetType()) != -1) return;
					var text = $('<span>').attr({'title': "Testing tooltip"}).append([
						$(getImageTag(geo.getIconID(), '26px', '26px')), 
						loca.GetText("SPE", geo.GetSpecialistDescription().getName_string())
					]);
					table.push(createTableRow([[3, text] ].concat(types.map(function(r){ return [1, createCheck("geo_{0}_{1}".format(r, geo.GetType())), 'text-center']}))));
					geos.push(geo.GetType());
				} catch (e) {}
			});
			autoWindow.sDialog().css("height", "80%").addClass("modal-lg");
			autoWindow.sTitle().html("{0} {1}".format(
				utils.getImageTag('icon_geologist.png', '45px'),
				"Advanced Deposits Options")
			);
			autoWindow.sData().append($('<div>', { 'class': 'container-fluid', 'style' : 'height:auto;' }).append(table));
			autoWindow.sData().find(".tblHeader img").css({ "display": "block", "margin": "0 auto" });
			autoWindow.sData().find('a').tooltip();
			autoWindow.withsBody('#aDeposits_Recommend').click(function(e){
				const data = { 
					Stone: [35, 62, 38, 49],
					BronzeOre: [62, 38, 49],
					Marble: [35, 62, 59, 38, 49],
					IronOre: [40, 62, 59, 38, 49],
					GoldOre: [42, 45, 62, 59, 38, 49],
					Coal: [45, 62, 59, 38, 49],
					Granite: [35, 45, 62, 59, 38, 49],
					TitaniumOre: [45, 40, 62, 59, 38, 49],
					Salpeter: [45, 40, 62, 59, 38, 49]
				};
				$.each(data, function(key, value){
					value.forEach(function(v){
						autoWindow.sData().find("#geo_{0}_{1}".format(key, v)).prop("checked", true);
					});
				});
			});
			autoWindow.withsBody('#aDeposits_Reset').click(function(e){
				$('.depoOption').each(function(i, checkBox){
					var op = $(this).attr("id").split("_");
					if(op[0] == "geo"){
						$(this).prop("checked", false);
					}
				});
			});
			// Load Saved Settings
			Object.keys(aSettings.Deposits.data).forEach(function(deposit){
				$.each(aSettings.Deposits.data[deposit].options, function(i, v){
					var id = "#depo_{0}_{1}".format(deposit, i);
					if(typeof v == "boolean")
						$(id).prop("checked", v);
					else if(typeof v == "number" || typeof v == "string")
						$(id).val(v);
					else if(v == null && i < 5)
						$(id).prop('disabled', true); 
					
				});
				$.each(aSettings.Deposits.data[deposit].geos, function(i, v){
					var id = "#geo_{0}_{1}".format(deposit, v);
					$(id).prop("checked", true);
				});
			});
			autoWindow.sshow();
		} catch(e){ debug(e) }
	},
	exec: function(){
		if(!game.gi.isOnHomzone() || !auto.isOn.Deposits) return; 
		try{
            // Remove all depleted mines
            /*var depletedDeposits = 0;
            game.getBuildings().forEach(function(building){
				if(building && building.GetBuildingName_string().indexOf("Depleted") != -1){
					auto.timedQueue.add(function(){
						try{
							game.zone.SendDestructBuildingCommand(building, "minimalInfoPanel"); 
						}catch(e){}
					});
					depletedDeposits++;
				}
            });

            if (depletedDeposits > 0 && !aDeposits.dRemoved)
				return aDeposits.dRemoved = true, aUI.alert("Removing all depleted deposits", 'GEOLOGIST');
			if(aDeposits.dRemoved)
				return aDeposits.dRemoved = false, auto.timedQueue.add(function(){ 
					game.gi.mClientMessages.SendMessagetoServer(1037, game.gi.mCurrentViewedZoneID, null);
				});
			*/
            var buildingSlots = game.gi.mCurrentPlayer.mBuildQueue.GetTotalAvailableSlots() - game.gi.mCurrentPlayer.mBuildQueue.GetQueue_vector().length;
			var buildingLisences = game.gi.mCurrentPlayer.GetMaxBuildingCount() - game.gi.mCurrentPlayer.mCurrentBuildingsCountAll;

			$.each(Object.keys(aSettings.Deposits.data), function(i, deposit){
				const depoData = aSettings.Deposits.data[deposit];
                var existingDeposits = game.zone.mStreetDataMap.getDeposits_vectorByType(deposit);
                var remainingSlots = depoData.max - existingDeposits.length
				//subtract the active specialists
				game.getSpecialists().sort(specNameSorter).forEach(function(specialist){
					if(!specialist || specialist.GetBaseType() != 2 || !specialist.IsInUse()) return;
					if(specialist.GetTask().GetSubType() == i) remainingSlots--;
				});
                //if there is deposits to find
                if(remainingSlots > 0){
                    game.getSpecialists().sort(specNameSorter).forEach(function(specialist){
						if(!specialist || specialist.GetBaseType() != 2 || specialist.IsInUse()) return;
                        if(depoData.geos.indexOf(specialist.GetType()) != -1 &&
                        remainingSlots > 0 &&
						depoData.options[0] //find deposit
                        ){
							var id = specialist.GetUniqueID();
                            auto.timedQueue.add(function(){ 
								try {
									aUtils.sendSpecPacket(id, 0, i);
								} catch (e) {}
							});
                            remainingSlots--;
                        }
                    });
                }
                // if can build a mine
                if(depoData.mine){
                    $.each(existingDeposits, function(ind, depo){
						if(depo == null) return;
						var depoMine = game.zone.GetBuildingFromGridPosition(depo.GetGrid());
						if(depoMine == null){
							var mineName = deposit.indexOf("Ore") == -1 ? deposit + "Mine" : deposit.replace("Ore", "Mine");
							var canAfford = game.zone.GetResources(game.player).CanPlayerAffordBuilding(mineName);
							if(buildingSlots > 0 && buildingLisences > 0 && canAfford && depoData.options[1]){
								auto.timedQueue.add(function(){
									try{
										aUI.alert("Building Mine on {0}".format(loca.GetText("RES", depo.GetName_string())));
										game.gi.SendServerAction(50, depoData.mine, depo.GetGrid(), 0, null);
									
									} catch(e){}
									});
								buildingLisences--;
								buildingSlots--;
							}
						} else if(depoMine.GetUpgradeLevel() < depoData.options[3] && 
								depoMine.IsUpgradeAllowed(true) &&
								depoData.options[2]){
							auto.timedQueue.add(function(){
								try{
									aUI.alert("Upgrading {0} To Level {1}".format(loca.GetText("BUI", depoMine.GetBuildingName_string()), depoMine.GetUpgradeLevel() + 1), depoMine.GetBuildingName_string());
									game.zone.UpgradeBuildingOnGridPosition(depoMine.GetGrid());
								}catch(e){}
							});
						} else if(depoMine.productionBuff == null && depoData.options[4]){
							var grid = depoMine.GetGrid();
							auto.timedQueue.add(function(){ 
								try{
									aUtils.applyBuff(aUtils.getBuff(depoData.options[5]), grid); 
								}catch(e){}
							});
						}
                    });
                } else if (depoData.options[4]) {
					var mName = deposit == "Stone" ? "Mason" : deposit + "Mason";
					game.zone.mStreetDataMap.getBuildingsByName_vector(mName).forEach(function(mason){
						if(mason.productionBuff == null){
							auto.timedQueue.add(function(){ 
								try{
									aUtils.applyBuff(aUtils.getBuff(depoData.options[5]), mason.GetGrid()); 
								}catch(e){}
							});
						}
					});
				}
            });
        } catch(er) { debug(er); }
    }
}
//-------------- Auto Quests --------------
const aQuests = {
	TOTrades: {},
	IsQuestReadyForSubmit: function(Quest){
		return game.def('converted.bluebyte.tso.quests.logic.QuestManagerStatic').IsQuestReadyForSubmit(Quest, true);
	},
	StartQuest: function(BName, QName){
		if(aUtils.getBuff(BName)){
			aUI.alert('Starting ' + loca.GetText('QUL', QName), BName);
			auto.timedQueue.add(function(){
				try {
					aUtils.applyBuff(aUtils.getBuff(BName), 8825);
				} catch (e) {}
			});
		}
	},
	DoQuests: function(Regex){
		const Quests = game.quests.GetQuestPool().GetQuest_vector().toArray().filter(function(q){
			return q && Regex.test(q.getQuestName_string());
		}); 
		$.each(Quests, function(i, Quest){
			aQuests.DoQuest(Quest.getQuestName_string());
		});
	},
	DoQuest: function(QName){
		try{
			const Quest = game.quests.getQuest(QName);
			if(!Quest) return;
			if(!Quest.IsRunning() && !Quest.isFinished()) return;
			if(Quest.isFinished()){
				$.each(Object.keys(aQuests.TOTrades), function(i, key){
					if(key.indexOf(Quest.getQuestName_string()) != -1)
						delete aQuests.TOTrades[key];
				});
				return game.quests.RewardOkButtonPressedFromGui(Quest);
			}
			if(aQuests.IsQuestReadyForSubmit(Quest))
				return game.quests.InitiatePayForQuestFinish(Quest.GetUniqueId());

			$.each(Quest.mQuestDefinition.questTriggers_vector.toArray(), function(t, trigger){
				const idx = trigger.triggerIdx;
				if(Quest.mQuestTriggersFinished_vector[idx].status) return;
				const rName = trigger.name_string,
					rAmount = trigger.amount,
					rDelta = Quest.mQuestTriggersFinished_vector[idx].deltaStart;
				const fAmount = rAmount - rDelta;
				switch(trigger.type){
					// TYPE_RESOURCE
					case 2:
						//Gather
						if(trigger.condition == 14){
							//if use res from star
							const buffVO = aUtils.getBuff(rName, 'AddResource');
							if(buffVO && buffVO.amount > fAmount && aSettings.Quests.Config.GatherfromStar){
								auto.timedQueue.add(function(){
									aUtils.applyBuff(buffVO, 8825, fAmount);
								});
							}else{
								aQuests.ResourceEconomy(rName, rAmount, rDelta);
							}
						}
						//Produce
						else if(trigger.condition == 15){
							aQuests.ResourceEconomy(rName, rAmount, rDelta);
						}
						//Buy
						else if(trigger.condition == 17){
							const total = game.quests.GetTotalValuesForQuestTrigger(game.player, Quest, idx);
							aUI.alert(game.quests.GetTriggerText(trigger, total), assets.GetQuestTriggerIcon(trigger));
						}
						//Sell
						else if(trigger.condition == 18){
							if(!aSettings.Quests.Config.SellinTO)
								return aUI.alert("Please sell {0} x{1} to a friend".format(loca.GetText('RES', rName), fAmount), rName);
							const tradeName = Quest.getQuestName_string() + "#" + idx;
							if(aQuests.TOTrades[tradeName]) return;
							if(!aUtils.EnoughResource(rName, fAmount, true)){
								const buffVO = aUtils.getBuff(rName, 'AddResource');
								if(buffVO && buffVO.amount > fAmount && aSettings.Quests.Config.GatherfromStar)
									auto.timedQueue.add(function(){
										aUtils.applyBuff(buffVO, 8825, fAmount);
									});
								return;
							}
							aQuests.TOTrades[tradeName] = { Send: [rName, fAmount], Live: false}
						}
						break;
					// TYPE_MILITARYUNIT
					case 7:
						const fUnit = aUtils.GetFreeArmy()[rName] || 0;
						const aUnit = aUtils.assignedArmy()[rName] || 0;
						if((fUnit + aUnit) < fAmount && aSettings.Quests.Config.TrainUnits)
							auto.timedQueue.add(function(){
								aUtils.TrainUnit(rName, fAmount);
							});
						else
							aUI.alert('Please Train {0} x{1}'.format(loca.GetText('RES', rName), fAmount));
						break;
					// TYPE_BUFF_ON_FRIEND
					case 16:
						const buffVO = aUtils.getBuff(rName);
						if(buffVO && buffVO.amount > fAmount){
							var friendList = globalFlash.gui.mFriendsList.GetFilteredFriends("", true).slice(-15);
							if(!friendList.length) return aUI.alert('Come on! Get Some friends!!');
							var friend = friendList[Math.floor(Math.random() * friendList.length)];
							auto.timedQueue.add(function(){ game.gi.visitZone(friend.id); });
							auto.timedQueue.add(function(){
								const buff = aUtils.getBuff(rName);
								aUI.alert('You are on {0} island'.format(friend.username));
								const workyards = game.getBuildings().filter(function(b){return b.ui == 'workyard' && !b.productionBuff }).slice(0, fAmount);
								$.each(workyards, function(i, wy){
									aUtils.applyBuff(buff, wy.GetGrid()); 
								});
							}, 25000);
							auto.timedQueue.add(function(){
								game.gi.visitZone(game.gi.mCurrentPlayer.GetHomeZoneId());
							}, 25000);
							auto.timedQueue.add(function(){ aUI.alert("Back at Home Island"); }, 25000);
						}else{
							auto.timedQueue.add(function(){
								aUtils.ProduceInPH(rName, fAmount);
							});
						}
						break;
					// TYPE_PAY_FOR_QUEST_FINISH
					case 18:
						if(aData.Units(rName)){
							const fUnit = aUtils.GetFreeArmy()[rName] || 0;
							const aUnit = aUtils.assignedArmy()[rName] || 0;
							if(fUnit >= fAmount)
								return;
							else if((fUnit + aUnit) > fAmount)
								shortcutsFreeAllUnits();
							else if(aSettings.Quests.Config.TrainUnits)
								if(!aQuests.InQuestTriggers(Quest, 'itemproducedlist', rName, fAmount))
									auto.timedQueue.add(function(){ aUtils.TrainUnit(rName, fAmount); });
							else
								aUI.alert('Please Train x{1} {0}'.format(loca.GetText('RES', rName), fAmount));
						} else {
							//Resource
							if(aUtils.EnoughResource(rName, fAmount)) return;
							const buffVO = aUtils.getBuff(rName, 'AddResource');
							if(buffVO && buffVO.amount > fAmount && aSettings.Quests.Config.GatherfromStar)
								auto.timedQueue.add(function(){
									aUtils.applyBuff(buffVO, 8825, fAmount);
								});
							else
								aQuests.ResourceEconomy(rName, rAmount, game.getResources().GetPlayerResource(rName).amount);
						}
						break;
					// TYPE_NEW_QUEST_TRIGGER
					case 45:
						const NTQuest = Quest.mQuestDefinition.endConditions_vector.toArray().filter(function(ec){
							return ec.triggerIdx == idx;
						})[0] || null;
						if(!NTQuest) return;
						const args = [Quest.mQuestTriggersFinished_vector[NTQuest.triggerIdx].deltaStart];
						if(NTQuest.action_string == 'buffapplied')
							args.push(aQuests.InQuestTriggers(Quest, ['buffowned','buffproduced']));
						if(NTQ.action_string == 'soldgoods')
							args.push(Quest.getQuestName_string())
						if(aQuests.NewTriggerQuest[NTQuest.action_string])
							aQuests.NewTriggerQuest[NTQuest.action_string](NTQuest, args);
						else
							aUI.alert(game.quests.getNewTriggerText(NTQuest), assets.GetNewQuestTriggerIcon(NTQuest));
						break;
				}
			});
		}catch(e){ debug(e), debug(QName) }
	},
	ResourceEconomy: function(name, amount, delta){
		const review = game.def("ServerState::cEconomyOverviewData",1).GetResourceProductionAndConsumptionValues(null, name);
		if(review.mProductionValue > 0)
			aUI.alert('Waiting to gather enough {0} ({1}/{2})'.format(name, delta, amount), assets.GetResourceIcon(name));
		else
			aUI.alert('Please make sure that your {0} production is running!'.format(loca.GetText('RES', name)), assets.GetResourceIcon(name));			
	},
	GetResourceBuildings: function(resource){
		return game.getBuildings().filter(function(building){
			try{
				return building.GetResourceCreation().GetResourceCreationDefinition().defaultSetting.resourceName_string == resource;
			}catch(e){ return false;}
		});
	},
	GetEffectiveBuff: function(unit){
		var result = null;
		$.each(game.def('global').map_BuffName_BuffDefinition, function(name, def){
			def.GetBuffEfficiencies_vector().forEach(function(effect){
				if(effect.buffName == unit) result = name;
			});
		});
		return result;
	},
	QuestName: {
		BartTheBarter: "Bart",
		ANewStone: "NewStone"
	},
	test: function(){
		try{
			if(!game.gi.isOnHomzone())  return;
			//.SetProductionActiveCommand()
			//Short Quests
			$.each(aSettings.Quests.Letters, function(name, enabled){
				if(!enabled) return;
				const QName = 'BuffQuest{0}Main'.format(aQuests.QuestName[name] || name);
				if(!game.quests.getQuest(QName)){
					aQuests.StartQuest("QuestStart_" + name, QName);
				}else{
					aQuests.DoQuest(QName);
				}
			});
			$.each(aSettings.Quests.Mini, function(name, enabled){
				if(!enabled) return;
				const QName = 'BuffQuest{0}'.format(aQuests.QuestName[name] || name);
				if(!game.quests.getQuest(QName)){
					aQuests.StartQuest("QuestStart_" + name, QName);
				}else{
					aQuests.DoQuest(QName);
				}
			});
			if(aSettings.Quests.Other.Daily) aQuests.DoQuests(/^Dai[A-Z]/);
			if(aSettings.Quests.Other.DailyGuild) aQuests.DoQuests(/^GuiDai[A-Z]/);
			if(aSettings.Quests.Other.Weekly) aQuests.DoQuests(/WeeklyChallenge.*Main/);
			aQuests.DoTrades();
		}catch(e){ debug(e) }
	},
	DoTrades: function(){
		var TradeCount = 0;
		$.each(aQuests.TOTrades, function(key, val){
			if(!val.Live) TradeCount++;
		});
		if(!TradeCount) return;
		var res = game.createResponder(function(e,d){
			try{
				if(!d || !d.data || !d.data.data) return;
				const data = d.data.data;
				var coinSlots = [];
				var nextSlot = data.length ? (data.toArray().filter(function(tr){
					if(tr.slotType == 2)
						coinSlots.push(tr.slotPos);
					return tr.slotType === 0;
				}).length ? 2 : 0) : 0;
				var nextCoinSlotPos = game.gi.mHomePlayer.mTradeData.getNextFreeSlotForType(2);
				var tradeInTO = function(trade, key){
					if(!data.length) return false;
					var exist = 0;
					$.each(data.toArray(), function(i, t){
						if(trade == t.offer)
							exist = t.id;
					});
					if(exist)
						aQuests.TOTrades[key].Live = exist;
					return exist;
				}
				$.each(aQuests.TOTrades, function(key, trade){
					if(trade.Live) return;
					const quest = key.split("#");
					if(game.quests.getQuest(quest[0]).mQuestTriggersFinished_vector[quest[1]].status) return;
					var data = {
						Send: trade.Send,
						Receive: [trade[0] == 'Fish'? 'Stone': 'Fish', 1],
						slotType: nextSlot,
						slotPos: nextSlot === 0 ? 0 : nextCoinSlotPos
					}

					const offer = "{0},{1}|{2},{3}|1".format(trade.Send[0],trade.Send[1],data.Receive[0],data.Receive[1]);
					aQuests.TOTrades[key]["Offer"] = offer
					if(tradeInTO(offer, key)) return;
					auto.timedQueue.add(function(){
						aTrade.SendTOTrade(data, key);
					});
					if(nextSlot === 2){
						coinSlots.push(nextCoinSlotPos);
						for(var i = 0; i < 9; i++){
							if(coinSlots.indexOf(i) == -1){
								nextCoinSlotPos = i;
								break;
							}
						}
					}else if(nextSlot === 0) nextSlot = 2;
				});
			}catch(e){ debug(e) }
		})
		auto.timedQueue.add(function(){
			aUtils.sendServerMessage(1062, game.gi.mCurrentViewedZoneID, null, res);
		});
	},
	ExplorersModal: function(sub){
		if(!game.gi.isOnHomzone()) return aUI.alert(getText("not_home"), 'ERROR');
		var save = function(){
			$.each(Object.keys(aSettings.Quests.Config.Explorers[sub]), function(i, t){
				aSettings.Quests.Config.Explorers[sub][t] = [];
			});
			autoWindow.withsBody('.container-fluid').find('input[type=checkbox]').each(function(i, item){
				var id = $(item).attr('id').split('_');
				if(id[0] === sub){
					if($(item).is(':checked'))
						aSettings.Quests.Config.Explorers[sub][id[1]].push(parseInt(id[2]));
				}
			});
			auto.SaveSettings();
			autoWindow.shide();
		}
		var tableData = function(){
			var table = [];
			const types = Object.keys(aSettings.Quests.Config.Explorers[sub]);
			table.push(createTableRow([ [12 - types.length, 'Explorers'] ].concat(types.map(function(r){
				var text = loca.GetText('TOT','Find{0}{1}'.format(sub, r)) 
				return  [1, aUtils.capitalize(text.split('(')[1].replace(')','')), 'small']
			})), true));
			var expls = [];
			game.getSpecialists().sort(specNameSorter).forEach(function(spec){
				try{
					if(!spec || spec.GetBaseType() != 1 || expls.indexOf(spec.GetType()) != -1) return;
					var text = $('<span>').append([
						$(getImageTag(spec.getIconID(), '26px', '26px')), 
						loca.GetText("SPE", spec.GetSpecialistDescription().getName_string())
					]);
					table.push(createTableRow([[12 - types.length, text] ].concat(types.map(function(r){ return [1, createSwitch("{0}_{1}_{2}".format(sub, r, spec.GetType()))]}))));
					expls.push(spec.GetType());
				} catch (e) { debug(e); }
			});
			return table;
		}
		autoWindow.settings(save, '');
		autoWindow.sTitle().html("{0} {1}".format(
			getImage(assets.GetBuffIcon("QuestStart_SharpClaw").bitmapData),
			'Quest: Explorers Task Managment')
		);
		autoWindow.sDialog().css("height", "80%").addClass("modal-lg");
		autoWindow.sData().append(
			$('<label>').text('Please Choose which Explorers should be used for {0} Search'.format(sub == 'AdventureZone' ? 'Adventure':sub)),
			$('<div>', { 'class': 'container-fluid', 'style' : 'height:auto;' }).append(tableData())
		);
		$.each(aSettings.Quests.Config.Explorers[sub], function(key, types){
			$.each(types, function(i, type){
				var id = "#{0}_{1}_{2}".format(sub, key, type);
				$(id).prop("checked", true);
			});
		});
		autoWindow.sshow();
	},
	NewTriggerQuest: {
		buffproduced: function(NTQ, args){
			const amount = NTQ.min - args[0];
			if(aSettings.Quests.Config.ProduceBuffs)
				auto.timedQueue.add(function(){ aUtils.ProduceInPH(NTQ.item_string, amount) });
			else 
				aUI.alert(game.quests.getNewTriggerText(NTQ));
		},
		buffowned: function(NTQ, args){
			const amount = NTQ.min - args[0];
			const buffVO = aUtils.getBuff(NTQ.item_string);
			if(buffVO && buffVO.amount >= amount) return buffVO;
			return aQuests.NewTriggerQuest.buffproduced(NTQ, args), false;
		},
		buffapplied: function(NTQ, args){
			const amount = NTQ.min - args[0];
			const buffVO = args[1] ? aUtils.getBuff(NTQ.item_string) : aQuests.NewTriggerQuest.buffowned(NTQ, args);
			if(!buffVO || buffVO.amount < amount || !aSettings.Quests.Config.ApplyBuffs) return;
			const targets = buffVO.GetBuffDefinition().GetTargetDescription_string();
			if(targets == 'Mayorhouse'){
				auto.timedQueue.add(function(){ aUtils.applyBuff(buffVO, 8825); });
			}
			else if(targets.indexOf('Workyard') != -1){
				const workyards = game.getBuildings().filter(function(b){
					return b.isWorkyard() && b.GetBuildingName_string().indexOf('EW_') == -1 && !b.productionBuff 
				}).slice(0, amount);
				$.each(workyards, function(i, wy){
					auto.timedQueue.add(function(){ aUtils.applyBuff(buffVO, wy.GetGrid()); });
				});
			}
		},
		buffappliedonfriend: function(NTQ, args){
			var buffVO = aUtils.getBuff("Fish", 'FillDeposit');
			const amount = NTQ.amount - args[0];
			if(buffVO && buffVO.GetAmount() > amount){
				var friendList = globalFlash.gui.mFriendsList.GetFilteredFriends("", true).slice(-10);
				if(!friendList.length) return aUI.alert('Come on! Get Some friends!!');
				var friend = friendList[Math.floor(Math.random() * friendList.length)];
				auto.timedQueue.add(function(){ game.gi.visitZone(friend.id); });
				auto.timedQueue.add(function(){
					aUI.alert('You are on {0} island'.format(friend.username));
					aUtils.applyBuff(buffVO, 9622, amount); 
				}, 25000);
				auto.timedQueue.add(function(){
					game.gi.visitZone(game.gi.mCurrentPlayer.GetHomeZoneId());
				}, 25000);
				auto.timedQueue.add(function(){ aUI.alert("Back at Home Island"); }, 25000);
			} else if(aSettings.Quests.Config.ProduceBuffs){
				auto.timedQueue.add(function(){
					aUtils.ProduceInPH('FillDeposit_Fishfood', Math.ceil(amount/100));
				});
			} else {
				aUI.alert('Please Make {0} Fish Food'.format(amount));
			}
		},
		buildingdestroyed: function(NTQ){
			const Building = game.zone.mStreetDataMap.getBuildingByName(NTQ.item_string);
			if(!Building) return;
			const Army = Building.GetArmy().GetSquads_vector();
			if(!Army.length) {
				auto.timedQueue.add(function(){
					try {
						game.gi.SendServerAction(165, 0, Building.GetGrid(), 0, null);
					} catch (e) {}
				});
				return aUI.alert("Destroying {0}!".format(loca.GetText('BUI', NTQ.item_string)), 'COMBAT');
			}
			$.each(Army, function(i, Squad){
				const eBuffName = aQuests.GetEffectiveBuff(Squad.GetType());
				const eBuffVO = aUtils.getBuff(eBuffName);
				if(eBuffVO && eBuffVO.amount >= Squad.amount){
					var buffList = game.def("Communication.VO::dBuffListVO", true);
						buffList.buffList = game.def("mx.collections::ArrayCollection", true);
					var buffVo = game.def("Communication.VO::dBuffVO", true);
						buffVo.uniqueId1 = eBuffVO.GetUniqueId().uniqueID1;
						buffVo.uniqueId2 = eBuffVO.GetUniqueId().uniqueID2;
						buffVo.amount = Squad.amount;
						buffList.buffList.addItem(buffVo);
					aUI.alert("Using {0} x{1} on {2}".format(loca.GetText("RES", eBuffName), Squad.amount, loca.GetText('BUI', NTQ.item_string)), 'MISSION');
					auto.timedQueue.add(function(){
						game.gi.SendServerAction(63, 0, Building.GetGrid(), 0, buffList);
					});
				} else {
					const eBuffAmount = eBuffVO ? Squad.amount - eBuffVO.amount : Squad.amount;
					auto.timedQueue.add(function(){
						aUtils.ProduceInPH(eBuffName, eBuffAmount);
					});
				}
			});
		},
		completeadventurelist: function(NTQ){
			aUI.alert(game.quests.getNewTriggerText(NTQ), assets.GetNewQuestTriggerIcon(NTQ));
		},
		onmap: function(NTQ){
			aUI.alert(game.quests.getNewTriggerText(NTQ), assets.GetNewQuestTriggerIcon(NTQ));
		},
		produceditemlist: function(NTQ, args){
			if(aData.Units(NTQ.item_string)){
				if(aSettings.Quests.Config.TrainUnits){
					const amount = NTQ.amount - args[0];
					auto.timedQueue.add(function(){ aUtils.TrainUnit(NTQ.item_string, amount); });
				} else {
					aUI.alert(game.quests.getNewTriggerText(NTQ));
				}
			} else {
				aQuests.ResourceEconomy(NTQ.item_string, NTQ.amount, args[0]);
			}
		},
		questcomplete: function(NTQ){
			aQuests.DoQuest(NTQ.item_string);
		},
		resourcegathered: function(NTQ, args){
			const iName = NTQ.item_string ? NTQ.item_string : NTQ.type_string;
			const buffVO = aUtils.getBuff(iName, 'AddResource');
			const iAmount = (NTQ.amount ? NTQ.amount : NTQ.min) - args[0];
			if(buffVO && buffVO.amount > iAmount && aSettings.Quests.Config.GatherfromStar){
				auto.timedQueue.add(function(){
					aUtils.applyBuff(buffVO, 8825, iAmount);
				});
			}else{
				aQuests.ResourceEconomy(iName, iAmount, args[0]);
			}
		},
		soldgoods: function(NTQ, args){
			if(!aSettings.Quests.Config.SellinTO)
				return aUI.alert(game.quests.getNewTriggerText(NTQ), NTQ.item_string);
			const TName = args[1] + "#" + NTQ.triggerIdx;
			if(aQuests.TOTrades[TName]) return;
			const amount = NTQ.amount - args[0];
			if(!aUtils.EnoughResource(NTQ.item_string, amount, true)){
				const buffVO = aUtils.getBuff(NTQ.item_string, 'AddResource');
				if(buffVO && buffVO.amount > amount && aSettings.Quests.Config.GatherfromStar)
					auto.timedQueue.add(function(){
						aUtils.applyBuff(buffVO, 8825, amount);
					});
				return;
			}
			aQuests.TOTrades[TName] = { Send: [NTQ.item_string, amount], Live: false}
		},
		specialisttaskfinished: function(NTQ, args){
			var option = [];
			var specTypes = [];
			const options = {
				"Deposit": ["Stone", "BronzeOre", 'Marble', 'IronOre', 'GoldOre', 'Coal', 'Granite','AlloyOre', 'Salpeter'],
				"Treasure": ["Short", "Medium", "Long", "EvenLonger", "Prolonged"],
				"AdventureZone": ["Short", "Medium", "Long", "VeryLong"]
			}
			const alter = {
				"Longest": "Prolonged",
				"AlloyOre": "TitaniumOre"
			}
			const amount = NTQ.amount - args[0];
			$.each(Object.keys(options), function(i, key){
				if(NTQ.item_string.indexOf(key) < 0) return;
				var item = NTQ.item_string.split(key)[1];
				item = alter[item] ? alter[item] : item;
				option = [key=="Deposit"?2:1, i, options[key].indexOf(item)];
				if(key == 'Deposit')
					specTypes = aSettings.Deposits.data[item].geos;
				else if(key == 'Treasure' || key == 'AdventureZone')
					specTypes = aSettings.Quests.Config.Explorers[key][item];
			});
			if(!option) return aUI.alert(game.quests.getNewTriggerText(NTQ));
			const specs = game.getSpecialists().filter(function(e){ return e && e.GetBaseType() == option[0];}).sort(specNameSorter);
			var searchs = amount - specs.filter(function(spec){ return spec.IsInUse() && spec.GetTask().GetSubType() === option[2]; }).length;
			if(searchs <= 0) return;
			if(!specTypes.length)
				return aUI.alert('Please select some {0} to start {1}'.format(option[0] === 1?"Explorers":"Geologists", loca.GetText('LAB',NTQ.item_string)), 'ERROR');
			
			specs.forEach(function(spec){
				if(spec.IsInUse() || searchs <= 0 || specTypes.indexOf(spec.GetType()) == -1) return;
				const id = spec.GetUniqueID();
				auto.timedQueue.add(function(){
					try{ aUtils.sendSpecPacket(id, option[1], option[2]); }catch(e){}
				});
				searchs--;
			});
		}
	},
	InQuestTriggers: function(Quest, actions, item, amount){
		return Quest.mQuestDefinition.endConditions_vector.toArray().filter(function(q){
			if(item)
				return actions == q.action_string && q.item_string == item && q.amount >= amount;
			else
				return actions.indexOf(q.action_string) != -1;
		}).length;
	},
	ThePathFinder: function(){
		const Tasks = game.gi.getCurrentTaskManager().getChildTasks(game.gi.getCurrentTaskManager().getCategoryByName('TaskBuilding'));
		$.each(Tasks, function(i, Task){
			if(Task.getFinished()) return;
			$.each(Task.getTriggers(), function(t, Trigger){
				if(Trigger.getFinished()) return;
				debug(Trigger.getDefinition());
			});
		});
	}
}
//-------------- Auto Book Binder --------------
const aBookBinder = {
	exec: function(){
		if(!game.gi.isOnHomzone() || !auto.isOn.BookBinder) return;
		try {
			var bookBinder = game.zone.mStreetDataMap.getBuildingByName("Bookbinder");
			if(!bookBinder) return aUI.alert("No Bookbinder found!", 'ERROR');
			//Check if Bookbinder is buffed
			const settings = aSettings.Buildings.BookBinder
			const buff = aUtils.getBuff(settings.buffType);
			const BBGrid = bookBinder.GetGrid();
			if(!bookBinder.productionBuff && settings.autoBuff && buff){
				auto.timedQueue.add(function(){ 
					try {
						aUtils.applyBuff(buff, BBGrid); 
					} catch (e) {}
				});
			}
			//Check BookBinder production Queue -> 2
			var bbProductionQ = game.zone.GetProductionQueue(2);
			if(bbProductionQ.mTimedProductions_vector.length != 0){
				var item = bbProductionQ.mTimedProductions_vector[0];
				var productionVO = item.GetProductionOrder().GetProductionVO();
				//Check if production is finished -> 1, 0 -> unfinished
				if(productionVO.producedItems == 0) return;
				if(productionVO.producedItems == 1){
					auto.timedQueue.add(function(){
						try {
							bbProductionQ.finishProduction(game.gi.mHomePlayer, true);
							aUtils.sendServerMessage(141, game.gi.mCurrentViewedZoneID, 2);
							aUI.alert("{0} produced successfully.".format(productionVO.type_string));
						} catch (e) {}
					});
					return;
				}
			}

			if(!aUtils.CanAfford(aBookBinder.GetBookCost(settings.bookType), 1))
				return aUI.alert("Not enough resources to produce {0}".format(settings.bookType), settings.bookType);
			
			auto.timedQueue.add(function(){	
				try {
					aUtils.startProduction("Bookbinder", settings.bookType, 1, 1);
					aUI.alert("Start producing {0}".format(settings.bookType), settings.bookType);	
				} catch (e) {}
			}, 10000);
		} catch (e) {}
	},
	GetBookCost: function(name){
		const book = game.def('global').skillPoints_vector.filter(function(sk){ return sk.id_string == name })[0];
		var cost = book.levels_vector[0].costs;
		$.each(book.levels_vector, function(i, level){
			if(level.amountProduced <= game.getResources().GetPlayerResource(name).producedAmount)
				cost = level.costs;
		});
		return cost;
	}
}
//-------------- Auto Collect --------------
const aCollect = {
	lBuildings: {
		'FlyingHouse': 'FlyingHouse', 
		'GiftChristmasTree': 'GiftChristmasTree',
		'GiftGhostShip': 'GhostLantern',
		'BalloonMarket_mini': 'BalloonMarket_mini'
	},
	exec: function(){
		if((game.gi.isOnHomzone() && aSettings.Collect.Pickups) ||
			(game.gi.mCurrentViewedZoneID == aUtils.adventureID() && aAdventure.data.name) ||
			game.zone.mAdventureName != "Home")
			aCollect.CheckForPickups();
		if(game.gi.isOnHomzone() && aSettings.Collect.LootBoxes)
			aCollect.CollectLootBoxes();
	},
	CheckForPickups: function(){
		try {
			const cQuest = game.quests.getQuest('CollectAllCollectibles') || 
					game.quests.getQuest('CollectAllEventCollectibles') || 
					game.quests.getQuest('CollectAllCollectiblesAdventure');
			if(cQuest && cQuest.IsQuestActive()){
				if(cQuest.isFinished()){
					game.quests.RewardOkButtonPressedFromGui(cQuest);
					globalFlash.gui.mQuestBook.Show();
					setTimeout(function() { globalFlash.gui.mQuestBook.Hide(); }, 2000);
					if(game.gi.mCurrentViewedZoneID == aUtils.adventureID()
						&& aAdventure.data.name
						&& aAdventure.data.steps[aAdventure.data.index].name == "CollectPickups"){
						aAdventure.data.index++;
						aUtils.updateStatus('Pickups Collected!');
					}
				} else {
					this.CollectPickups();
				}
			}
		}catch(e){}
	},
	CollectPickups: function(){
		try{
			var collectionsManager = swmmo.getDefinitionByName("Collections::CollectionsManager").getInstance(),
			questTriggersMap = {},
			itemGOContainer,
			count = 0;
			if (game.gi.mCurrentPlayer.mIsAdventureZone && game.quests.GetQuestPool().IsAnyQuestsActive()) {
				$.each(game.quests.GetQuestPool().GetQuest_vector().toArray(), function(i, item) {
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
						try {
							game.gi.SelectBuilding(item);
						} catch (e) {}
					});
				}
			});
		}catch(er){}
	},
	CollectLootBoxes: function(){
		$.each(aCollect.lBuildings, function(name, val){
			try{
				const buildingVO = game.zone.mStreetDataMap.getBuildingByName(name);
				if(!buildingVO) return;
				const questVO = game.quests.getQuest('BuiBonus_{0}_Timer_Loop'.format(val)) ||
				game.quests.getQuest('BuiBonus_{0}_Timer'.format(val));
				if(!questVO){
					auto.timedQueue.add(function(){
						try{
							game.gi.SelectBuilding(buildingVO);
						}catch(e){ debug(e) };
					});
					auto.timedQueue.add(function(){ globalFlash.gui.UpdateGuiOnZoneLoad(); });
				}	
			}catch(e){ debug(e) }
		});
	}
}
//-------------- Auto Weekly Quest --------------
const aWeeklyQuest = {
	exec: function(){
		if(!game.gi.isOnHomzone() || !auto.isOn.WeeklyQuest) return;
		aWeeklyQuest.HitShip();
	},
	GetEffectiveBuff: function(unit){
		var result = null;
		$.each(game.def('global').map_BuffName_BuffDefinition, function(name, def){
			def.GetBuffEfficiencies_vector().forEach(function(effect){
				if(effect.buffName == unit) result = name;
			});
		});
		return result;
	},
	HitShip: function(){
		try {
			var wShip = game.zone.GetBuildingFromGridPosition(7301);
			if(wShip){
				var sArmy = wShip.GetArmy().GetSquads_vector()[0];
				if(sArmy){
					const wBuffName = aWeeklyQuest.GetEffectiveBuff(sArmy.GetType());
					const wBuffVO = aUtils.getBuff(wBuffName);
					if(wBuffVO && wBuffVO.amount >= sArmy.amount){
						var buffList = game.def("Communication.VO::dBuffListVO", true);
							buffList.buffList = game.def("mx.collections::ArrayCollection", true);
						var buffVo = game.def("Communication.VO::dBuffVO", true);
							buffVo.uniqueId1 = wBuffVO.GetUniqueId().uniqueID1;
							buffVo.uniqueId2 = wBuffVO.GetUniqueId().uniqueID2;
							buffVo.amount = sArmy.amount;
							buffList.buffList.addItem(buffVo);
						aUI.alert("Using {0}x{1} on enemy ship".format(loca.GetText("RES", wBuffName), sArmy.amount), 'MISSION');
						game.gi.SendServerAction(63, 0, 7301, 0, buffList);
					} else {
						const wBuffAmount = wBuffVO ? sArmy.amount - wBuffVO.amount : sArmy.amount;
						aUtils.ProduceInPH(wBuffName, wBuffAmount);
					}
				} else {
					//Kill if no army left
					aUI.alert("Destroying Weekly ship!", 'COMBAT');
					auto.timedQueue.add(function(){
						try {
							game.gi.SendServerAction(165, 0, 7301, 0, null);
						} catch (e) {}
					});
				}
			} else {
				var weeklyQuest = game.quests.GetQuestPool().GetQuest_vector().toArray().filter(function(q){
					return q && /WeeklyChallenge.*(First|Second|Third)/.test(q.getQuestName_string()) && q.GetQuestMode() == 5;
				})[0];
				if(weeklyQuest){
					game.quests.RewardOkButtonPressedFromGui(weeklyQuest);
					aUI.alert("Completeing weekly ship quest!");
				}
			}
		} catch(e) {}
	}
}
//-------------- Auto Mail Accept/Decline --------------
const aMail = {
	Types: {
		cTrades: [4, 5],
		Loot: [6, 25, 26, 27, 28, 41, 42, 43, 44, 45],
		AdvLoot: [7, 19, 24, 30, 33, 46],
		AdvMessage: [8, 29, 63],
	},
	nextRun: new Date().getTime(),
	aWaitingResponse: null,
	AcceptInvite_Try_Index: 0,
	AcceptInvite_Try_Mails: [],
	Modal: function(mode){
		try{
		// mode  1 -> friends, else -> resources
			if (!game.gi.isOnHomzone()) 
				return aUI.alert(getText('not_home'), 'ERROR');
			
			var save = function(){
				try{
					if(mode == 'Friends'){
						aSettings.Mail.AcceptGuildTrades = $('#aMailAcceptGuildTrades').is(':checked');
					}else if (mode == 'Resources'){
						aSettings.Mail.AllowAllResources = $('#aMailAllowAllResources').is(':checked');
						const max = $('#aMailResourcesMax').val();
						if(isNaN(max))
							return alert('Max Value should be numerical');
						aSettings.Mail.AllResourcesMax = parseInt(max);
					}
					auto.SaveSettings();
					autoWindow.shide();
				} catch(e) {}
			}
			
			
			var friendSelect = function(){
				var friends = globalFlash.gui.mFriendsList.GetFilteredFriends("", true);
				friends.sort(function(a, b) {
					return a.username.toLowerCase().localeCompare(b.username.toLowerCase());
				});
				var friendSelect = aUtils.createSelect('aMailFriendSelect')
					.append($('<option>', { value:"0" }).text("---"));
				friends.forEach(function(item) {
					if (item != null)
						friendSelect.append($('<option>', { value: item.id }).text(item.username));	
				});
				return friendSelect;
			};
			var ResourceSelect = function(){
				var resourceSelect = aUtils.createSelect('aMailResourceSelect')
					.append($('<option>', { value:"0" }).text("---"));
					aData.Resources().forEach(function(item) {
						resourceSelect.append($('<option>', { value: item }).text(loca.GetText("RES", item))).prop("outerHTML");
					});
				return resourceSelect.html(resourceSelect);
			};
			const Options = function(mode){
				if(mode == 'Friends')
					return [
						createTableRow([[10, "Friends"], [2, '']], true),
						createTableRow([
							[10, "Accept All Guild trades (Resources filter is applied)"],
							[2, createSwitch("aMailAcceptGuildTrades", aSettings.Mail.AcceptGuildTrades) ],
						], 0),
						createTableRow([
							[2, loca.GetText("LAB", "UserName")],
							[4, friendSelect()],
							[4, '<input type="checkbox" id="aMailFavorite"/> {0}'.format('Accept everything')],
							[2, aUtils.createButton('aMailAcceptFriend', 'Add Friend') ]
						], false),
						$('<br>'),
						createTableRow([
							[6, loca.GetText("LAB", "Friends")],
							[6, "Accept everything"]
						], true),
						$('<div>', { id: 'aMailAllowedFriends'}).append(friendsData)
					]
				else if(mode == 'Resources')
					return [
							createTableRow([[10, "Resources"], [2, '']], true),
							createTableRow([
								[6, "&#10551; Allow all resources with limit"],
								[3, $('<input>', { 'value': aSettings.Mail.AllResourcesMax, 'type': 'number', 'class': 'form-control', 'placeholder': 'Max Limit', 'id': 'aMailResourcesMax'})],
								[1, ''],
								[2, createSwitch("aMailAllowAllResources", aSettings.Mail.AllowAllResources) ],
							], 0),
							createTableRow([
								[12, "&#10551; Customized limit filters are prioritised & always On"],
							], 0),
							createTableRow([
								[1, loca.GetText("LAB", "TradeTabItems")],
								[4, ResourceSelect()],
								[1, ''],
								[3,  '<input type="number" class="form-control" placeholder="Max Limit" id="aMailResourceMax"/>'],
								[3, aUtils.createButton("aMailAddResource", 'Add Resource')],
							], 0),
							$('<br>'),
							$('<span>').text('Customize Resources Max Limit'),
							createTableRow([
								[6, loca.GetText("LAB", "TradeTabItems")],
								[6 ,  'Max'],
							], true),
							$('<div>', { id: 'aMailAllowedResources'}).append(resourcesData)
						]
			}
			var friendsData = function(){
				var allowed = [];
				$.each(aSettings.Mail.EnabledUsers, function(id, friend){
					try
					{
						allowed.push(createTableRow([
							[6, friend.name],
							[5, (friend.favorite ? loca.GetText("LAB", "YES") : "")],
							[1, $('<button>', { 'type': 'button', 'class': 'close aMailRemoveAllowedFriend', 'value': id }).html($('<span>').html('&times;'))]
							], false));
					}
					catch (e)  // old format
					{
						allowed.push(createTableRow([
							[6, friend],
							[5, ""],
							[1, $('<button>', { 'type': 'button', 'class': 'close aMailRemoveAllowedFriend', 'value': id }).html($('<span>').html('&times;'))]
							], false));
					}
				});
				return allowed;
			}
			var resourcesData = function(){
				var allowed = [];
				$.each(aSettings.Mail.EnabledResources, function(name, max){
					try {
						allowed.push(createTableRow([
							[6, getImage(assets.GetResourceIcon(name).bitmapData, "23px") + ' ' + loca.GetText('RES', name)],
							[5, max],
							[1, $('<button>', { 'type': 'button', 'class': 'close aMailRemoveAllowedResource', 'value': name }).html($('<span>').html('&times;'))]
						], false));
					} catch (e) {}
				})
				return allowed;
			}
			autoWindow.settings(save);
			autoWindow.sDialog().css("height", "80%");
			autoWindow.sTitle().html("{0} {1}".format(
				utils.getImageTag(mode === 1 ? 'IconMailTypeFriend' : 'IconMailTypeTrade'),
				"Filter Trade Mails")
			);
			autoWindow.sData().append(
				$('<div>', { 'class': 'container-fluid', 'style' : 'height:auto;' }).append([
					'&#10551; Accept if friend is in list or guild member (If Option is On)',
					$('<br>'),
					"&#10551; Resources filter doesn't work if you allow everything for this friend",
					$('<br>'),
				].concat(Options(mode)))
			);
			autoWindow.withsBody("#aMailAddResource").click(function(){
				try{
					var name = $('#aMailResourceSelect').val();
					var max = $('#aMailResourceMax').val();
					if (name == "---" || max == "") return;
					if(isNaN(max))
						return alert('Max Value should be numerical');
					aSettings.Mail.EnabledResources[name] = parseInt(max);
					autoWindow.withsBody('#aMailAllowedResources').empty().append(resourcesData);
				} catch (a) { debug(a) }
			});
			autoWindow.withsBody("#aMailAcceptFriend").click(function(){
				try{
					var friendId = $('#aMailFriendSelect').val();
					if (friendId == "0") return;
					var friendName = $('#aMailFriendSelect option:selected').text();
					var favorite = $('#aMailFavorite').is(':checked');
					aSettings.Mail.EnabledUsers[friendId] = { name: friendName, favorite: favorite };
					autoWindow.withsBody('#aMailAllowedFriends').empty().append(friendsData);
				} catch (a) { debug(a) }
			});
			autoWindow.sData().on('click','.aMailRemoveAllowedFriend', function(){
				try{
					delete aSettings.Mail.EnabledUsers[$(this).val()];
					autoWindow.withsBody('#aMailAllowedFriends').empty().append(friendsData);
				} catch (a) { debug(a) }
			}).on('click','.aMailRemoveAllowedResource', function(){
				try{
					delete aSettings.Mail.EnabledResources[$(this).val()];
					autoWindow.withsBody('#aMailAllowedResources').empty().append(resourcesData);
				} catch (a) { debug(a) }
			});
			autoWindow.sshow();
		}catch(er){ debug(er); }
	},
	SavedTradesModal: function(){
		try{
			const file = air.File.applicationDirectory.resolvePath("auto/saved_trades.json").nativePath;
			const data = aUtils.readFile(file) || []; 
			if(!data.length)
				return aUI.alert('Empty Trade Log', 'ERROR');
			$("div[role='dialog']:not(#aSavedTradesModal):visible").modal("hide");
			$('#aSavedTradesModal').remove();
			createModalWindow('aSavedTradesModal', utils.getImageTag('IconMailTypeTrade') + ' Trades Log');
			var table = $.map(data, function(trade){
				return createTableRow([
					[2, aUtils.formatDate(trade.Date)],
					[2, trade.Sender],
					[2, getImage(assets.GetResourceIcon(trade.Send.Name).bitmapData, "23px")  + " " + loca.GetText('RES', trade.Send.Name)],
					[1, trade.Send.Qty.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")],
					[2, getImage(assets.GetResourceIcon(trade.Receive.Name).bitmapData, "23px")  + " " + loca.GetText('RES', trade.Receive.Name)],
					[1, trade.Receive.Qty.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")],
					[2, $('<label>').css('color', trade.Status ? '#99ff99':'red').text(trade.Status ? "Accepted": "Decliened")]
				], false)
			});
			$('#aSavedTradesModalData').append(
				$('<div>', { 'class': 'container-fluid', 'style' : 'height:auto;' }).append([
					createTableRow([
						[2, "Date"],
						[2, "Friend"],
						[2, "Sent"],
						[1, "Amount"],
						[2, "Received"],
						[1, "Amount"],
						[2, "Status"]
					], true)
				].concat(table))
			)
			$('#aSavedTradesModal:not(:visible)').modal({ backdrop: "static" });
		}catch(e){ debug(e) }
	},
	resetNextRun: function(after){
		this.nextRun = new Date().getTime() + (after ? after : (aSettings.Mail.TimerMinutes * 60000));
	},
	run: function(){
		try
		{
			if (!game.gi.isOnHomzone()) return aMail.resetNextRun();
			auto.timedQueue.add(function(){ globalFlash.gui.mMailWindow.Show() });
			auto.timedQueue.add(function(){ globalFlash.gui.mMailWindow.Hide() });
			auto.timedQueue.add(function(){
				const Operation = game.def('ServerState::cConnectionManager').GetInstance().mMailService.operations['GetHeaders'];
				if(!Operation) return;
				const Result = Operation.lastResult;
				if(!Result || !Result.data || !Result.data.data || !Result.data.data.headers_collection) 
					return debug('Empty Mail Response'), aMail.resetNextRun(20000);
				aMail.HeadersHandler(Result.data.data.headers_collection.toArray());
			});
		} catch (e) {}
	},
	HeadersHandler: function(Mails)
	{
		try
		{
			var LootMails = [];
			var AdvInvites = [];
			$.each(Mails, function(i, objMail) {
				if (!objMail) return;
				// this groups can be to star
				if ((aSettings.Mail.AcceptLoots && aMail.Types.Loot.indexOf(objMail.type) >= 0) ||
					(aSettings.Mail.AcceptGeologistMsg && objMail.type == 32) ||
					(aSettings.Mail.AcceptAdventureLoot && aMail.Types.AdvLoot.indexOf(objMail.type) >= 0) ||
					(aSettings.Mail.AcceptAdventureMessage && aMail.Types.AdvMessage.indexOf(objMail.type) >= 0) ||
					(aSettings.Mail.AcceptGifts && objMail.type == 9)
					)
				{
					//if(game.def('com.bluebyte.tso.util::MailUtils').CanCollectMail(objMail))
					LootMails.push(objMail.id);
				} else if (aSettings.Mail.AcceptInvites && objMail.type == 23){
					AdvInvites.push(objMail.id);
				} else if (aSettings.Mail.CompleteTrades && aMail.Types.cTrades.indexOf(objMail.type) != -1){
					aCycle.wQueue.push(function() { aMail.AcceptUserTrade(objMail.type , objMail.id); });
				} else if (objMail.type === 1) {
					aCycle.wQueue.push(function() { aMail.GetMailBody(objMail.id, "accept"); });
				}					
			});
			if (LootMails.length > 0)
				aCycle.wQueue.push(function(){ aMail.AcceptLootMsgs(LootMails, aSettings.Mail.ToStar); });
			if (AdvInvites.length > 0)
				aCycle.wQueue.push(function(){ aMail.AcceptInvites(AdvInvites) });
			aMail.resetNextRun();
		} catch (e) {}
	},
	Set_aWaitingResponse: function() {
		debug("waiting response");
		this.aWaitingResponse = setTimeout(function() { 
			aMail.aWaitingResponse_NoResponse() 
		}, 20000);
	},
	aWaitingResponse_NoResponse: function()
	{
		this.Clear_aWaitingResponse();
		debug("No Response");
		this.resetNextRun();
	},
	Clear_aWaitingResponse: function()
	{
		debug("clear waiting response");
		clearTimeout(this.aWaitingResponse);
		this.aWaitingResponse = null;
	},
	GetHeaders: function(){
		if (!game.gi.isOnHomzone()) return false;
		try
		{
			var responder = game.createResponder(aMail.GetHeadersHandler, aMail.aWaitingResponse_NoResponse)
			var v = game.def("Communication.VO::dIntegerVO", !0);
				v.value = 5000;
			aUtils.sendServerMessage(1175, game.gi.mCurrentViewedZoneID, v, responder);
			return true;
		} catch (e) { return false; }
	},
	AcceptLootMsgs: function(LootMails, toStar){
		if (!game.gi.isOnHomzone()) return;
		try
		{
			var MailRequest = game.def("Communication.VO.Mail::dDismissMailsRequestVO", 1);
			var Collection = game.def("mx.collections::ArrayCollection", 1);
			LootMails.forEach(function(Mail){ Collection.addItem(Mail); });
			MailRequest.mailsIDs_collection = Collection;
			MailRequest.claim = !toStar;
			
			aUI.alert('Accepting {0} loot mails'.format(LootMails.length), "MAIL_LOOT");
			aUtils.sendServerMessage(1201 , game.gi.mCurrentViewedZoneID, MailRequest);
		} catch (e) {}
	},
	GetMailBody: function(id, type)
	{
		if (!game.gi.isOnHomzone()) return false;
		var responder = {
			"accept": game.createResponder(aMail.GetBodyHandler, aMail.aWaitingResponse_NoResponse),
			"invite": game.createResponder(aMail.GetInviteHandler, aMail.AcceptInvite_Try)
		}
		try
		{
			//this.Set_aWaitingResponse();
			var v = game.def("Communication.VO::dIntegerVO", 1);
			v.value = parseInt(id);
			aUtils.sendServerMessage(1177, game.mCurrentViewedZoneID, v , responder[type]);		
			return true;
		} catch (e) { debug(e) }	
	},
	GetBodyHandler: function(event, data){
		//aMail.Clear_aWaitingResponse();
		if (!game.gi.isOnHomzone()) return false;
		var isGuildMember = function(id){
			var result = false;
			game.gi.GetCurrentPlayerGuild().members.toArray().forEach(function(member){
				if(member.id == id)
					result = true;
			});
			return result;
		}
		try
		{
			if (!data && !data.data)
				return false;
			//if(!game.def('com.bluebyte.tso.util::MailUtils').CanCollectMail(data.data))
			//	return debug("Can't collect this mail");
			var items = aMail.GetBodyItems(data.data.body);
			var user = aSettings.Mail.EnabledUsers[data.data.senderId.toString()];
			var gMember = isGuildMember(data.data.senderId);
			var premission = false;
			var isResource = (items.Send.Name && !items.Send.Type) ? true : false;
			if (user && user.favorite) {
				premission = true;
			} else if (user || (gMember && aSettings.Mail.AcceptGuildTrades)) {
				if(isResource){
					if(aSettings.Mail.AllowAllResources && items.Send.Qty <= aSettings.Mail.AllResourcesMax)
						premission = true;
					var resource = aSettings.Mail.EnabledResources[items.Send.Name];
					if(resource)
						premission = items.Send.Qty <= resource ? true : false;
				}
			}
			if(!premission) return debug('Pending {0} from {1}'.format(data.data.body, data.data.senderName));
			var canTrade = false;
			if (isResource && aUtils.getItemAmount(items.Send.Name) >= items.Send.Qty)
				canTrade = true;
			if (!isResource && aUtils.getBuff(items.Send.Name, items.Send.Type).amount >= items.Send.Qty)
				canTrade = true;

			
			if(canTrade)
				aMail.AcceptUserTrade(data.data.type, data.data.id);
			else if (aSettings.Mail.DeclineTrades && isResource)
				aMail.RefuseUserTrade(data.data.id);
			else 
				return;

			if (aSettings.Mail.SaveFriendsTrades){
				items['Date'] = new date().getTime();
				items['Sender'] = data.data.senderName;
				items['Status'] = canTrade;
				aMail.SaveTradeToLog(items);
			}
		}catch(e){ debug(e) }
	},
	AcceptInvites: function(AceeptLootMailsID){
		if (!AceeptLootMailsID) return;
		try
		{
			aMail.AcceptInvite_Try_Mails = AceeptLootMailsID;
			aMail.AcceptInvite_Try_Index = 0;
			aMail.AcceptInvite_Try();
		} catch(e){ deubg(e) }
	},
	AcceptInvite_Try: function(){
		try
		{
			if (aMail.AcceptInvite_Try_Index >= aMail.AcceptInvite_Try_Mails.length)			
				return deubg("Invite End Loop");
				
			var id = aMail.AcceptInvite_Try_Mails[aMail.AcceptInvite_Try_Index++];
			aMail.GetMailBody(id, "invite");
		} catch(e){ deubg(e) }
	},
	GetInviteHandler: function(event, data){
		try
		{
			aMail.Clear_aWaitingResponse();
			var advName = data.data.attachments.adventureName;
			var friend = data.data.senderId.toString();
			var zoneid = data.data.attachments.zoneID;
			var mailid = data.data.id;

			debug("Received an invite for " + advName + " from " + friend);
			if (_usInvitesSettings.Adventures[advName] !== undefined) // Invite configured?
			{
				cfg = _usInvitesSettings.Adventures[advName];
				if (cfg.Players[friend] !== undefined)
				{
					debug("Accepting an invite for " + advName + " from " + cfg.Players[friend] + " mailID : " + mailid);
					_exudMIA_HasStuckedInvitedAdv(zoneid);
					// ok valid invite
					setTimeout(function() {_exudMIA_StartAdventure(advName, zoneid, mailid);}, 5000);
					return; // end of loop
				}
			}
		} catch(e){ deubg(e) }
		
		aMail.AcceptInvite_Try();
	},
	GetBodyItems: function(body)
	{
		var getResources = function(data){
			try
			{
				var result = { Name: '', Qty: '', Type: null };
				data = data.split(",");
				if (data.length == 2)
				{
					result.Name = data[0];
					result.Qty = parseInt(data[1]);
				}
				else if (data.length == 3)
				{
					result.Type = data[0];
					result.Name = data[1];
					result.Qty = parseInt(data[2]);
				}
				return result;
			} catch (es) { }
		}
		var result = {};
		body = body.split("|");
		result['Receive'] = getResources(body[0]);
		result['Send'] = getResources(body[1]);
		return result;
	},
	AcceptUserTrade: function(type, mailId)
	{
		if (!game.gi.isOnHomzone()) return;
		try
		{
			var v = game.def("Communication.VO::dIntegerVO", !0);
				v.value = mailId;
			aUtils.sendServerMessage(type === 1 ? 1050 : 1054, game.gi.mCurrentPlayer.GetPlayerId(), v, null);
			aUI.alert(type === 1 ? 'Trade Accepted' : 'Trade Resources Collected', "MAIL_TRADE");
			return true;
		} catch (e) { return false; }
	},
	RefuseUserTrade: function(mailId)
	{
		if (!game.gi.isOnHomzone())	return false;
		try
		{
			var v = game.def("Communication.VO::dIntegerVO", !0);
			v.value = parseInt(mailId);
			aUtils.sendServerMessage(1053 , game.gi.mCurrentPlayer.GetPlayerId(), v);
			aUI.alert('Declining: ' + mailId, "MAIL_TRADE");
		} catch (e) {}
	},
	SaveTradeToLog: function(trade)
	{
		try
		{
			const file = air.File.applicationDirectory.resolvePath("auto/saved_trades.json").nativePath;
			var data = aUtils.readFile(file) || [];
			data.push(trade);
			fileStream = new air.FileStream();
			fileStream.open(new air.File(file), air.FileMode.WRITE);
			fileStream.writeUTFBytes(JSON.stringify(data));
			fileStream.close();
		} catch (e) { debug("Error saving trade log: " + e); }
	},
	SendInvite: function(ZoneID , PlayeID, PlayerName, response_callback){
		try
		{
			var v = game.def("Communication.VO::dIntegerVO", !0);
			v.value = parseInt(PlayeID);
			aUtils.sendServerMessage(92, ZoneID, v, response_callback);
			aUI.alert('Sending invite: ' + PlayerName, 'MISSION');
			return true;
		} catch (e) { }
		return false;				
	},
	AcceptInvite: function(ZoneID, mailId, response_callback)
	{
		try
		{
			var v = game.def("Communication.VO::dIntegerVO", !0);
			v.value = mailId;
			aUtils.sendServerMessage(93, ZoneID, v, response_callback);
			aUI.alert('Accepted Invite: ' + mailId, "MAIL_TRADE");
			return true;
		} catch (e) { }
		return false;
	},
	test2: function(id){
		try
		{
			var responder = game.createResponder(function(e,d){
				debug(e)
				debug(d)
			}, function(){})
			var v = game.def("Communication.VO::dIntegerVO", 1);
				v.value = parseInt(id);
			aUtils.sendServerMessage(1177, game.mCurrentViewedZoneID, v , responder);		
			return true;
		} catch (e) {}	
	}
}
//-------------- Auto Shop --------------
const aShop = {
	
}
//-------------- Auto Trade --------------
const aTrade = {
	Modal: function(){
		try
		{
			if (!game.gi.isOnHomzone())
				return aUI.alert(getText('not_home'), 'ERROR');

			var loadTransactions = function(){
				$('#aTradeTransactions').empty();
				$.each(aSettings.Trade.Trades, function(key, val){
					$('#aTradeTransactions').append(
						createTableRow([
							[2, val.FriendName],
							[2, loca.GetText("RES", val.SendResource)],
							[2, val.SendAmount],
							[2, loca.GetText("RES", val.ReceiveResource)],
							[2, val.ReceiveAmount],
							[1, val.ISDT ? 'Yes' : 'No'],
							[1, $('<button>', { 'type': 'button', 'class': 'close aTradeDelItem', 'value': val.ID }).html($('<span>').html('&times;'))]
						], false)
					);
				});
				$('#aTradeTransactions').find('.row').css('cursor', 'pointer');
			}
			$("div[role='dialog']:not(#aTradeModal):visible").modal("hide");

			$('#aTradeModal').remove();

			createModalWindow('aTradeModal', utils.getImageTag('icon_dice.png', '45px') + ' Trades');
			
			var _friends = globalFlash.gui.mFriendsList.GetFilteredFriends("", true);
			_friends.sort(function(a, b) {
				return a.username.toLowerCase().localeCompare(b.username.toLowerCase());
			});
			
			var select_friend = function(firends){
				var select_friend = $('<select>', { id: 'aTradeFriendSelect' });
				select_friend.append($('<option>', { value:"0" }).text("---"));
				firends.forEach(function(item) {
					if (item != null)
						select_friend.append($('<option>', { value: item.id }).text(item.username));	
				});
				return select_friend;
			};

			var select_resourcesSend = $('<select>', { id: 'aTradeSendSelect' });
			select_resourcesSend.append($('<option>', { value:"---" }).text("---")).prop("outerHTML");
			
			var select_resourcesRec = $('<select>', { id: 'aTradeReceiveSelect' });
			select_resourcesRec.append($('<option>', { value:"---" }).text("---")).prop("outerHTML");

			aData.Resources().forEach(function(item) {
				select_resourcesSend.append($('<option>', { value: item }).text(loca.GetText("RES", item))).prop("outerHTML");
				select_resourcesRec.append($('<option>', { value: item }).text(loca.GetText("RES", item))).prop("outerHTML");
			});
			$('#aTradeModalData').append(
				$('<div>', { 'class': 'container-fluid', 'style' : 'height:auto;' }).append([
					createTableRow([
						[2, 'Friend'],
						[3, select_friend(_friends) ],
						[2, ''],
						[2, "Double Trade?"],
						[3, createSwitch("aTradeDoubleTradeCheck", true)]
					], false),
					createTableRow([
						[2, 'Send'],
						[3 , select_resourcesSend],
						[2, ''],
						[2,  'Receive'],
						[3, select_resourcesRec],
					], false),
					createTableRow([
						[2, 'Amount'],
						[3, '<input type="text" style="color:black;" id="aTradeAmountSendSelect"/>'],
						[2, 'Inventory: ' + '<label id="aTradeSelectedAmount">0</label>'],
						[2,  'Amount'],
						[3, '<input type="text" style="color:black;" id="aTradeAmountReceiveSelect"/>'],
					], false),
					$('<br>'),
					$('<label>').text('List of saved transactions'),
					createTableRow([
						[2,  'Friend'],
						[2, 'Send'],
						[2, 'Amount'],
						[2, 'Receive'],
						[2, 'Amount'],
						[2, 'Double Trade?']
					], true),
					$('<div>', { id: 'aTradeTransactions'})
				])
			)
	
			$("#aTradeModal .modal-footer").prepend([
				$('<button>').attr({ "id": "aTradeSendItem", "class": "btn btn-primary pull-left" }).text('Send'),
				$('<button>').attr({ "id": "aTradeAddItem", "class": "btn btn-primary pull-left" }).text('Save Trade'),
			]);
			loadTransactions();

			$('#aTradeSendSelect').change(function(){
				var amount = game.zone.GetResources(game.player).GetResourceAmount($(this).val()).toString()
				$('#aTradeSelectedAmount').text(amount.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
			});

			$('#aTradeSendItem').click(function () { 
				var trade = {
					'ID' : new Date().getTime(),
					'SendResource' : $('#aTradeSendSelect option:selected').val(),
					'SendAmount' : parseInt($("#aTradeAmountSendSelect").val()),
					'ReceiveResource' : $('#aTradeReceiveSelect option:selected').val(),
					'ReceiveAmount' : parseInt($("#aTradeAmountReceiveSelect").val()),
					'ISDT' : $("#aTradeDoubleTradeCheck").prop("checked"),
					'FriendID' : $('#aTradeFriendSelect option:selected').val(),
					'FriendName' : $('#aTradeFriendSelect option:selected').text()
				};
				if (trade.SendResource == "" ||
					trade.ReceiveResource == "" ||
					trade.FriendID == "" ||
					trade.SendAmount < 1 ||
					trade.ReceiveAmount < 1)
					return;
				aTrade.exec(trade);
			});
			
			$('#aTradeAddItem').click(function () { 
				var trade = {
					'ID' : new Date().getTime(),
					'SendResource' : $('#aTradeSendSelect option:selected').val(),
					'SendAmount' : parseInt($("#aTradeAmountSendSelect").val()),
					'ReceiveResource' : $('#aTradeReceiveSelect option:selected').val(),
					'ReceiveAmount' : parseInt($("#aTradeAmountReceiveSelect").val()),
					'ISDT' : $("#aTradeDoubleTradeCheck").prop("checked"),
					'FriendID' : $('#aTradeFriendSelect option:selected').val(),
					'FriendName' : $('#aTradeFriendSelect option:selected').text()
				};
				if (trade.SendResource == "" ||
					trade.ReceiveResource == "" ||
					trade.FriendID == "" ||
					trade.SendAmount < 1 ||
					trade.ReceiveAmount < 1)
					return;
				
				aSettings.Trade.Trades[trade.ID] = trade;
				auto.SaveSettings();
				loadTransactions();
			});
			
			$('#aTradeModalData').on('click', '.aTradeDelItem', function (e){
				try{
					delete aSettings.Trade.Trades[$(this).val()];
					auto.SaveSettings();
					loadTransactions();				
				} catch (a) { }
			}).on('click', '#aTradeTransactions .row div', function (e){
				if(!this.nextSibling) return;
				var trade = aSettings.Trade.Trades[$(this).parent().find('.close').val()];
				$('#aTradeFriendSelect').val(trade.FriendID);
				$('#aTradeSendSelect').val(trade.SendResource).change();
				$('#aTradeAmountSendSelect').val(trade.SendAmount);
				$('#aTradeReceiveSelect').val(trade.ReceiveResource);
				$('#aTradeAmountReceiveSelect').val(trade.ReceiveAmount);
				$('#aTradeDoubleTradeCheck').prop("checked", trade.ISDT);
			});
			$('#aTradeModalData .aTradeSendItem2').click(function (e) {
				var trade = aSettings.Trade.Trades[$(this).val()];
				aTrade.exec(trade);
			});
			$('#aTradeModal:not(:visible)').modal({ backdrop: "static" });
		} catch (e) {}
	},
	exec: function(trade) {
		try{
			if (!game.gi.isOnHomzone()) return;

			var EnoughRessiTrade = game.gi.mCurrentPlayerZone.GetResources(game.gi.mCurrentPlayer);

			if(EnoughRessiTrade.HasPlayerResource(trade.SendResource, trade.SendAmount))
			{
				auto.timedQueue.add(function() {
					try {
						aTrade.SendUserTrade2(trade.SendResource, trade.SendAmount, trade.ReceiveResource, trade.ReceiveAmount, trade.FriendID, null);
					} catch (e) {}
				},2000);
				if (trade.ISDT)
					auto.timedQueue.add(function() {
						try {
							aTrade.SendUserTrade2(trade.ReceiveResource, trade.ReceiveAmount, trade.SendResource, trade.SendAmount, trade.FriendID, null);
						} catch (e) {}
					},4000);
			}
			else
			{
				aUI.alert('Trade not sent! Not enough resources', 'ERROR');
			}
		}catch(e){}
	},
	SendUserTrade: function(srcSend, srcSendAmount, srcReceive, srcReceiveAMount, FriendID, response_callback, isBuff) {
		if (!game.gi.isOnHomzone())	return false;
		try
		{
				var ResDef = swmmo.getDefinitionByName("Communication.VO::dResourceVO");
				var TOff = game.def("Communication.VO::dTradeOfferVO", !0);
				var buffOffer = game.def("Communication.VO::dBuffVO", !0);
				var MyBuffID = "";
				var MyBuffID2 = "";
				var Buffnamedata = "";
				var isBuffIntern = false;
				var buffVector = game.gi.mCurrentPlayer.getAvailableBuffs_vector();
					buffVector.forEach(function(data){
						if(isBuff == "Buff" && (data.GetResourceName_string() == srcSend || (data.GetBuffDefinition().GetName_string() == srcSend && data.GetResourceName_string() == "")))
						{
							MyBuffID = data.GetUniqueId().uniqueID1;
							MyBuffID2 = data.GetUniqueId().uniqueID2;
							Buffnamedata = data.GetType();
							isBuffIntern = true;
						}
					});
				if(isBuffIntern)
				{
					buffOffer.amount = srcSendAmount;
					buffOffer.buffName_string = Buffnamedata;
					buffOffer.resourceName_string = srcSend;
					buffOffer.uniqueId1 = MyBuffID;
					buffOffer.uniqueId2 = MyBuffID2;
					buffOffer.sourceZoneId = game.player.GetPlayerId();
					TOff.offerRes = null;
					TOff.offerBuff = buffOffer;			
				}
				else
				{
					var resOffer = new ResDef().init(srcSend, srcSendAmount);
					TOff.offerRes = resOffer;
					TOff.offerBuff = null;
				}
				var resCost = new ResDef().init(srcReceive, srcReceiveAMount);
				TOff.costsRes = resCost;
				TOff.costsBuff = null;
				TOff.receipientId = FriendID;
				TOff.lots = 0;
				TOff.slotType = 4;
				TOff.slotPos = 0;
				aUtils.sendServerMessage(1049, game.gi.mCurrentViewedZoneID, TOff, response_callback);
				aUI.alert("Mail sent", "MAIL_TRADE");
				return true;
		} catch(e) {}
		return false;
	},
	SendUserTrade2: function(srcSend, srcSendAmount, srcReceive, srcReceiveAMount, FriendID, response_callback) 
	{
		if (!game.gi.isOnHomzone())	return false;
		try
		{
			var ResDef = swmmo.getDefinitionByName("Communication.VO::dResourceVO");
			var TOff = game.def("Communication.VO::dTradeOfferVO", !0);
			var resOffer = new ResDef().init(srcSend, srcSendAmount);
			var resCost = new ResDef().init(srcReceive, srcReceiveAMount);
			TOff.offerRes = resOffer;
			TOff.offerBuff = null;
			TOff.costsRes = resCost;
			TOff.costsBuff = null;
			TOff.receipientId = FriendID;
			TOff.lots = 0;
			TOff.slotType = 4;
			TOff.slotPos = 0;
			//air.Introspector.Console.log(TOff);
			aUtils.sendServerMessage(1049, game.gi.mCurrentViewedZoneID, TOff, response_callback);
			aUI.alert("Mail sent", "MAIL_TRADE");
			return true;
		} catch(e) {}
		return false;
	},
	SendTOTrade: function(data, key){
		try
		{
			if(!aUtils.EnoughResource(data.Send[0], data.Send[1])) return;
			var ResDef = game.def("Communication.VO::dResourceVO");
			var TOff = game.def("Communication.VO::dTradeOfferVO", !0);
			TOff.offerRes =  new ResDef().init(data.Send[0], data.Send[1]);
			TOff.offerBuff = null;
			TOff.costsRes = new ResDef().init(data.Receive[0], data.Receive[1]);
			TOff.costsBuff = null;
			TOff.lots = 1;
			TOff.slotType = data.slotType;
			TOff.slotPos = data.slotPos;
			aUtils.sendServerMessage(1049, game.gi.mCurrentViewedZoneID, TOff, game.createResponder(function(e,d){ 
				aQuests.TOTrades[key].Live = true;
			}))
			aUI.alert("Trade sent to Trade Office", "MAIL_TRADE");
		} catch(e) {}
	},
	test: function(){
		var t = {
			"Send" : ["Stone", 100],
			"Receive": ["Fish", 1],
			"slotType": 0,
			"slotPos": 0
		}
		aTrade.SendTOTrade(t);
	}
}
//-------------- Auto Star to Store --------------
const aStar2Store = {
	Modal: function(){
		try{
			if (!game.gi.isOnHomzone()) 
				return aUI.alert(getText('not_home'), 'ERROR');
			var save = function(){
				try{
					aSettings.Star2Store.boxTypes = [];
					aData.Resources(true).forEach(function(x){
						if(autoWindow.withsBody("#aStar2Store_sw_" + x).prop("checked"))
							aSettings.Star2Store.boxTypes.push(x);
					});
					auto.SaveSettings(1);
					autoWindow.shide();
				} catch(e) {}
			}
			var tableData = function(){
				try {
					return aData.Resources(true).map(function(x){
							var isSelected = (aSettings.Star2Store.boxTypes.indexOf(x) >= 0);
							var buff = aUtils.getBuff(x, 'AddResource');
							return createTableRow(
								[
									[1, createSwitch("aStar2Store_sw_" + x, isSelected)],
									[5, getImage(assets.GetResourceIcon(x).bitmapData, "23px")  + " " + aUtils.findTextOf(x)],
									[6, buff ? "{0}".format(buff.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0"]
								], false);
						});
					
				} catch (e) {}
			}
			autoWindow.settings(save);
			autoWindow.sDialog().css("height", "80%");
			autoWindow.sTitle().html("{0} {1}".format(
				utils.getImageTag('icon_dice.png', '45px'),
				"Star to Store")
			);
			autoWindow.sData().append(
				$('<div>', { 'class': 'container-fluid', 'style' : 'height:auto;' }).append([
					createTableRow([
						[1, 'Transfer'],
						[5, 'Type'],
						[6, 'Amount in Star']
					], true),
				].concat(tableData()))
			);
			autoWindow.sshow();
		}catch(e){}
	},
	exec: function(){
		if (!game.gi.isOnHomzone() || !auto.isOn.Star2Store) return;
		try {
			var buffList = game.def("Communication.VO::dBuffListVO", 1);
				buffList.buffList = game.def("mx.collections::ArrayCollection", 1);
				buffList.target_string = "Mayorhouse";
			aSettings.Star2Store.boxTypes.forEach(function(item) {
				var buffItem = aUtils.getBuff(item, 'AddResource');
				if(!buffItem) return;
				var storeItem = game.gi.mCurrentPlayerZone.GetResources(game.gi.mHomePlayer).GetPlayerResource(item)
				if (storeItem.amount != storeItem.maxLimit)
				{
					var buff = game.def("Communication.VO::dBuffVO", 1);
					buff.uniqueId1 = buffItem.GetUniqueId().uniqueID1;
					buff.uniqueId2 = buffItem.GetUniqueId().uniqueID2;
					buff.amount = buffItem.GetAmount();
					buffList.buffList.addItem(buff);
				}
			});
			if (buffList.buffList.length > 0)
				auto.timedQueue.add(function(){ 
					try {
						game.gi.SendServerAction(63, 0, 8825, 0, buffList); 
					} catch (e) {}
				});
		} catch (ex) { debug(ex) }
	}
}
//-------------- Auto Open Mystery Boxs --------------
const aStarBoxs = {
	Types: [
		"Loottable_Starfall_MysteryBoxRadiator",
		"Loottable_Starfall_MysteryBoxHardRock",
		"Loottable_Starfall_MysteryBoxFruitTree",
		"Loottable_GhostLanternMysteryBox",
		"Loottable_GiftChristmasTreeMysteryBox",
		"Loottable_FlyingHouseMysteryBox",
		"Loottable_BalloonMarket_mini_MysteryBox",
		"Loottable_Starfall_MysteryBox1",
		"Loottable_Starfall_MysteryBox2",
		"Loottable_Starfall_MysteryBox3",
		"Loottable_Starfall_MysteryBox4",
		"Loottable_Starfall_MysteryBox1B",
		"Loottable_Starfall_MysteryBox2B",
		"Loottable_Starfall_MysteryBox3B",
		"Loottable_Starfall_MysteryBox4B",
		"Loottable_MysteryBoxBlackKnights",
		"Loottable_CollectibleMysteryBox",
		"Loottable_ChristmasMysteryBoxDeco",
		"Loottable_ChristmasMysteryBoxResource",
		"Loottable_MysteryBoxAdventure",
		"Loottable_NormalResourceBox",
		"Loottable_LuxuryResourceBox",
		"Loottable_SummerEventMysteryBox",
		"Loottable_MiniAdventureBox",
		"Loottable_RefillMysteryBox",
		"Loottable_HalloweenMysteryBox",
		"Loottable_Easter2015MysteryBox",
		"Loottable_Easter2016MysteryBox",
		"Loottable_CostumeTimeMysteryBox",
		'Loottable_ValentineBox',
		'Loottable_ValentineCardBox'
	],
	Modal: function(){
		try{
			if (!game.gi.isOnHomzone()) 
				return aUI.alert(getText('not_home'), 'ERROR');
			var save = function(){
				try{
					aSettings.StarBoxs.boxTypes = [];
					aStarBoxs.Types.forEach(function(x){
						if(autoWindow.withsBody("#aStarBoxs_sw_" + x).prop("checked"))
							aSettings.StarBoxs.boxTypes.push(x);
					});
					auto.SaveSettings(1);
					autoWindow.shide();
				} catch(e) {}
			}
			var tableData = function(){
				try {
					return aStarBoxs.Types.sort(function(a, b){
							a = aUtils.findTextOf(a);
							b = aUtils.findTextOf(b);
							return a.localeCompare(b);
						}).map(function(x){
							//aSettings.Star2Store.boxTypes
							var isSelected = (aSettings.StarBoxs.boxTypes.indexOf(x) >= 0);
							var buff = aUtils.getBuff(x);
							return createTableRow(
								[
									[1, createSwitch("aStarBoxs_sw_" + x, isSelected)],
									[8, getImage(assets.GetBuffIcon(x).bitmapData, "23px")  + " " + aUtils.findTextOf(x)],
									[3, buff ? "{0}".format(buff.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0"]
								], false);
						});
					
				} catch (e) {}
			}
			autoWindow.settings(save);
			autoWindow.sDialog().css("height", "80%");
			autoWindow.sTitle().html("{0} {1}".format(
				getImage(assets.GetBuffIcon('Loottable_MysteryBoxBlackKnights').bitmapData),
				"Manage Star Mystery Boxes")
			);
			autoWindow.sData().append(
				$('<div>', { 'class': 'container-fluid', 'style' : 'height:auto;' }).append([
					createTableRow([
						[1, 'Open'],
						[8, 'Box Type'],
						[3, 'Amount']
					], true),
				].concat(tableData()))
			);
			autoWindow.sshow();
		}catch(er){}
	},
	exec: function(){
		if (!game.gi.isOnHomzone() || !auto.isOn.StarBoxs) return;
		try{
			const responder = game.createResponder(
				function(e, response){ 
					if(!response.data || !response.data.data || !response.data.data.items)
						return;
					response.data.data.items.source.forEach(function(item){
						var name = item.resourceName_string != "" ? item.resourceName_string : item.buffName_string;
						aUI.alert('Congratulations, you got {0} x{1} from mystery box!'.format(aUtils.findTextOf(name), item.amount), 
						name);
					});
				},
			function(){ aUtils.alert('Failed to open box!', 'ERROR')});
			aSettings.StarBoxs.boxTypes.forEach(function(type){
				const box = aUtils.getBuff(type);
				if(!box) return;
				if(box.getAmount() == 0) return;
				auto.timedQueue.add(function(){
					try {
						game.gi.SendServerAction(61, 0, 8825, 0, box.GetUniqueId(), responder);
					} catch (e) {}
				});
			});
		}catch(er){}
	}
}
//-------------- Tweaks --------------
const aTweaks = {
	Apply: function(){
		try 
		{
			var Glob = swmmo.getDefinitionByName("global");
			globalFlash.gui.mChatPanel.getViewComponent().messageHistory.maxEntries = aSettings.Tweaks.ChatMax ? 100 : 300;
			Glob.tradeMaxAdventureAmount = aSettings.Tweaks.TradeAdventureMax ? 100 : 10;
			Glob.tradeMaxBuildingAmount = aSettings.Tweaks.TradeBuildingMax ? 100 : 10;
			Glob.tradeMaxBuffAmount = aSettings.Tweaks.TradeBuffMax ? 10000 : 1000;
			Glob.tradeRefreshInterval = aSettings.Tweaks.TradeFreshInterval ? 10 : 30;
			Glob.maxAnimalsOnMap = aSettings.Tweaks.GUIMaxAnimals ? 50 : 100;
			Glob.mailboxPageSize = aSettings.Tweaks.MailPageSize ? 100 : 50;
		} catch(e){}
	}
}
//-------------- Event ----------------
const aEvent = {
	DepositNeeded: function(){
		const cEvent = game.gi.mEventManager.GetActiveEventNames().filter(function(e){ return e.indexOf('_Shop') > -1; })[0];
		if(!cEvent) return aUI.alert("Something is wrong, can't find event", 'ERROR');
		var eEndTime = game.gi.mEventManager.GetEventStopDate(cEvent);
			eEndTime = eEndTime - (new Date().getTime());
		if(cEvent.indexOf('Valentine') > -1){
			var eWorkTime = game.def("ServerState::gEconomics").GetResourcesCreationDefinitionForBuilding('FlowerFarm').workTime;
				eWorkTime = (eWorkTime + 12) * 1000;
			var Refills = Math.ceil(eEndTime / eWorkTime);
			aUI.alert("Each Flower Farm should have {0} deposit".format(Refills), 'ValentinesFlower');
		}else if(cEvent.indexOf('Halloween') > -1){
			for(i = 1; i < 4; i++){
				const wName = 'pumpkinfield_0' + i;
				var eWorkTime = game.def("ServerState::gEconomics").GetResourcesCreationDefinitionForBuilding(wName).workTime;
					eWorkTime = (eWorkTime + 12) * 1000;
				var Refills = Math.ceil(eEndTime / eWorkTime);
				aUI.alert('Each {0} should have {1} deposits'.format(loca.GetText('BUI', wName), Refills), 'HalloweenResource');
			}
		}else{
			aUI.alert("This event doesn't have any farms ;)", 'ERROR');
		}
	},
	EventWithDepo: function(){
		const cEvent = game.gi.mEventManager.GetActiveEventNames().filter(function(e){ return e.indexOf('_Shop') > -1; })[0];
		if(!cEvent) return false;
		if(cEvent.indexOf('Valentine') > -1 || cEvent.indexOf('Halloween') > -1){
			return true;
		}else{
			return false;
		}
	}
}

const auto = {
	version: '1.1.3',
	iProgress: 0,
	iTimer: null,
    isOn: {
        Adventure: false,
        Explorers: false,
		Deposits: false,
		CollectPickups: false,
        Quests: false,
		BookBinder: false,
		Mail: false,
		Star2Store: false,
		StarBoxs: false
    },
    timedQueue: null,
    timerID: null,
	lastExec: 0,
	watchID: null,
	TickMonitor: null,
	cLog: null,
	load:function(){
		auto.iProgress = 0;
		aUI.makeMenu(true);
		aSettings = aUtils.cExtend(aSettings, readSettings(null, 'auto'));
		auto.iTimer = setInterval(function(){
			auto.iProgress += 1;
			aUtils.updateStatus("Initiating {0}%".format(auto.iProgress));
			if(auto.iProgress == 10){
				if(aSettings.Auto.AutoUpdate)
					auto.CheckforUpdate();
				else
					auto.iProgress = 70;
			}
			if (auto.iProgress >= 100) {
				clearInterval(auto.iTimer);
				auto.init();
			}
		}, 300);
	},
	Changelog: function(){
		//alert(auto.cLog[auto.version]);
		$("div[role='dialog']:not(#aChangelogModal):visible").modal("hide");
		$('#aChangelogModal').remove();
		createModalWindow('aChangelogModal', utils.getImageTag('icon_dice.png', '45px') + ' Changelog');
		var data = $.map(Object.keys(auto.cLog).reverse(), function(v){
			var r = [
				createTableRow([[11, "Version: {0}".format(v)], [1, ""]], true)
			];
			$.each(auto.cLog[v], function(i, f){
				r.push(createTableRow([[11, "&#10551; {0}".format(f)], [1, ""]], false));
			});
			r.push($('<br>'));
			return r;
		});
		$('#aChangelogModalData').append(
			$('<div>', { 'class': 'container-fluid', 'style' : 'height:auto;' }).append([].concat(data))
		)
		$('#aChangelogModal:not(:visible)').modal({ backdrop: "static" });
	},
	CheckforUpdate: function(){
		aUI.alert("Checking for update!",'MEMORY');
		try{
			$.get('https://raw.githubusercontent.com/adly98/autoTSO/main/version.json', function(data){
				var json = JSON.parse(data);
				auto.cLog = json.changelog;
				if(auto.CompareVersions(json.version, auto.version) === 1){
					aUI.alert("New Update Available, updating...",'MEMORY');
					auto.iProgress = 50;
					auto.UpdateScript();
				} else { 
					aUI.alert("You are using the latest version :D",'MEMORY');
					auto.iProgress = 80;
				}
			});
		}catch(e){ debug(e) }
	},
	UpdateScript: function(){
		try{
			auto.SaveSettings();
			$.get("https://raw.githubusercontent.com/adly98/autoTSO/main/user_auto.js", function (data) {
				var file = new air.File(air.File.applicationDirectory.resolvePath("userscripts/user_auto.js").nativePath);
				fileStream = new air.FileStream();
				fileStream.open(file, air.FileMode.WRITE);
				fileStream.writeUTFBytes(data);
				fileStream.close();
				auto.iProgress = 90;
				setTimeout(function() {
					aUI.alert("Updated Successfuly ^_^",'MEMORY');
					reloadScripts();
				}, 5000);
			});
		}catch(e){ aUI.alert("New Version couldn't be downloaded @_@",'ERROR'); }
	},
	CompareVersions: function(v1, v2){
		const v1Parts = v1.split('.').map(Number);
		const v2Parts = v2.split('.').map(Number);

		for (var i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
			const v1Part = v1Parts[i] || 0;
			const v2Part = v2Parts[i] || 0;

			if (v1Part > v2Part) return 1;
			if (v1Part < v2Part) return -1;
		}
		return 0;
	},
	init: function(){
		try{
			game.gi.channels.ZONE.addPropertyObserver(
				"ZONE_REFRESHED", game.getTracker('zRefresh', aUtils.zoneRefreshed)
			);
			game.gi.channels.SPECIALIST.addPropertyObserver(
				"generalbattlefought", game.getTracker('battleFinished', aUtils.battleFinished)
			);
			
			//soldSuccessful
			this.isOn.Explorers = aSettings.Explorers.autoStart;
			this.isOn.Deposits = aSettings.Deposits.autoStart;
			this.isOn.BookBinder = aSettings.Buildings.BookBinder.autoStart;
			this.isOn.Quests = aSettings.Quests.Config.AutoStart;
			this.isOn.CollectPickups = aSettings.Collect.Pickups;
			this.isOn.Mail = aSettings.Mail.AutoStart;
			this.isOn.Star2Store = aSettings.Star2Store.autoStart;
			this.isOn.StarBoxs = aSettings.StarBoxs.autoStart;
			$.extend(aAdventure.data, aSettings.Adventures.lastAdv);
			aTweaks.Apply();
			aUI.makeMenu();
			clearInterval(aSettings.Auto.LastWatchID);
			this.start();
			this.watchID = setInterval(function(){
				if (new Date() - auto.lastExec > 180000 && auto.lastExec) {//3 minutes
					aUI.alert("Restarting Copiolt!", 'ERROR');
					auto.stop();
					auto.start();
				}
			}, 1000);
			this.TickMonitor = setInterval(function(){
				if(game.gi.mGameTickCommand_vector.length > 1){
					$.each(game.gi.mGameTickCommand_vector, function(i, tick){
						if(tick.mode == 120) return;
						else if(tick.mode == 1062){
							$.each(tick.data, function(i, trade){
								$.each(aQuests.TOTrades, function(key, val){
									if(trade.offer == val.Offer)
										aQuests.TOTrades[key].Live = trade.id;
								})
							});
						}
					});
				}
			}, 2000);
			aSettings.Auto.LastWatchID = this.watchID;
			auto.SaveSettings();
		}catch(er){ debug(er) }
	},
    start: function(time){
		aUI.alert("All Set and ready to go!", 'MEMORY');
		auto.lastExec = new Date().getTime();
        auto.timerID = setTimeout(aCycle.run, 1000);
    },
    stop: function(){ 
        clearTimeout(auto.timerID); 
    },
	SaveSettings: function(alert){
		try
		{
			settings.settings['auto'] = [];
			storeSettings(aSettings, 'auto');
			if(alert)
				aUI.alert("Settings Saved!");
		} catch(e){}
	}
}
const aSettings = {
	Auto:{
		LastWatchID: 0,
		AutoUpdate: true,
	},
	Explorers: {
		autoStart: false,
		template: "",
		useTemplate: false
	},
	Adventures: {
		speedBuff: "GeneralSpeedBuff_Bronze",
		blackVortex: false,
		templates: [],
		lastAdv: {},
		reTrain: false
	},
	Deposits: {
		autoStart: false,
		data: { 
			Stone: { max: 8, geos: [], options: [true, null, null, null, true] },
			BronzeOre: { max: 6, geos: [], mine: 36, options: [true, true, true, 3, true] },
			Marble: { max: 10, geos: [], options: [true, null, null, null, true] },
			IronOre: { max: 19, geos: [], mine: 50, options: [true, true, true, 3, true] },
			GoldOre: { max: 9, geos: [], mine: 46, options: [true, true, true, 3, true] },
			Coal: { max: 6, geos: [], mine: 37, options: [true, true, true, 3, true] },
			Granite: { max: 6, geos: [], options: [true, null, null, null, true] },
			TitaniumOre: { max: 4, geos: [], mine: 69, options: [true, true, true, 3, true] },
			Salpeter: { max: 4, geos: [], mine: 63, options: [true, true, true, 3, true] }
		}
	},
	Quests: {
		Letters: {
			SharpClaw: true, 
			StrangeIdols: true,
			Annoholics: true,
			SilkCat: true,
			Miranda: true,
			BartTheBarter: true,
			Vigilante: true,
			SettlersBandits: true,
			LostCompass: true,
			AThreat: true
		},
		Mini: {
			TheLittlePanda: true,
			MysteriousCoin: true,
			WeddingInvitation: true,
			ANewStone: true,
			SaveTheDeers: true,
			WolfPuppy: true
		},
		Other: {
			Daily: false,
			DailyGuild: false,
			Weekly: false,
		},
		Config: {
			AutoStart: false,
			PayResources: true,
			ProduceBuffs: true,
			ApplyBuffs: true,
			SellinTO: true,
			TrainUnits: true,
			GatherfromStar: true,
			Explorers:{
				Treasure: {
					Short: [],
					Medium: [],
					Long: [],
					EvenLonger: [],
					Prolonged: []
				},
				AdventureZone: {
					Short: [],
					Medium: [],
					Long: [],
					VeryLong: []
				}
			}
		}
	},
	Buildings: {
		BookBinder: {
			autoStart: false,
			bookType: "Manuscript",
			autoBuff: false,
			buffType: "BookbinderBuffLvl1"
		}
	},
	Mail: {
		AutoStart: false,
		EnabledUsers: {},
		EnabledResources: {},
		TimerMinutes : 3,
		AcceptLoots : true,
		AcceptGifts: true,
		AcceptGeologistMsg : true,
		AcceptAdventureLoot : true,
		AcceptAdventureMessage : true,
		SaveFriendsTrades : false,
		DeclineTrades : true,
		CompleteTrades: false,
		AcceptInvites : false,
		ToStar : false,
		AcceptGuildTrades: false,
		AllowAllResources: false,
		AllResourcesMax: 0
	},
	Star2Store: {
		autoStart: false,
		boxTypes: []
	},
	StarBoxs: {
		autoStart: false,
		boxTypes: []
	},
	Trade: {
		Trades: {}
	},
	Collect: {
		Pickups: true,
		LootBoxes: true
	},
	Tweaks: {
		ChatMax: false,
		TradeAdventureMax: false,
		TradeBuildingMax: false,
		TradeBuffMax: false,
		TradeFreshInterval: false,
		GUIMaxAnimals: false,
		MailPageSize: false
	},
	misc: {
		showGrid: false,
	}
}
auto.load();