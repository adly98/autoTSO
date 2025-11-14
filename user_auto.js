/**
 * @fileoverview AutoTSO Main Automation Script
 *
 * This file contains the core automation system for The Settlers Online game.
 * It provides automated management of adventures, quests, mail, trading, resource
 * production, and other game activities through a queue-based execution system.
 *
 * Main Components:
 * - aSession: Session state and runtime data
 * - aQueue: Action queue management and execution
 * - aSettings: Configuration persistence
 * - aUtils: Utility functions for file I/O, UI, and game interactions
 * - aAdventure: Adventure automation and battle management
 * - aMail: Mail and inbox management
 * - aTrade: Trading system integration
 *
 * @version 2.0.2
 */

var AdventureManager = game.def("com.bluebyte.tso.adventure.logic::AdventureManager").getInstance();

// Configuration Constants
const TIMEOUTS = {
    QUEUE_RESTART_DELAY: 1000,
    QUEUE_SKIP_DELAY: 2000,
    TEMPLATE_STATUS_CLEAR: 3000,
    ADVENTURE_RETRY_DELAY: 5000,
    ADVENTURE_START_DELAY: 10000,
    ADVENTURE_QUEST_COMPLETE_DELAY: 10000,
    ADVENTURE_TRAIN_UNITS_DELAY: 12000,
    MAIL_RETRY_DELAY: 15000,
    WATCHER_INTERVAL: 30000,
    WATCHER_TIMEOUT_THRESHOLD: 5000,
    EXCELSIOR_INTERVAL: 3000,
    EXCELSIOR_TIMEOUT: 10000
};

const LIMITS = {
    MAX_QUEUE_INTERVAL: 10,
    DEFAULT_QUEUE_DELAY: 1500,
    TRADE_OUTBOX_VALUE: 5000,
    TRADE_BUFF_MAX_DEFAULT: 1000,
    TRADE_BUFF_MAX_TWEAKED: 10000,
    TRADE_MAX_INPUT: 5000,
    CLIENT_PACKET_TIMEOUT_DEFAULT: 30000,
    CLIENT_PACKET_TIMEOUT_INCREASED: 120000
};

const WORK_TIME_OFFSET_SECONDS = 12;
// Console polyfill for AIR compatibility (console object doesn't exist in AIR)
if (typeof console === 'undefined') {
    var console = {
        log: function(msg) { debug('[LOG] ' + msg); },
        error: function(msg) { debug('[ERROR] ' + msg); },
        warn: function(msg) { debug('[WARN] ' + msg); }
    };
}

// Session Data
const aSession = {
    observers: [],
    isOn: {
        Adventure: false,
        Explorers: false,
        Deposits: false,
        CollectPickups: false,
        Quests: false,
        Buildings: false,
        Mail: false,
        FromStarToStore: false,
        OpenMysteryBoxs: false
    },
    excelsior: {
        sCategory: 0,
        sCollection: 0,
        interval: null
    },
    zoneAction: null,
    mail: {
        monitor: new Date().getTime(),
        pendingTrades: {},
        pendingInvites: {},
        lootMails: game.def("mx.collections::ArrayCollection", !0)
    },
    adventure: {
        name: null,
        lostArmy: {},
        index: 0,
        action: '',
        repeatCount: 0,
        lastTime: null,
        steps: [],
        getGenerals: function (current) {
            const step = aSession.adventure.steps[current ? aSession.adventure.index : 0];
            if (!current && step.name !== 'InHomeLoadGenerals') return [];
            return Object.keys(step.data);
        },
        getEnemies: function (current) {
            const enemies = { all: [], remaining: [] };
            if (aSession.adventure.name.indexOf('BuffAdventures') === 0) return enemies;
            $.each(aSession.adventure.steps, function (i, step) {
                if (current && i !== aSession.adventure.index) return;
                if (step.name !== 'AdventureTemplate') return;
                $.each(step.data, function (id, item) {
                    if (!item.target || enemies.all.indexOf(item.target) > -1) return;

                    enemies.all.push(item.target);

                    const building = game.zone.GetBuildingFromGridPosition(item.target);
                    if (building && building.getPlayerID() === -1)
                        enemies.remaining.push(item.target);
                });
            });
            enemies.all = enemies.all.length;
            enemies.remaining = enemies.remaining.length;
            return enemies;
        },
        getArmy: function (current) {
            const army = {};
            const step = aSession.adventure.steps[current ? aSession.adventure.index : 0];
            if (!current && step.name !== 'InHomeLoadGenerals') return army;
            $.each(step.data, function (id, item) {
                $.each(item.army, function (unit, amount) {
                    army[unit] = (army[unit] || 0) + amount;
                });
            });
            return army;
        },
        getLostUnits: function () {
            const result = {
                total: 0,
                army: {}
            };
            aAdventure.army.updateArmy();
            $.each(aSession.adventure.getArmy(), function (unit, amount) {
                const lost = amount - armyInfo.total[unit];
                if (lost <= 0) return;
                result.army[unit] = lost;
                result.total += lost;
            });
            return result;
        },
        currentStep: function () {
            try {
                return aSession.adventure.steps[aSession.adventure.index];
            } catch (e) { return {} }
        },
        nextStep: function () {
            aSession.adventure.index++;
            if (aSession.adventure.index < aSession.adventure.steps.length)
                delete this.currentStep().applied;
        },
        reset: function () {
            var repeat = aSession.adventure.repeatCount > 0 ? true : false;
            aSession.adventure.name = repeat ? aSession.adventure.name : null;
            aSession.adventure.index = 0;
            aSession.adventure.action = '';
            aSession.adventure.repeatCount = repeat ? aSession.adventure.repeatCount : 0;
            aSession.adventure.lastTime = null;
            aSession.adventure.steps = repeat ? aSession.adventure.steps : [];
        }
    }
}

/**
 * Action Queue Manager
 *
 * Manages the execution queue for all automation actions. Actions are added to
 * the queue and executed sequentially with configurable delays between them.
 * The queue automatically restarts after completion and includes a watchdog
 * system to detect and recover from stuck operations.
 *
 * @namespace aQueue
 */
const aQueue = {
    queue: [],
    waiting: [],
    index: 0,
    delay: LIMITS.DEFAULT_QUEUE_DELAY,
    interval: LIMITS.MAX_QUEUE_INTERVAL,
    last: null,
    tID: null,

    /**
     * Adds an action to the end of the execution queue
     * @param {string} name - The action name (must exist in aQueue.actions)
     * @param {Array} [params] - Parameters to pass to the action function
     * @param {number} [delay] - Optional delay in milliseconds before this action executes
     * @returns {void}
     */
    add: function (name, params, delay) {
        const obj = {
            fn: name,
            params: params || null,
            delay: delay || null
        }
        aQueue.queue.push(obj);
    },

    /**
     * Adds an action to the waiting queue (executed on next queue run)
     * @param {string} name - The action name
     * @param {Array} [params] - Parameters for the action
     * @param {number} [delay] - Optional delay in milliseconds
     * @returns {void}
     */
    addToWaiting: function (name, params, delay) {
        const obj = {
            fn: name,
            params: params || null,
            delay: delay || null
        }
        aQueue.waiting.push(obj);
    },

    /**
     * Inserts an action immediately after the current position in the queue
     * @param {string} name - The action name
     * @param {Array} [params] - Parameters for the action
     * @param {number} [delay] - Optional delay in milliseconds
     * @returns {void}
     */
    addNext: function (name, params, delay) {
        aQueue.clearIDs();
        aQueue.queue.splice(aQueue.index + 1, 0, { fn: name, params: params || null });
        game.auto.aQueueIDs.push(setTimeout(function () { aQueue.next() }, delay || aQueue.delay));
    },

    /**
     * Resets the queue to initial state (clears all queued actions)
     * @returns {void}
     */
    reset: function () {
        aQueue.index = 0;
        aQueue.queue = [];
        if (game.aWatcherID) {
            clearInterval(game.aWatcherID);
            game.aWatcherID = null;
        }
        // Clean up property observers
        aSession.observers.forEach(function (observer) {
            try {
                observer.channel.removePropertyObserver(observer.property, observer.tracker);
            } catch (e) {
                debug('[WARN] Failed to remove observer: ' + e);
            }
        });
        aSession.observers = [];
    },

    /**
     * Merges waiting queue into the main queue
     * @returns {void}
     */
    addWaiting: function () {
        aQueue.queue = aQueue.queue.concat(aQueue.waiting);
        aQueue.waiting = [];
    },

    /**
     * Starts a new queue cycle, populating it with all automation tasks
     * This is the main entry point for the automation system. It checks
     * all enabled features and adds appropriate actions to the queue.
     * @returns {void}
     */
    run: function () {
        aQueue.clearIDs();
        aQueue.reset();
        aQueue.add('status', ['Looking for something to do ^_^']);
        aQueue.addWaiting();
        aQuests.manage();
        aSpecialists.manageExplorers();
        aBuildings.deposits.manage();
        aBuildings.collectibles.manage();
        aBuildings.manage();
        aResources.transferFromStarToStore();
        aBuffs.openLootables();
        aMail.manage();
        aAdventure.auto.start();
        aUtils.game.checkRAM();
        aQueue.add('status', ['']);
        aQueue.next();
    },
    clearIDs: function () {
        if (!game.auto.hasOwnProperty('aQueueIDs')) {
            game.auto.aQueueIDs = [];
            return;
        }
        game.auto.aQueueIDs.forEach(function (id) { clearTimeout(id); });
        game.auto.aQueueIDs = [];
    },

    /**
     * Restarts the queue after a countdown interval
     * Called automatically when the queue completes or is idle
     * @returns {void}
     */
    restart: function () {
        if (aQueue.interval <= 0) {
            aQueue.interval = LIMITS.MAX_QUEUE_INTERVAL;
            aQueue.run();
        } else {
            aUI.updateStatus('idle...', 'Auto');
            aQueue.interval--;
            aQueue.countDown();
        }
    },
    countDown: function () {
        game.auto.aQueueIDs.push(setTimeout(aQueue.restart, TIMEOUTS.QUEUE_RESTART_DELAY));
    },

    /**
     * Skips the current action and moves to the next one immediately
     * Clears all pending timeouts before advancing
     * @returns {void}
     */
    skip: function () {
        aQueue.clearIDs();
        aQueue.next();
    },

    /**
     * Executes the next action in the queue
     * Automatically advances the queue index and schedules the following action
     * @returns {void}
     */
    next: function () {
        const current = aQueue.queue[aQueue.index];
        aQueue.last = new Date().getTime();
        if (!current) { return aQueue.restart(); }
        try { aQueue.actions[current.fn](current.params); } catch (e) { debug(e) }
        //aQueue.queue[aQueue.index] = null;
        const next = aQueue.queue[++aQueue.index];
        if (!next) { return aQueue.restart(); }
        game.auto.aQueueIDs.push(setTimeout(function () { aQueue.next(); }, next.delay || aQueue.delay));
    },
    repeat: function (delay) {
        aQueue.clearIDs();
        aQueue.index--;
        setTimeout(function () { aQueue.next() }, delay || aQueue.delay);
    },
    actions: {
        status: function (args) {
            aUI.updateStatus(args[0], args[1] || 'Auto');
        },
        sendExplorer: function (args) {
            aUI.updateStatus("Sending explorers ({0}/{1})".format(args[2], args[3]), 'Explorers');
            aUtils.game.sendSpecialistPacket(aUtils.game.uID(args[0]), args[1][0], args[1][1]);
        },
        sendGeologist: function (args) {
            aUI.updateStatus('Sending geologists to search for {0} deposit ({1}/{2})'.format(
                loca.GetText("RES", args[2]), args[3], args[4]), 'Geologists');
            aUtils.game.sendSpecialistPacket(aUtils.game.uID(args[0]), 0, args[1]);
        },
        collect: function (args) {
            const building = game.zone.GetBuildingFromGridPosition(args[0]);
            game.gi.SelectBuilding(building);
            aUI.updateStatus('Collecting {0}{1}!'.format(
                args[1] ? 'Mystery Box from ' : '',
                loca.GetText('BUI', building.GetBuildingName_string())
            ), 'Collectibles');
            globalFlash.gui.UpdateGuiOnZoneLoad();
        },
        completeQuest: function (name) {
            const quest = game.quests.getQuest(name);
            if (quest.isFinished()) {
                aUI.updateStatus('Completing "{0}" quest!!'.format(loca.GetText('QUL', quest.getQuestName_string())), 'Quests');
                game.quests.RewardOkButtonPressedFromGui(quest);
            }
            if (aAdventure.info.isOnAdventure()
                && aSession.adventure.name
                && aSession.adventure.currentStep().name === "CollectPickups") {
                aSession.adventure.nextStep();
                aUI.updateStatus('Pickups Collected!', 'Adventure');
            }
        },
        startProduction: function (args) {
            aBuildings.production.order(args[0], args[1] || 1, args[2] === false ? false : true, args[3], args[4]);
        },
        completeProduction: function (args) {
            game.gi.mClientMessages.SendMessagetoServer(141, game.gi.mCurrentViewedZoneID, args[0]);
            aUI.updateStatus("{0} produced successfully.".format(args[1]));
        },
        killMonster: function (args) {
            game.gi.SendServerAction(165, 0, args[0], 0, null);
            aUI.updateStatus("Destroying {0}!".format(loca.GetText('BUI', args[1])), 'Quests');
        },
        gatherResource: function (args) {
            switch (args[0]) {
                case 'send':
                    aTrade.send(args[1]);
                    break;
                case 'checkOutbox':
                    aUI.updateStatus('Checking Trades in OutBox', 'Quests');
                    var v = game.def("Communication.VO::dIntegerVO", !0);
                    v.value = LIMITS.TRADE_OUTBOX_VALUE;
                    game.gi.mClientMessages.SendMessagetoServer(
                        1176, game.gi.mCurrentViewedZoneID, v,
                        aUtils.responders.checkOutbox(args[1])
                    );
                    break;
                case 'checkInbox':
                    aUI.updateStatus('Checking Trades in Inbox', 'Quests');
                    aMail.getHeaders(aUtils.responders.checkInbox(args[1]));
                    break;
            }
        },
        applyBuff: function (args) {
            var status = '';
            var responder = null;
            if (args.what === 'ADVENTURE') {
                status = 'Starting "{0}" Adventure'.format(loca.GetText('ADN', aSession.adventure.name));
                args.type = ['Adventure', aSession.adventure.name];
            } else if (args.what === 'ADVENTURE_BUFF') {
                status = 'Applying "{0}"'.format(
                    loca.GetText('RES', args.type)
                );
            } else if (args.what === 'ON_ADVENTURE_BUFF') {
                status = 'Using "{0}" on "{1}"'.format(
                    loca.GetText('RES', args.type),
                    args.target
                );
            } else if (args.what === 'BOX') {
                status = 'Opening "{0}" Mystery Box'.format(loca.GetText('RES', args.type));
                responder = aUtils.responders.openBox();
            } else if (args.what === 'BUILDING') {
                status = 'Applying "{0}" on "{1}"!'.format(
                    loca.GetText('RES', args.type),
                    loca.GetText('BUI', args.building)
                );
            } else if (args.what === 'BUILDINGS') {
                status = 'Applying "{0}" ({1}/{2})!'.format(
                    loca.GetText('RES', args.type),
                    args.num, args.total
                );
            } else if (args.what === 'QUEST') {
                status = 'Starting "{0}" quest'.format(loca.GetText('QUL', args.quest));
            } else if (args.what === 'RESOURCE') {
                status = 'Transfering x{0} {1} from Star to Store!'.format(args.amount, loca.GetText('RES', args.type[1]));
            }
            aUI.updateStatus(status, 'Buffs');
            aBuffs.applyBuff(args.type, args.grid === 0 ? args.grid : (args.grid || 8825), args.amount || 0, responder);
        },
        friend: function (args) {
            switch (args[0]) {
                case "visit":
                    aSession.zoneAction = 'ApplyBuffOnFriend';
                    game.gi.visitZone(args[1]);
                    aUI.updateStatus("Visiting {0}'s island".format(args[2]), 'Quests');
                    break;
                case 'apply':
                    aUI.Alert('You are on {0} island'.format(args[1]));
                    var targets = aBuffs.getBuffTargets(args[2], args[3]);
                    if ($.isArray(targets)) {
                        $.each(targets, function (i, grid) {
                            aBuffs.applyBuff(args[2], grid, 0, aUtils.responders.buffOnFriend(targets.length === i + 1));
                            aUI.updateStatus('Applying {0} ({1}/{2})!!'.format(loca.GetText('RES', args[2]), i + 1, targets.length), 'Quests');
                        });
                    } else {
                        aBuffs.applyBuff(args[2], targets, args[3], aUtils.responders.buffOnFriend(true));
                        aUI.updateStatus('Applying x{1} {0}!!'.format(loca.GetText('RES', args[2]), args[3]), 'Quests');
                    }
                    break;
                case 'return':
                    aUI.updateStatus('Returning to Home Island', 'Quests');
                    game.gi.visitZone(game.gi.mCurrentPlayer.GetHomeZoneId());
                    break;
                case 'home':
                    aUI.updateStatus("Back at Home Island", 'Quests');
                    break;
            }
        },
        buildMine: function (params) {
            aUI.updateStatus("Building Mine on {0}".format(loca.GetText("RES", params[2])), 'Deposits');
            game.gi.SendServerAction(50, params[0], params[1], 0, null);
        },
        upgradeBuilding: function (params) {
            aUI.updateStatus("Upgrading {0} To Level {1}".format(loca.GetText("BUI", params[1]), params[2]), 'Buildings');
            game.zone.UpgradeBuildingOnGridPosition(params[0]);
        },
        removeBuilding: function (args) {
            aUI.updateStatus('Removing {0} {1}!!'.format(loca.GetText('BUI', args.name), args.num), 'Buildings');
            game.zone.SendDestructBuildingCommand(game.zone.GetBuildingFromGridPosition(args.grid), "minimalInfoPanel");
        },
        turnOnProduction: function (grid) {
            game.zone.GetBuildingFromGridPosition(grid).SetProductionActiveCommand(1);
        },
        payQuest: function (name) {
            var quest = game.quests.getQuest(name);
            globalFlash.gui.mQuestBook.SetPreselectedQuest(quest);
            globalFlash.gui.mQuestBook.Show();
            globalFlash.gui.mQuestBook.Hide();
            game.quests.InitiatePayForQuestFinish(quest.GetUniqueId());
            aUI.updateStatus('Paying for "{0}" quest!!'.format(loca.GetText('QUL', name)), 'Quests');
        },
        mail: function (args) {
            switch (args[0]) {
                case 'getHeaders':
                    aMail.getHeaders();
                    break;
                case 'handleHeaders':
                    try {
                        const op = game.def('ServerState::cConnectionManager').GetInstance().mMailService.operations['GetHeaders'];
                        aMail.handleHeaders(op.lastResult.data.data.headers_collection.toArray());
                    } catch (e) {
                        debug('Empty Mail Response!!');
                        aMail.setMonitor(0.5);
                    }
                    break;
                case 'completeTrade':
                    aTrade.complete(args[1], args[2]);
                    break;
                case 'getBody':
                    aMail.getMailBody(args[1], args[2]);
                    break;
                case 'acceptLoot':
                    aMail.acceptLootMails();
                    break;
            }
        },
        sendOfficeTrades: function () {
            game.gi.mClientMessages.SendMessagetoServer(1062, game.gi.mCurrentViewedZoneID, null, aUtils.responders.sendOfficeTrades());
        },
        finishAdventureQuests: function () {
            try {
                var finishedQuests = game.quests.GetQuestPool().GetQuest_vector().toArray().filter(function (e) { return e && e.isFinished(); });
                $.each(finishedQuests, function (i, quest) {
                    quest.SetQuestMode(1);
                    var dSA = game.def("Communication.VO::dServerAction", true);
                    dSA.type = 1;
                    dSA.data = quest.GetUniqueId();
                    var Responder = quest.GetQuestDefinition().specialType_string.indexOf('lastQuest') > -1 ?
                        game.createResponder(function () {
                            AdventureManager.removeAdventure(aAdventure.info.getActiveAdvetureID());
                            aSession.isOn.Adventure = false;
                            aSession.adventure.action = "FinishAdventure";
                            aSession.adventure.lastTime = new Date().getTime();
                            game.gi.visitZone(game.gi.mCurrentPlayer.GetHomeZoneId());
                        }) : null;
                    game.gi.mClientMessages.SendMessagetoServer(100, game.gi.mCurrentViewedZoneID, dSA, Responder);
                    aUI.playSound('QuestComplete');
                });
            } catch (er) { }
        },
        loadGeneralUnits: function (args) {
            aUI.playSound('UnitProduced');
            game.gi.mClientMessages.SendMessagetoServer(1031, game.gi.mCurrentViewedZoneID, args.army);
            aUI.updateStatus(args.message);
        },
        sendGeneralsToAdventure: function (args) {
            armyServices.specialist.sendToZone(
                armyGetSpecialistFromID(args.id),
                aAdventure.info.getActiveAdvetureID()
            );
            aUI.updateStatus(
                'Sending generals to "{0}" ({1}/{2})'.format(
                    loca.GetText('ADN', aSession.adventure.name),
                    args.num,
                    args.total
                ),
                'Adventure');
        },
        travelToZone: function (destination) {
            const to = {
                "Adventure": aAdventure.info.getActiveAdvetureID(),
                "Home": game.gi.mCurrentPlayer.GetHomeZoneId()
            }
            game.gi.visitZone(to[destination]);
            aUI.updateStatus("Travelling to {0} island!".format(destination), 'Adventure');
        },
        retranchGeneral: function (args) {
            const spec = armyGetSpecialistFromID(args.id);
            armySendGeneralToStar(spec);
            aUI.updateStatus("{0} Sending generals to Star {1}!!".format(args.file || "", args.order || ""), "Adventure");
        },
        moveGeneral: function (args) {
            aAdventure.action.sendGeneralAction(args.id, 4, args.order || "");
            aUI.updateStatus("{0} Moving generals to position {1}!!".format(args.file || "", args.order || ""), "Adventure");
        },
        attackEnemy: function (args) {
            aAdventure.action.sendGeneralAction(args.id, 5, args.order || "");
            aUI.updateStatus("{0} Attacking enemy camps {1}!!".format(args.file || "", args.order || ""), "Adventure");
        }
    },
    watcher: function () {
        if (game.aWatcherID) return;
        game.aWatcherID = setInterval(function () {
            try {
                if (!aQueue.queue.length || !aQueue.last) return;
                const next = aQueue.queue[aQueue.index + 1];
                const delay = next ? next.delay : aQueue.interval;
                if (new Date().getTime() > aQueue.last + delay + TIMEOUTS.WATCHER_TIMEOUT_THRESHOLD) {
                    aUI.Alert('Error Occured!, Restarting Automation!', 'ERROR');
                    aQueue.run();
                }
            } catch (e) { }
        }, TIMEOUTS.WATCHER_INTERVAL);
    }
}

/**
 * Settings Manager
 *
 * Manages application configuration and user preferences. Handles loading,
 * saving, and merging settings with defaults. Settings are persisted to
 * disk as JSON files.
 *
 * @namespace aSettings
 */
const aSettings = {
    defaults: {
        Auto: {
            AutoUpdate: true,
            RestartRAM: 0,
            increaseTimeout: false,
            showGrid: false,
        },
        Security: {
            validateFilePaths: false,
        },
        Explorers: {
            autoStart: false,
            template: "",
            useTemplate: false,
            eventOptimize: false
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
                Ghost: false,
                PathFinder: false,
                Starfall: false
            },
            Config: {
                AutoStart: false,
                PayResources: true,
                SellinTO: true,
                TrainUnits: true,
                GatherfromStar: true,
                Notification: true,
                Explorers: {
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
                },
                Buffs: {
                    PHBuff: '',
                    Apply: true,
                    Produce: true
                },
                ProduceResource: {
                    BuffType: '',
                    TurnOn: false
                }
            }
        },
        Buildings: {
            autoStart: false,
            TProduction: {
                ProvisionHouse: { item: '', amount: 0, stack: 1, buff: '' },
                ProvisionHouse2: { item: '', amount: 0, stack: 1, buff: '' },
                Barracks: { item: '', amount: 0, stack: 1, buff: '' },
                EliteBarracks: { item: '', amount: 0, stack: 1, buff: '' },
                Barracks3: { item: '', amount: 0, stack: 1, buff: '' },
                ExpeditionWeaponSmith: { item: '', amount: 0, stack: 1, buff: '' },
                Bookbinder: { item: '', buff: '' },
                AdventureBookbinder: { item: '', amount: 0, stack: 1 },
                Oilmill: { item: '', amount: 0, stack: 1 },
                OilRefinery: { item: '', amount: 0, stack: 1 },
                Stronghold: { item: '', amount: 0, stack: 1 },
                Smokehouse: { item: '', amount: 0, stack: 1 },
                CarnivalGrounds: { item: '', amount: 0, stack: 1 },
                ArtificerStudy: { item: '', amount: 0, stack: 1 },
                Laboratory: { item: '', amount: 0, stack: 1 },
                SiegeWorkshop: { item: '', amount: 0 },
                ToyFactory: { item: '', amount: 0, stack: 1 },
                Chocolatier: { item: '', amount: 0, stack: 1 },
                SnackStand: { item: '', amount: 0, stack: 1 },
                LoversStatue: { item: '', amount: 0, stack: 1 },
                CandyFactory: { item: '', amount: 0, stack: 1 },
                BalloonMarket: { item: '', amount: 0, stack: 1 },
                S4Lazaret: { item: '', amount: 0, stack: 1 },
                BlackTree_Blue: { item: '', amount: 0, stack: 1 },
                BlackTree_Gold: { item: '', amount: 0, stack: 1 },
                BlackTree_Green: { item: '', amount: 0, stack: 1 },
                BlackTree_Purple: { item: '', amount: 0, stack: 1 },
                BlackTree_Red: { item: '', amount: 0, stack: 1 }
            }
        },
        Mail: {
            AutoStart: false,
            AutoStartEvents: false,
            EnabledUsers: {},
            EnabledResources: {},
            TimerMinutes: 3,
            AcceptLoots: true,
            AcceptGifts: true,
            AcceptGeologistMsg: true,
            AcceptAdventureLoot: true,
            AcceptAdventureMessage: true,
            SaveFriendsTrades: false,
            DeclineTrades: true,
            CompleteTrades: false,
            AcceptInvites: false,
            AcceptTrades: false,
            ToStar: false,
            AcceptGuildTrades: false,
            AllowAllResources: false,
            AllResourcesMax: 0
        },
        TransferToStore: {
            autoStart: false,
            boxTypes: []
        },
        Lootables: {
            autoStart: false,
            boxTypes: []
        },
        Trade: {
            Trades: []
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
        }
    },

    /**
     * Saves current settings to disk as JSON
     * @param {boolean} [alert] - Whether to show a success alert
     * @returns {void}
     */
    save: function (alert) {
        try {
            const data = JSON.stringify(aSettings.defaults, null, 2);
            aUtils.file.Write(aUtils.file.Path('settings'), data);
            if (alert) aUI.Alert("Settings Saved!");
        } catch (e) { debug(e); }
    },

    /**
     * Loads settings from disk and merges with defaults
     * Falls back to reading legacy settings if file doesn't exist
     * @returns {void}
     */
    load: function () {
        var data = aUtils.file.Read(aUtils.file.Path('settings')) || readSettings(null, 'auto');
        aSettings = aSettings.extend(aSettings.defaults, data);
    },
    extend: function (target, source) {
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
                    aSettings.extend(target[prop], source[prop]);
                } else {
                    target[prop] = source[prop];
                }
            } else if (source.hasOwnProperty(prop) && !target.hasOwnProperty(prop)) {
                if (!isNaN(parseInt(prop)))
                    target[prop] = source[prop];
            }
        }
        return target;
    }
}

/**
 * Utility Functions
 *
 * Collection of utility functions for UI creation, file I/O, formatting,
 * game interactions, and event tracking.
 *
 * @namespace aUtils
 */
const aUtils = {
    create: {
        Panel: function (content) {
            return $('<div>', { 'class': 'panel panel-defaults', 'style': 'background: inherit;' }).append([
                // $('<div>', { 'class': 'panel-heading' }).append(header),
                $('<div>', { 'class': 'panel-body' }).append(content)
            ])
        },
        Select: function (id) {
            return $('<select>', { 'class': 'form-control', 'id': id });
        },
        Button: function (id, text) {
            return $('<button>', {
                'style': 'cursor: pointer;text-decoration:none;color:#000;height: 20px;padding: 0px;',
                'class': 'btn form-control',
                'id': id
            }).text(text)
        },
        Span: function (id, text) {
            return $('<span>', {
                'id': id
            }).text(text);
        },
        Switch: function (id, isChecked) {
            return $("<label>", {
                'class': "switch"
            })
                .append($("<input>", {
                    'type': "checkbox",
                    'id': id,
                    'checked': isChecked
                }))
                .append($("<span/>", {
                    'class': "slider round"
                }))
        },
        Row: function (colums, rowClass, header) {
            rowClass = rowClass ? rowClass : '';
            var rowDiv = $("<div>", { 'class': "row {0}".format(rowClass) })
            return colums.forEach(function (colum) {
                var columDiv = $("<div>", {
                    'class': "col-xs-{0} col-sm-{0} col-lg-{0}".format(colum[0])
                }).html(colum[1]);
                header && columDiv.addClass("tblHeader"),
                    colum[2] && columDiv.addClass(colum[2]),
                    columDiv.attr("style", header ? "border-radius:10px 10px 10px 10px;line-height: 23px" : ""),
                    rowDiv.append(columDiv)
            }), rowDiv
        },
        SettingsImg: function (id) {
            return $('<img>', { id: id, src: 'images/icon_settings.png', style: 'height: 23px; cursor: pointer;' })
        },
        newImg: function () {
            return '<img src="https://img.icons8.com/retro/23/new.png" alt="new"/>';
        },
        container: function () {
            return $('<div>', { 'class': 'container-fluid', 'style': 'height: auto; user-select: none;' });
        }
    },
    format: {
        Time: function (ms) {
            const tSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(tSeconds / 60);
            const seconds = tSeconds % 60;
            return "{0}:{1}".format(minutes, seconds < 10 ? '0' + seconds : seconds);
        },
        Date: function (ms) {
            var date = new Date(ms);
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
        Capitalize: function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },
        num: function (num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
    },

    /**
     * File I/O Operations
     * @namespace aUtils.file
     */
    file: {
        /**
         * Constructs file path in the auto directory
         * @param {string} segment - File name (without .json extension)
         * @returns {string} Full native file path
         */
        Path: function (segment) {
            return air.File.applicationDirectory.resolvePath('auto/' + segment + '.json').nativePath;
        },
        getPath: function (type, file) {
            var dir = ['templates', 'resources'];
            return aUtils.file.Path(dir[type] + '/' + file);
        },
        checkResource: function (file) {
            var file = new air.File(aUtils.file.getPath(1, file));
            return file.exists;
        },
        validatePath: function (filePath) {
            // Validate that the path is within allowed directories to prevent directory traversal
            try {
                var file = new air.File(filePath);
                var allowedDirs = [
                    air.File.applicationDirectory.nativePath,
                    air.File.applicationStorageDirectory.nativePath,
                    air.File.applicationDirectory.resolvePath('auto').nativePath
                ];

                var fileNativePath = file.nativePath;
                var isValid = allowedDirs.some(function(allowedDir) {
                    return fileNativePath.indexOf(allowedDir) === 0;
                });

                if (!isValid) {
                    // Check if validation is disabled - only override on failure
                    if (!aSettings.defaults.Security.validateFilePaths) {
                        debug('Path validation disabled - allowing access to: ' + filePath);
                        return true;
                    }
                    debug('Path validation failed: ' + filePath + ' is outside allowed directories');
                    debug('Invalid path access attempt: ' + filePath);
                    return false;
                }
                return true;
            } catch (e) {
                debug('Path validation error: ' + e);
                debug('Path validation error: ' + e);
                return false;
            }
        },

        /**
         * Reads and parses a JSON file from disk
         * @param {string} fileName - Full path to the file
         * @returns {Object|boolean} Parsed JSON object, or false if file doesn't exist or is invalid
         */
        Read: function (fileName) {
            try {
                if (!aUtils.file.validatePath(fileName)) {
                    debug('Read blocked - invalid path: ' + fileName);
                    return false;
                }

                var file = new air.File(fileName);
                if (!file.exists) return false;
                var fileStream = new air.FileStream();
                fileStream.open(file, air.FileMode.READ);
                var data = fileStream.readUTFBytes(file.size);
                fileStream.close();
                if (data === "") { return false; }
                return JSON.parse(data);
            } catch (e) {
                debug('File read error: ' + e);
                debug('Read error: ' + e);
                return false;
            }
        },

        /**
         * Writes data to a file on disk
         * @param {string} path - Full path to the file
         * @param {string} data - Data to write (typically JSON string)
         * @returns {void}
         */
        Write: function (path, data) {
            try {
                if (!aUtils.file.validatePath(path)) {
                    debug('Write blocked - invalid path: ' + path);
                    return false;
                }

                var fileStream = new air.FileStream();
                fileStream.open(new air.File(path), air.FileMode.WRITE);
                fileStream.writeUTFBytes(data);
                fileStream.close();
                return true;
            } catch (e) {
                debug('File write error: ' + e);
                debug('Write error: ' + e);
                return false;
            }
        },

        /**
         * Deletes a file from disk
         * @param {string} path - Full path to the file to delete
         * @returns {void}
         */
        Delete: function (path) {
            try {
                if (!aUtils.file.validatePath(path)) {
                    debug('Delete blocked - invalid path: ' + path);
                    return false;
                }

                new air.File(path).deleteFile();
                return true;
            } catch (e) {
                debug('File delete error: ' + e);
                debug('Delete error: ' + e);
                return false;
            }
        },
        Select: function (callback) {
            try {
                var file = new air.File();
                file.browseForOpen("Select a Template");
                var selectHandler = function(event) {
                    file.removeEventListener(air.Event.SELECT, selectHandler);
                    callback(event);
                };
                file.addEventListener(air.Event.SELECT, selectHandler);
            } catch (e) { }
        },
        SaveTemplate: function (template) {
            var lastDir = settings.read("autoAdvlastDir");
            file = new air.File(lastDir ? lastDir : air.File.documentsDirectory.nativePath)
                .resolvePath("autoAdvTemplate.txt");
            var completeHandler = function (t) {
                file.removeEventListener(air.Event.COMPLETE, completeHandler);
                if (mainSettings.changeTemplateFolder) {
                    var a = {};
                    a["autoAdvlastDir"] = t.target.parent.nativePath;
                    mainSettings["autoAdvlastDirlastDir"] = t.target.parent.nativePath;
                    settings.store(a);
                }
            };
            file.addEventListener(air.Event.COMPLETE, completeHandler);
            file.save(JSON.stringify(template, null, " "));
        }
    },
    trackers: {
        zoneRefreshed: function () {
            try {
                if (game.gi.isOnHomzone()) {
                    if (aSession.zoneAction === 'BackHomeFromFriend') {
                        setTimeout(function () { aQueue.skip(); }, TIMEOUTS.QUEUE_SKIP_DELAY);
                        aSession.zoneAction = null;
                    }
                    if (aSession.adventure.action === "FinishAdventure") {
                        debug('Finishing adventure');
                        if (aSettings.defaults.Adventures.reTrain)
                            aAdventure.action.trainLostUnits();

                        aSession.adventure.repeatCount--;
                        aSession.adventure.reset();
                        aUI.modals.adventure.AM_LoadInfo()
                        setTimeout(function () {
                            aSession.isOn.Adventure = true;
                            aUI.menu.init();
                        }, TIMEOUTS.ADVENTURE_START_DELAY);
                    }
                } else {
                    if (aSession.zoneAction === 'ApplyBuffOnFriend') {
                        setTimeout(function () { aQueue.skip(); }, TIMEOUTS.QUEUE_SKIP_DELAY);
                        aSession.zoneAction = 'BackHomeFromFriend';
                    }
                }

                var step = aSession.adventure.currentStep();
                if (step && ((step.name === 'VisitAdventure' && aAdventure.info.isOnAdventure()) ||
                    (step.name === 'ReturnHome' && game.gi.isOnHomzone()))) {
                    aUI.Alert("{0} Island Loaded!".format(step.name === 'VisitAdventure' ? 'Adventure' : 'Home'), 'QUEST');
                    aSession.adventure.action = '';
                    aSession.adventure.nextStep();

                    if (step.name === 'VisitAdventure') {
                        const waitingQuests = game.quests.GetQuestPool().GetQuest_vector().toArray().filter(function (quest) {
                            return quest && quest.mQuestMode === 2;
                        });
                        waitingQuests.forEach(function (quest) {
                            globalFlash.gui.mQuestBook.SetPreselectedQuest(quest);
                            globalFlash.gui.mQuestBook.Show();
                            globalFlash.gui.mQuestBook.Hide();
                        });
                    }
                }
            } catch (e) { debug(e) }
        },
        battleFinished: function (e) {
            try {
                if (!aAdventure.info.isOnAdventure()) return;
                aUI.modals.adventure.AM_UpdateInfo(e.data.getCasualties());
                const enemies = aSession.adventure.getEnemies();
                aUI.Alert("Target Enemy Camps Eliminated ({0}/{1})!!".format(
                    enemies.all - enemies.remaining,
                    enemies.all),
                    "ARMY"
                );

            } catch (er) { debug(er) }
        },
        chatObserver: function () {
            //debug(e);
        }
    },
    game: {
        applyTweaks: function () {
            try {
                game.def("defines").CLIENT_PACKET_LOSS_TIMEOUT = aSettings.defaults.Auto.increaseTimeout ? LIMITS.CLIENT_PACKET_TIMEOUT_INCREASED : LIMITS.CLIENT_PACKET_TIMEOUT_DEFAULT;
                globalFlash.gui.mChatPanel.getViewComponent().messageHistory.maxEntries = aSettings.defaults.Tweaks.ChatMax ? 100 : 300;
                game.def("global").tradeMaxAdventureAmount = aSettings.defaults.Tweaks.TradeAdventureMax ? 100 : 10;
                game.def("global").tradeMaxBuildingAmount = aSettings.defaults.Tweaks.TradeBuildingMax ? 100 : 10;
                game.def("global").tradeMaxBuffAmount = aSettings.defaults.Tweaks.TradeBuffMax ? LIMITS.TRADE_BUFF_MAX_TWEAKED : LIMITS.TRADE_BUFF_MAX_DEFAULT;
                game.def("global").tradeRefreshInterval = aSettings.defaults.Tweaks.TradeFreshInterval ? 10 : 30;
                game.def("global").maxAnimalsOnMap = aSettings.defaults.Tweaks.GUIMaxAnimals ? 50 : 100;
                game.def("global").mailboxPageSize = aSettings.defaults.Tweaks.MailPageSize ? 100 : 50;
            } catch (e) { }
        },
        checkRAM: function () {
            if (!aSettings.defaults.Auto.RestartRAM) return;
            if (air.System.privateMemory > (aSettings.defaults.Auto.RestartRAM * Math.pow(1024, 3)))
                this.restart();
        },
        restart: function () {
            updateApplication();
            var nativeProcessStartupInfo = new window.runtime.flash.desktop.NativeProcessStartupInfo();
            var file = air.File.applicationDirectory.resolvePath("client.exe");
            nativeProcessStartupInfo.executable = file;
            var processArgs = new window.runtime.Vector["<String>"]();
            $.extend(rawArgs, {
                "flexid": game.def("mx.messaging::FlexClient").getInstance().id,
                "authrandom": game.def("defines").CLIENT_AUTHRANDOM,
                "autorun": JSON.stringify(aSession.isOn)
            });
            processArgs[0] = "tso://?" + Object.keys(rawArgs).map(function (k) { return "{0}={1}".format(k, rawArgs[k]); }).join('&');
            nativeProcessStartupInfo.arguments = processArgs;
            process = new window.runtime.flash.desktop.NativeProcess();
            process.start(nativeProcessStartupInfo);
            setTimeout(function () {
                window.runtime.flash.desktop.NativeApplication.nativeApplication.exit(-3);
            }, TIMEOUTS.ADVENTURE_RETRY_DELAY);
        },
        getText: function (item) {
            const textTypes = ["RES", "BUI", "SPE", "COL", "LAB", "ADN", "ALM", "SHI", "ACL"];
            if (item === "") return "";
            for (var idx = 0; idx < textTypes.length; idx++) {
                var n = loca.GetText(textTypes[idx], item);
                if (n.toLowerCase().indexOf("undefined") < 0)
                    return n;
            }
            return item;
        },
        sendSpecialistPacket: function (uniqueId, taskId, subTaskId) {
            if (!uniqueId) return;
            try {
                var specTask = game.def("Communication.VO::dStartSpecialistTaskVO", true);
                specTask.subTaskID = subTaskId;
                specTask.paramString = "";
                specTask.uniqueID = uniqueId;
                game.gi.SendServerAction(95, taskId, 0, 0, specTask);
            } catch (e) { }
        },
        timedProduction: function (type, item, amount, stack, grid) {
            try {
                var dTPVO = game.def("Communication.VO::dTimedProductionVO", true);
                dTPVO.productionType = type;
                dTPVO.type_string = item;
                dTPVO.amount = amount;
                dTPVO.stacks = stack;
                dTPVO.buildingGrid = grid;
                game.gi.mClientMessages.SendMessagetoServer(91, game.gi.mCurrentViewedZoneID, dTPVO);
            } catch (er) { debug(er) }
        },
        uID: function (string) {
            var arr = string.split('.');
            var uID = game.def('Communication.VO.dUniqueID', !0);
            uID.uniqueID1 = arr[0];
            uID.uniqueID2 = arr[1];
            return uID;
        }
    },
    friends: {
        getFriends: function () {
            return globalFlash.gui.mFriendsList.GetFilteredFriends("", true).filter(function (f) {
                return f.username.indexOf('Deleted') === -1;
            }).sort(function (a, b) {
                return a.username.toLowerCase().localeCompare(b.username.toLowerCase());
            });
        },
        isGuildMember: function (id) {
            var result = false;
            game.gi.GetCurrentPlayerGuild().members.toArray().forEach(function (member) {
                if (result) return;
                if (member.id === id)
                    result = true;
            });
            return result;
        },
        getRandom: function (res_name) {
            var friendList = globalFlash.gui.mFriendsList.GetFilteredFriends("", true).filter(function (f) {
                return !f.onlineStatus && f.username.indexOf('Deleted') === -1;
            }).sort(function (a, b) {
                return b.playerLevel - a.playerLevel;
            });
            if (!friendList.length) return aUI.Alert('Come on! Get Some friends!!'), null;
            friendList = friendList.slice(Math.ceil(friendList.length / 2));
            if (res_name === 'FillDeposit_Fishfood')
                return friendList[friendList.length - 1];
            return friendList[Math.floor(Math.random() * friendList.length)];
        }
    },
    responders: {
        openBox: function () {
            return game.createResponder(
                function (e, response) {
                    try {
                        response.data.data.items.source.forEach(function (item) {
                            var name = item.resourceName_string !== "" ? item.resourceName_string : item.buffName_string;
                            aUI.Alert('Congratulations, you got "x{1} {0}" from mystery box!'.format(aUtils.game.getText(name), item.amount),
                                name);
                        });
                    } catch (e) { }
                },
                function () { aUI.Alert('Failed to open box!', 'ERROR') });
        },
        sendOfficeTrades: function () {
            return game.createResponder(function (e, d) {
                try {
                    const data = d.data.data;
                    var nextSlot = aTrade.office.nextSlotType(data);
                    var nextCoinSlotPos = game.gi.mHomePlayer.mTradeData.getNextFreeSlotForType(2);
                    $.each(aTrade.office.trades, function (key, trade) {
                        if (trade.Live) return;
                        const quest = key.split("#");
                        if (aQuests.isTriggerFinished(quest[0], quest[1])) return;
                        var data = {
                            Send: trade.Send,
                            Receive: [trade[0] === 'Fish' ? 'Stone' : 'Fish', 1],
                            slotType: nextSlot,
                            slotPos: nextSlot === 0 ? 0 : nextCoinSlotPos
                        }
                        const offer = "{0},{1}|{2},{3}|1".format(trade.Send[0], trade.Send[1], data.Receive[0], data.Receive[1]);
                        aTrade.office.trades[key]["Offer"] = offer;
                        if (aTrade.office.isTradeLive(data, offer, key)) return;
                        aTrade.send(data, function () {
                            try {
                                var k = key;
                                aTrade.office.trades[k].Live = true;
                            } catch (e) { debug(e) }
                        });
                        //});
                        if (nextSlot === 2) {
                            aTrade.office.coinSlots.push(nextCoinSlotPos);
                            for (var i = 0; i < 9; i++) {
                                if (aTrade.office.coinSlots.indexOf(i) === -1) {
                                    nextCoinSlotPos = i;
                                    break;
                                }
                            }
                        } else if (nextSlot === 0) nextSlot = 2;
                        aTrade.office.coinSlots = [];
                    });
                } catch (e) { }
            });
        },
        buffOnFriend: function (res) {
            if (!res) return null;
            return game.createResponder(function () {
                setTimeout(function () { aQueue.skip(); }, TIMEOUTS.ADVENTURE_TRAIN_UNITS_DELAY);
            });
        },
        checkOutbox: function (friendID) {
            return game.createResponder(function (e, d) {
                try {
                    $.each(d.data.headers_collection, function (i, mail) {
                        if (mail.reciepientId !== friendID) return;
                        aTrade.complete(mail.id, mail.type, false);
                    });
                    aUI.updateStatus('Declining Outbox Trades', 'Quests');
                } catch (e) {
                    debug('Outbox: Error ' + e.message);
                    aQueue.repeat(6000);
                }
            });
        },
        checkInbox: function (friendID) {
            return game.createResponder(function (e, d) {
                try {
                    $.each(d.data.headers_collection, function (i, mail) {
                        if (mail.senderId !== friendID) return;
                        var remove = game.createResponder(function (e, d) {
                            delete aResources.gather.list[d.data.data.returnedItem.name_string];
                        });
                        aTrade.complete(mail.id, mail.type, true, remove);
                    });
                    aUI.updateStatus('Completing Trades', 'Quests');
                } catch (e) {
                    debug('Inbox: Error ' + e.message);
                    aQueue.repeat(6000);
                }
            });
        }
    }
}
// ==================== UI & Menu ====================
const aUI = {
    menu: {
        Progress: 0,
        Timer: null,
        SelectedAdventure: null,
        initItem: function (name, label, enabled) {
            var menuItem = window.nativeWindow.menu.getItemByName(name);
            if (menuItem !== null) window.nativeWindow.menu.removeItem(menuItem);
            var newItem = new air.NativeMenuItem(label);
            newItem.name = name;
            newItem.enabled = enabled ? true : false;
            window.nativeWindow.menu.addItem(newItem);
        },
        init: function (first) {
            try {
                if (first) {
                    aUI.menu.initItem("aStatus", '---', false);
                    return;
                }
                aUI.menu.initItem("Automation", '~Automation~', true);
                aUI.menu.initItem("aStatus", '---', false);

                var m = [
                    { label: "v{0} {1}".format(auto.version, auto.update.available ? "*New Update Avaliable!!*" : ""), name: "version", onSelect: aUI.modals.Changelog },
                    { type: 'separator' },
                    { label: "Settings", onSelect: aUI.modals.Settings },
                    { label: "Update", name: "update", enabled: auto.update.available, onSelect: auto.update.updateScript },
                    {
                        label: "Restart Client", onSelect: function () {
                            if (confirm('Are you sure you want to restart the client?'))
                                aUtils.game.restart();
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Mail/Trade', items: [
                            { label: "Trade with friends", onSelect: aUI.modals.trade.withFriends },
                            { label: "Auto Mail: Trade Logs", onSelect: aUI.modals.trade.savedTrades },
                        ]
                    },
                    {
                        label: 'Event', items: [
                            { label: "Calculate required deposits", enabled: aEvents.isEventWithDepos(), onSelect: aEvents.calculateDeposits },
                            { label: "Estimate daily event items (if optimized)", enabled: aEvents.getActiveEvent('_Content') ? true : false, onSelect: aEvents.calculateDailyItems },
                        ]
                    },
                    { label: "The Excelsior", onSelect: aUI.modals.Excelsior },
                    {
                        label: "The Pathfinder", enabled: window.hasOwnProperty('aPathfinder'), onSelect: function () {
                            if (!window.hasOwnProperty('aPathfinder')) {
                                return aUI.Alert('You must download and install the Pathfinder script first!!', 'ERROR');
                            }
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Auto Adventures', items: [
                            {
                                label: aUI.menu.featureLabel('Adventure'), name: "auto_Adventure", onSelect: function (e) {
                                    if (!aSession.adventure.name)
                                        return aUI.Alert("No active Adventure. please select a new Adventure", 'ERROR');
                                    aUI.menu.toggleFeature('Adventure', e);
                                }
                            },
                            { label: "Monitor", onSelect: aUI.modals.adventure.adventureMonitor },
                            {
                                label: "Previous Step", onSelect: function () {
                                    if (!aSession.adventure.name)
                                        return aUI.Alert("No active Adventure. please select a new Adventure", 'ERROR');
                                    if (aSession.adventure.index <= 0)
                                        return aUI.Alert("You are at the first step!!", 'ERROR');
                                    aSession.adventure.index--;
                                }
                            },
                            {
                                label: "Next Step", onSelect: function () {
                                    if (!aSession.adventure.name)
                                        return aUI.Alert("No active Adventure. please select a new Adventure", 'ERROR');
                                    if (aSession.adventure.index >= aSession.adventure.steps.length)
                                        return aUI.Alert("You are at the final step!!", 'ERROR');
                                    aSession.adventure.nextStep();
                                }
                            },
                            {
                                label: "End Repetition", enabled: aSession.adventure.repeatCount > 1, onSelect: function () {
                                    if (!aSession.adventure.name)
                                        return aUI.Alert("No active Adventure. please select a new Adventure", 'ERROR');
                                    aSession.adventure.repeatCount = 1;
                                    aUI.Alert("Auto Adventure will stop after finishing the current adventure");
                                }
                            },
                            { type: 'separator' },
                            { label: 'Reload Saved Adventures!', onSelect: function () { aUI.menu.init() } },
                            { type: 'separator' },
                        ].concat(aUI.menu.savedItems())
                    },
                    {
                        label: aUI.menu.featureLabel('Explorers'), name: "auto_Explorers", onSelect: function (e) {
                            aUI.menu.toggleFeature('Explorers', e);
                        }
                    },
                    {
                        label: aUI.menu.featureLabel('Quests'), name: "auto_Quests", onSelect: function (e) {
                            aUI.menu.toggleFeature('Quests', e);
                        }
                    },
                    {
                        label: aUI.menu.featureLabel('Deposits'), name: "auto_Deposits", onSelect: function (e) {
                            aUI.menu.toggleFeature('Deposits', e);
                        }
                    },
                    {
                        label: aUI.menu.featureLabel('Buildings'), name: "auto_Buildings", onSelect: function (e) {
                            aUI.menu.toggleFeature('Buildings', e);
                        }
                    },
                    {
                        label: aUI.menu.featureLabel('Mail'), name: "auto_Mail", onSelect: function (e) {
                            aUI.menu.toggleFeature('Mail', e);
                        }
                    },
                    {
                        label: aUI.menu.featureLabel('Open_Mystery_Boxs'), name: "auto_OpenMysteryBoxs", onSelect: function (e) {
                            aUI.menu.toggleFeature('Open_Mystery_Boxs', e);
                        }
                    },
                    {
                        label: aUI.menu.featureLabel('From_Star_To_Store'), name: "auto_FromStarToStore", onSelect: function (e) {
                            aUI.menu.toggleFeature('From_Star_To_Store', e);
                        }
                    }
                ];
                menu.nativeMenu.getItemByName("Automation").submenu = air.ui.Menu.createFromJSON(m);

                var existingGridPosMenu = window.nativeWindow.menu.getItemByName("GridPosMenu");
                if (aSettings.defaults.Auto.showGrid) {
                    if (existingGridPosMenu === null) {
                        MenuItem = new air.NativeMenuItem("Grid : ---");
                        MenuItem.name = "GridPosMenu";
                        MenuItem.enabled = false;
                        window.nativeWindow.menu.addItem(MenuItem);
                        window.nativeWindow.stage.addEventListener("click", auto.generateGrid);
                    }
                } else {
                    if (existingGridPosMenu) {
                        window.nativeWindow.menu.removeItem(existingGridPosMenu);
                        try {
                            window.nativeWindow.stage.removeEventListener("click", auto.generateGrid);
                        } catch (e) {
                            // Listener may have already been removed or never added
                        }
                    }
                }
                if (!menu.nativeMenu.getItemByName("Automation").submenu)
                    aUI.menu.init();
            } catch (e) { debug(e) }
        },
        savedItems: function () {
            try {
                var items = [];
                $.each(aAdventure.data.getAdventures(), function (category, adventures) {
                    var catAdvs = [];
                    if (category === 'Scenario') {
                        $.each(adventures, function (i, scenario) {
                            catAdvs.push(aUI.menu.itemMaker({ name: scenario }, catAdvs.length));
                        });
                    } else {
                        $.each(aSettings.defaults.Adventures.templates, function (index, template) {
                            if (adventures.indexOf(template.name) === -1) return;
                            catAdvs.push(aUI.menu.itemMaker(template, catAdvs.length));
                        });
                    }
                    if (catAdvs.length)
                        items.push({ label: category, items: catAdvs });
                });
                return items;
            } catch (e) { debug(e) }
        },
        itemMaker: function (template, len) {
            const name = "{0}".format(template.id || template.name);
            const amount = aBuffs.getBuffAmount(['Adventure', template.name]);
            const label = "{0}{1}. {2} x{3}".format(
                name === aUI.menu.SelectedAdventure ? "-> " : "",
                (len + 1),
                template.label || loca.GetText('ADN', template.name),
                amount
            );
            return { label: label, enabled: (amount || aAdventure.info.getActiveAdvetureID(template.name)) ? true : false, name: name, onSelect: aUI.menu.startAutoAdventure };
        },
        featureLabel: function (feature) {
            const name = feature.replace(/_/g, "");
            const label = aUtils.format.Capitalize(feature.replace(/_/g, " "))
            return "{0} Auto {1}".format(aSession.isOn[name] ? "Stop" : "Start", label);
        },
        toggleFeature: function (feature, event) {
            const name = feature.replace(/_/g, "");
            const run = !aSession.isOn[name];
            const label = aUtils.format.Capitalize(feature.replace(/_/g, " "));
            aSession.isOn[name] = run;
            event.target.label = "{0} Auto {1}".format(run ? "Stop" : "Start", label)
            aUI.Alert("Auto {1} is {0}".format(run ? "On" : "Off", label), 'QUEST');
        },
        startAutoAdventure: function (event) {
            try {
                if (!confirm('Are you sure you want to start this auto adventure?')) return;
                aSession.adventure.repeatCount = 0;
                aSession.adventure.reset();
                var adventure = isNaN(parseInt(event.target.name)) ?
                    game.auto.resources[event.target.name.replace('BuffAdventures_', '')] :
                    aUtils.file.Read(aUtils.file.getPath(0, event.target.name));

                const AdventureActive = aAdventure.info.getActiveAdvetureID(adventure.name) ? 1 : 0;
                const mapCount = aBuffs.getBuffAmount(['Adventure', adventure.name]) + AdventureActive;
                if (mapCount < 1)
                    return aUI.Alert("You don't have any adventure maps for this adventure!!!", "ERROR");

                var repeat = confirm("Repeat the adventure as many as you have? x{0}".format(mapCount));
                aSession.adventure.repeatCount = mapCount;
                if (!repeat) {
                    var userCount = parseInt(prompt("Repeat count !? defaults: 1"));
                    aSession.adventure.repeatCount = isNaN(userCount) ? 1 : (userCount > mapCount ? mapCount : userCount);
                }

                $.extend(aSession.adventure, adventure);
                delete aSession.adventure.hash;
                aSession.adventure.id = event.target.name;
                aUI.Alert(loca.GetText('ADN', adventure.name) + " is selected", adventure.name);
                aSession.isOn.Adventure = true;
                aUI.modals.adventure.AM_LoadInfo();
                aUI.menu.SelectedAdventure = event.target.name;
                aUI.menu.init();
            } catch (e) { debug(e) }
        }
    },
    modals: {
        Changelog: function () {
            if (!auto.update.changelog) {
                $.get(auto.update.url() + 'version.json', function (data) {
                    var json = JSON.parse(data);
                    auto.update.changelog = json.changelog;
                    aUI.modals.Changelog();
                });
                return;
            }
            $("div[role='dialog']:not(#aChangelogModal):visible").modal("hide");
            $('#aChangelogModal').remove();
            createModalWindow('aChangelogModal', utils.getImageTag('icon_dice.png', '45px') + ' Changelog');
            var data = $.map(Object.keys(auto.update.changelog).reverse(), function (v) {
                var r = [
                    createTableRow([[11, "Version: {0}".format(v)], [1, ""]], true)
                ];
                $.each(auto.update.changelog[v], function (i, f) {
                    r.push(createTableRow([[11, "&#10551; {0}".format(f)], [1, ""]], false));
                });
                r.push($('<br>'));
                return r;
            });
            $('#aChangelogModalData').append(
                aUtils.create.container().append([].concat(data))
            )
            $('#aChangelogModal:not(:visible)').modal({ backdrop: "static" });
        },
        settings: {
            loadSavedAdventures: function () {
                $("#aAdventure_SavedPool").empty().append(aSettings.defaults.Adventures.templates.map(function (adv, i) {
                    return $('<option>', { value: i }).text(adv.label || loca.GetText('ADN', adv.name));
                }));
            }
        },
        Settings: function () {
            try {
                aWindow = new Modal('mainSettings', utils.getImageTag('icon_dice.png', '45px') + ' Auto Settings');
                aWindow.size = 'modal-sg';
                aWindow.create();
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
                var aAdventure_SpeedBuffs = aUtils.create.Select("aAdventure_SpeedBuffs")
                    .append($('<option>', { 'value': '' }).text("Don't Use Speed Buff"))
                    .append(aBuffs.getSpeedBuffs(true));

                const specialistsMenu = aUtils.create.container().append([
                    createTableRow([[8, getImageTag('icon_general.png', '26px', '26px') + "Auto Adventures"], [4, $('<a>', { href: '#', text: "Create new auto template!", 'id': 'aAdventure_TemplateMaker' })]], true),
                    createTableRow([[3, "Adventures: "], [5, aUtils.create.Select('aAdventure_SavedPool')], [2, aUtils.create.Button('aAdventure_EditTemplate', 'Edit')], [2, aUtils.create.Button('aAdventure_RemoveTemplate', 'Remove')]]),
                    createTableRow([[3, "Speed Buff:"], [9, aAdventure_SpeedBuffs]]),
                    createTableRow([[9, "Retrain lost units?:"], [3, createSwitch('aAdventure_RetrainUnits', aSettings.defaults.Adventures.reTrain)]]),
                    createTableRow([[5, "Use Black Vortex?:"], [4, "Own: {0}".format(aBuffs.getBuffAmount("PropagationBuff_AdventureZoneTravelBoost_BlackTree"))], [3, createSwitch('aAdventure_BlackVortex', aSettings.defaults.Adventures.blackVortex)]]),
                    $('<br>'),
                    createTableRow([[9, getImageTag('icon_explorer.png', '26px', '26px') + 'Explorers'], [3, '&nbsp;']], true),
                    createTableRow([
                        [9, "Run on Startup"],
                        [2, createSwitch('aExplorers_AutoStart', aSettings.defaults.Explorers.autoStart)],
                        [1, aUtils.create.SettingsImg('aExplorers_Menu')]
                    ]),
                    createTableRow([[9, "During Events: Optimize search for each explorer (Top Priority) " + aUtils.create.newImg()], [3, createSwitch('aExplorers_EventOptimize', aSettings.defaults.Explorers.eventOptimize)]]),
                    createTableRow([[3, "Template: "], [6, aUtils.create.Span('aExplorers_Template', aSettings.defaults.Explorers.template)], [3, aUtils.create.Button('aExplorers_SelectTemplate', loca.GetText("LAB", "Select"))]]),
                    createTableRow([[9, "Override defaults task with template: "], [3, createSwitch('aExplorers_UseTemplate', aSettings.defaults.Explorers.useTemplate)]]),
                    createTableRow([[6, '&#10551; On: Use template'], [6, 'Off: Use defaults task']]),
                    $('<br>'),
                    createTableRow([[9, getImageTag('icon_geologist.png', '26px', '26px') + 'Geologists & Deposits'], [3, '&nbsp;']], true),
                    createTableRow([
                        [9, "Run on Startup"],
                        [2, createSwitch('aDeposits_AutoStart', aSettings.defaults.Deposits.autoStart)],
                        [1, aUtils.create.SettingsImg('aDeposits_Menu')]
                    ]),
                    $('<br>')
                ]);
                var mMonitor = aUtils.create.Select("aMail_Monitor");
                for (var i = 3; i < 11; i++) {
                    mMonitor.append($('<option>', { value: i }).text("{0} Minutes".format(i)));
                }
                const mailTradeMenu = aUtils.create.container().append([
                    createTableRow([[9, utils.getImageTag('IconMailTypeMail', '26px') + 'Mail'], [3, '&nbsp;']], true),
                    createTableRow([
                        [5, "Run on Startup"],
                        [1, createSwitch('aMail_AutoStart', aSettings.defaults.Mail.AutoStart)],
                        [5, "Auto run during Events " + aUtils.create.newImg()],
                        [1, createSwitch('aMail_AutoStartEvents', aSettings.defaults.Mail.AutoStartEvents)],
                    ]),
                    createTableRow([
                        [9, "Check every:"],
                        [3, mMonitor],
                    ]),
                    createTableRow([
                        [5, '&#10551; Accept Explorers loots'],
                        [1, createSwitch("aMail_Loots", aSettings.defaults.Mail.AcceptLoots)],
                        [5, '&#10551; Accept Geologist messages'],
                        [1, createSwitch("aMail_Geologist", aSettings.defaults.Mail.AcceptGeologistMsg)],
                    ]),
                    createTableRow([
                        [5, "&#10551; Accept Adventures loot"],
                        [1, createSwitch("aMail_AdvLoots", aSettings.defaults.Mail.AcceptAdventureLoot)],
                        [5, "&#10551; Accept Adventures messages"],
                        [1, createSwitch("aMail_AdvMsg", aSettings.defaults.Mail.AcceptAdventureMessage)],
                    ]),
                    createTableRow([
                        [5, '&#10551; Accept Gifts'],
                        [1, createSwitch('aMail_Gifts', aSettings.defaults.Mail.AcceptGifts)],
                        [5, "&#10551; Send resources to STAR MENU"],
                        [1, createSwitch("aMail_Star", aSettings.defaults.Mail.ToStar)],
                    ]),
                    createTableRow([
                        [5, '&#10551; Accept Adventure Invites'],
                        [1, createSwitch('aMail_AdvInvite', aSettings.defaults.Mail.AcceptInvites)],
                        [6, '']
                    ]),
                    $('<label>').text('More Filters and options in future updates ^^'),
                    $('<br>'),
                    createTableRow([[9, utils.getImageTag('IconMailTypeTrade', '26px') + 'Trades'], [3, '&nbsp;']], true),
                    createTableRow([
                        [5, '&#10551; Accept Trades'],
                        [1, createSwitch('aMail_Trades', aSettings.defaults.Mail.AcceptTrades)],
                        [5, "&#10551; Complete Accepted & declined trades"],
                        [1, createSwitch("aMail_Complete", aSettings.defaults.Mail.CompleteTrades)],
                    ]),
                    createTableRow([
                        [5, "&#10551; Trade: Filter Friends"],
                        [1, aUtils.create.SettingsImg('aMail_FriendsFilter')],
                        [5, "&#10551; Trade: Filter Resources"],
                        [1, aUtils.create.SettingsImg('aMail_ResourcesFilter')]
                    ]),
                    createTableRow([
                        [5, "&#10551; Decline unacceptable trades (no resources)"],
                        [1, createSwitch("aMail_Decline", aSettings.defaults.Mail.DeclineTrades)],
                        [5, "&#10551; Save Accepted/Declined Trades"],
                        [1, createSwitch("aMail_SaveTrades", aSettings.defaults.Mail.SaveFriendsTrades)],
                    ])
                ]);
                const questsMenu = aUtils.create.container().append([
                    createTableRow([[9, 'Quests Settings'], [3, '&nbsp;']], true),
                    createTableRow([[9, "Run on Startup"], [3, createSwitch('aQuests_Config_AutoStart', aSettings.defaults.Quests.Config.AutoStart)]]),
                    createTableRow([
                        [5, "&#10551; Gather Resources from STAR:"],
                        [1, createSwitch('aQuests_Config_Gather', aSettings.defaults.Quests.Config.GatherfromStar)],
                        [5, "&#10551; Pay Resources & Units:"],
                        [1, createSwitch('aQuests_Config_Pay', aSettings.defaults.Quests.Config.PayResources)]
                    ]),
                    createTableRow([
                        [5, "&#10551; Produce Buffs:"],
                        [1, createSwitch('aQuests_Config_Buffs_Produce', aSettings.defaults.Quests.Config.Buffs.Produce)],
                        [5, "&#10551; Apply Buffs:"],
                        [1, createSwitch('aQuests_Config_Buffs_Apply', aSettings.defaults.Quests.Config.Buffs.Apply)]
                    ]),
                    createTableRow([
                        [2, "&#10551; PH Buff:"],
                        [4, aUtils.create.Select('aQuests_Config_Buffs_PHBuff').append(aBuffs.getBuffsForBuilding('ProvisionHouse', false, true))]
                    ]),
                    createTableRow([
                        [5, "&#10551; Sell: Resources on Trade office"],
                        [1, createSwitch('aQuests_Config_Sell', aSettings.defaults.Quests.Config.SellinTO)],
                        [5, "&#10551; Train Units: "],
                        [1, createSwitch('aQuests_Config_TrainUnits', aSettings.defaults.Quests.Config.TrainUnits)]
                    ]),
                    createTableRow([
                        [5, "&#10551; Produce Resource: Turn On Production"],
                        [1, createSwitch('aQuests_Config_ProduceResource_TurnOn', aSettings.defaults.Quests.Config.ProduceResource.TurnOn)],
                        [2, "&#10551; Workyard Buff:"],
                        [4, aUtils.create.Select('aQuests_Config_ProduceResource_BuffType').append(aBuffs.getBuffsForBuilding('Workyard', true, true))]
                    ]),
                    createTableRow([
                        [5, '&#10551; Notify when intervention needed:'],
                        [1, createSwitch('aQuests_Config_Notification', aSettings.defaults.Quests.Config.Notification)],
                        [5, ''],
                        [1, '']
                    ]),
                    createTableRow([
                        [5, '&#10551; Explorers Treasure Search:'],
                        [1, aUtils.create.SettingsImg('aQuests_ExplorerTask_Treasure')],
                        [5, '&#10551; Explorers Adventure Search:'],
                        [1, aUtils.create.SettingsImg('aQuests_ExplorerTask_Adventure')]
                    ]),
                    createTableRow([[9, "&#10551; Geologists Task: is the same as Auto Deposits settings!"], [3, aUtils.create.SettingsImg('aQuests_GeologistTask')]]),
                    $('<br>'),
                    createTableRow([[9, 'Quests'], [3, '&nbsp;']], true),
                    createTableRow([
                        [5, getImage(assets.GetResourceIcon("QuestShort").bitmapData, "23px") + 'Daily Quests'],
                        [1, createSwitch('aQuests_Daily', aSettings.defaults.Quests.Other.Daily)],
                        [5, getImage(assets.GetBuildingIcon("guild_building").bitmapData, "23px") + 'Guild Daily Quests'],
                        [1, createSwitch('aQuests_DailyGuild', aSettings.defaults.Quests.Other.DailyGuild)]
                    ]),
                    createTableRow([
                        [5, getImage(assets.GetBuildingIcon("EventMonster_WeeklyChallengeShip").bitmapData, "23px") + 'Weekly Quests'],
                        [1, createSwitch('aQuests_Weekly', aSettings.defaults.Quests.Other.Weekly)],
                        [5, getImage(assets.GetBuildingIcon("GiftGhostShip").bitmapData, "23px") + 'Ghost Ship Quests'],
                        [1, createSwitch('aQuests_Ghost', aSettings.defaults.Quests.Other.Ghost)]
                    ]),
                    createTableRow([
                        [5, getImage(assets.GetBuildingIcon("TaskBuilding").bitmapData, "23px") + 'Path Finder Quests'],
                        [1, createSwitch('aQuests_PathFinder', aSettings.defaults.Quests.Other.PathFinder)],
                        [5, getImage(assets.GetBuildingIcon("QuestStarfall").bitmapData, "23px") + 'Starfall Quests'],
                        [1, createSwitch('aQuests_Starfall', aSettings.defaults.Quests.Other.Starfall)]
                    ]),
                    $('<br>'),
                    createTableRow([[9, 'Excelsior Letter Quests'], [3, '&nbsp;']], true),
                    createTableRow([
                        [5, getImage(assets.GetBuffIcon("QuestStart_SharpClaw").bitmapData, "23px") + loca.GetText('RES', "QuestStart_SharpClaw")],
                        [1, createSwitch('aQuests_Letters_SharpClaw', aSettings.defaults.Quests.Letters.SharpClaw)],
                        [5, getImage(assets.GetBuffIcon("QuestStart_StrangeIdols").bitmapData, "23px") + loca.GetText('RES', "QuestStart_StrangeIdols")],
                        [1, createSwitch('aQuests_Letters_StrangeIdols', aSettings.defaults.Quests.Letters.StrangeIdols)]
                    ]),
                    createTableRow([
                        [5, getImage(assets.GetBuffIcon("QuestStart_Annoholics").bitmapData, "23px") + loca.GetText('RES', "QuestStart_Annoholics")],
                        [1, createSwitch('aQuests_Letters_Annoholics', aSettings.defaults.Quests.Letters.Annoholics)],
                        [5, getImage(assets.GetBuffIcon("QuestStart_SilkCat").bitmapData, "23px") + loca.GetText('RES', "QuestStart_SilkCat")],
                        [1, createSwitch('aQuests_Letters_SilkCat', aSettings.defaults.Quests.Letters.SilkCat)]
                    ]),
                    createTableRow([
                        [5, getImage(assets.GetBuffIcon("QuestStart_Miranda").bitmapData, "23px") + loca.GetText('RES', "QuestStart_Miranda")],
                        [1, createSwitch('aQuests_Letters_Miranda', aSettings.defaults.Quests.Letters.Miranda)],
                        [5, getImage(assets.GetBuffIcon("QuestStart_BartTheBarter").bitmapData, "23px") + loca.GetText('RES', "QuestStart_BartTheBarter")],
                        [1, createSwitch('aQuests_Letters_BartTheBarter', aSettings.defaults.Quests.Letters.BartTheBarter)]
                    ]),
                    createTableRow([
                        [5, getImage(assets.GetBuffIcon("QuestStart_Vigilante").bitmapData, "23px") + loca.GetText('RES', "QuestStart_Vigilante")],
                        [1, createSwitch('aQuests_Letters_Vigilante', aSettings.defaults.Quests.Letters.Vigilante)],
                        [5, getImage(assets.GetBuffIcon("QuestStart_SettlersBandits").bitmapData, "23px") + loca.GetText('RES', "QuestStart_SettlersBandits")],
                        [1, createSwitch('aQuests_Letters_SettlersBandits', aSettings.defaults.Quests.Letters.SettlersBandits)]
                    ]),
                    createTableRow([
                        [5, getImage(assets.GetBuffIcon("QuestStart_LostCompass").bitmapData, "23px") + loca.GetText('RES', "QuestStart_LostCompass")],
                        [1, createSwitch('aQuests_Letters_LostCompass', aSettings.defaults.Quests.Letters.LostCompass)],
                        [5, getImage(assets.GetBuffIcon("QuestStart_AThreat").bitmapData, "23px") + loca.GetText('RES', "QuestStart_AThreat")],
                        [1, createSwitch('aQuests_Letters_AThreat', aSettings.defaults.Quests.Letters.AThreat)]
                    ]),
                    $('<br>'),
                    createTableRow([[9, 'Mini Quests'], [3, '&nbsp;']], true),
                    createTableRow([
                        [5, getImage(assets.GetBuffIcon("QuestStart_TheLittlePanda").bitmapData, "23px") + loca.GetText('RES', "QuestStart_TheLittlePanda")],
                        [1, createSwitch('aQuests_Letters_TheLittlePanda', aSettings.defaults.Quests.Mini.TheLittlePanda)],
                        [5, getImage(assets.GetBuffIcon("QuestStart_MysteriousCoin").bitmapData, "23px") + loca.GetText('RES', "QuestStart_MysteriousCoin")],
                        [1, createSwitch('aQuests_Letters_MysteriousCoin', aSettings.defaults.Quests.Mini.MysteriousCoin)]
                    ]),
                    createTableRow([
                        [5, getImage(assets.GetBuffIcon("QuestStart_WeddingInvitation").bitmapData, "23px") + loca.GetText('RES', "QuestStart_WeddingInvitation")],
                        [1, createSwitch('aQuests_Letters_WeddingInvitation', aSettings.defaults.Quests.Mini.WeddingInvitation)],
                        [5, getImage(assets.GetBuffIcon("QuestStart_ANewStone").bitmapData, "23px") + loca.GetText('RES', "QuestStart_ANewStone")],
                        [1, createSwitch('aQuests_Letters_ANewStone', aSettings.defaults.Quests.Mini.ANewStone)]
                    ]),
                    createTableRow([
                        [5, getImage(assets.GetBuffIcon("QuestStart_SaveTheDeers").bitmapData, "23px") + loca.GetText('RES', "QuestStart_SaveTheDeers")],
                        [1, createSwitch('aQuests_Letters_SaveTheDeers', aSettings.defaults.Quests.Mini.SaveTheDeers)],
                        [5, getImage(assets.GetBuffIcon("QuestStart_WolfPuppy").bitmapData, "23px") + loca.GetText('LAB', "QuestStart_WolfPuppy")],
                        [1, createSwitch('aQuests_Letters_WolfPuppy', aSettings.defaults.Quests.Mini.WolfPuppy)]
                    ]),
                ]);
                //
                const buildingsMenuHtml = function () {
                    var html = [];
                    var table = [];
                    const buildings = Object.keys(aSettings.defaults.Buildings.TProduction);
                    buildings.forEach(function (name, idx) {
                        if (!game.zone.mStreetDataMap.getBuildingByName(name)) return;
                        table.push([5, getImage(assets.GetBuildingIcon(name).bitmapData, "23px") + ' ' + loca.GetText('BUI', name)]);
                        table.push([1, aUtils.create.SettingsImg('aBuildings_' + name).addClass('buildingSettings')]);
                        if (table.length === 4 || idx + 1 === buildings.length) {
                            html.push(createTableRow(table));
                            table = [];
                        }
                    });
                    return html;
                }
                const buildingsMenu = aUtils.create.container().append([
                    createTableRow([[9, 'Buildings'], [3, '&nbsp;']], true),
                    createTableRow([[9, 'Run on Startup'], [3, createSwitch('aBuildings_AutoStart', aSettings.defaults.Buildings.autoStart)]]),
                    $('<br>'),
                    createTableRow([[9, 'Avaliable Production Buildings ' + aUtils.create.newImg()], [3, '&nbsp;']], true),
                ].concat(buildingsMenuHtml()));

                const toolsMenu = aUtils.create.container().append([
                    createTableRow([[9, 'Auto Star to Store'], [3, '&nbsp;']], true),
                    createTableRow([
                        [9, 'Run on Startup'],
                        [2, createSwitch('aTransferToStore_AutoStart', aSettings.defaults.TransferToStore.autoStart)],
                        [1, aUtils.create.SettingsImg('aTransferToStore_Menu')]
                    ]),
                    $('<br>'),
                    createTableRow([[9, 'Auto Open Mystery Boxs'], [3, '&nbsp;']], true),
                    createTableRow([
                        [9, 'Run on Startup'],
                        [2, createSwitch('aLootables_AutoStart', aSettings.defaults.Lootables.autoStart)],
                        [1, aUtils.create.SettingsImg('aLootables_Menu')]
                    ]),
                    $('<br>'),
                    createTableRow([[9, 'Auto Collect'], [3, '&nbsp;']], true),
                    createTableRow([
                        [9, "Pickups"],
                        [3, createSwitch('aCollect_Pickups', aSettings.defaults.Collect.Pickups)],
                    ]),
                    createTableRow([[12, '&#10551; When on Adventures/Senarios it is always On']]),
                    createTableRow([
                        [9, "Loot/Mystery Boxes"],
                        [3, createSwitch('aCollect_LootBoxes', aSettings.defaults.Collect.LootBoxes)],
                    ]),
                    createTableRow([[12, '&#10551; From Gift Chrismtas Tree, etc']]),
                    $('<br>'),
                ]);
                const miscMenu = aUtils.create.container().append([
                    createTableRow([[9, 'Script'], [3, '&nbsp;']], true),
                    createTableRow([
                        [9, "Auto Update on start up"],
                        [3, createSwitch('aScript_AutoUpdate', aSettings.defaults.Auto.AutoUpdate)],
                    ]),
                    $('<br>'),
                    createTableRow([[9, 'Security'], [3, '&nbsp;']], true),
                    createTableRow([
                        [9, "Enable file path validation (recommended)"],
                        [3, createSwitch('aSecurity_ValidateFilePaths', aSettings.defaults.Security.validateFilePaths)],
                    ]),
                    createTableRow([[12, '&#10551; When disabled, file operations may access any path (use with caution)']]),
                    $('<br>'),
                    createTableRow([[9, 'Connectivity'], [3, '&nbsp;']], true),
                    createTableRow([
                        [4, "Restart Client when RAM used:"],
                        [4, $('<input>', { 'id': 'aScript_RestartRAM', 'class': 'form-control', 'type': 'text', 'value': aSettings.defaults.Auto.RestartRAM })],
                        [4, ' GBs (disabled when 0)']
                    ]),
                    createTableRow([
                        [9, "Increase lost connection timeout to 120s:"],
                        [3, createSwitch('aScript_IncreaseTimeout', aSettings.defaults.Auto.increaseTimeout)],
                    ]),
                    $('<br>'),
                    createTableRow([[9, 'Tweaks'], [3, '&nbsp;']], true),
                    createTableRow([
                        [9, "&#10551; Chat: Reduce Message Histroy"],
                        [3, createSwitch('aTweaks_ChatMax', aSettings.defaults.Tweaks.ChatMax)],
                    ]),
                    createTableRow([
                        [9, "&#10551; Trade: Increase Adventures Max to 100"],
                        [3, createSwitch('aTweaks_TradeAdventureMax', aSettings.defaults.Tweaks.TradeAdventureMax)],
                    ]),
                    createTableRow([
                        [9, "&#10551; Trade: Increase Buildings Max to 100"],
                        [3, createSwitch('aTweaks_TradeBuildingMax', aSettings.defaults.Tweaks.TradeBuildingMax)],
                    ]),
                    createTableRow([
                        [9, "&#10551; Trade: Increase Buffs Max to 10000"],
                        [3, createSwitch('aTweaks_TradeBuffMax', aSettings.defaults.Tweaks.TradeBuffMax)],
                    ]),
                    createTableRow([
                        [9, "&#10551; Trade: Reduce Refresh Interval to 10s"],
                        [3, createSwitch('aTweaks_TradeFreshInterval', aSettings.defaults.Tweaks.TradeFreshInterval)],
                    ]),
                    createTableRow([
                        [9, "&#10551; GUI: Reduce Animals to 50 (Enhance Performance)"],
                        [3, createSwitch('aTweaks_GUIMaxAnimals', aSettings.defaults.Tweaks.GUIMaxAnimals)],
                    ]),
                    createTableRow([
                        [9, "&#10551; Mail: Increase Page Size to 100 (Each page have more mails)"],
                        [3, createSwitch('aTweaks_MailPageSize', aSettings.defaults.Tweaks.MailPageSize)],
                    ]),
                    $('<br>'),
                    createTableRow([[9, 'Developpers'], [3, '&nbsp;']], true),
                    createTableRow([[9, 'Show Grid'], [3, createSwitch('autoShowGrid', aSettings.defaults.Auto.showGrid)]]),

                ]);
                tabcontent.append([
                    $('<div>', { 'class': 'tab-pane fade in active', 'id': 'menu_Specialists' }).append(specialistsMenu),
                    $('<div>', { 'class': 'tab-pane fade', 'id': 'menu_MailTrade' }).append(mailTradeMenu),
                    $('<div>', { 'class': 'tab-pane fade', 'id': 'menu_Quests' }).append(questsMenu),
                    $('<div>', { 'class': 'tab-pane fade', 'id': 'menu_Buildings' }).append(buildingsMenu),
                    $('<div>', { 'class': 'tab-pane fade', 'id': 'menu_Tools' }).append(toolsMenu),
                    $('<div>', { 'class': 'tab-pane fade', 'id': 'menu_Misc' }).append(miscMenu)
                ]);
                aWindow.Body().html(tabs.prop("outerHTML") + '<br>' + tabcontent.prop("outerHTML"));
                aWindow.withBody('div.row').addClass('nohide');
                aWindow.withBody('.nav-justified > li').css("width", "20%");

                // Unbind all existing click handlers to prevent memory leaks and event stacking
                aWindow.Body().off('click');

                aWindow.withBody('#aAdventure_TemplateMaker').click(function () { aUI.modals.adventure.templateMaker(); });
                aWindow.withBody('#aExplorers_Menu').click(aUI.modals.ExplorersSettings);
                aWindow.withBody('#aDeposits_Menu, #aQuests_GeologistTask').click(aUI.modals.GeoDepositSettings);
                aWindow.withBody('#aQuests_ExplorerTask_Treasure').click(function () { aUI.modals.SelectExplorersForQuests('Treasure') });
                aWindow.withBody('#aQuests_ExplorerTask_Adventure').click(function () { aUI.modals.SelectExplorersForQuests('AdventureZone') });
                aWindow.withBody('#aTransferToStore_Menu').click(aUI.modals.TransferToStore);
                aWindow.withBody('#aLootables_Menu').click(aUI.modals.Lootables);
                aWindow.withBody('#aMail_Monitor').val(aSettings.defaults.Mail.TimerMinutes);
                aWindow.withBody('#aMail_FriendsFilter').click(function () { aUI.modals.trade.filterSettings('Friends') });
                aWindow.withBody('#aMail_ResourcesFilter').click(function () { aUI.modals.trade.filterSettings('Resources') });
                aWindow.withBody('.buildingSettings').click(function () {
                    aUI.modals.buildingSettings($(this).attr('id').replace('aBuildings_', ''));
                });
                aWindow.withBody('#aAdventure_EditTemplate').click(function () {
                    if (!$("#aAdventure_SavedPool").val()) return;
                    aUI.modals.adventure.templateMaker($("#aAdventure_SavedPool").val());
                });
                aWindow.withBody('#aAdventure_RemoveTemplate').click(function () {
                    if (!confirm('Are you sure ?!')) return;
                    const index = parseInt($("#aAdventure_SavedPool").val());
                    aUtils.file.Delete(aUtils.file.getPath(0, aSettings.defaults.Adventures.templates[index].id));
                    aSettings.defaults.Adventures.templates.splice(index, 1);
                    aUI.modals.settings.loadSavedAdventures();
                    aSettings.save();
                });
                aWindow.withBody('#aExplorers_SelectTemplate').click(function () {
                    aUtils.file.Select(function (event) {
                        $("#aExplorers_Template").html(event.currentTarget.nativePath);
                        aSettings.defaults.Explorers.template = event.currentTarget.nativePath;
                    });
                });
                aWindow.withBody('#aScript_RestartRAM').on('input', function () {
                    $(this).val($(this).val().replace(/[^0-9.]/g, '').replace(/^([^.]*\.)|\./g, '$1'));

                });
                aWindow.Footer().prepend($("<button>").attr({ 'class': "btn btn-primary pull-left" }).text('Save').click(function () {
                    //Script
                    aSettings.defaults.Auto.AutoUpdate = $('#aScript_AutoUpdate').is(':checked');
                    aSettings.defaults.Auto.RestartRAM = parseFloat($('#aScript_RestartRAM').val()) || 0;
                    aSettings.defaults.Auto.increaseTimeout = $('#aScript_IncreaseTimeout').is(':checked');
                    //Security
                    aSettings.defaults.Security.validateFilePaths = $('#aSecurity_ValidateFilePaths').is(':checked');
                    // Auto Adventures
                    aSettings.defaults.Adventures.reTrain = $('#aAdventure_RetrainUnits').is(':checked');
                    aSettings.defaults.Adventures.blackVortex = $('#aAdventure_BlackVortex').is(':checked');
                    aSettings.defaults.Adventures.speedBuff = $('#aAdventure_SpeedBuffs').val();
                    // Explorers
                    aSettings.defaults.Explorers.autoStart = $('#aExplorers_AutoStart').is(':checked');
                    aSettings.defaults.Explorers.useTemplate = $('#aExplorers_UseTemplate').is(':checked');
                    aSettings.defaults.Explorers.template = $('#aExplorers_Template').text();
                    aSettings.defaults.Explorers.eventOptimize = $('#aExplorers_EventOptimize').is(':checked');
                    // Deposits
                    aSettings.defaults.Deposits.autoStart = $('#aDeposits_AutoStart').is(':checked');
                    // Quests
                    aSettings.defaults.Quests.Config.AutoStart = $('#aQuests_Config_AutoStart').is(':checked');
                    aSettings.defaults.Quests.Config.GatherfromStar = $('#aQuests_Config_Gather').is(':checked');
                    aSettings.defaults.Quests.Config.PayResources = $('#aQuests_Config_Pay').is(':checked');
                    aSettings.defaults.Quests.Config.SellinTO = $('#aQuests_Config_Sell').is(':checked');
                    aSettings.defaults.Quests.Config.TrainUnits = $('#aQuests_Config_TrainUnits').is(':checked');
                    aSettings.defaults.Quests.Config.Buffs.Produce = $('#aQuests_Config_Buffs_Produce').is(':checked');
                    aSettings.defaults.Quests.Config.Buffs.Apply = $('#aQuests_Config_Buffs_Apply').is(':checked');
                    aSettings.defaults.Quests.Config.Buffs.PHBuff = $('#aQuests_Config_Buffs_PHBuff').val();

                    aSettings.defaults.Quests.Config.ProduceResource.TurnOn = $('#aQuests_Config_ProduceResource_TurnOn').is(':checked');
                    aSettings.defaults.Quests.Config.ProduceResource.BuffType = $('#aQuests_Config_ProduceResource_BuffType').val();
                    aSettings.defaults.Quests.Config.Notification = $('#aQuests_Config_Notification').is(':checked');

                    aSettings.defaults.Quests.Other.Daily = $('#aQuests_Daily').is(':checked');
                    aSettings.defaults.Quests.Other.DailyGuild = $('#aQuests_DailyGuild').is(':checked');
                    aSettings.defaults.Quests.Other.Weekly = $('#aQuests_Weekly').is(':checked');
                    aSettings.defaults.Quests.Other.Ghost = $('#aQuests_Ghost').is(':checked');
                    aSettings.defaults.Quests.Other.PathFinder = $('#aQuests_PathFinder').is(':checked');
                    aSettings.defaults.Quests.Other.Starfall = $('#aQuests_Starfall').is(':checked');
                    //Letter Quests
                    aSettings.defaults.Quests.Letters.SharpClaw = $('#aQuests_Letters_SharpClaw').is(':checked');
                    aSettings.defaults.Quests.Letters.StrangeIdols = $('#aQuests_Letters_StrangeIdols').is(':checked');
                    aSettings.defaults.Quests.Letters.Annoholics = $('#aQuests_Letters_Annoholics').is(':checked');
                    aSettings.defaults.Quests.Letters.SilkCat = $('#aQuests_Letters_SilkCat').is(':checked');
                    aSettings.defaults.Quests.Letters.Miranda = $('#aQuests_Letters_Miranda').is(':checked');
                    aSettings.defaults.Quests.Letters.BartTheBarter = $('#aQuests_Letters_BartTheBarter').is(':checked');
                    aSettings.defaults.Quests.Letters.Vigilante = $('#aQuests_Letters_Vigilante').is(':checked');
                    aSettings.defaults.Quests.Letters.SettlersBandits = $('#aQuests_Letters_SettlersBandits').is(':checked');
                    aSettings.defaults.Quests.Letters.LostCompass = $('#aQuests_Letters_LostCompass').is(':checked');
                    aSettings.defaults.Quests.Letters.AThreat = $('#aQuests_Letters_AThreat').is(':checked');
                    //Mini Quests
                    aSettings.defaults.Quests.Mini.TheLittlePanda = $('#aQuests_Letters_TheLittlePanda').is(':checked');
                    aSettings.defaults.Quests.Mini.MysteriousCoin = $('#aQuests_Letters_MysteriousCoin').is(':checked');
                    aSettings.defaults.Quests.Mini.WeddingInvitation = $('#aQuests_Letters_WeddingInvitation').is(':checked');
                    aSettings.defaults.Quests.Mini.ANewStone = $('#aQuests_Letters_ANewStone').is(':checked');
                    aSettings.defaults.Quests.Mini.SaveTheDeers = $('#aQuests_Letters_SaveTheDeers').is(':checked');
                    aSettings.defaults.Quests.Mini.WolfPuppy = $('#aQuests_Letters_WolfPuppy').is(':checked');


                    //Buildings
                    aSettings.defaults.Buildings.autoStart = $('#aBuildings_AutoStart').is(':checked');

                    //Tweaks
                    aSettings.defaults.Tweaks.ChatMax = $('#aTweaks_ChatMax').is(':checked');
                    aSettings.defaults.Tweaks.TradeAdventureMax = $('#aTweaks_TradeAdventureMax').is(':checked');
                    aSettings.defaults.Tweaks.TradeBuildingMax = $('#aTweaks_TradeBuildingMax').is(':checked');
                    aSettings.defaults.Tweaks.TradeBuffMax = $('#aTweaks_TradeBuffMax').is(':checked');
                    aSettings.defaults.Tweaks.TradeFreshInterval = $('#aTweaks_TradeFreshInterval').is(':checked');
                    aSettings.defaults.Tweaks.GUIMaxAnimals = $('#aTweaks_GUIMaxAnimals').is(':checked');
                    aSettings.defaults.Tweaks.MailPageSize = $('#aTweaks_MailPageSize').is(':checked');
                    //Mail
                    aSettings.defaults.Mail.AutoStart = $('#aMail_AutoStart').is(':checked');
                    aSettings.defaults.Mail.AutoStartEvents = $('#aMail_AutoStartEvents').is(':checked');
                    aSettings.defaults.Mail.AcceptAdventureLoot = $('#aMail_AdvLoots').is(':checked');
                    aSettings.defaults.Mail.AcceptAdventureMessage = $('#aMail_AdvMsg').is(':checked');
                    aSettings.defaults.Mail.AcceptLoots = $('#aMail_Loots').is(':checked');
                    aSettings.defaults.Mail.AcceptGifts = $('#aMail_Gifts').is(':checked');
                    aSettings.defaults.Mail.AcceptGeologistMsg = $('#aMail_Geologist').is(':checked');
                    aSettings.defaults.Mail.DeclineTrades = $('#aMail_Decline').is(':checked');
                    aSettings.defaults.Mail.CompleteTrades = $('#aMail_Complete').is(':checked');
                    aSettings.defaults.Mail.ToStar = $('#aMail_Star').is(':checked');
                    aSettings.defaults.Mail.TimerMinutes = parseInt($('#aMail_Monitor').val());
                    aSettings.defaults.Mail.SaveFriendsTrades = $('#aMail_SaveTrades').is(':checked');
                    aSettings.defaults.Mail.AcceptInvites = $('#aMail_AdvInvite').is(':checked');
                    aSettings.defaults.Mail.AcceptTrades = $('#aMail_Trades').is(':checked');
                    //Misc
                    aSettings.defaults.Collect.Pickups = $('#aCollect_Pickups').is(':checked');
                    aSettings.defaults.Collect.LootBoxes = $('#aCollect_LootBoxes').is(':checked');
                    aSettings.defaults.TransferToStore.autoStart = $('#aTransferToStore_AutoStart').is(':checked');
                    aSession.isOn.TransferToStore = aSettings.defaults.TransferToStore.autoStart;
                    aSettings.defaults.Lootables.autoStart = $('#aLootables_AutoStart').is(':checked');
                    aSession.isOn.Lootables = aSettings.defaults.Lootables.autoStart;
                    aSettings.defaults.Auto.showGrid = $('#autoShowGrid').is(':checked');
                    aSettings.save(true);
                    aUtils.game.applyTweaks();
                    aUI.menu.init();
                    aWindow.hide();
                }));
                aUI.modals.settings.loadSavedAdventures();
                aWindow.show();
                $('#aAdventure_SpeedBuffs').val(aSettings.defaults.Adventures.speedBuff);
                $('#aMail_Monitor').val(aSettings.defaults.Mail.TimerMinutes);
                $('#aQuests_Config_Buffs_PHBuff').val(aSettings.defaults.Quests.Config.Buffs.PHBuff);
                $('#aQuests_Config_ProduceResource_BuffType').val(aSettings.defaults.Quests.Config.ProduceResource.BuffType);
            } catch (e) { debug(e) }
        },
        adventure: {
            TM_LoadHomeTemplate: function (templatePath) {
                try {
                    aWindow.withsBody('#LHTemp').html(templatePath);
                    aWindow.homeTemp = aUtils.file.Read(templatePath);
                    if (!aWindow.homeTemp) alert('Invalid file!');
                    const generals = {}, units = {};
                    $.each(aWindow.homeTemp, function (id, props) {
                        const icon = game.def('Enums::SPECIALIST_TYPE').toString(props.type).toLowerCase();
                        generals[icon] = (generals[icon] || 0) + 1;
                        $.each(props.army, function (type, amount) {
                            units[type] = (units[type] || 0) + amount;
                        });
                    });
                    aWindow.withsBody('#LHGenerals').empty();
                    aWindow.withsBody('#LHUnits').empty();
                    $.each(generals, function (img, count) {
                        aWindow.withsBody('#LHGenerals').append(
                            getImageTag("icon_{0}.png".format(img), '23px') + "x" + count + " "
                        );
                    });
                    $.each(units, function (img, count) {
                        aWindow.withsBody('#LHUnits').append(
                            getImage(assets.GetMilitaryIcon(img).bitmapData, '23px') + "x" + count + " "
                        );
                    });
                } catch (e) { }
            },
            TM_UpdateView: function () {
                aWindow.withsBody('#aTemplate_Steps').empty();
                var out = [];

                aWindow.steps.forEach(function (step, idx) {
                    const stepNum = $('<span>').html('&#8597;{0}.'.format(idx + 1)).css('cursor', 'move');
                    switch (step.name) {
                        case 'AdventureTemplate':
                            var typename = step.file.split("\\").pop();
                            aWindow.withsBody('#aTemplate_Steps').append(
                                aUtils.create.Row([
                                    [1, stepNum],
                                    [10, $('<span>').html('Excute: {0}'.format(typename)).css('cursor', 'pointer')],
                                    [1, $('<button>', { 'type': 'button', 'class': 'close', 'value': idx }).html($('<span>').html('&times;'))],
                                ], 'tempStep').attr('style', idx === aWindow.selectedStep ? 'background: #FF7700;' : ''));
                            break;
                        case 'ProduceItem':
                        case 'ApplyBuff':
                            const item = aAdventure.data.getItems($("#aTemplate_AdventureSelect").val())[step.data];
                            const amount = item.amount || item.grids.length;
                            const fullName = aBuffs.fullName(step.data);
                            aWindow.withsBody('#aTemplate_Steps').append(
                                aUtils.create.Row([
                                    [1, stepNum],
                                    [10, $('<span>').html('{0}: {1}{2} x{3}'.format(step.name === "ApplyBuff" ? "Apply" : "Produce", getImage(assets.GetBuffIcon(fullName).bitmapData, "20px"), loca.GetText('RES', fullName), amount)).css('cursor', 'pointer')],
                                    [1, $('<button>', { 'type': 'button', 'class': 'close', 'value': idx, 'disabled': 'disabled' }).html($('<span>').html('&times;'))],
                                ], 'tempStep').attr('style', idx === aWindow.selectedStep ? 'background: #FF7700;' : ''));
                            break;
                        default:
                            aWindow.withsBody('#aTemplate_Steps').append(
                                aUtils.create.Row([
                                    [1, stepNum],
                                    [10, $('<span>').html(step.name.replace(/([a-z])([A-Z])/g, '$1 $2')).css('cursor', 'pointer')],
                                    [1, $('<button>', { 'type': 'button', 'class': 'close', 'value': idx }).html($('<span>').html('&times;'))],
                                ], 'tempStep').attr('style', idx === aWindow.selectedStep ? 'background: #FF7700;' : ''));
                    }

                });
                aWindow.withsBody('#aTemplate_Steps').append(out);
                aWindow.withsBody('.close').click(function () {
                    if (aWindow.selectedStep === $(this).val()) {
                        aWindow.selectedStep = null;
                        $('#aTemplate_SelectedStep').empty();
                    }
                    aWindow.steps.splice(parseInt($(this).val()), 1);
                    aUI.modals.adventure.TM_UpdateView();
                });
                aWindow.withsBody('#aTemplate_Steps').sortable({
                    update: function (event, ui) {
                        var prevIndex = $(ui.item).find('.close').val();
                        if (aWindow.selectedStep === prevIndex)
                            aWindow.selectedStep = ui.item.index();
                        shortcutsMoveElement(aWindow.steps, prevIndex, ui.item.index());
                        aUI.modals.adventure.TM_UpdateView();
                    }
                });
            },
            TM_UpdateTemplateAttacks: function (data) {
                $("#selectedStep_TemplateAttacks").empty();
                var num = 1;
                $.each(data, function (id, general) {
                    var army = '';
                    $.each(general.army, function (type, amount) {
                        army += utils.getImageTag(type, '24px', '24px') + ' ' + amount;
                    });
                    const icon = game.def('Enums::SPECIALIST_TYPE').toString(general.type).toLowerCase();
                    $("#selectedStep_TemplateAttacks").append(
                        aUtils.create.Row([
                            [5, (num++) + ". " + getImageTag("icon_{0}.png".format(icon), '24px', '24px') + ' ' + general.name],
                            [4, army],
                            [1, general.grid && $('<img>', { 'src': 'images/1648_GUI.Assets.gAssetManager_ButtonIconTrumpet.png' })],
                            [1, general.target && $('<img>', { 'src': 'images/1647_GUI.Assets.gAssetManager_ButtonIconFindWildZone.png' })],
                            [1, (general.time / 1000) + 's']
                        ])
                    )
                });
            },
            TM_UpdateStepStatus: function (success, text) {
                $("#aTemplate_UpdateStepStatus").html(
                    $("<b>").text(text)
                ).css("color", success ? "green" : "red").show()
                setTimeout(function () { $("#aTemplate_UpdateStepStatus").empty(); }, TIMEOUTS.TEMPLATE_STATUS_CLEAR);
            },
            TM_SelectedStepInfo: function (step) {
                const selectedStep = $('#aTemplate_SelectedStep');
                selectedStep.empty();
                switch (step.name) {
                    case 'VisitAdventure':
                    case 'ReturnHome':
                        selectedStep.append(
                            aUtils.create.Row([
                                [12, 'Load {0} Island'.format(step.name === 'ReturnHome' ? 'Home' : 'Adventure')]
                            ])
                        );
                        break;
                    case 'CollectPickups':
                        selectedStep.append(
                            aUtils.create.Row([
                                [12, 'Wait for Collectibles, Collect Collectibles and proceed!']
                            ])
                        );
                        break;
                    case 'ProduceItem':
                    case 'ApplyBuff':
                        const item = aAdventure.data.getItems($("#aTemplate_AdventureSelect").val())[step.data];
                        const fullName = aBuffs.fullName(step.data);
                        selectedStep.append(
                            aUtils.create.Row([
                                [12, $('<span>').html('Auto {0} x{3} {1}{2} {4}'.format(
                                    step.name === "ApplyBuff" ? "Apply" : "Produce",
                                    getImage(assets.GetBuffIcon(fullName).bitmapData, "26px"),
                                    loca.GetText('RES', fullName),
                                    item.amount || item.grids.length,
                                    step.name === 'ApplyBuff' ? 'on Targets' : 'in {0} Provision House'.format(getImage(assets.GetBuildingIcon('ProvisionHouse').bitmapData, "26px"))
                                ))]
                            ])
                        );
                        if (step.name === 'ProduceItem') {
                            selectedStep.append(
                                aUtils.create.Row([
                                    [11, "Move to next step as soon as production started (don't wait for it to complete)"],
                                    [1, aUtils.create.Switch('skip_production', step.skip || false)]
                                ])
                            );
                        }
                        break;
                    case 'UseSpeedBuff':
                        selectedStep.append([
                            aUtils.create.Row([[12, 'Apply Speed Buff on Advneuter Island ;)']]),
                            aUtils.create.Row([[12, 'You can choose specific buff for this adventure!']]),
                            aUtils.create.Row([
                                [2, 'Select Buff:'],
                                [8, aUtils.create.Select("selectedStep_SpeedBuff")
                                    .append($('<option>', { 'value': '' }).text('Default from settings!'))
                                    .append(aBuffs.getSpeedBuffs(true))
                                    .val(step.data || '')
                                ],
                                [2, aUtils.create.Button('', 'Select').click(function () {
                                    step.data = $('#selectedStep_SpeedBuff').val();
                                    aUI.modals.adventure.TM_UpdateStepStatus(true, "Selected");
                                })]
                            ])
                        ]);
                        break;
                    case 'AdventureTemplate':
                        selectedStep.append([
                            aUtils.create.Row([[12, 'This is a saved version of the data (Update if needed)']]),
                            aUtils.create.Row([
                                [3, "Template file: "],
                                [7, aUtils.create.Span('selectedStep_TemplateFile', step.file)],
                                [2, aUtils.create.Button("", "Update").click(function () {
                                    const data = aUtils.file.Read(step.file);
                                    aUI.modals.adventure.TM_UpdateStepStatus(data, data ? "Updated" : "Failed");
                                    if (!data) return;
                                    step.data = data;
                                    aUI.modals.adventure.TM_UpdateTemplateAttacks(data);
                                })]
                            ]),
                            aUtils.create.Row([
                                [11, "Move to next step only if all enemies in this step are killed!"],
                                [1, createSwitch('kill_all_enemies', step.killAll || false)],
                            ]),
                            $('<br>'),
                            createTableRow([
                                [5, "General"],
                                [4, "Army"],
                                [1, "Move"],
                                [1, "Attack"],
                                [1, "Delay"]
                            ], true),
                            aUtils.create.Span('selectedStep_TemplateAttacks').addClass('small')
                        ]);
                        aUI.modals.adventure.TM_UpdateTemplateAttacks(step.data);
                        break;
                }
                $("#skip_production").change(function () { step.skip = $(this).is(":checked"); });
                $("#kill_all_enemies").change(function () { step.killAll = $(this).is(":checked"); });
            },
            TM_SaveTemplate: function () {
                const LHTemp = aWindow.withsBody('#LHTemp').text();
                if (!LHTemp)
                    return alert('You must include a "Home Load Template"');
                const template = {
                    name: $('#aTemplate_AdventureSelect').val(),
                    steps: [
                        { name: 'InHomeLoadGenerals', file: LHTemp, data: aUtils.file.Read(LHTemp) },
                        { name: 'StartAdventure' },
                        { name: 'SendGeneralsToAdventure' }
                    ].concat(aWindow.steps)
                }
                template.steps.push({ name: 'LoadGeneralsToEnd' });
                template.hash = hash(JSON.stringify(template));
                var id = aWindow.adventureIndex ?
                    aSettings.defaults.Adventures.templates[aWindow.adventureIndex].id : new Date().getTime();
                aUtils.file.Write(
                    aUtils.file.getPath(0, id),
                    JSON.stringify(template, null, 2)
                );
                if (!aWindow.adventureIndex) {
                    aSettings.defaults.Adventures.templates.push({
                        label: prompt("Custom adventure name"),
                        name: template.name,
                        id: id
                    });
                }
                aSettings.save(true);
                if (!aWindow.adventureIndex)
                    aUI.modals.settings.loadSavedAdventures();
                aUI.menu.init();
                aWindow.shide();
            },
            templateMaker: function (adventureIndex) {
                aWindow.selectedStep = null;
                aWindow.steps = [];
                aWindow.adventureIndex = adventureIndex || null;
                aWindow.settings(aUI.modals.adventure.TM_SaveTemplate);
                aWindow.sDialog().css("height", "100%").addClass("modal-lg");
                aWindow.sTitle().html("{0} {1}".format(
                    getImageTag('icon_general.png'),
                    "Auto Adventure Template maker")
                );

                // Adventure Select
                var adventureSelect = function () {
                    const select = aUtils.create.Select('aTemplate_AdventureSelect');
                    $.each(aAdventure.data.getAdventures(), function (category, adventures) {
                        if (['Scenario', 'Coop'].indexOf(category) !== -1) return;
                        var optGroup = $('<optgroup>', { label: category });
                        $.each(adventures, function (i, adv) {
                            const disabled = aAdventure.data.getAdventureType(adv) === "Venture" && !aAdventure.data.getItems(adv) ? true : false;
                            optGroup.append($('<option>', { value: adv }).prop('disabled', disabled).text(loca.GetText('ADN', adv)));
                        });
                        select.append(optGroup);
                    });
                    return select;
                }

                var tempOptions = [
                    aUtils.create.Row([[2,
                        aUtils.create.container().attr('id', 'adventureIcon')
                    ], [10,
                        aUtils.create.container().html([
                            aUtils.create.Row([[12, 'Options']], '', true),
                            aUtils.create.Row([[3, 'Adventure:'], [9, adventureSelect()]]),
                            aUtils.create.Row([
                                [3, "Load template: "],
                                [7, aUtils.create.Span('LHTemp')],
                                [2, aUtils.create.Button("LHTempSelect", "Select")]
                            ]),
                        ])
                    ]], 'main'),
                    $('<br>'),
                    aUtils.create.Row([[12, "Tool Auto Functions"]], '', true),
                    aUtils.create.Row([[12, "Retrenching Generals, Ending Quests, Loading generals and Finishing Adventure"]]),
                    $('<br>'),
                    aUtils.create.Row([[12, 'Overview']], '', true),
                    aUtils.create.Row([[12, $('<div>', { 'id': 'LHGenerals' })]]),
                    aUtils.create.Row([[12, $('<div>', { 'id': 'LHUnits' })]]),
                    $('<br>'),
                    createTableRow([[10, "Selected Step Details (Don't forget to save!)"], [2, aUtils.create.Span('aTemplate_UpdateStepStatus')]], true),
                    $('<span>', { 'id': 'aTemplate_SelectedStep' })
                ];
                var tempSteps = [
                    aUtils.create.Row([[12, 'Steps (Double click to select)']], '', true),
                    $('<span>', { 'id': 'aTemplate_Steps', 'class': 'small' })
                ];
                aWindow.sData().append(aUtils.create.container().append([
                    aUtils.create.Row([
                        [8, aUtils.create.container().html(tempOptions)],
                        [4, aUtils.create.container().html(tempSteps)]
                    ], 'main'),
                ]));
                aWindow.withsBody('.main').css({ "background": "inherit", "margin-top": "5px" });
                aWindow.withsBody('#LHTempSelect').click(function () {
                    aUtils.file.Select(function (event) {
                        aUI.modals.adventure.TM_LoadHomeTemplate(event.currentTarget.nativePath);
                    });
                });
                aWindow.withsBody('#aTemplate_AdventureSelect').change(function () {
                    const value = $(this).val();
                    debug(value);
                    $("#adventureIcon").html(getImage(assets.GetBuffIcon($('#aTemplate_AdventureSelect').val()).bitmapData));
                    $('#LHTemp, #LHGenerals, #LHUnits').empty();
                    aWindow.steps = [];
                    aWindow.steps.push({ name: 'VisitAdventure' });
                    aWindow.steps.push({ name: 'UseSpeedBuff' });
                    $.each(aAdventure.data.getItems(value), function (k) {
                        aWindow.steps.push({ name: 'ProduceItem', data: k });
                        aWindow.steps.push({ name: 'ApplyBuff', data: k });
                    });
                    aUI.modals.adventure.TM_UpdateView();
                });
                $('#aTemplate_Steps').on('dblclick', '.tempStep', function () {
                    const idx = $(this).find('.close').val();
                    aWindow.selectedStep = aWindow.selectedStep !== idx ? idx : null;
                    aUI.modals.adventure.TM_UpdateView();
                    if (!aWindow.selectedStep) return $('#aTemplate_SelectedStep').empty();
                    aUI.modals.adventure.TM_SelectedStepInfo(aWindow.steps[idx]);
                });

                aWindow.sFooter().prepend(
                    $('<div>', { 'class': 'btn-group dropup aTemplate_Commands' }).append([
                        $('<button>').attr({
                            "class": "btn btn-success dropdown-toggle",
                            'aria-haspopup': 'true',
                            'style': 'margin-left: 4px;',
                            'aria-expanded': 'false',
                            'data-toggle': "dropdown"
                        }).text('Add Step'),
                        $('<ul>', { 'class': 'dropdown-menu' }).append([
                            $('<li>').html($('<a>', { 'href': '#', 'name': 'ReturnHome', 'class': 'venture_only' }).text("Return Home")),
                            $('<li>').html($('<a>', { 'href': '#', 'name': 'VisitAdventure' }).text("Load Adventure")),
                            $('<li>').html($('<a>', { 'href': '#', 'name': 'CollectPickups', 'class': 'venture_only' }).text("Collect Pickups")),
                            $('<li>').html($('<a>', { 'href': '#', 'name': 'AdventureTemplate' }).text("Adventure Template/s")),
                        ])
                    ])
                )
                // Unbind existing click handlers to prevent event stacking
                aWindow.sFooter().find('.dropdown-menu a').off('click');
                aWindow.sFooter().find('.dropdown-menu a').click(function () {
                    if (this.name === 'AdventureTemplate') {
                        var txtFilter = new air.FileFilter("Template", "*.*");
                        var root = new air.File();
                        root.browseForOpenMultiple("Open", new window.runtime.Array(txtFilter));
                        var selectMultipleHandler = function (event) {
                            root.removeEventListener(window.runtime.flash.events.FileListEvent.SELECT_MULTIPLE, selectMultipleHandler);
                            event.files.forEach(function (file) {
                                const data = aUtils.file.Read(file.nativePath);
                                if (!data) return alert('Invalid file');
                                aWindow.steps.push({ name: 'AdventureTemplate', file: file.nativePath, data: data });
                            });
                            aUI.modals.adventure.TM_UpdateView();
                        };
                        root.addEventListener(window.runtime.flash.events.FileListEvent.SELECT_MULTIPLE, selectMultipleHandler);
                    } else {
                        const isNotVenture = aAdventure.data.getAdventureType($("#aTemplate_AdventureSelect").val()) !== "Venture";
                        if (this.name === 'CollectPickups' && isNotVenture)
                            return alert("You can only add this on Ventures\nTool will collect normal adventure collectibles!");
                        if (this.name === 'ReturnHome' && isNotVenture)
                            alert("You normally don't need this step in normal adventures\nUse with caution!!")

                        aWindow.steps.push({ name: this.name });
                        aUI.modals.adventure.TM_UpdateView();
                    }
                });
                if (aWindow.adventureIndex) {
                    const adventure = aSettings.defaults.Adventures.templates[aWindow.adventureIndex];
                    const content = aUtils.file.Read(aUtils.file.getPath(0, adventure.id));
                    if (!content) return alert('Invalid file!');
                    $('#aTemplate_AdventureSelect').val(content.name);
                    $("#adventureIcon").html(getImage(assets.GetBuffIcon($('#aTemplate_AdventureSelect').val()).bitmapData));
                    $('#aTemplate_AdventureSelect').prop('disabled', true);
                    aUI.modals.adventure.TM_LoadHomeTemplate(content.steps[0].file);
                    aWindow.steps = content.steps.slice(3, -1);
                    aUI.modals.adventure.TM_UpdateView();
                } else {
                    $('#aTemplate_AdventureSelect').change();
                }
                aWindow.sshow();
            },
            adventureMonitor: function () {
                if (!aSession.adventure.name)
                    return aUI.Alert('Please select an adventure first', 'ARMY');
                try {
                    aWindow = new Modal("aAdventureModal", getImage(assets.GetBuffIcon("MapPart").bitmapData) + " Auto Adventure");
                    var aAdventure_SpeedBuffs = aUtils.create.Select("aAdventure_SpeedBuffs").append(aBuffs.getSpeedBuffs(1));
                    //aWindow.size = '';
                    aWindow.create();
                    aWindow.Body().empty().append(
                        aUtils.create.container().append([
                            aUtils.create.Panel([
                                aUtils.create.Row([
                                    [1,
                                        $('<div>', { 'class': 'text-center' }).append([
                                            $('<div>', { 'id': 'aAdventureImg' }),
                                        ])
                                    ],
                                    [11,
                                        $('<div>').append([
                                            aUtils.create.Row([
                                                [1, "Name: "],
                                                [3, $('<label>', { 'id': 'aAdventureName', 'class': 'small' })],
                                                [2, "Inventory: " + $('<span>', { 'id': 'aAdventureAmount' }).prop('outerHTML')],
                                                [2, 'Speed Buff:'],
                                                [4, aAdventure_SpeedBuffs],
                                            ], 'remTable'),
                                            aUtils.create.Row([
                                                [1, "File: "],
                                                [3, $('<label>', { 'id': 'aAdventureFile', 'class': 'text-muted small' })],
                                                [2, "Repeats: " + $('<label>', { 'id': 'aAdventureRepeats' }).prop('outerHTML')],
                                                [2, "Black Vortex ({0}):".format(aBuffs.getBuffAmount("PropagationBuff_AdventureZoneTravelBoost_BlackTree"))],
                                                [1, createSwitch('aAdventure_BlackVortex', aSettings.defaults.Adventures.blackVortex)],
                                                [2, "Retrain lost units:"],
                                                [1, createSwitch('aAdventure_RetrainUnits', aSettings.defaults.Adventures.reTrain)],
                                            ], 'remTable'),
                                        ]).css("padding", "-20px 15px")
                                    ]], 'remTable')
                            ]),
                            $('<div>', { 'class': 'small' }).html('* Finishing quests and ending the adventure are done automatically!'),
                            aUtils.create.Panel([
                                aUtils.create.Row([
                                    [7, $('<div>', { 'id': 'aAdventureStepsDiv' }).css("padding", "-20px 15px")],
                                    [5,
                                        $('<div>', { 'class': 'small' }).css("padding", "-20px 15px").append([
                                            aUtils.create.Row([[4, "Generals:"], [8, aUtils.create.Span('aAdventureTotalGenerals', '0')]], 'remTable'),
                                            aUtils.create.Row([[4, "Targets:"], [2, aUtils.create.Span('aAdventureTotalEnemies', '0')], [4, 'Remaining:'], [2, aUtils.create.Span('aAdventureRemainingEnemies', '0')]], 'remTable'),
                                            aUtils.create.Row([[4, "Lost Units:"], [8, aUtils.create.Span('aAdventureTotalLost', '0')]], 'remTable'),
                                            $('<div>', { 'id': 'aAdventureLostUnitsDiv' }),
                                        ])
                                    ]
                                ], 'remTable'),
                            ]).css('border', '0px'),
                        ]));

                    aWindow.Footer().empty().prepend([
                        $("<button>", { 'id': 'aAdventureToggle', 'data-cmd': aSession.isOn.Adventure ? 'stop' : 'start', 'class': "btn btn-primary pull-left" }).text(aSession.isOn.Adventure ? 'Stop' : "Start"),
                        $("<label>", { 'id': 'aAdventureStatus', 'style': 'margin: 7px;', 'class': "small pull-left" }).text("Status: ---")
                    ]).append(
                        $("<button>", { 'class': "btn btn-primary btnClose", 'data-dismiss': 'modal' }).text("Close")
                    );
                    aWindow.withBody('#aAdventure_BlackVortex').change(function (e) { aSettings.defaults.Adventures.blackVortex = $(e.target).is(':checked'); });
                    aWindow.withBody('#aAdventure_RetrainUnits').change(function (e) { aSettings.defaults.Adventures.reTrain = $(e.target).is(':checked'); });
                    $('#aAdventureModal').on('click', '#aAdventureToggle', function () {
                        switch ($(this).data('cmd')) {
                            case 'start':
                                aSession.isOn.Adventure = true;
                                $(this).data('cmd', 'stop').text('Stop');
                                break;
                            case 'startfrom':
                            case 'continuefrom':
                                var indexTxt = $('#aAdventureStepsDiv').find(".stepSelected").data('step');
                                aSession.adventure.index = parseInt(indexTxt);
                                aSession.isOn.Adventure = true;
                                $(this).data('cmd', 'stop').text('Stop');
                                break;
                            case 'stop':
                                aSession.isOn.Adventure = false;
                                $(this).data('cmd', 'start').text('Start');
                                break;
                        }
                    });
                    aUI.modals.adventure.AM_LoadInfo();
                    aWindow.withBody(".remTable").css({ "background": "inherit", "margin-top": "5px" });
                    aWindow.show();
                    $('#aAdventure_SpeedBuffs').val(aSettings.defaults.Adventures.speedBuff);
                } catch (e) { debug(e); }
            },
            AM_LoadInfo: function () {
                try {
                    var buffAmount = aBuffs.getBuffAmount(['Adventure', aSession.adventure.name]);
                    $("#aAdventureImg").html(getImage(assets.GetBuffIcon(aSession.adventure.name).bitmapData, '50px'));
                    $("#aAdventureName").html(loca.GetText("ADN", aSession.adventure.name));
                    $("#aAdventureAmount").html(buffAmount);
                    $("#aAdventureRepeats").html(aSession.adventure.repeatCount);
                    $("#aAdventureFile").html("Saved Locally!!");
                    $("#aAdventureToggle").prop("disabled", buffAmount === 0);
                    $('#aAdventureTotalGenerals').text(aSession.adventure.getGenerals().length);
                    $('#aAdventureTotalEnemies').text(aSession.adventure.getEnemies().all);
                    aUI.modals.adventure.AM_UpdateInfo();
                    aUI.modals.adventure.AM_UpdateSteps();
                } catch (e) { }
            },
            AM_UpdateInfo: function () {
                try {
                    $('#aAdventureRemainingEnemies').text(aSession.adventure.getEnemies().remaining);
                    $('#aAdventureLostUnitsDiv').empty();
                    var totalLost = 0;
                    $.each(aSession.adventure.getLostUnits().army, function (uName, lost) {
                        totalLost += lost;
                        $('#aAdventureLostUnitsDiv').append(aUtils.create.Row([
                            [1, "&#10551;"],
                            [6, getImage(assets.GetMilitaryIcon(uName).bitmapData, "22px") + " {0}:".format(loca.GetText('RES', uName))],
                            [5, lost]
                        ]));
                    });
                    $('#aAdventureTotalLost').text(totalLost);
                    $('#aAdventureLostUnitsDiv .row').css({ "background": "inherit" });
                } catch (e) { debug(e) }
            },
            AM_UpdateSteps: function () {
                try {
                    if (!aSession.isOn.Adventure)
                        $("#aAdventureToggle").data("cmd", "start").text("Start");

                    $('#aAdventureStepsDiv').empty()
                        .append(aUtils.create.Row([[6, "Adventure Steps"], [6, "Details"]], "text-center", true))
                        .append(
                            aSession.adventure.steps.map(function (step, index) {
                                var selected = '';
                                if (index === aSession.adventure.index)
                                    selected = aSession.isOn.Adventure ? 'background: #FF7700;' : 'background: #377fa8;';
                                var text = step.name.replace(/([A-Z])/g, ' $1').trim();
                                var details = step.data || "";
                                if (details.indexOf("BuffAd") > -1) {
                                    details = getImage(assets.GetBuffIcon(details).bitmapData, '22px', '22px') + loca.GetText("RES", details);
                                }

                                return aUtils.create.Row([
                                    [6, text],
                                    [6, details, details.indexOf('\\') > -1 ? "text-muted" : ""]
                                ], "text-center small").attr('style', 'cursor:pointer;{0}'.format(selected)).attr('data-step', index).click(aUI.modals.adventure.AM_SelectedStep)
                            })
                        )

                } catch (e) { }
            },
            AM_SelectedStep: function (e) {
                try {
                    e = $(e.target).hasClass('row') ? e.target : $(e.target).parent('.row');
                    var data = $(e).data('step');
                    aUI.modals.adventure.AM_UpdateSteps();

                    if ($(e).hasClass('stepSelected')) {
                        $("#aAdventureToggle").data("cmd", aSession.isOn.Adventure ? 'stop' : 'start').text(aSession.isOn.Adventure ? 'Stop' : 'Start');
                    } else {
                        $('#aAdventureStepsDiv').find("[data-step='{0}']".format(data)).addClass('stepSelected').css('background', 'brown');
                        $("#aAdventureToggle").data("cmd", aSession.isOn.Adventure ? "continuefrom" : 'startfrom')
                            .text("{0} from this step".format(aSession.isOn.Adventure ? 'Continue' : 'Start'))
                    }
                } catch (e) { }
            }
        },
        SelectExplorersForQuests: function (sub) {
            if (!game.gi.isOnHomzone()) return aUI.Alert(getText("not_home"), 'ERROR');
            var save = function () {
                $.each(Object.keys(aSettings.defaults.Quests.Config.Explorers[sub]), function (i, t) {
                    aSettings.defaults.Quests.Config.Explorers[sub][t] = [];
                });
                aWindow.withsBody('.container-fluid').find('input[type=checkbox]').each(function (i, item) {
                    var id = $(item).attr('id').split('_');
                    if (id[0] === sub) {
                        if ($(item).is(':checked'))
                            aSettings.defaults.Quests.Config.Explorers[sub][id[1]].push(parseInt(id[2]));
                    }
                });
                aSettings.save();
                aWindow.shide();
            }
            var tableData = function () {
                var table = [];
                const types = Object.keys(aSettings.defaults.Quests.Config.Explorers[sub]);
                table.push(createTableRow([[12 - types.length, 'Explorers']].concat(types.map(function (r) {
                    var text = loca.GetText('TOT', 'Find{0}{1}'.format(sub, r))
                    return [1, aUtils.format.Capitalize(text.split('(')[1].replace(')', '')), 'small']
                })), true));
                var expls = [];
                game.getSpecialists().sort(specNameSorter).forEach(function (spec) {
                    try {
                        if (!spec || spec.GetBaseType() !== 1 || expls.indexOf(spec.GetType()) !== -1) return;
                        var text = $('<span>').append([
                            $(getImageTag(spec.getIconID(), '26px', '26px')),
                            loca.GetText("SPE", spec.GetSpecialistDescription().getName_string())
                        ]);
                        table.push(createTableRow([[12 - types.length, text]].concat(types.map(function (r) { return [1, createSwitch("{0}_{1}_{2}".format(sub, r, spec.GetType()))] }))));
                        expls.push(spec.GetType());
                    } catch (e) { debug(e); }
                });
                return table;
            }
            aWindow.settings(save, '');
            aWindow.sTitle().html("{0} {1}".format(
                getImage(assets.GetBuffIcon("QuestStart_SharpClaw").bitmapData),
                'Quest: Explorers Task Managment')
            );
            aWindow.sDialog().css("height", "80%").addClass("modal-lg");
            aWindow.sData().append(
                $('<label>').text('Please Choose which Explorers should be used for {0} Search'.format(sub === 'AdventureZone' ? 'Adventure' : sub)),
                aUtils.create.container().append(tableData())
            );
            $.each(aSettings.defaults.Quests.Config.Explorers[sub], function (key, types) {
                $.each(types, function (i, type) {
                    var id = "#{0}_{1}_{2}".format(sub, key, type);
                    $(id).prop("checked", true);
                });
            });
            aWindow.sshow();
        },
        GeoDepositSettings: function () {
            try {
                if (!game.gi.isOnHomzone()) { return showGameAlert(getText('not_home')); }
                const depoTypes = ["Stone", "BronzeOre", "Marble", "IronOre", "Coal", "GoldOre", "Granite", "TitaniumOre", "Salpeter"];
                var saveTemp = function () {
                    //options [findDepo, buildMine, upgradeMine, MineLevel, buffMine]
                    depoTypes.forEach(function (type) { aSettings.defaults.Deposits.data[type].geos = []; });
                    $('.depoOption').each(function () {
                        var op = $(this).attr("id").split("_");
                        if ($(this).is(":disabled")) return;
                        if (op[0] === "depo") {
                            var val = isNaN(parseInt($(this).val())) ? $(this).val() : parseInt($(this).val());
                            aSettings.defaults.Deposits.data[op[1]].options[op[2]] = $(this).attr("type") === "checkbox" ? $(this).is(":checked") : val;
                        } else if (op[0] === "geo") {
                            if ($(this).is(":checked"))
                                aSettings.defaults.Deposits.data[op[1]].geos.push(parseInt(op[2]));
                        }
                    });
                    aSettings.save();
                    aWindow.shide();
                }
                aWindow.settings(saveTemp);

                var createCheck = function (id) {
                    return $('<input>', { 'type': 'checkbox', 'class': 'depoOption', 'id': id, 'style': 'display: block;margin: 4px auto;' });
                }
                var createInput = function (id) {
                    var type = id.split('_')[1];
                    var max = aSettings.defaults.Deposits.data[type].max;
                    return $('<input>', { 'type': 'text', 'placeholder': max, 'value': max, 'class': 'depoOption noOfDepos form-control', 'id': id, 'style': 'display: block;margin: 4px auto;' });
                }
                var createLvlSelect = function (id) {
                    var select = aUtils.create.Select(id).addClass("depoOption");
                    for (var i = 0; i < 8; i++) {
                        select.append($('<option>', { value: i }).text(i));
                    }
                    return select;
                }
                var createBuffSelect = function (id, type) {
                    var name = ["Stone:", "Marble", 'Granite'].indexOf(type) !== -1 ? type + "Mason" : type.replace("Ore", "Mine");
                    var select = aUtils.create.Select(id).addClass("depoOption")
                        .append(aBuffs.getBuffsForBuilding(name.replace('Stone', ''), true, true));
                    return select.html(select.find('option').sort(function (a, b) {
                        return $(a).text() < $(b).text() ? -1 : 1;
                    }));
                }
                var safeGetImageTag = function (name, w, h) {
                    try {
                        return getImageTag(name, w, h);
                    } catch (e) {
                        return $('<span>', {
                            'style': 'display: inline-block; width: ' + w + '; height: ' + h + '; background-color: #ccc;',
                            'title': 'Image not available: ' + name
                        }).prop('outerHTML');
                    }
                }
                var table = [];
                table.push(createTableRow([[3, 'Settings']].concat(depoTypes.map(function (r) { return [1, safeGetImageTag(r, '23px', '23px')] })), true));
                table.push(createTableRow([[3, "Find Deposit:"]].concat(depoTypes.map(function (r) { return [1, createCheck("depo_{0}_0".format(r))] }))));
                table.push(createTableRow([[3, "Build Mine:"]].concat(depoTypes.map(function (r) { return [1, createCheck("depo_{0}_1".format(r))] }))));
                table.push(createTableRow([[3, "Upgrade Mine:"]].concat(depoTypes.map(function (r) { return [1, createCheck("depo_{0}_2".format(r))] }))));
                table.push(createTableRow([[3, "Mine Level:"]].concat(depoTypes.map(function (r) { return [1, createLvlSelect("depo_{0}_3".format(r))] }))));
                table.push(createTableRow([[3, "Buff Mine/Mason:"]].concat(depoTypes.map(function (r) { return [1, createCheck("depo_{0}_4".format(r))] }))));
                table.push(createTableRow([[3, "Buff Type:"]].concat(depoTypes.map(function (r) { return [1, createBuffSelect("depo_{0}_5".format(r), r)] }))));
                table.push(createTableRow([[3, "No. of Deposits: " + aUtils.create.newImg()]].concat(depoTypes.map(function (r) { return [1, createInput("depo_{0}_6".format(r))] }))));
                table.push($('<br>'));
                table.push(createTableRow([
                    [9, 'Which geologists search for the deposit?'],
                    [2, $('<a>', { href: '#', text: 'Recommendation', 'id': 'aDeposits_Recommend' })],
                    [1, $('<a>', { href: '#', text: 'Reset', 'id': 'aDeposits_Reset' })]
                ], true));
                var geos = [];
                game.getSpecialists().sort(specNameSorter).forEach(function (geo) {
                    try {
                        if (!geo || geo.GetBaseType() !== 2 || geos.indexOf(geo.GetType()) !== -1) return;
                        var text = $('<span>').attr({ 'title': "Testing tooltip" }).append([
                            $(getImageTag(geo.getIconID(), '26px', '26px')),
                            loca.GetText("SPE", geo.GetSpecialistDescription().getName_string())
                        ]);
                        table.push(createTableRow([[3, text]].concat(depoTypes.map(function (r) { return [1, createCheck("geo_{0}_{1}".format(r, geo.GetType())), 'text-center'] }))));
                        geos.push(geo.GetType());
                    } catch (e) { }
                });
                aWindow.sDialog().css("height", "80%").addClass("modal-lg");
                aWindow.sTitle().html("{0} {1}".format(
                    utils.getImageTag('icon_geologist.png', '45px'),
                    "Advanced Deposits Options")
                );
                aWindow.sData().append(aUtils.create.container().append(table));
                aWindow.sData().find(".tblHeader img").css({ "display": "block", "margin": "0 auto" });
                aWindow.sData().find('a').tooltip();
                aWindow.withsBody('#aDeposits_Recommend').click(function () {
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
                    $.each(data, function (key, value) {
                        value.forEach(function (v) {
                            aWindow.sData().find("#geo_{0}_{1}".format(key, v)).prop("checked", true);
                        });
                    });
                });
                aWindow.withsBody('#aDeposits_Reset').click(function () {
                    $('.depoOption').each(function () {
                        var op = $(this).attr("id").split("_");
                        if (op[0] === "geo") {
                            $(this).prop("checked", false);
                        }
                    });
                });
                aWindow.withsBody('.noOfDepos').on('input', function () {
                    $(this).val($(this).val().replace(/[^0-9.]/g, ''));
                    var max = aSettings.defaults.Deposits.data[$(this).attr('id').split('_')[1]].max;
                    if (parseInt($(this).val()) > max)
                        $(this).val(max);
                });
                // Load Saved Settings
                Object.keys(aSettings.defaults.Deposits.data).forEach(function (deposit) {
                    $.each(aSettings.defaults.Deposits.data[deposit].options, function (i, v) {
                        var id = "#depo_{0}_{1}".format(deposit, i);
                        if (typeof v === "boolean")
                            $(id).prop("checked", v);
                        else if (typeof v === "number" || typeof v === "string")
                            $(id).val(v);
                        else if (v === null && i < 5)
                            $(id).prop('disabled', true);

                    });
                    $.each(aSettings.defaults.Deposits.data[deposit].geos, function (i, v) {
                        var id = "#geo_{0}_{1}".format(deposit, v);
                        $(id).prop("checked", true);
                    });
                });
                aWindow.sshow();
            } catch (e) { debug(e) }
        },
        buildingSettings: function (buildingName) {
            try {
                if (!game.gi.isOnHomzone())
                    return aUI.Alert(getText('not_home'), 'ERROR');
                aWindow.buildingName = buildingName;
                const sObj = aSettings.defaults.Buildings.TProduction[buildingName];
                var save = function () {
                    if (sObj.hasOwnProperty('item'))
                        aSettings.defaults.Buildings.TProduction[buildingName].item = aWindow.withsBody('#producableItems').val();
                    if (sObj.hasOwnProperty('amount'))
                        aSettings.defaults.Buildings.TProduction[buildingName].amount = parseInt(aWindow.withsBody('#amount').val());
                    if (sObj.hasOwnProperty('stack'))
                        aSettings.defaults.Buildings.TProduction[buildingName].stack = parseInt(aWindow.withsBody('#stack').val());
                    if (sObj.hasOwnProperty('buff'))
                        aSettings.defaults.Buildings.TProduction[buildingName].buff = aWindow.withsBody('#buff').val();
                    aSettings.save();
                    aWindow.shide();

                };
                var settings = function () {
                    var html = [];
                    $.each(aSettings.defaults.Buildings.TProduction[buildingName], function (k) {
                        var table = null;
                        if (k === 'item') {
                            table = createTableRow([
                                [3, 'Item: '],
                                [1, $('<span>', { 'id': 'itemImg' })],
                                [8, aUtils.create.Select('producableItems').append(aBuildings.getProducableItems(buildingName))]
                            ]);
                        } else if (k === 'buff') {
                            table = createTableRow([
                                [3, 'Buff: '],
                                [1, $('<span>', { 'id': 'buffImg' })],
                                [8, aUtils.create.Select('buff').append(aBuffs.getBuffsForBuilding(buildingName, false, true))]
                            ]);
                        } else if (k === 'amount') {
                            table = createTableRow([
                                [4, 'Amount: '],
                                [8, $('<input>', { 'id': 'amount', 'class': 'form-control' })]
                            ]);
                        } else if (k === 'stack') {
                            var options = [];
                            for (var i = 25; i >= 1; i--) {
                                options.push($('<option>', { 'value': i }).text(i));
                            }
                            table = createTableRow([
                                [4, 'Items per stack: '],
                                [8, aUtils.create.Select('stack').append(options)]
                            ]);
                        }
                        html.push(table);
                    });
                    return html;
                }
                aWindow.settings(save);
                aWindow.sDialog().css("height", "70%");
                aWindow.sTitle().html("{0} {1} ({2})".format(
                    getImage(assets.GetBuildingIcon(buildingName).bitmapData),
                    loca.GetText('BUI', buildingName),
                    game.zone.mStreetDataMap.getBuildingsByName_vector(buildingName).length
                ));
                aWindow.sData().append(
                    aUtils.create.container().append([
                        $('<label>').html('Notes:-'),
                        $('<br>'),
                        $('<label>').html('&#10551; If anything is "None" that means it is disabled!!'),
                        $('<label>').html('&#10551; Buff is applied when the building is in production!'),
                        $('<label>').html('&#10551; Building level doesn\'t matter ;) (you can create anything @@)'),
                        createTableRow([[9, 'Building Settings'], [3, '&nbsp;']], true)
                    ].concat(settings()).concat([
                        $('<br>'),
                        $('<br>'),
                        aUtils.create.Row([
                            [4, ""],
                            [8, $('<span>', { 'id': 'itemCosts' })]
                        ], 'remTable')
                    ]))
                );
                aWindow.withsBody('#producableItems').change(function () {
                    aWindow.withsBody('#itemImg').html(getImage(assets.GetResourceIcon($(this).val()).bitmapData, '26px'));
                    if (!$(this).val())
                        return aWindow.withsBody(".remTable").hide();
                    aWindow.withsBody(".remTable").show();
                    aWindow.withsBody("#itemCosts").empty();
                    var costs = [];
                    if (aWindow.buildingName === 'Bookbinder') {
                        costs = aBuildings.production.getBook($(this).val()).costs;
                    } else {
                        var buffDef = aBuffs.getDefinition($(this).val());
                        if (buffDef) {
                            costs = buffDef.GetCosts_vector();
                        }
                    };
                    costs.forEach(function (cost) {
                        aWindow.withsBody("#itemCosts").append(
                            getImage(assets.GetResourceIcon(cost.name_string).bitmapData, "23px") + cost.amount
                        )
                    });
                }).val(sObj.item).change();
                aWindow.withsBody('#buff').change(function () {
                    aWindow.withsBody('#buffImg').html(getImage(assets.GetResourceIcon($(this).val()).bitmapData, '26px'));
                }).val(sObj.buff).change();
                aWindow.withsBody('#stack').val(sObj.stack).change();
                aWindow.withsBody('#amount').on('input', function () {
                    $(this).val($(this).val().replace(/[^0-9.]/g, ''));
                    if ($(this).val() > LIMITS.TRADE_MAX_INPUT) $(this).val(LIMITS.TRADE_MAX_INPUT);
                }).val(sObj.amount).change();

                aWindow.withsBody(".remTable").css({ "background": "inherit", "margin-top": "5px" });
                aWindow.sshow();
            } catch (e) { debug(e) }
        },
        Lootables: function () {
            try {
                if (!game.gi.isOnHomzone())
                    return aUI.Alert(getText('not_home'), 'ERROR');
                var save = function () {
                    try {
                        aSettings.defaults.Lootables.boxTypes = [];
                        aBuffs.lootables().forEach(function (x) {
                            if (aWindow.withsBody("#aLootable_sw_" + x).prop("checked"))
                                aSettings.defaults.Lootables.boxTypes.push(x);
                        });
                        aSettings.save(true);
                        aWindow.shide();
                    } catch (e) { }
                }
                var tableData = function () {
                    try {
                        return aBuffs.lootables().sort(function (a, b) {
                            a = aUtils.game.getText(a);
                            b = aUtils.game.getText(b);
                            return a.localeCompare(b);
                        }).map(function (x) {
                            var isSelected = (aSettings.defaults.Lootables.boxTypes.indexOf(x) >= 0);
                            return createTableRow(
                                [
                                    [1, createSwitch("aLootable_sw_" + x, isSelected)],
                                    [8, getImage(assets.GetBuffIcon(x).bitmapData, "23px") + " " + aUtils.game.getText(x)],
                                    [3, "{0}".format(aUtils.format.num(aBuffs.getBuffAmount(x)))]
                                ], false);
                        });

                    } catch (e) { }
                }
                aWindow.settings(save);
                aWindow.sDialog().css("height", "80%");
                aWindow.sTitle().html("{0} {1}".format(
                    getImage(assets.GetBuffIcon('Loottable_MysteryBoxBlackKnights').bitmapData),
                    "Manage Star Mystery Boxes")
                );
                aWindow.sData().append(
                    aUtils.create.container().append([
                        createTableRow([
                            [1, 'Open'],
                            [8, 'Box Type'],
                            [3, 'Amount']
                        ], true),
                    ].concat(tableData()))
                );
                aWindow.sshow();
            } catch (er) { }
        },
        TransferToStore: function () {
            try {
                if (!game.gi.isOnHomzone())
                    return aUI.Alert(getText('not_home'), 'ERROR');
                var save = function () {
                    try {
                        aSettings.defaults.TransferToStore.boxTypes = [];
                        aResources.getResourcesInfo(true).forEach(function (x) {
                            if (aWindow.withsBody("#aTransferToStore_sw_" + x).prop("checked"))
                                aSettings.defaults.TransferToStore.boxTypes.push(x);
                        });
                        aSettings.save(true);
                        aWindow.shide();
                    } catch (e) { }
                }
                aWindow.settings(save);
                aWindow.sDialog().css("height", "80%");
                aWindow.sTitle().html("{0} {1}".format(
                    utils.getImageTag('icon_dice.png', '45px'),
                    "Star to Store")
                );
                aWindow.sData().append(
                    aUtils.create.container().append([
                        createTableRow([
                            [1, 'Transfer'],
                            [5, 'Type'],
                            [6, 'Amount in Star']
                        ], true),
                    ].concat(aResources.getResourcesInfo(true, true)))
                );
                aWindow.sshow();
            } catch (e) { debug(e) }
        },
        Excelsior: function () {
            try {
                var updateCollectionInfo = function (def) {
                    var part = game.gi.mContentGeneratorManager.GetPartWithName(def.getPartName());
                    $('#aExcelisorCollectionAmount').empty().append([
                        getImage(assets.GetResourceIcon(def.getPartName()).bitmapData, '23px'),
                        " ",
                        loca.GetText('RES', def.getPartName()),
                        ": ",
                        part ? part.GetAmount() : 0
                    ]);
                    var completions = Math.floor(part.GetAmount() / def.getPartAmount());
                    $('#aExcelisorCollectionCompletions').text(completions);
                    if (!aSession.excelsior.interval)
                        $('#aExcelisorCompleteCollection').prop('disabled', completions < 1);
                }
                if (!game.gi.isOnHomzone())
                    return aUI.Alert('You must be on your home island to use this feature!', 'ERROR');
                aWindow = new Modal("aExcelisorModal", getImage(assets.GetBuildingIcon("AirshipExcelsior").bitmapData) + " The Excelsior");
                aWindow.size = '';
                aWindow.create();
                aWindow.Body().empty().append(
                    aUtils.create.container().attr('id', 'aExcelisorContainer')
                        .append([
                            $('<center>').append([
                                $('<span>').html('{0} Crystals: '.format(getImage(assets.GetResourceIcon("Crystal").bitmapData, "23px"))),
                                $('<span>', { 'id': 'aExcelsiorCrystals' }).html(game.getResources().GetResourceAmount('Crystal')),
                            ]),
                            $('<br>'),
                            createTableRow([
                                [11, 'Main'],
                                [1, '']
                            ], true),
                            createTableRow([
                                [2, "Category: "],
                                [5, aUtils.create.Select('aExcelisorCategory').append(aBuildings.excelsior.categories(1))]
                            ]),
                            createTableRow([
                                [2, "Collection: "],
                                [5, aUtils.create.Select('aExcelisorCollection')],
                            ]),
                            createTableRow([
                                [2, 'Reward Pool: '],
                                [10, aUtils.create.Span('aExcelisorCollectionRewardPool')]
                            ]),
                            createTableRow([
                                [2, 'Roll Count: '],
                                [5, $('<input>', { 'id': 'aExcelisorRollCount', 'class': 'form-control', 'type': 'text', 'value': '1' })],
                                [2, aUtils.create.Button('aExcelisorRoll', 'Roll')]
                            ]),
                            $('<br>'),
                            $('<center>').append([
                                aUtils.create.Span('aExcelisorCollectionAmount'),
                            ]),
                            $('<br>'),
                            createTableRow([
                                [11, 'Collection'],
                                [1, '']
                            ], true),
                            createTableRow([
                                [2, 'Reward Pool: '],
                                [10, aUtils.create.Span('aExcelisorCollectionRewards')]
                            ]),
                            createTableRow([
                                [5, 'Avaliable Collection Completions: '],
                                [2, aUtils.create.Span('aExcelisorCollectionCompletions')],
                                [2, aUtils.create.Button('aExcelisorCompleteCollection', aSession.excelsior.interval ? 'Stop' : 'Complete')]
                            ])
                        ])
                );
                aWindow.withBody('#aExcelisorCategory').val(aSession.excelsior.sCategory);
                aWindow.withBody('#aExcelisorCategory').change(function () {
                    aSession.excelsior.sCategory = parseInt($(this).val());
                    $('#aExcelisorCollection').empty().append(aBuildings.excelsior.collections(aSession.excelsior.sCategory, 1)).change();
                }).change();
                aWindow.withBody('#aExcelisorCollection').val(aSession.excelsior.sCollection);
                aWindow.withBody('#aExcelisorCollection').change(function () {
                    aSession.excelsior.sCollection = parseInt($(this).val());
                    var def = aBuildings.excelsior.definitions()[aSession.excelsior.sCategory].getCollections()[aSession.excelsior.sCollection];
                    updateCollectionInfo(def);
                    var rewards = [];
                    $.each(def.getContent().mItemContents_vector, function (r, reward) {
                        if (rewards.length) rewards.push(' ');
                        if (reward.GetType() === 1 || reward.GetType() === 10)
                            rewards.push(getImage(assets.GetResourceIcon(reward.GetName_string()).bitmapData, "23px"))
                        if (reward.GetType() === 0)
                            rewards.push(getImage(assets.GetBuffIcon(reward.GetName_string()).bitmapData, "23px"));
                        rewards.push(' ');
                        rewards.push(reward.GetCount() ? reward.GetCount() : 1);
                    });
                    $('#aExcelisorCollectionRewardPool').empty().append(rewards);
                    rewards = [];
                    $.each(def.getRewards().mItemContents_vector, function (r, reward) {
                        if (rewards.length) rewards.push(' ');
                        rewards.push(getImage(assets.GetBuffIcon(reward.GetName_string()).bitmapData, "23px"));
                        rewards.push(' ');
                        rewards.push(reward.GetCount() ? reward.GetCount() : 1);
                    });
                    $('#aExcelisorCollectionRewards').empty().append(rewards);

                }).change();
                aWindow.withBody('#aExcelisorRollCount').on('input', function () {
                    $(this).val($(this).val().replace(/[^0-9]/g, ''));
                    var value = parseInt($(this).val());
                    $('#aExcelisorRoll').prop('disabled', isNaN(value) || !value || value > game.getResources().GetResourceAmount('Crystal'));
                });
                aWindow.withBody('#aExcelisorRoll').click(function () {
                    $('#aExcelisorContainer :input').prop('disabled', true);
                    var cat = aBuildings.excelsior.definitions()[aSession.excelsior.sCategory];
                    var colID = cat.getCollections()[aSession.excelsior.sCollection].getId();
                    var count = parseInt($('#aExcelisorRollCount').val());
                    game.gi.mContentGeneratorManager.RollCollection(cat.getId(), colID, count, false);
                    setTimeout(function () {
                        $('#aExcelisorContainer :input').prop('disabled', false);
                        $('#aExcelsiorCrystals').html(game.getResources().GetResourceAmount('Crystal'));
                        $('#aExcelisorCollection').change();
                        $('#aExcelisorRollCount').val('1');
                        globalFlash.gui.mContentGeneratorPanel.Show()
                        globalFlash.gui.mContentGeneratorPanel.Hide();
                    }, TIMEOUTS.EXCELSIOR_TIMEOUT);
                });
                aWindow.withBody('#aExcelisorCompleteCollection').click(function () {
                    if ($(this).text() === 'Stop') {
                        $(this).text('Complete');
                        clearInterval(aSession.excelsior.interval);
                        $('#aExcelisorContainer :input').prop('disabled', false);
                    } else {
                        $(this).text('Stop')
                        $('#aExcelisorContainer :input:not(#aExcelisorCompleteCollection)').prop('disabled', true);
                        aSession.excelsior.interval = setInterval(function () {
                            if (!game.gi.isOnHomzone()) return;
                            globalFlash.gui.mContentGeneratorPanel.Show()
                            globalFlash.gui.mContentGeneratorPanel.Hide();
                            var cat = aBuildings.excelsior.definitions()[aSession.excelsior.sCategory];
                            var def = cat.getCollections()[aSession.excelsior.sCollection];
                            var part = game.gi.mContentGeneratorManager.GetPartWithName(def.getPartName());
                            if (!part || part.GetAmount() < def.getPartAmount()) {
                                $('#aExcelisorCompleteCollection').trigger('click');
                                return clearInterval(aSession.excelsior.interval);
                            }
                            updateCollectionInfo(def);
                            game.gi.mContentGeneratorManager.CompleteCollection(cat.getId(), def.getId());
                        }, TIMEOUTS.EXCELSIOR_INTERVAL);
                    }
                });
                if (aSession.excelsior.interval)
                    $('#aExcelisorContainer :input:not(#aExcelisorCompleteCollection)').prop('disabled', true);
                aWindow.show();
            } catch (e) { debug(e) }
        },
        ExplorersSettings: function () {
            var save = function () {
                var result = {};
                aWindow.sData().find("div[class*='specdef_']").each(function (i, item) {
                    var type = $(item).attr('class').split(' ').pop();
                    var value = $(item).children('select').val();
                    if (value !== 0 && value !== mainSettings.explDefTask) {
                        result[type.split("_").pop()] = value;
                    }
                });
                mainSettings.explDefTaskByType = result;
                settings.settings["global"] = {};
                settings.store(mainSettings);
                aWindow.shide();
            }
            aWindow.settings(save, '');
            aWindow.sTitle().html("{0} {1}".format(
                getImageTag('icon_explorer.png'),
                "Explorers Default Task")
            );
            aWindow.sDialog().css("height", "80%");
            specType = 1;
            var html = '<div class="container-fluid" style="user-select: all;">';
            html += utils.createTableRow([
                [10, getText('expldeftask_desc')],
                [2, $('<a>', { href: '#', text: getText('btn_reset'), 'class': 'settingsreset' })]
            ], true);
            html += utils.createTableRow([[6, loca.GetText("LAB", "Name")], [6, loca.GetText("LAB", "AvatarCurrentSelection")]], true);
            $.each(specGetTypesForType(), function (type, name) {
                html += utils.createTableRow([
                    [6, getImageTag("icon_" + armySPECIALIST_TYPE.toString(type).toLowerCase() + ".png", '8%') + loca.GetText("SPE", name)],
                    [6, createExplorerDropdown(0, 0, 0, true), 'specdef_' + type]
                ]);
            });
            aWindow.sData().html(html + '<div>');
            aWindow.sData().find('select').each(function (i, item) {
                $(item).find('option:first').text("{0} -> {1}".format(loca.GetText("ACL", "BuffAdventuresGeneral"), loca.GetText("LAB", "ToggleOptionsPanel")));
            });
            // Unbind existing click handlers to prevent event stacking
            aWindow.sData().find('.settingsreset').off('click');
            aWindow.sData().find('.settingsreset').click(function () {
                aWindow.sData().find('select').val(0);
            });
            $.each(mainSettings.geoDefTaskByType, function (type, value) { aWindow.sData().find('.specdef_' + type).children('select').val(value); });
            $.each(mainSettings.explDefTaskByType, function (type, value) { aWindow.sData().find('.specdef_' + type).children('select').val(value); });
            aWindow.sFooter().find('.pull-left').removeClass('pull-left');
            aWindow.sFooter().prepend([
                $('<button>').attr({ "class": "btn btn-primary pull-left specSettingsSaveTemplate" }).text(getText('save_template')),
                $('<button>').attr({ "class": "btn btn-primary pull-left specSettingsLoadTemplate" }).text(getText('load_template')).click(function () { specSettingsTemplates.load(); })
            ]);
            // Unbind existing click handlers to prevent event stacking
            aWindow.sFooter().find('.specSettingsSaveTemplate').off('click');
            aWindow.sFooter().find('.specSettingsSaveTemplate').click(function () {
                var dataToSave = { type: 'specsettings', data: {} };
                aWindow.sData().find('select').map(function () {
                    var id = $(this).closest('div').attr('class').split(' ').pop().split("_").pop();
                    dataToSave['data'][id] = $(this).val();
                });
                specSettingsTemplates.save(dataToSave);
            });
            aWindow.sshow();
        },
        trade: {
            withFriends: function () {
                try {
                    if (!game.gi.isOnHomzone())
                        return aUI.Alert(getText('not_home'), 'ERROR');

                    var loadTransactions = function () {
                        aWindow.withBody('#aTradeTransactions').empty();
                        $.each(aSettings.defaults.Trade.Trades, function (i, val) {
                            aWindow.withBody('#aTradeTransactions').append(
                                createTableRow([
                                    [2, val.FriendName],
                                    [3, getImage(assets.GetResourceIcon(val.SendResource).bitmapData, "23px") + " " + loca.GetText("RES", val.SendResource)],
                                    [1, aUtils.format.num(val.SendAmount)],
                                    [3, getImage(assets.GetResourceIcon(val.ReceiveResource).bitmapData, "23px") + " " + loca.GetText("RES", val.ReceiveResource)],
                                    [1, aUtils.format.num(val.ReceiveAmount)],
                                    [1, $('<label>').css('color', val.ISDT ? '#99ff99' : 'red').text(val.ISDT ? "Yes" : "No")],
                                    [1, $('<button>', { 'type': 'button', 'class': 'close aTradeDelItem', 'value': i }).html($('<span>').html('&times;'))]
                                ], false)
                            );
                        });
                        aWindow.withBody('#aTradeTransactions').find('.row').css('cursor', 'pointer');
                    }
                    aWindow = new Modal('aTradeModal', utils.getImageTag('IconMailTypeTrade', '45px') + ' Trades');
                    aWindow.create();
                    var _friends = globalFlash.gui.mFriendsList.GetFilteredFriends("", true);
                    _friends.sort(function (a, b) {
                        return a.username.toLowerCase().localeCompare(b.username.toLowerCase());
                    });

                    var select_friend = function (firends) {
                        var select_friend = $('<select>', { id: 'aTradeFriendSelect' });
                        select_friend.append($('<option>', { value: "0" }).text("---"));
                        firends.forEach(function (item) {
                            if (item !== null)
                                select_friend.append($('<option>', { value: item.id }).text(item.username));
                        });
                        return select_friend;
                    };

                    var select_resourcesSend = $('<select>', { id: 'aTradeSendSelect' });
                    select_resourcesSend.append($('<option>', { value: "---" }).text("---")).prop("outerHTML");

                    var select_resourcesRec = $('<select>', { id: 'aTradeReceiveSelect' });
                    select_resourcesRec.append($('<option>', { value: "---" }).text("---")).prop("outerHTML");

                    aResources.getResourcesInfo().forEach(function (item) {
                        select_resourcesSend.append($('<option>', { value: item }).text(loca.GetText("RES", item))).prop("outerHTML");
                        select_resourcesRec.append($('<option>', { value: item }).text(loca.GetText("RES", item))).prop("outerHTML");
                    });
                    aWindow.Body().empty().append(
                        aUtils.create.container().append([
                            createTableRow([
                                [11, 'Trade Options'],
                                [1, ' ']
                            ], true),
                            aUtils.create.Row([
                                [2, 'Friend'],
                                [3, select_friend(_friends)],
                                [2, ''],
                                [2, "Double Trade?"],
                                [3, createSwitch("aTradeDoubleTradeCheck", true)]
                            ], 'remTable'),
                            aUtils.create.Row([
                                [2, 'Send'],
                                [3, select_resourcesSend.prop("outerHTML") + " " + $('<span>', { 'id': 'aTradeSendImg', 'style': 'margin-left:5px;' }).prop("outerHTML")],
                                [2, ''],
                                [2, 'Receive'],
                                [3, select_resourcesRec.prop("outerHTML") + " " + $('<span>', { 'id': 'aTradeReceiveImg', 'style': 'margin-left:5px;' }).prop("outerHTML")],
                            ], 'remTable'),
                            aUtils.create.Row([
                                [2, 'Amount'],
                                [3, $('<input>', { 'id': 'aTradeAmountSendSelect', 'class': 'form-control', 'type': 'number', 'value': '0' })],
                                [2, 'Inventory: ' + '<label id="aTradeSelectedAmount">0</label>'],
                                [2, 'Amount'],
                                [3, $('<input>', { 'id': 'aTradeAmountReceiveSelect', 'class': 'form-control', 'type': 'number', 'value': '0' })],
                            ], 'remTable'),
                            $('<br>'),
                            $('<label>').text('list of saved transactions'),
                            createTableRow([
                                [2, 'Friend'],
                                [3, 'Send'],
                                [1, 'Amount'],
                                [3, 'Receive'],
                                [1, 'Amount'],
                                [2, 'Double Trade?']
                            ], true),
                            $('<div>', { id: 'aTradeTransactions' })
                        ])
                    )

                    aWindow.Footer().prepend([
                        $('<button>').attr({ "id": "aTradeSendItem", "class": "btn btn-primary pull-left" }).text('Send'),
                        $('<button>').attr({ "id": "aTradeAddItem", "class": "btn btn-primary pull-left" }).text('Save Trade'),
                    ]);
                    loadTransactions();

                    aWindow.withBody('#aTradeSendSelect').change(function () {
                        try {
                            aWindow.withBody('#aTradeSendImg').empty().append(getImage(assets.GetResourceIcon($(this).val()).bitmapData, "23px"));
                            var amount = game.zone.GetResources(game.player).GetResourceAmount($(this).val())
                            $('#aTradeSelectedAmount').text(aUtils.format.num(amount));
                        } catch (e) { $('#aTradeSelectedAmount').text('0') }
                    });
                    aWindow.withBody('#aTradeReceiveSelect').change(function () {
                        aWindow.withBody('#aTradeReceiveImg').empty().append(getImage(assets.GetResourceIcon($(this).val()).bitmapData, "23px"));
                    });
                    aWindow.withBody('#aTradeSendItem').click(function () {
                        var trade = {
                            'SendResource': $('#aTradeSendSelect option:selected').val(),
                            'SendAmount': parseInt($("#aTradeAmountSendSelect").val()),
                            'ReceiveResource': $('#aTradeReceiveSelect option:selected').val(),
                            'ReceiveAmount': parseInt($("#aTradeAmountReceiveSelect").val()),
                            'ISDT': $("#aTradeDoubleTradeCheck").prop("checked"),
                            'FriendID': $('#aTradeFriendSelect option:selected').val(),
                            'FriendName': $('#aTradeFriendSelect option:selected').text()
                        };
                        if (trade.SendResource === "" ||
                            trade.ReceiveResource === "" ||
                            trade.FriendID === "" ||
                            trade.SendAmount < 1 ||
                            trade.ReceiveAmount < 1)
                            return;
                        aTrade.exec(trade);
                    });

                    aWindow.withBody('#aTradeAddItem').click(function () {
                        var trade = {
                            'ID': new Date().getTime(),
                            'SendResource': $('#aTradeSendSelect option:selected').val(),
                            'SendAmount': parseInt($("#aTradeAmountSendSelect").val()),
                            'ReceiveResource': $('#aTradeReceiveSelect option:selected').val(),
                            'ReceiveAmount': parseInt($("#aTradeAmountReceiveSelect").val()),
                            'ISDT': $("#aTradeDoubleTradeCheck").prop("checked"),
                            'FriendID': $('#aTradeFriendSelect option:selected').val(),
                            'FriendName': $('#aTradeFriendSelect option:selected').text()
                        };
                        if (!trade.SendResource ||
                            !trade.ReceiveResource ||
                            !trade.FriendID ||
                            trade.SendAmount < 1 ||
                            trade.ReceiveAmount < 1)
                            return;

                        aSettings.defaults.Trade.Trades.push(trade);
                        aSettings.save();
                        loadTransactions();
                    });

                    aWindow.withBody('.aTradeDelItem').on('click', function () {
                        try {
                            aSettings.defaults.Trade.Trades.splice(parseInt($(this).val()), 1)
                            aSettings.save();
                            loadTransactions();
                        } catch (a) { }
                    })
                    aWindow.withBody('#aTradeAmountSendSelect, #aTradeAmountReceiveSelect').on('input', function () {
                        $(this).val($(this).val().replace(/[^0-9.]/g, '').replace(/^([^.]*\.)|\./g, '$1'));
                    });
                    aWindow.withBody('#aTradeTransactions .row div').on('click', function () {
                        if (!this.nextSibling) return;
                        var trade = aSettings.defaults.Trade.Trades[$(this).parent().find('.close').val()];
                        $('#aTradeFriendSelect').val(trade.FriendID);
                        $('#aTradeSendSelect').val(trade.SendResource).change();
                        $('#aTradeAmountSendSelect').val(trade.SendAmount);
                        $('#aTradeReceiveSelect').val(trade.ReceiveResource).change();
                        $('#aTradeAmountReceiveSelect').val(trade.ReceiveAmount);
                        $('#aTradeDoubleTradeCheck').prop("checked", trade.ISDT);
                    });
                    aWindow.withBody(".remTable").css({ "background": "inherit", "margin-top": "5px" });
                    aWindow.show();
                } catch (e) { debug(e) }
            },
            savedTrades: function () {
                try {
                    const data = aUtils.file.Read(aUtils.file.Path('saved_trades')) || [];
                    if (!data.length)
                        return aUI.Alert('Empty Trade Log', 'ERROR');
                    aWindow = new Modal('aSavedTradesModal', utils.getImageTag('IconMailTypeTrade') + ' Trades Log');
                    aWindow.create();
                    var table = $.map(data, function (trade) {
                        return createTableRow([
                            [2, aUtils.format.Date(trade.Date)],
                            [2, trade.Sender],
                            [2, getImage(assets.GetResourceIcon(trade.Send.Name).bitmapData, "23px") + " " + loca.GetText('RES', trade.Send.Name)],
                            [1, aUtils.format.num(trade.Send.Qty)],
                            [2, getImage(assets.GetResourceIcon(trade.Receive.Name).bitmapData, "23px") + " " + loca.GetText('RES', trade.Receive.Name)],
                            [1, aUtils.format.num(trade.Receive.Qty)],
                            [2, $('<label>').css('color', trade.Status ? '#99ff99' : 'red').text(trade.Status ? "Accepted" : "Decliened")]
                        ], false)
                    });
                    aWindow.Body().empty().append(
                        aUtils.create.container().append([
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
                    aWindow.show()
                } catch (e) { debug(e) }
            },
            filterSettings: function (mode) {
                try {
                    // mode  1 -> friends, else -> resources
                    if (!game.gi.isOnHomzone())
                        return aUI.Alert(getText('not_home'), 'ERROR');

                    var save = function () {
                        try {
                            if (mode === 'Friends') {
                                aSettings.defaults.Mail.AcceptGuildTrades = $('#aMailAcceptGuildTrades').is(':checked');
                            } else if (mode === 'Resources') {
                                aSettings.defaults.Mail.AllowAllResources = $('#aMailAllowAllResources').is(':checked');
                                const max = $('#aMailResourcesMax').val();
                                if (isNaN(max))
                                    return alert('Max Value should be numerical');
                                aSettings.defaults.Mail.AllResourcesMax = parseInt(max);
                            }
                            aSettings.save();
                            aWindow.shide();
                        } catch (e) { }
                    }


                    var friendSelect = function () {
                        var friendSelect = aUtils.create.Select('aMailFriendSelect')
                            .append($('<option>', { value: "0" }).text("---"));
                        aUtils.friends.getFriends().forEach(function (item) {
                            if (item !== null)
                                friendSelect.append($('<option>', { value: item.id }).text(item.username));
                        });
                        return friendSelect;
                    };
                    var ResourceSelect = function () {
                        try {
                            var resourceSelect = aUtils.create.Select('aMailResourceSelect')
                                .append($('<option>', { value: "0" }).text("---"));
                            var resources = aResources.getResourcesInfo();
                            if (resources && Array.isArray(resources)) {
                                resources.forEach(function (item) {
                                    resourceSelect.append($('<option>', { value: item }).text(loca.GetText("RES", item)));
                                });
                            }
                            return resourceSelect.html(resourceSelect);
                        } catch (e) {
                            debug('[ERROR] ResourceSelect failed: ' + e);
                            return $('<select>', { id: 'aMailResourceSelect' }).append($('<option>', { value: "0" }).text("---"));
                        }
                    };
                    const Options = function (mode) {
                        if (mode === 'Friends')
                            return [
                                createTableRow([[10, "Friends"], [2, '']], true),
                                createTableRow([
                                    [10, "Accept All Guild trades (Resources filter is applied)"],
                                    [2, createSwitch("aMailAcceptGuildTrades", aSettings.defaults.Mail.AcceptGuildTrades)],
                                ], 0),
                                createTableRow([
                                    [2, loca.GetText("LAB", "UserName")],
                                    [4, friendSelect()],
                                    [4, '<input type="checkbox" id="aMailFavorite"/> {0}'.format('Accept everything')],
                                    [2, aUtils.create.Button('aMailAcceptFriend', 'Add Friend')]
                                ], false),
                                $('<br>'),
                                createTableRow([
                                    [6, loca.GetText("LAB", "Friends")],
                                    [6, "Accept everything"]
                                ], true),
                                $('<div>', { id: 'aMailAllowedFriends' }).append(friendsData)
                            ]
                        else if (mode === 'Resources')
                            return [
                                createTableRow([[10, "Resources"], [2, '']], true),
                                createTableRow([
                                    [6, "&#10551; Allow all resources with limit"],
                                    [3, $('<input>', { 'value': aSettings.defaults.Mail.AllResourcesMax, 'type': 'number', 'class': 'form-control', 'placeholder': 'Max Limit', 'id': 'aMailResourcesMax' })],
                                    [1, ''],
                                    [2, createSwitch("aMailAllowAllResources", aSettings.defaults.Mail.AllowAllResources)],
                                ], 0),
                                createTableRow([
                                    [12, "&#10551; Customized limit filters are prioritised & always On"],
                                ], 0),
                                createTableRow([
                                    [1, loca.GetText("LAB", "TradeTabItems")],
                                    [4, ResourceSelect()],
                                    [1, ''],
                                    [3, '<input type="number" class="form-control" placeholder="Max Limit" id="aMailResourceMax"/>'],
                                    [3, aUtils.create.Button("aMailAddResource", 'Add Resource')],
                                ], 0),
                                $('<br>'),
                                $('<span>').text('Customize Resources Max Limit'),
                                createTableRow([
                                    [6, loca.GetText("LAB", "TradeTabItems")],
                                    [6, 'Max'],
                                ], true),
                                $('<div>', { id: 'aMailAllowedResources' }).append(resourcesData)
                            ]
                    }
                    var friendsData = function () {
                        var allowed = [];
                        $.each(aSettings.defaults.Mail.EnabledUsers, function (id, friend) {
                            try {
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
                    var resourcesData = function () {
                        var allowed = [];
                        $.each(aSettings.defaults.Mail.EnabledResources, function (name, max) {
                            try {
                                allowed.push(createTableRow([
                                    [6, getImage(assets.GetResourceIcon(name).bitmapData, "23px") + ' ' + loca.GetText('RES', name)],
                                    [5, max],
                                    [1, $('<button>', { 'type': 'button', 'class': 'close aMailRemoveAllowedResource', 'value': name }).html($('<span>').html('&times;'))]
                                ], false));
                            } catch (e) { }
                        })
                        return allowed;
                    }
                    aWindow.settings(save);
                    aWindow.sDialog().css("height", "80%");
                    aWindow.sTitle().html("{0} {1}".format(
                        utils.getImageTag(mode === 1 ? 'IconMailTypeFriend' : 'IconMailTypeTrade'),
                        "Filter Trade Mails")
                    );
                    aWindow.sData().append(
                        aUtils.create.container().append([
                            '&#10551; Accept if friend is in list or guild member (If Option is On)',
                            $('<br>'),
                            "&#10551; Resources filter doesn't work if you allow everything for this friend",
                            $('<br>'),
                        ].concat(Options(mode)))
                    );
                    aWindow.withsBody("#aMailAddResource").click(function () {
                        try {
                            var name = $('#aMailResourceSelect').val();
                            var max = $('#aMailResourceMax').val();
                            if (name === "---" || max === "") return;
                            if (isNaN(max))
                                return alert('Max Value should be numerical');
                            aSettings.defaults.Mail.EnabledResources[name] = parseInt(max);
                            aWindow.withsBody('#aMailAllowedResources').empty().append(resourcesData);
                        } catch (a) { debug(a) }
                    });
                    aWindow.withsBody("#aMailAcceptFriend").click(function () {
                        try {
                            var friendId = $('#aMailFriendSelect').val();
                            if (friendId === "0") return;
                            var friendName = $('#aMailFriendSelect option:selected').text();
                            var favorite = $('#aMailFavorite').is(':checked');
                            aSettings.defaults.Mail.EnabledUsers[friendId] = { name: friendName, favorite: favorite };
                            aWindow.withsBody('#aMailAllowedFriends').empty().append(friendsData);
                        } catch (a) { debug(a) }
                    });
                    aWindow.sData().on('click', '.aMailRemoveAllowedFriend', function () {
                        try {
                            delete aSettings.defaults.Mail.EnabledUsers[$(this).val()];
                            aWindow.withsBody('#aMailAllowedFriends').empty().append(friendsData);
                        } catch (a) { debug(a) }
                    }).on('click', '.aMailRemoveAllowedResource', function () {
                        try {
                            delete aSettings.defaults.Mail.EnabledResources[$(this).val()];
                            aWindow.withsBody('#aMailAllowedResources').empty().append(resourcesData);
                        } catch (a) { debug(a) }
                    });
                    aWindow.sshow();
                } catch (er) { debug(er); }
            }
        }
    },
    Alert: function (message, icon) {
        try {
            icon = icon ? icon : 'TransporterAdmiral';
            if (typeof icon === 'string') {
                const icons = {
                    'ERROR': 'Boss.png',
                    'Q': 'eventmarketbuff2_rabbid.png',
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
                icon = icon.indexOf(".png") !== -1 ? assets.GetBitmap(icon) : assets.GetBuffIcon(icon);
            }

            var t = game.def("GUI.Components.ItemRenderer::AvatarMessageItemRenderer", !0);
            globalFlash.gui.mAvatarMessageList.mClientMessages.addChild(t);
            t.headlineLabel.text = "Auto Copilot";
            t.messageBody.text = message;
            t.image.source = icon;
        } catch (e) { }
    },
    updateStatus: function (status, from) {
        var date = new Date();
        var time = "[{0}:{1}:{2}]".format(date.getHours(), date.getMinutes(), date.getSeconds());
        from = from ? '[{0}]'.format(from) : '';
        menu.nativeMenu.getItemByName("aStatus").label = time + from + ' ' + status;
        $("#aAdventureStatus").text(from + status);
    },
    playSound: function (sound) {
        sound = sound.split("_");
        var SoundManager = game.def("Sound::cSoundManager").getInstance();
        return (sound.length === 1) ? SoundManager.playEffect(sound[0]) : SoundManager.playEffect(sound[0], sound[1]);
    }
}
// ==================== Events ====================
const aEvents = {
    treasureItems: {
        XMAS: [2.2, 4.6, 9.2, 18.4, 27.2],
        Valentine: [1.3, 2.6, 3.9, 6.5, 9.1],
        Easter: [2.6, 3.9, 5.9, 8.8, 11.7],
        Soccer: [1.95, 2.95, 3.95, 5.95, 7.95],
        Anniversary: [1.5, 2.5, 3.5, 5, 6.5],
        HW: [2.6, 3.9, 6.5, 11.8, 15.6],
    },
    getActiveEvent: function (type) {
        const event = game.gi.mEventManager.GetActiveEventNames().filter(function (e) { return e.indexOf(type) !== -1 });
        if (!event.length) return null;
        var active = null;
        $.each(this.treasureItems, function (k) {
            if (event[0].indexOf(k) !== -1)
                active = k;
        });
        return active;
    },
    isEventWithDepos: function () {
        try {
            if (!game.gi.isOnHomzone()) return false;
            var event = aEvents.getActiveEvent('_Shop');
            return ['Valentine', 'HW'].indexOf(event) > -1 ? true : false;
        } catch (e) { return false; }
    },
    calculateDailyItems: function () {
        try {
            var eventName = aEvents.getActiveEvent('_Content');
            if (!eventName) return aUI.Alert('No suitable active events!', 'ERROR');
            var optimized = {}, dayValue = 0;
            var tasks = game.def("global").specialistTaskDefinitions_vector[1].subtasks_vector.filter(function (task) {
                return [4, 5].indexOf(task.subTaskID) === -1;
            });
            aSpecialists.getSpecialists(1).forEach(function (spec) {
                try {
                    var skills = spec.getSkillTree().getItems_vector().concat(spec.skills.getItems_vector());
                    var taskID = 0, taskValue = 0;
                    $.each(tasks, function (i, task) {
                        var duration = task.duration;
                        var itemCount = aEvents.treasureItems[eventName][i];
                        var itemModifier = 1;
                        skills.forEach(function (skill) {
                            var lvl = skill.getLevel() - 1;
                            if (lvl === -1) return;
                            skill.getDefinition().level_vector[lvl].forEach(function (skillDef) {
                                if (skillDef.type_string.length === 0 || skillDef.type_string === 'FindTreasure' + task.taskType_string) {
                                    if (skillDef.modifier_string.toLowerCase() === 'searchtime') {
                                        duration = skillDef.value !== 0 ? skillDef.value : ((duration * skillDef.multiplier) + skillDef.adder);
                                    } else if (skillDef.modifier_string.toLowerCase() === 'changeloottablerolls') {
                                        itemModifier = skillDef.multiplier > itemModifier ? skillDef.multiplier : itemModifier;
                                    }
                                }
                            });
                        });
                        if (game.player.GetPlayerLevel() < 50 && eventName === 'Anniversary')
                            itemCount *= 3;

                        itemCount *= itemModifier;
                        duration = Math.round((duration / spec.GetSpecialistDescription().GetTimeBonus()) / 360) / 100;
                        thisValue = itemCount / duration;
                        if (thisValue > taskValue) {
                            taskValue = thisValue;
                            taskID = task.subTaskID;
                            dayValue += thisValue;
                        }
                    });
                    optimized[spec.GetUniqueID().toKeyString()] = {
                        id: taskID,
                        name: spec.getName(false)
                    };
                } catch (er) { }
            });
            const resources = {
                XMAS: "ChristmasResource",
                Valentine: "ValentinesFlower",
                Easter: "StripedEggs",
                Soccer: "EMEventResource",
                Anniversary: game.gi.mHomePlayer.GetPlayerLevel() > 53 ? "Candles" : "CakeDough",
                HW: "HalloweenResource"
            }
            aUI.Alert('Your Estimated daily "{0}" gain is "{1}"'.format(
                loca.GetText('RES', resources[eventName]),
                Math.round(dayValue * 24)
            ), resources[eventName]);
        } catch (e) { debug(e) }
    },
    calculateDeposits: function () {
        try {
            if (!aEvents.isEventWithDepos())
                return aUI.Alert("Something is wrong, can't find event", 'ERROR');

            const eventName = game.gi.mEventManager.GetActiveEventNames().filter(function (e) {
                return e.indexOf('_Shop') !== -1
            })[0];
            const event = aEvents.getActiveEvent('_Shop');
            var eEndTime = game.gi.mEventManager.GetEventStopDate(eventName);
            eEndTime = eEndTime - (new Date().getTime());
            if (event === 'Valentine') {
                var eWorkTime = game.def("ServerState::gEconomics").GetResourcesCreationDefinitionForBuilding('FlowerFarm').workTime;
                eWorkTime = (eWorkTime + WORK_TIME_OFFSET_SECONDS) * 1000;
                var refills = Math.ceil(eEndTime / eWorkTime);
                aUI.Alert("Each Flower Farm should have {0} deposit".format(refills), 'ValentinesFlower');
            } else if (event === 'HW') {
                var total = 0;
                for (i = 1; i < 4; i++) {
                    const wName = 'pumpkinfield_0' + i;
                    var eWorkTime = game.def("ServerState::gEconomics").GetResourcesCreationDefinitionForBuilding(wName).workTime;
                    eWorkTime = (eWorkTime + WORK_TIME_OFFSET_SECONDS) * 1000;
                    var refills = Math.ceil(eEndTime / eWorkTime);
                    total += (refills * 3);
                    aUI.Alert('Each {0} should have {1} deposits'.format(loca.GetText('BUI', wName), refills), 'HalloweenResource');
                }
                aUI.Alert("Total Pumpkin deposits needed: {0}".format(total), 'HalloweenResource');
            }
        } catch (e) { debug(e) }
    }
}
// ==================== Buffs ====================
const aBuffs = {
    getBuff: function (buff) {
        buff = buff === 'FillDeposit_Fishfood' ? ['FillDeposit', 'Fish'] : buff;
        var type = $.isArray(buff) ? buff[0] : buff;
        var name = $.isArray(buff) ? buff[1] : '';
        var cBuff = null;
        $.each(game.gi.mCurrentPlayer.getAvailableBuffs_vector(), function (i, b) {
            if (cBuff || !b || b.GetType() !== type) return;
            var isResNameNum = isFinite(b.GetResourceName_string()) && b.GetResourceName_string();
            if (b.GetResourceName_string() === name || isResNameNum) {
                cBuff = b;
                name = b.GetResourceName_string();
            }
        });
        if (!cBuff) return null;
        return this.verifyBuff(cBuff.GetUniqueId().toKeyString(), type, name);
    },
    verifyBuff: function (id, type, name) {
        var cBuff2 = game.gi.mCurrentPlayer.getAvailableBuffs_vector().filter(function (b) {
            return b.GetUniqueId().toKeyString() === id;
        })[0];
        if (!cBuff2) return null;
        return cBuff2.GetType() === type && cBuff2.GetResourceName_string() === name ? cBuff2 : null;
    },
    getDefinition: function (name) {
        return game.def('global').map_BuffName_BuffDefinition[name];
    },
    getBuffAmount: function (buff) {
        try { return aBuffs.getBuff(buff).amount; } catch (e) { return 0; }
    },
    getSpeedBuffs: function (toOptions) {
        const buffs = ["Bronze", "Platinum", "Blackened_Titanium", "Obsidian", "Mystical"];
        if (toOptions)
            return buffs.map(function (buff) {
                buff = 'GeneralSpeedBuff_' + buff;
                var amount = aBuffs.getBuffAmount(buff);
                return $('<option>', { value: buff, disabled: amount ? false : true }).text("{0}({1}): {2}".format(loca.GetText('RES', buff), amount, loca.GetText('DES', buff).split("Target")[0]));
            });
        else
            return buffs.map(function (buff) { return 'GeneralSpeedBuff_' + buff; });
    },
    getBuffsForBuilding: function (target, isWorkyard, toOptions) {
        const buffs = game.gi.mCurrentPlayer.getAvailableBuffs_vector().filter(function (buff) {
            if (!buff) return false;
            const def = buff.GetBuffDefinition();
            if (def.GetBuffType() !== 0) return false;
            const targets = def.GetTargetDescription_string().split(',');
            const targetGroup = def.GetTargetGroup_string() || null;
            return targets.indexOf(target) !== -1 || game.def('BuffSystem.cBuffDefinition').targetGroups.groupContains(targetGroup, target) || (isWorkyard && targets.indexOf('Workyard') !== -1);
        });
        if (!toOptions) return buffs;
        var options = [
            $('<option>', { value: '' }).text('None')
        ];
        buffs.forEach(function (buff) {
            try {
                if (!buff || typeof buff.GetType !== 'function') return;
                var des = loca.GetText('DES', buff.GetType()).split('Target')[0];
                var amount = aBuffs.getBuffAmount(buff.GetType());
                options.push($('<option>', { value: buff.GetType() }).text("{0} ({1}): {2}".format(loca.GetText('RES', buff.GetType()), amount, des)));
            } catch (e) {
                debug('[WARN] Failed to process buff: ' + e);
            }
        });
        return options;
    },
    EffectiveFor: function (unit) {
        var result = null;
        $.each(game.def('global').map_BuffName_BuffDefinition, function (name, def) {
            if (result) return;
            def.GetBuffEfficiencies_vector().forEach(function (effect) {
                if (effect.buffName === unit) result = [name, effect.efficiency];
            });
            if (def.HasBattleBuffTarget(unit)) result = [name, 1];
        });
        return result;
    },
    getBuffTargets: function (buff, amount) {
        try {
            var def = aBuffs.getDefinition(buff);
            var targets = def.GetTargetDescription_string();
            targets = targets ? targets.split(',') : [];
            game.getBuildings().forEach(function (building) {
                if (!building || !building.GetArmy() ||
                    !building.GetArmy().GetSquads_vector().length) return;
                $.each(building.GetArmy().GetSquads_vector(), function (i, Squad) {
                    if (aBuffs.checkIfBuffTarget(buff, Squad.GetType())) {
                        if (targets.indexOf(building.GetBuildingName_string()) === -1)
                            targets.push(building.GetBuildingName_string());
                    }
                });
            });
            if (amount === null) { return targets; }
            switch (def.GetTargetType()) {
                case 0:
                    var grids = [];
                    $.each(game.getBuildings(), function (i, building) {
                        if (!building) return;
                        if (game.def('EpicWorkyard.EpicWorkyardsManager').getInstance().getIsEpicSubBuilding(building.GetBuildingName_string())) return;
                        if (aBuffs.AppliedTo(building, buff)) return;
                        if ((targets.indexOf('Workyard') !== -1 &&
                            !building.productionBuff &&
                            building.isWorkyard()) ||
                            targets.indexOf(building.GetBuildingName_string()) !== -1) {
                            grids.push(building.GetGrid());
                        }
                    });
                    return grids;
                case 1:
                    return game.zone.mStreetDataMap.getDeposits_vectorByType(this.getDefinition(buff).GetResourceName_string())[0].GetGrid();
            }
        } catch (e) { return []; }
    },
    checkIfBuffTarget: function (buff, unit) {
        var result = false;
        const def = aBuffs.getDefinition(buff);
        def.GetBuffEfficiencies_vector().forEach(function (effect) {
            if (effect.buffName === unit) result = true;
        });
        return result || def.HasBattleBuffTarget(unit);
    },
    getProduceableBuffs: function (type) {
        return game.def('BuffSystem::cBuff').GetProduceableBuffDefinitions(game.gi).filter(function (buff) {
            if ((type === 6 && buff.GetGroup_string() === '5') ||
                (type === 11 && buff.GetGroup_string() === '11')) {
                return true;
            } else if (type === 1) {
                return ["5", "11"].indexOf(buff.GetGroup_string()) === -1;
            }
            //&& !game.def('BuffSystem.BuffAdventureController').isBuffAdventureBuff(buff.GetName_string());
        }).map(function (buff) { return buff.GetName_string() });
    },
    checkBuffAmount: function (buffName, amount) {
        try { return aBuffs.getBuff(buffName).amount >= (amount || 0); } catch (e) { return false; }
    },
    applyBuff: function (buff, grid, amount, responder) {
        try {
            game.gi.SendServerAction(61, 0, grid, amount || 0, aBuffs.getBuff(buff).GetUniqueId(), responder || null);
        } catch (e) { }
    },
    fullName: function (buff) {
        const full = {
            "BB": "BattleBuffHurt_BuffAd",
            "CS": "ChangeSkin_BuffAd",
            "EE": "EmptyEffectBuff_BuffAd"
        }
        var prefix = buff.split("_")[0];
        var abb = full[prefix];
        return abb ? buff.replace(prefix, abb) : buff
    },
    AppliedTo: function (building, buffName) {
        var applied = false;
        $.each(building.mBuffs_vector, function (i, buff) {
            if (applied) return
            applied = buff.GetBuffDefinition().GetName_string() === buffName;
        });
        return applied;
    },
    lootables: function () {
        var types = [];
        $.each(game.def('global').map_BuffName_BuffDefinition, function (key) {
            if (key.indexOf('Loottable_') === 0) types.push(key);
        });
        return types;
    },
    openLootables: function () {
        try {
            if (!game.gi.isOnHomzone() || !aSession.isOn.OpenMysteryBoxs) return;
            // aQueue.add('status', ['Checking Mystery Boxs!']);
            aSettings.defaults.Lootables.boxTypes.forEach(function (type) {
                if (aBuffs.getBuffAmount(type) <= 0) return;
                aQueue.add('applyBuff', { what: 'BOX', type: type });
            });
        } catch (er) { }
    },
    applyOnFriend: function (buff, amount, friend) {
        var dSA = game.def("Communication.VO::dServerAction", true);
        dSA.type = 0;
        dSA.grid = 1960;
        dSA.endGrid = amount || 0;
        dSA.data = aBuffs.getBuff(buff).GetUniqueId();
        var responder = game.createResponder(function (e, d) { debug(d) });
        game.gi.mClientMessages.SendMessagetoServer(61, friend, dSA, responder);
    }
}
// ==================== Resources ====================
const aResources = {
    gather: {
        list: {},
        byTrade: function () {
            try {
                const friend = aUtils.friends.getRandom();
                if (!friend) return;
                $.each(aResources.gather.list, function (name, amount) {
                    var trade = {
                        Send: [name, amount],
                        Receive: [name === 'Fish' ? 'Stone' : 'Fish', 1],
                        friendID: friend.id
                    }
                    aQueue.add('gatherResource', ['send', trade]);
                });
                aQueue.add('gatherResource', ['checkOutbox', friend.id], TIMEOUTS.ADVENTURE_START_DELAY);
                aQueue.add('gatherResource', ['checkInbox', friend.id], TIMEOUTS.ADVENTURE_START_DELAY);
            } catch (e) { debug(e) }
        }
    },
    getResourcesInfo: function (AllResources, toOptions) {
        try {
            var result = [];
            const resources = game.getResources().GetPlayerResources_vector("").sort(function (a, b) {
                return loca.GetText("RES", a).localeCompare(loca.GetText("RES", b))
            });
            $.each(resources, function (i, Resource) {
                try {
                    const event = game.def('ServerState::gEconomics').mMap_EventResourceDefaultDefinition[Resource.name_string];
                    if (game.def('ServerState::gEconomics').GetResourcesDefaultDefinition(Resource.name_string).tradable && ((!event) || (game.gi.mEventManager.isEventStarted(event.requiredEventName_string) || AllResources))) {
                        result.push(Resource.name_string);
                    }
                } catch (e) {
                    debug('[WARN] Failed to process resource: ' + Resource.name_string + ', error: ' + e);
                }
            });
            if (!toOptions) return result;
            return result.map(function (x) {
                var isSelected = (aSettings.defaults.TransferToStore.boxTypes.indexOf(x) >= 0);
                return createTableRow(
                    [
                        [1, createSwitch("aTransferToStore_sw_" + x, isSelected)],
                        [5, getImage(assets.GetResourceIcon(x).bitmapData, "23px") + " " + aUtils.game.getText(x)],
                        [6, "{0}".format(aUtils.format.num(aBuffs.getBuffAmount(['AddResource', x])))]
                    ], false);
            });
        } catch (e) { debug(e) }
    },
    Has: function (name, amount, alert) {
        if (game.getResources().HasPlayerResource(name, amount)) return true;
        if (alert)
            aUI.Alert('You need to have {0} {1}'.format(amount, loca.GetText('RES', name)), assets.GetResourceIcon(name));
        return false;
    },
    productionBuildings: function (resource) {
        return game.getBuildings().filter(function (building) {
            try {
                return building.GetResourceCreation().GetResourceCreationDefinition().defaultSetting.resourceName_string === resource;
            } catch (e) { return false; }
        });
    },
    runProduction: function (resource, total) {
        try {
            const Buildings = this.productionBuildings(resource);
            if (!Buildings.length)
                aUI.Alert('Please have some buildings that produce "{0}"'.format(loca.GetText('RES', resource)), resource);
            var reqResources = {};
            var Output = 0;
            var fullWareHouse = false;
            $.each(Buildings, function (i, building) {
                switch (building.GetResourceCreation().GetProductionState()) {
                    case 0: // WORKING
                        const buff = aSettings.defaults.Quests.Config.ProduceResource.BuffType;
                        aBuildings.buffBuilding(building, buff);
                        break;
                    case 1: // RESOURCE_MISSING
                        Output += building.GetResourceOutputFactor();
                        $.each(building.GetResourceCreation().GetResourceCreationDefinition().necessaryResources_vector, function (ii, req) {
                            reqResources[req.name_string] = (reqResources[req.name_string] || 0) + (req.amount * building.GetResourceInputFactor());
                        })
                        break;
                    case 2: // WAREHOUSE_FULL
                        fullWareHouse = true;
                        break;
                    case 5: // STOPPED_PRODUCTION
                        if (aSettings.defaults.Quests.Config.ProduceResource.TurnOn)
                            aQueue.add('turnOnProduction', building.GetGrid());
                        break;
                    default:
                        debug('Unkown Production State "{0}"!'.format(building.GetResourceCreation().GetProductionState()));
                }
            });
            $.each(reqResources, function (name, amount) {
                const req = (total * amount) / Output;
                if (aResources.Has(name, req)) return;
                if (aBuffs.getBuffAmount(['AddResource', name]) < req) {
                    aResources.runProduction(name, req);
                } else {
                    aBuffs.applyBuff(['AddResource', name], 8825, req);
                }
            });
            if (fullWareHouse)
                aUI.Alert('Warehouse is full of "{0}", Can\'t produce more!!'.format(loca.GetText('RES', resource)), resource);

        } catch (e) { debug(e) }
    },
    Economy: function (name, amount, delta) {
        const review = game.def("ServerState::cEconomyOverviewData", 1).GetResourceProductionAndConsumptionValues(null, name);
        if (review.mProductionValue > 0)
            aUI.Alert('Waiting to gather enough {0} ({1}/{2})'.format(name, delta, amount), assets.GetResourceIcon(name));
        else
            aUI.Alert('Please make sure that your {0} production is running!'.format(loca.GetText('RES', name)), assets.GetResourceIcon(name));
    },
    transferFromStarToStore: function () {
        try {
            if (!game.gi.isOnHomzone() || !aSession.isOn.FromStarToStore) return;
            // aQueue.add('status', ['Checking Star Resources!']);
            aSettings.defaults.TransferToStore.boxTypes.forEach(function (item) {
                aResources.getResourceFormStar(item);
            });
        } catch (e) { debug(e) }
    },
    remainingCapacity: function (resName) {
        return game.getResources().GetWareHouseCapacity() - game.getResources().GetResourceAmount(resName);
    },
    getResourceFormStar: function (resName, amount) {
        var buffAmount = aBuffs.getBuffAmount(['AddResource', resName]);
        if (!buffAmount) return false;
        if (amount > buffAmount || !amount) amount = buffAmount;
        var transferable = aResources.remainingCapacity(resName);
        if (!transferable) return false;
        if (amount > transferable)
            aUI.Alert('Please make space to gather x{0} {1}'.format(amount - transferable, loca.GetText('RES', resName)), assets.GetResourceIcon(resName));
        else
            transferable = amount;

        return aQueue.add('applyBuff', { what: 'RESOURCE', type: ['AddResource', resName], amount: transferable }), true;
    }
}
// ==================== Specialists ====================
const aSpecialists = {
    getSpecialists: function (type, task) {
        //arg2
        // number -> return specs with task
        // true -> return free specs only
        // false -> return all
        return game.getSpecialists().sort(specNameSorter).filter(function (spec) {
            try {
                if (!spec || game.player.GetPlayerId() !== spec.getPlayerID() ||
                    (type === 0 && !spec.GetSpecialistDescription().isGeneral()) ||
                    (type !== 0 && spec.GetBaseType() !== type)) return false;
                if (typeof task === 'number') {
                    if (!spec.IsInUse()) return false;
                    return spec.GetTask().GetSubType() === task;
                }
                return task ? !spec.IsInUse() : true;
            } catch (e) { return false }
        });
    },
    manageExplorers: function () {
        if (!game.gi.isOnHomzone() || !aSession.isOn.Explorers) return;
        // aQueue.add('status', ['Checking Explorers!']);
        try {
            const explorers = aSpecialists.getSpecialists(1, true);
            if (!explorers.length) return;

            const template = aSettings.defaults.Explorers.useTemplate ? aUtils.file.Read(aSettings.defaults.Explorers.template) : false;
            const activeEvent = aEvents.getActiveEvent('Content');
            const tasks = game.def("global").specialistTaskDefinitions_vector[1].subtasks_vector.filter(function (task) {
                return [4, 5].indexOf(task.subTaskID) === -1;
            });
            var sub = 0;
            explorers.forEach(function (expl, index) {
                try {
                    var finalTask = null;
                    if (template) {
                        var tempTask = template[expl.GetUniqueID().toKeyString().replace(".", "_")];
                        if (tempTask) { finalTask = tempTask.split(','); }
                    } else {
                        var defaultTask = mainSettings.explDefTaskByType[expl.GetType()];
                        if (defaultTask) { finalTask = defaultTask.split(',') }
                    }
                    if (aSettings.defaults.Explorers.eventOptimize && activeEvent) {
                        var skills = expl.getSkillTree().getItems_vector().concat(expl.skills.getItems_vector());
                        var taskValue = 0;
                        $.each(tasks, function (i, task) {
                            var duration = task.duration;
                            var itemModifier = 1;
                            skills.forEach(function (skill) {
                                var lvl = skill.getLevel() - 1;
                                if (lvl === -1) return;
                                skill.getDefinition().level_vector[lvl].forEach(function (skillDef) {
                                    if (skillDef.type_string.length === 0 || skillDef.type_string === 'FindTreasure' + task.taskType_string) {
                                        if (skillDef.modifier_string.toLowerCase() === 'searchtime') {
                                            duration = skillDef.value !== 0 ? skillDef.value : ((duration * skillDef.multiplier) + skillDef.adder);
                                        } else if (skillDef.modifier_string.toLowerCase() === 'changeloottablerolls') {
                                            itemModifier = skillDef.multiplier > itemModifier ? skillDef.multiplier : itemModifier;
                                        }
                                    }
                                });
                            });
                            duration = Math.round((duration / expl.GetSpecialistDescription().GetTimeBonus()) / 360) / 100;
                            var value = (aEvents.treasureItems[activeEvent][i] * itemModifier) / duration;
                            if (value > taskValue) {
                                taskValue = value;
                                finalTask = [1, task.subTaskID];
                            }
                        });
                    }
                    if (!finalTask) {
                        sub++;
                        return;
                    }
                    aQueue.add('sendExplorer', [expl.GetUniqueID().toKeyString(), finalTask, index + 1 - sub, explorers.length - sub]);
                } catch (er) { }
            });
            //aUI.updateStatus("Sending: {0} Explorers".format(explorers.length), 'Explorers');
        } catch (e) { debug(e); debug('There has been an error while sending explorers'); }
    },
    sendGeologists: function (geos, count, type, depo) {
        aSpecialists.getSpecialists(2, true).filter(function (g) { return geos.indexOf(g.GetType()) !== -1; })
            .forEach(function (geo, index) {
                if (index + 1 > count) return;
                aQueue.add('sendGeologist', [geo.GetUniqueID().toKeyString(), type, depo, index + 1, count]);
            });
    }
}
// ==================== Buildings ====================
const aBuildings = {
    collectibles: {
        check: function () {
            try {
                const sBuildings = this.buildings();
                const cQuest = aQuests.getQuests(/CollectAll/)[0];
                if (!(cQuest && cQuest.IsQuestActive()) && !Object.keys(sBuildings).length) return
                this.collect(sBuildings);
                aQueue.add('completeQuest', cQuest.getQuestName_string(), TIMEOUTS.ADVENTURE_QUEST_COMPLETE_DELAY);
            } catch (e) { }
        },
        collect: function (itemsMap) {
            try {
                var collectionsManager = game.def("Collections::CollectionsManager").getInstance();
                game.zone.mStreetDataMap.GetBuildings_vector().forEach(function (item) {
                    if (!item) return;
                    var itemGOContainer = item.GetGOContainer();
                    if (
                        collectionsManager.getBuildingIsCollectible(item.GetBuildingName_string()) ||
                        (
                            item.getPlayerID() !== 0 &&
                            itemsMap[item.GetBuildingName_string()] &&
                            item.mIsSelectable &&
                            itemGOContainer.mIsAttackable &&
                            !itemGOContainer.mIsLeaderCamp &&
                            itemGOContainer.ui !== "enemy" &&
                            (item.GetArmy() === null || !item.GetArmy().HasUnits())
                        )
                    ) {
                        aQueue.add('collect', [item.GetGrid()]);
                    }
                });
            } catch (er) { }
        },
        lootables: function () {
            const lBuildings = {
                'FlyingHouse': 'FlyingHouse',
                'GiftChristmasTree': 'GiftChristmasTree',
                'GiftGhostShip': 'GhostLantern',
                'BalloonMarket_mini': 'BalloonMarket_mini'
            }
            $.each(lBuildings, function (name, val) {
                try {
                    const buildingVO = game.zone.mStreetDataMap.getBuildingByName(name);
                    if (!buildingVO) return;
                    const questVO = game.quests.getQuest('BuiBonus_{0}_Timer_Loop'.format(val)) ||
                        game.quests.getQuest('BuiBonus_{0}_Timer'.format(val));
                    if (!questVO) {
                        aQueue.add('collect', [buildingVO.GetGrid(), true]);
                    }
                } catch (e) { debug(e) }
            });
        },
        buildings: function () {
            //DummyBuildingCollectibleClue_EpicResidence
            var itemsMap = {}
            if (game.gi.mCurrentPlayer.mIsAdventureZone && game.quests.GetQuestPool().IsAnyQuestsActive()) {
                $.each(game.quests.GetQuestPool().GetQuest_vector().toArray(), function (i, item) {
                    if (item.isFinished() || !item.IsQuestActive()) { return; }
                    $.each(item.mQuestDefinition.questTriggers_vector, function (n, trigger) {
                        if (!(trigger.type === 1 && trigger.condition === 9)) return;
                        if (trigger.name_string !== null && trigger.name_string !== '')
                            itemsMap[trigger.name_string] = true;
                    });
                    $.each(item.mQuestDefinition.endConditions_vector, function (n, trigger) {
                        if (trigger.action_string !== 'buildingdestroyed' &&
                            trigger.item_string.indexOf('Collectible') === -1) return;
                        itemsMap[trigger.name_string || trigger.item_string] = true;
                    });
                });
            }
            if (aAdventure.info.isOnAdventure()) {
                game.getBuildings().forEach(function (building) {
                    if (building && building.GetBuildingName_string().indexOf('DummyBuilding') === 0)
                        itemsMap[building.GetBuildingName_string()] = true;
                });
            }
            return itemsMap;
        },
        manage: function () {
            // aQueue.add('status', ['Checking Collectibles!']);
            if ((game.gi.isOnHomzone() && aSettings.defaults.Collect.Pickups) ||
                (aAdventure.info.isOnAdventure() && aSession.adventure.name) ||
                game.zone.mAdventureName !== "Home")
                aBuildings.collectibles.check();
            if (game.gi.isOnHomzone() && aSettings.defaults.Collect.LootBoxes)
                aBuildings.collectibles.lootables();
        }
    },
    deposits: {
        removeDepleted: function () {
            const depleted = game.getBuildings().filter(function (b) {
                try {
                    if (b.GetBuildingName_string().indexOf("Depleted") === -1) return false;
                    const name = b.GetBuildingName_string().split('Deposit')[1];
                    return Object.keys(aSettings.defaults.Deposits.data).indexOf(name) > -1;
                } catch (e) { return false; }
            });
            depleted.forEach(function (building, index) {
                const num = "({0}/{1})".format(index + 1, depleted.length);
                aQueue.add('removeBuilding', { grid: building.GetGrid(), num: num, name: building.GetBuildingName_string() });
            });
        },
        manage: function () {
            if (!game.gi.isOnHomzone() || !aSession.isOn.Deposits) return;
            try {
                aBuildings.deposits.removeDepleted();

                var buildingSlots = game.gi.mCurrentPlayer.mBuildQueue.GetTotalAvailableSlots() - game.gi.mCurrentPlayer.mBuildQueue.GetQueue_vector().length;
                var buildingLisences = game.gi.mCurrentPlayer.GetMaxBuildingCount() - game.gi.mCurrentPlayer.mCurrentBuildingsCountAll;

                const geologists = aSpecialists.getSpecialists(2);
                $.each(Object.keys(aSettings.defaults.Deposits.data), function (index, depoName) {
                    const depoData = aSettings.defaults.Deposits.data[depoName];
                    const onMapDepos = game.zone.mStreetDataMap.getDeposits_vectorByType(depoName);
                    const onTaskGeos = geologists.filter(function (spec) {
                        var task = spec.GetTask ? spec.GetTask() : null;
                        return task && task.GetSubType() === index;
                    });
                    const unfoundDepos = (depoData.options[7] || depoData.max) - onMapDepos.length - onTaskGeos.length;

                    //if there is deposits to find
                    if (unfoundDepos > 0)
                        aSpecialists.sendGeologists(depoData.geos, unfoundDepos, index, depoName);

                    // if can build a mine
                    if (depoData.mine) {
                        $.each(onMapDepos, function (i, onMapDepo) {
                            if (onMapDepo === null) return;
                            var depoMine = game.zone.GetBuildingFromGridPosition(onMapDepo.GetGrid());
                            if (depoMine === null) {
                                var mineName = depoName.replace("Ore", "") + "Mine";
                                var canAfford = game.zone.GetResources(game.player).CanPlayerAffordBuilding(mineName);
                                if (buildingSlots > 0 && buildingLisences > 0 && canAfford && depoData.options[1]) {
                                    aQueue.add('buildMine', [depoData.mine, onMapDepo.GetGrid(), onMapDepo.GetName_string()]);
                                    buildingLisences--;
                                    buildingSlots--;
                                }
                            } else if (depoData.options[2] &&
                                depoMine.GetUpgradeLevel() < depoData.options[3] &&
                                depoMine.IsUpgradeAllowed(true)
                            ) {
                                aQueue.add('upgradeBuilding', [depoMine.GetGrid(), depoMine.GetBuildingName_string(), depoMine.GetUpgradeLevel() + 1]);
                            } else if (depoData.options[4]) {
                                aBuildings.buffBuilding(depoMine, depoData.options[5]);
                            }
                        });
                    } else if (depoData.options[4]) {
                        game.zone.mStreetDataMap.getBuildingsByName_vector(depoName === "Stone" ? "Mason" : depoName + "Mason")
                            .forEach(function (mason) { aBuildings.buffBuilding(mason, depoData.options[5]); });
                    }
                });
            } catch (er) { debug(er); }
        }
    },
    production: {
        getBook: function (name) {
            const book = game.def('global').skillPoints_vector.filter(function (sk) { return sk.id_string === name })[0];
            if (!book) return null
            var nbook = book.levels_vector[0];
            $.each(book.levels_vector, function (i, level) {
                if (level.amountProduced <= game.getResources().GetPlayerResource(name).producedAmount)
                    nbook = level;
            });
            return nbook;
        },
        info: function (Buff) {
            if (!Buff) return null;
            if (aBuildings.production.getBook(Buff))
                return [2, Buff, aBuildings.production.getBook(Buff).costs];
            const unit = aAdventure.army.getUnit(Buff);
            if (unit)
                return [unit.GetIsElite() ? 8 : 0, Buff, unit.GetCosts_vector()];
            var PQueue = null;
            $.each(aBuffs.getProduceableBuffs(1), function (i, b) {
                if (b !== Buff) return;
                var buffDef = aBuffs.getDefinition(b);
                PQueue = [1, b, buffDef.GetCosts_vector(), buffDef.GetProductionAmount()];
            });
            if (PQueue) return PQueue;
            $.each(game.def('global').timedProductions_vector, function (i, TPros) {
                if (!TPros.length) return;
                TPros.forEach(function (TPro) {
                    if (TPro.name_string.indexOf(Buff) !== -1) PQueue = [i, TPro.name_string, TPro.GetCosts_vector(), TPro.GetProductionAmount()];
                });
            });
            return PQueue;
        },
        inProgress: function (queue, type) {
            const productionQueue = game.zone.GetProductionQueue(queue);
            var result = 0;
            productionQueue.mTimedProductions_vector.forEach(function (tp) {
                if (tp.GetType() === type) result += tp.GetAmount();
            });
            return result;
        },
        affordable: function (costs, amount) {
            try {
                if (!costs) return false;
                var canAfford = true;
                $.each(costs, function (i, res) {
                    const resource = res.name_string === 'Population' ? game.getResources().GetFree() : game.getResources().GetResourceAmount(res.name_string)
                    const allAmount = res.amount * amount;
                    if (resource < allAmount) {
                        canAfford = false;
                        if (aSettings.defaults.Quests.Config.GatherfromStar && aBuffs.getBuffAmount(['AddResource', res.name_string] >= allAmount))
                            aBuffs.applyBuff(['AddResource', res.name_string], 8825, allAmount);
                    }
                });
                return canAfford;
            } catch (e) { debug(e) }
        },
        order: function (item, amount, check, stack, grid) {
            try {
                const iInfo = this.info(item);
                if (!iInfo || !amount) return;
                if (iInfo[3]) amount = Math.ceil(amount / iInfo[3]);
                if (check) amount -= this.inProgress(iInfo[0], iInfo[1]);
                if (amount <= 0) return;
                if (!this.affordable(iInfo[2], amount))
                    return aUI.Alert("Not enough resources to produce x{1} {0}".format(loca.GetText("RES", iInfo[1]), amount), iInfo[1]);
                const PQ = game.zone.GetProductionQueue(iInfo[0]);
                stack = stack || 25;
                grid = grid || PQ.productionBuilding.GetGrid();
                if (amount >= stack) {
                    aUtils.game.timedProduction(PQ.mProductionType, iInfo[1], stack, Math.floor(amount / stack), grid);
                }
                if (amount % stack) {
                    aUtils.game.timedProduction(PQ.mProductionType, iInfo[1], amount % stack, 1, grid);
                }
                aUI.Alert("Start producing x{1} {0}".format(loca.GetText("RES", iInfo[1]), amount), iInfo[1]);
                aUI.updateStatus("Start producing x{1} {0}".format(loca.GetText("RES", iInfo[1]), amount), 'Buffs');
            } catch (e) { debug(e) }
        }
    },
    excelsior: {
        definitions: function () {
            return game.def('converted.bluebyte.tso.contentgenerator.logic::ContentGeneratorDefinitions').getInstance().getDefinitions();
        },
        categories: function (toOptions) {
            return $.map(aBuildings.excelsior.definitions(), function (def, i) {
                if (!toOptions)
                    return def.getName();
                return $('<option>', { value: i }).text(loca.GetText('LAB', def.getName()));
            });
        },
        collections: function (category, toOptions) {
            return $.map(aBuildings.excelsior.definitions()[category].getCollections(), function (collection, i) {
                if (!toOptions)
                    return collection.getName();
                return $('<option>', { value: i }).text(loca.GetText('RES', collection.getName()));
            });
        }
    },
    buffBuilding: function (building, buffName) {
        if (!building || building.productionBuff != null || building.GetResourceCreation().GetProductionState() !== 0 ||
            building.IsUpgradeInProgress() || building.IsInConstructionMode() || building.IsInDestruction() ||
            !buffName || !aBuffs.getBuffAmount(buffName)) return;
        aQueue.add('applyBuff', { what: 'BUILDING', type: buffName, grid: building.GetGrid(), building: building.GetBuildingName_string() });
    },
    getProducableItems: function (name) {
        var building = game.zone.mStreetDataMap.getBuildingByName(name);
        var items = [];
        switch (building.productionType) {
            case 1:
            case 6:
            case 11:
                items = aBuffs.getProduceableBuffs(building.productionType);
                break;
            case 2:
                items = ["Manuscript", "Tome", "Codex"];
                break;
            case 7:
                items = $.map(game.def('MilitarySystem::cMilitaryUnitData').GetAllUnitDataByTier(true, 3), function (u) { return u.GetProductionName_string(); });
                break;
            case 0:
            case 8:
                var units = game.def('MilitarySystem::cMilitaryUnitDescription').GetAllUnitDescriptions(true).filter(function (u) {
                    return (u.GetIsElite() && building.productionType === 8) || (!u.GetIsElite() && building.productionType === 0);
                });
                items = $.map(units, function (u) { return u.GetProductionName_string(); });
                break;
            default:
                items = $.map(game.def('global').timedProductions_vector[building.productionType], function (tp) { return tp.name_string; });

        }
        var options = [
            $('<option>', { value: '' }).text('None')
        ];
        items.forEach(function (item) {
            options.push($('<option>', { value: item }).text(loca.GetText('RES', item)))
        })
        return options;
    },
    manage: function () {
        if (!game.gi.isOnHomzone() || !aSession.isOn.Buildings) return;
        try {
            $.each(aSettings.defaults.Buildings.TProduction, function (name, settings) {
                var buildings = game.zone.mStreetDataMap.getBuildingsByName_vector(name);
                if (!buildings) return;
                var building = buildings.sort(function (a, b) {
                    return b.GetUpgradeLevel() - a.GetUpgradeLevel()
                })[0];
                const TP = building.productionQueue.mTimedProductions_vector;
                if (settings.buff && !building.productionBuff && TP.length) {
                    aQueue.add('applyBuff', { what: 'BUILDING', type: settings.buff, grid: building.GetGrid(), building: building.GetBuildingName_string() });
                }
                if (!settings.item || settings.amount === 0) return;
                if (name === 'Bookbinder' && TP[0]) {
                    var productionVO = TP[0].GetProductionOrder().GetProductionVO();
                    if (productionVO.producedItems === 1)
                        aQueue.add('completeProduction', [2, productionVO.type_string]);
                    return;
                }
                const inProgress = aBuildings.production.inProgress(building.productionQueue.mProductionType, settings.item);
                if (settings.amount > inProgress)
                    aQueue.add('startProduction', [settings.item, settings.amount, true, settings.stack, building.GetGrid()]);
            });
        } catch (e) { }
    }
}

/**
 * Mail Management System
 *
 * Handles automated mail processing including accepting loot, processing trades,
 * accepting adventure invites, and managing the mail inbox. Uses a timer-based
 * monitoring system to periodically check for new mail.
 *
 * @namespace aMail
 */
const aMail = {
    /**
     * Sets the next time to check mail
     * @param {number} [after] - Minutes to wait before next check (defaults to settings value)
     * @returns {void}
     */
    setMonitor: function (after) {
        aSession.mail.monitor = new Date().getTime() + ((after || aSettings.defaults.Mail.TimerMinutes) * 60000);
    },

    /**
     * Fetches mail headers from the server
     * @param {Object} [responder] - Optional custom responder for the server request
     * @returns {boolean} True if request was sent, false on error
     */
    getHeaders: function (responder) {
        try {
            var v = game.def("Communication.VO::dIntegerVO", !0);
            v.value = LIMITS.TRADE_OUTBOX_VALUE;
            game.gi.mClientMessages.SendMessagetoServer(1175, game.gi.mCurrentViewedZoneID, v, responder || null);
            game.gi.mClientMessages.SendMessagetoServer(1184, 0, null);
            return true;
        } catch (e) { return false; }
    },

    /**
     * Processes mail headers and queues appropriate actions
     * Filters mails by type and user settings, then adds actions to accept loot,
     * complete trades, or process invites
     * @param {Array} mails - Array of mail header objects from the server
     * @returns {void}
     */
    handleHeaders: function (mails) {
        try {
            aUI.updateStatus('Checking Mails...', 'Mail');
            $.each(mails, function (i, mail) {
                if (!mail) return;
                // this groups can be to star
                if ((aSettings.defaults.Mail.AcceptLoots && [6, 25, 26, 27, 28, 41, 42, 43, 44, 45].indexOf(mail.type) >= 0) ||
                    (aSettings.defaults.Mail.AcceptGeologistMsg && mail.type === 32) ||
                    (aSettings.defaults.Mail.AcceptAdventureLoot && [7, 19, 24, 30, 33, 46].indexOf(mail.type) >= 0) ||
                    (aSettings.defaults.Mail.AcceptAdventureMessage && [8, 29, 63].indexOf(mail.type) >= 0) ||
                    (aSettings.defaults.Mail.AcceptGifts && mail.type === 9)
                ) {
                    if (game.def('com.bluebyte.tso.util::MailUtils').CanCollectMail(mail))
                        aSession.mail.lootMails.addItem(mail.id);
                } else if (aSettings.defaults.Mail.CompleteTrades && [4, 5].indexOf(mail.type) !== -1) {
                    aQueue.addNext('mail', ['completeTrade', mail.id, mail.type]);
                } else if ((mail.type === 1 && aSettings.defaults.Mail.AcceptTrades) ||
                    (aSettings.defaults.Mail.AcceptInvites && mail.type === 23)) {
                    aQueue.addNext('mail', ['getBody', mail.id, mail.type]);
                }
            });
            if (aSession.mail.lootMails.length > 0) {
                aUI.updateStatus('Accepting {0} loot mails...'.format(aSession.mail.lootMails.length), 'Mail');
                aQueue.addNext('mail', ['acceptLoot']);
            }
            aMail.setMonitor();
        } catch (e) { }
    },

    /**
     * Fetches the full body of a mail message
     * @param {number} id - Mail ID to fetch
     * @param {number} type - Mail type (1=trade, 23=invite)
     * @returns {boolean} True if request was sent, false on error
     */
    getMailBody: function (id, type) {
        var handler = {
            1: ['handleTradeMail', 'pendingTrades'],
            23: ['handleInviteMail', 'pendingInvites']
        }
        try {
            if (aSession.mail[handler[type][1]].hasOwnProperty(id))
                return aMail[handler[type][0]](null, aSession.mail[handler[type][1]][id]);


            var res = game.createResponder(aMail[type === 1 ? 'handleTradeMail' : 'handleInviteMail']);
            var v = game.def("Communication.VO::dIntegerVO", 1);
            v.value = parseInt(id);
            game.gi.mClientMessages.SendMessagetoServer(1177, game.mCurrentViewedZoneID, v, res);
            return true;
        } catch (e) { debug(e) }
    },
    handleTradeMail: function (event, data) {
        try {
            data = data.data || data;
            var items = aMail.getMailItems(data.body);
            var user = aSettings.defaults.Mail.EnabledUsers[data.senderId.toString()];
            var isGM = aUtils.friends.isGuildMember(data.senderId);
            var premission = false;
            var isResource = (items.Send.Name && !items.Send.Type) ? true : false;
            if (user && user.favorite) {
                premission = true;
            } else if (user || (isGM && aSettings.defaults.Mail.AcceptGuildTrades)) {
                if (isResource) {
                    if (aSettings.defaults.Mail.AllowAllResources && items.Send.Qty <= aSettings.defaults.Mail.AllResourcesMax)
                        premission = true;
                    var resource = aSettings.defaults.Mail.EnabledResources[items.Send.Name];
                    if (resource)
                        premission = items.Send.Qty <= resource ? true : false;
                }
            }
            if (!premission) {
                aSession.mail.pendingTrades[data.id] = data;
                return debug('Pending {0} from {1}'.format(data.body, data.senderName));
            }
            var canTrade = false;
            if (isResource && game.getResources().GetPlayerResource(items.Send.Name).amount >= items.Send.Qty)
                canTrade = true;
            if (!isResource && aBuffs.getBuffAmount(items.Send.Name, items.Send.Type) >= items.Send.Qty)
                canTrade = true;

            if (!canTrade && !(aSettings.defaults.Mail.DeclineTrades && isResource))
                return;

            delete aSession.mail.pendingTrades[data.id];
            aTrade.complete(data.id, 1, canTrade);
            aUI.updateStatus('Accepting Trade..', 'Mail');
            if (aSettings.defaults.Mail.SaveFriendsTrades) {
                items['Date'] = new Date().getTime();
                items['Sender'] = data.senderName;
                items['Status'] = canTrade;
                aTrade.save(items);
            }
        } catch (e) { }
    },
    getMailItems: function (body) {
        var getResources = function (data) {
            try {
                var result = { Name: '', Qty: '', Type: null };
                data = data.split(",");
                if (data.length === 2) {
                    result.Name = data[0];
                    result.Qty = parseInt(data[1]);
                }
                else if (data.length === 3) {
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
    handleInviteMail: function (event, data) {
        try {
            data = data.data || data;
            AdventureManager.recountAdventures();
            if (AdventureManager.getJoinedAdventuresCount()) {
                aSession.mail.pendingInvites[data.id] = data;
                aUI.updateStatus('Already in an adventure, skipping invite from {0}'.format(data.senderName), 'Mail');
            }
            var advName = data.attachments.adventureName;
            var v = game.def("Communication.VO::dIntegerVO", !0);
            v.value = parseInt(data.id);
            aUI.updateStatus("Accepting \"{0}\" invitaion from {1}".format(loca.GetText('ADN', advName), data.senderName), 'Mail');
            delete aSession.mail.pendingInvites[data.id];
            game.gi.mClientMessages.SendMessagetoServer(93, data.attachments.zoneID, v);
        } catch (e) { debug('Error accepting adventure invite'); }
    },
    acceptLootMails: function () {
        try {
            var MailRequest = game.def("Communication.VO.Mail::dDismissMailsRequestVO", 1);
            MailRequest.mailsIDs_collection = aSession.mail.lootMails;
            MailRequest.claim = !aSettings.defaults.Mail.ToStar;
            game.gi.mClientMessages.SendMessagetoServer(1201, game.gi.mCurrentViewedZoneID, MailRequest, game.createResponder(function () {
                aSession.mail.lootMails.removeAll();
                setTimeout(function () { aMail.getHeaders(); }, TIMEOUTS.MAIL_RETRY_DELAY);
            }));
        } catch (e) { }
    },

    /**
     * Main mail management function called by the automation queue
     * Checks if mail monitoring is enabled and due, then queues mail retrieval
     * @returns {void}
     */
    manage: function () {
        if (!game.gi.isOnHomzone() || !aSession.isOn.Mail || aSession.mail.monitor > new Date().getTime()) return;
        // aQueue.add('status', ['Checking Inbox!']);
        aQueue.add('mail', ['getHeaders']);
        aQueue.add('mail', ['handleHeaders'], 7000);
    }
}

/**
 * Trade Management System
 *
 * Handles sending, accepting, and managing trades. Supports both player-to-player
 * trades and Trade Office functionality. Can send resources or buffs in exchange
 * for other resources or buffs.
 *
 * @namespace aTrade
 */
const aTrade = {
    office: {
        trades: {},
        coinSlots: [],
        nextSlotType: function (data) {
            if (!data.length) return 0;
            return data.toArray().filter(function (tr) {
                if (tr.slotType === 2)
                    aTrade.office.coinSlots.push(tr.slotPos);
                return tr.slotType === 0;
            }).length ? 2 : 0;
        },
        isThereNewTrades: function () {
            var TradeCount = 0;
            $.each(aTrade.office.trades, function (key, val) {
                if (!val.Live) TradeCount++;
            });
            return TradeCount;
        },
        isTradeLive: function (data, trade, key) {
            if (!data.length) return false;
            var exist = 0;
            $.each(data.toArray(), function (i, t) {
                if (trade === t.offer)
                    exist = t.id;
            });
            if (exist)
                this.trades[key].Live = true;
            return exist;
        },
        customTrade: function (send, sAmount, rec, rAmount, lots) {
            var nextFreeSlotPos = game.gi.mHomePlayer.mTradeData.getNextFreeSlotForType(0);
            var nextCoinSlotPos = game.gi.mHomePlayer.mTradeData.getNextFreeSlotForType(2);
            var data = {
                Send: [send, sAmount],
                Receive: [rec, rAmount],
                lots: lots || 1,
                slotType: nextFreeSlotPos === 0 ? 0 : 2,
                slotPos: nextFreeSlotPos === 0 ? 0 : nextCoinSlotPos
            }
            aTrade.send(data);
        }
    },

    /**
     * Sends a trade offer to the Trade Office or a specific player
     * @param {Object} data - Trade configuration object
     * @param {Array} data.Send - [resourceName, amount] to send
     * @param {Array} data.Receive - [resourceName, amount] to receive
     * @param {number} [data.lots=1] - Number of trade lots
     * @param {number} [data.slotType] - Trade slot type (0=normal, 2=coin, 4=direct)
     * @param {number} [data.slotPos] - Slot position
     * @param {number} [data.friendID] - Target player ID for direct trades
     * @param {Function} [callback] - Optional callback function on completion
     * @returns {boolean} False on error, undefined on success
     */
    send: function (data, callback) {
        try {
            if (!game.gi.isOnHomzone()) return false;
            var ResVO = game.def("Communication.VO::dResourceVO");
            var tradeVO = game.def("Communication.VO::dTradeOfferVO", !0);
            if (aBuffs.getDefinition(data.Send[0])) {
                var buff = aBuffs.getBuff(data.Send[0]);
                if (!buff || buff.amount < data.Send[1])
                    return aUI.Alert('Trade Failed: Insufficient Buffs', 'ERROR');
                var buffVO = buff.CreateBuffVOFromBuff();
                buffVO.amount = data.Send[1];
                buffVO.sourceZoneId = game.player.GetPlayerId();
                tradeVO.offerRes = null;
                tradeVO.offerBuff = buffVO;
            } else {
                if (!aResources.Has(data.Send[0], data.Send[1]))
                    return aUI.Alert('Trade Failed: Insufficient Resources', 'ERROR');
                tradeVO.offerRes = new ResVO().init(data.Send[0], data.Send[1]);
                tradeVO.offerBuff = null;
            }
            if (aBuffs.getDefinition(data.Receive[0])) {
                var buff = aBuffs.getDefinition(data.Receive[0]);
                var buffVO = game.def("Communication.VO::dBuffVO", true);
                buffVO.buffName_string = buff.GetType();
                buffVO.resourceName_string = buff.GetResourceName_string();
                buffVO.amount = data.Receive[1];
                tradeVO.costsRes = null;
                tradeVO.costsBuff = buffVO;
            } else {
                tradeVO.costsRes = new ResVO().init(data.Receive[0], data.Receive[1]);
                tradeVO.costsBuff = null;
            }
            tradeVO.lots = data.friendID ? 0 : (data.lots || 1);
            tradeVO.slotType = data.friendID ? 4 : data.slotType;
            tradeVO.slotPos = data.friendID ? 0 : data.slotPos;
            tradeVO.receipientId = data.friendID || 0;
            game.gi.mClientMessages.SendMessagetoServer(1049, game.gi.mCurrentViewedZoneID, tradeVO, game.createResponder(callback))
            aUI.Alert("Trade sent!", "Trade");
        } catch (e) { debug(e) }
    },

    /**
     * Accepts, rejects, or collects a trade
     * @param {number} id - Mail/trade ID
     * @param {number} type - Trade type (1=incoming trade, other=outgoing trade)
     * @param {boolean} [accept=true] - True to accept, false to reject (type 1 only)
     * @param {Object} [responder] - Optional server responder
     * @returns {boolean} True on success, false on error
     */
    complete: function (id, type, accept, responder) {
        try {
            var code = type === 1 ? (accept ? 1050 : 1053) : 1054;
            var v = game.def("Communication.VO::dIntegerVO", !0);
            v.value = parseInt(id);
            game.gi.mClientMessages.SendMessagetoServer(code, game.gi.mCurrentPlayer.GetPlayerId(), v, responder || null);
            aUI.updateStatus('Trade ' + (type === 1 ? (accept ? 'Accepted' : 'Rejected') : 'Resources Collected'), "Mail");
            return true;
        } catch (e) { return false; }
    },

    /**
     * Saves a trade to the trade history log
     * @param {Object} trade - Trade object containing Send, Receive, Date, Sender, Status
     * @returns {void}
     */
    save: function (trade) {
        try {
            const path = aUtils.file.Path('saved_trades');
            var data = aUtils.file.Read(path) || [];
            data.push(trade);
            aUtils.file.Write(path, JSON.stringify(data, null, 2));
        } catch (e) { debug("Error saving trade log: " + e); }
    },
}

// ==================== Quests ====================
const aQuests = {
    getQuests: function (regex) {
        return game.quests.GetQuestPool().GetQuest_vector().toArray().filter(function (q) {
            return q && regex.test(q.getQuestName_string());
        })
    },
    orders: {
        list: {},
        add: function (type, info) {
            if (!this.list[type]) this.list[type] = {};
            if (this.list[type][info.name]) {
                this.list[type][info.name] = this.list[type][info.name].amount > info.amount ? this.list[type][info.name] : info;
            } else {
                this.list[type][info.name] = info;
            }
        },
        reset: function () {
            this.list = {};
        },
        isInList: function (cmds, data) {
            var result = false;
            $.each(cmds, function (i, cmd) {
                try {
                    if (aQuests.orders.list[cmd][data.name].amount >= data.amount)
                        result = true;
                } catch (e) { }
            });
            return result;
        },
        execute: function () {
            $.each(aQuests.orders.list, function (cmd, items) {
                if (!Object.keys(items).length) return;
                $.each(items, function (res_name, data) {
                    const itemName = loca.GetText('RES', res_name);
                    try {
                        switch (cmd) {
                            case 'buffapplied':
                                if (aBuffs.getBuffAmount(res_name) < data.amount) {
                                    if (aQuests.orders.isInList(['buffproduced', 'buffowned'], data))
                                        return;
                                    if (!aSettings.defaults.Quests.Config.Buffs.Produce)
                                        return aUI.Alert('Please Produce x{1} {0}'.format(itemName, data.amount));
                                    return aQueue.add('startProduction', [res_name, data.amount]);
                                }
                                $.each(aBuffs.getBuffTargets(res_name, data.amount),
                                    function (i, grid) {
                                        aQueue.add('applyBuff', { what: 'BUILDINGS', type: res_name, grid: grid, num: i + 1, total: data.amount });
                                    });
                                break;
                            case 'buffappliedonfriend':
                                if (aBuffs.getBuffAmount(res_name) < data.amount)
                                    return aQueue.add('startProduction', [res_name, data.amount]);
                                var friend = aUtils.friends.getRandom(res_name);
                                if (!friend) return;
                                aQueue.add('friend', ['visit', friend.id, friend.username]);
                                aQueue.add('friend', ['apply', friend.username, res_name, data.amount], 40000);
                                aQueue.add('friend', ['return'], 40000);
                                aQueue.add('friend', ['home'], 40000);
                                // }
                                break;
                            case 'resourceproduced':
                                if (aResources.remainingCapacity(res_name) < data.amount)
                                    return aUI.Alert('Not enough storage to produce x{1} {0}!'.format(itemName, data.amount), res_name);
                                // aQueue.add('status', ['Waiting to produce x{0} {1}!'.format(data.amount, loca.GetText('RES', res_name)), 'Quests']);
                                aResources.runProduction(res_name, data.amount);
                                break;
                            case 'resourcegathered':
                                if (aResources.getResourceFormStar(res_name, data.amount)) return;
                                if (aResources.Has(res_name, data.amount))
                                    aResources.gather.list[res_name] = data.amount;
                                else
                                    aResources.runProduction(res_name, data.amount);
                                break;
                            case 'soldgoods':
                                if (!aSettings.defaults.Quests.Config.SellinTO)
                                    return aUI.Alert("Please sell x{1} {0} to a friend".format(loca.GetText('RES', itemString), trueAmount), itemString);
                                if (aTrade.office.trades[data.quest + "#" + data.idx]) return;
                                if (!aResources.Has(res_name, data.amount))
                                    if (!aResources.getResourceFormStar(res_name, data.amount))
                                        return aUI.Alert('There is not enough "{0}" to sell!'.format(loca.GetText('RES', res_name)), res_name);

                                aTrade.office.trades[data.quest + "#" + data.idx] = { Send: [res_name, data.amount], Live: false }
                                break;
                            case 'resourcepaid':
                                if (aResources.Has(res_name, data.amount)) return;
                                if (aResources.getResourceFormStar(res_name, data.amount)) return;
                                if (aQuests.orders.isInList(['resourceproduced'], res_name, data)) return;
                                aResources.runProduction(res_name, data.amount - game.getResources().GetPlayerResource(res_name).amount);
                                break;
                            case 'buffowned':
                            case 'buffproduced':
                            case 'buffpaid':
                                if (cmd === 'buffpaid' && aBuffs.getBuffAmount(res_name) > data.amount) return;
                                if (['buffowned', 'buffpaid'].indexOf(cmd) !== -1 &&
                                    aQuests.orders.isInList(['buffproduced'], res_name, data))
                                    return;
                                if (!aSettings.defaults.Quests.Config.Buffs.Produce)
                                    return aUI.Alert('Please Produce x{1} {0}'.format(loca.GetText('RES', res_name), data.amount));
                                aQueue.add('startProduction', [res_name, data.amount]);
                                break;
                            case 'unitowned':
                            case 'produceditemlist':
                            case 'unitpaid':
                                if (cmd === 'unitpaid') {
                                    aAdventure.army.updateArmy();
                                    if (armyInfo.free[res_name] > data.amount) return;
                                    if (armyInfo.assigned[res_name] > data.amount) return shortcutsFreeAllUnits();
                                }
                                if (['unitowned', 'unitpaid'].indexOf(cmd) !== -1 &&
                                    aQuests.orders.isInList(['produceditemlist'], res_name, data))
                                    return;
                                if (!aSettings.defaults.Quests.Config.TrainUnits)
                                    return aUI.Alert('Please Train x{1} {0}'.format(loca.GetText('RES', res_name), data.amount));
                                aQueue.add('startProduction', [res_name, data.amount]);
                                break;
                            case 'specialisttaskfinished':
                                var option = [];
                                var specTypes = [];
                                const options = {
                                    "Deposit": ["Stone", "BronzeOre", 'Marble', 'IronOre', 'GoldOre', 'Coal', 'Granite', 'AlloyOre', 'Salpeter'],
                                    "Treasure": ["Short", "Medium", "Long", "EvenLonger", "Prolonged"],
                                    "AdventureZone": ["Short", "Medium", "Long", "VeryLong"]
                                }
                                const alter = {
                                    "Longest": "Prolonged",
                                    "AlloyOre": "TitaniumOre"
                                }
                                $.each(Object.keys(options), function (i, key) {
                                    if (res_name.indexOf(key) < 0) return;
                                    var item = res_name.split(key)[1];
                                    const itemName = alter[item] || item;
                                    option = [key === "Deposit" ? 2 : 1, i, options[key].indexOf(itemName)];
                                    if (key === 'Deposit')
                                        specTypes = aSettings.defaults.Deposits.data[itemName].geos;
                                    else if (key === 'Treasure' || key === 'AdventureZone')
                                        specTypes = aSettings.defaults.Quests.Config.Explorers[key][itemName];
                                });
                                if (!option) return aQuests.NTQAlert(data);
                                var specTypeString = option[0] === 1 ? "Explorers" : "Geologists";
                                var searchs = data.amount - aSpecialists.getSpecialists(option[0], option[2]).length;
                                if (searchs <= 0)
                                    return aUI.Alert('Waiting for {0} to complete all searches'.format(specTypeString));

                                if (!specTypes.length)
                                    return aUI.Alert('Please select some {0} to start {1}'.format(specTypeString, loca.GetText('LAB', res_name)), 'ERROR');
                                var count = 0;
                                aSpecialists.getSpecialists(option[0], true).forEach(function (spec) {
                                    if (searchs - count <= 0 || specTypes.indexOf(spec.GetType()) === -1) return;
                                    if (option[0] === 1) {
                                        aQueue.add('sendExplorer', [spec.GetUniqueID().toKeyString(), [option[1], option[2]], ++count, searchs]);
                                    } else {
                                        aQueue.add('sendGeologist', [spec.GetUniqueID().toKeyString(), option[2], itemName, ++count, searchs]);
                                    }
                                });
                                break;
                            case 'buildingdestroyed':
                                const Buildings = game.zone.mStreetDataMap.getBuildingsByName_vector(res_name);
                                $.each(Buildings, function (i, Building) {
                                    if (!Building) return;
                                    if (Building.isWorkyard()) return;
                                    const Army = Building.GetArmy().GetSquads_vector();
                                    if (!Army.length) {
                                        return aQueue.add('killMonster', [Building.GetGrid(), res_name]);
                                    }
                                    $.each(Army, function (i, Squad) {
                                        const eBuff = aBuffs.EffectiveFor(Squad.GetType());
                                        const requiredAmount = Math.ceil(Squad.amount / eBuff[1]);
                                        if (aQuests.orders.isInList(['buffapplied'], eBuff[0], requiredAmount)) return;
                                        const buffAmount = aBuffs.getBuffAmount(eBuff[0]);
                                        if (buffAmount >= requiredAmount) {
                                            aQueue.add('applyBuff', { what: 'BUILDING', type: eBuff[0], grid: Building.GetGrid(), building: res_name, amount: requiredAmount });
                                        } else {
                                            if (aQuests.orders.isInList(['buffproduced'], eBuff[0], [requiredAmount])) return;
                                            aQueue.add('startProduction', [eBuff[0], requiredAmount]);
                                        }
                                    });
                                });
                                break;
                            default:
                                aQuests.NTQAlert(data);
                        }
                    } catch (e) { debug(e) }
                });
            });
        }
    },
    resolve: {
        info: function (trigger, delta) {
            return {
                idx: trigger.triggerIdx,
                name: trigger.name_string || trigger.item_string || trigger.type_string,
                total: trigger.amount || trigger.min,
                delta: delta,
                amount: (trigger.amount || trigger.min) - delta
            };
        },
        quests: function (regex) {
            aQuests.getQuests(regex).forEach(function (quest) {
                aQuests.resolve.quest(quest.getQuestName_string());
            });
        },
        quest: function (questName) {
            try {
                const quest = game.quests.getQuest(questName);
                if (!quest) return;
                if (!quest.IsRunning() && !quest.isFinished()) return;
                if (quest.isFinished()) {
                    $.each(Object.keys(aTrade.office.trades), function (i, key) {
                        if (key.indexOf(quest.getQuestName_string()) !== -1)
                            delete aTrade.office.trades[key];
                    });
                    aQueue.add('completeQuest', questName);
                    return;
                }
                var payToFinish = false;
                $.each(quest.mQuestDefinition.questTriggers_vector.toArray(), function (t, trigger) {
                    if (quest.mQuestTriggersFinished_vector[trigger.triggerIdx].status) return;
                    const deltaStart = quest.mQuestTriggersFinished_vector[trigger.triggerIdx].deltaStart;
                    const types = {
                        2: function () {
                            if (trigger.condition === 14) return 'resourcegathered';
                            if (trigger.condition === 15) return 'resourceproduced';
                            if (trigger.condition === 17) return null; //'boughtgoods';
                            if (trigger.condition === 18) return 'soldgoods';
                            return null;
                        },
                        7: function () { return 'unitowned' },
                        16: function () { return 'buffappliedonfriend' },
                        18: function (info) {
                            payToFinish = true;
                            if (aAdventure.army.getUnit(info.name)) return 'unitpaid';
                            if (game.getResources().GetPlayerResource(info.name)) return 'resourcepaid';
                            if (aBuff.getDefinition(info.name)) return 'buffpaid';
                            return null;
                        }
                    }
                    var info, type;
                    if (trigger.type === 45) {
                        const NTQ = quest.mQuestDefinition.endConditions_vector.toArray().filter(function (ec) {
                            return ec.triggerIdx === trigger.triggerIdx;
                        })[0];
                        if (!NTQ) return;
                        if (NTQ.action_string === 'questcomplete')
                            return aQuests.resolve.quest(NTQ.item_string);
                        info = aQuests.resolve.info(NTQ, deltaStart);
                        if (NTQ.action_string === 'buffappliedonfriend')
                            info.name = info.name || 'FillDeposit_Fishfood'
                        type = NTQ.action_string;
                    } else {
                        info = aQuests.resolve.info(trigger, deltaStart);
                        type = types[trigger.type] ? types[trigger.type](info) : null;
                        if (!type) {
                            const total = game.quests.GetTotalValuesForQuestTrigger(game.player, quest, info.idx);
                            return aUI.Alert(game.quests.GetTriggerText(trigger, total), assets.GetQuestTriggerIcon(trigger));
                        }
                    }
                    info.quest = quest.getQuestName_string();

                    if (!(aQuests.canSubmit(quest) && payToFinish))
                        aQuests.orders.add(type, info);
                });
                if (aQuests.canSubmit(quest) && payToFinish)
                    aQueue.add('payQuest', quest.getQuestName_string());
            } catch (e) { debug(e) }
        },
        tasks: function (tasks) {
            $.each(tasks, function (i, Task) {
                if (Task.getState() === 1)
                    return game.gi.mClientMessages.SendMessagetoServer(161, game.gi.mCurrentViewedZoneID, Task.getId());
                var PayToFinish = true;
                $.each(Task.getTriggers(), function (t, trigger) {
                    var def = trigger.getDefinition();
                    if (trigger.getFinished() || (def.amount || def.min) - trigger.getCurrentAmount() === 0) return;
                    if (def.action_string === 'paytofinish') {
                        PayToFinish = aResources.Has(def.item_string, def.amount);
                    } else {
                        PayToFinish = false;
                        var info = aQuests.resolve.info(def, trigger.getCurrentAmount());
                        info.quest = Task.getId();
                        aQuests.orders.add(def.action_string, info);
                    }
                });
                if (PayToFinish)
                    game.gi.mClientMessages.SendMessagetoServer(162, game.gi.mCurrentViewedZoneID, Task.getId());
            });
        }
    },
    canSubmit: function (quest) {
        return game.def('converted.bluebyte.tso.quests.logic.QuestManagerStatic').IsQuestReadyForSubmit(quest, true);
    },
    startQuest: function (buff, quest) {
        if (aBuffs.getBuffAmount(buff) < 1) return;
        aQueue.add('applyBuff', { what: 'QUEST', type: buff, quest: quest });
    },
    manage: function () {
        try {
            if (!game.gi.isOnHomzone() || !aSession.isOn.Quests) return;
            // aQueue.add('status', ['Checking Quests!']);
            aQuests.orders.reset();
            // PH Stuff
            // const PH = game.zone.mStreetDataMap.getBuildingByName("ProvisionHouse");
            // if (!PH) return aUI.Alert("No Provision House found!", 'ERROR');
            // if (!PH.productionBuff && aSettings.defaults.Quests.Config.Buffs.PHBuff) {
            //     aBuffs.Apply(aSettings.defaults.Quests.Config.Buffs.PHBuff, PH.GetGrid());
            // }
            //Short Quests
            const AlterName = {
                BartTheBarter: "Bart",
                ANewStone: "NewStone"
            }
            $.each(aSettings.defaults.Quests.Letters, function (name, enabled) {
                if (!enabled) return;
                const questName = 'BuffQuest{0}Main'.format(AlterName[name] || name);
                if (!game.quests.getQuest(questName))
                    aQuests.startQuest("QuestStart_" + name, questName);
                else
                    aQuests.resolve.quest(questName);
            });
            $.each(aSettings.defaults.Quests.Mini, function (name, enabled) {
                if (!enabled) return;
                const questName = 'BuffQuest{0}'.format(AlterName[name] || name);
                if (!game.quests.getQuest(questName)) {
                    aQuests.startQuest("QuestStart_" + name, questName);
                } else {
                    aQuests.resolve.quest(questName);
                }
            });
            if (aSettings.defaults.Quests.Other.Daily)
                aQuests.resolve.quests(/^Dai[A-Z]/);
            if (aSettings.defaults.Quests.Other.DailyGuild)
                aQuests.resolve.quests(/^GuiDai[A-Z]/);
            if (aSettings.defaults.Quests.Other.Weekly)
                aQuests.resolve.quests(/WeeklyChallenge.*Main/);
            if (aSettings.defaults.Quests.Other.Ghost)
                aQuests.resolve.quests(/BuiBonus_GhostLantern_WeeklyQuest.*/);
            if (aSettings.defaults.Quests.Other.Starfall)
                aQuests.resolve.quests(/Starfall_Repeatable_.*_Main_lvl.*/);
            //if (aSettings.defaults.Quests.Other.PathFinder)
            //    aQuests.resolve.tasks(this.PathFinder.Tasks());
            aQuests.orders.execute();
            if (aTrade.office.isThereNewTrades())
                aQueue.add('sendOfficeTrades');
            if (Object.keys(aResources.gather.list).length)
                aResources.gather.byTrade();
        } catch (e) { debug(e) }
    },
    NTQAlert: function (data) {
        if (!aSettings.defaults.Quests.Config.Notification) return;
        var NTQ;
        if (isNaN(parseInt(data.quest))) {
            NTQ = game.quests.getQuest(data.quest).mQuestDefinition.endConditions_vector[data.idx];
        } else {
            NTQ = aQuests.PathFinder.Trigger(data.quest, data.idx).getDefinition();
        }
        aUI.Alert(game.quests.getNewTriggerText(NTQ), assets.GetNewQuestTriggerIcon(NTQ));
    },
    isTriggerFinished: function (quest, idx) {
        if (isNaN(parseInt(quest))) {
            return game.quests.getQuest(quest).mQuestTriggersFinished_vector[idx].status;
        } else {
            return this.PathFinder.isTriggerFinished(quest, idx);
        }
    }
}

/**
 * Adventure Management System
 *
 * Handles all adventure-related automation including battle management,
 * general deployment, army tracking, and adventure template execution.
 * Supports automated camp clearing, general movement, and army loading.
 *
 * @namespace aAdventure
 */
const aAdventure = {
    /**
     * Battle state management and execution
     * @namespace aAdventure.battle
     */
    battle: {
        getState: function (attackersOnly) {
            const myArmy = JSON.parse(JSON.stringify(armyInfo.total));
            var canSubmitAttack = true, attackSubmitChecker = [];
            const state = {
                army: { canSubmit: true, required: {}, matched: true },
                busy: { travelling: [], moving: [], attacking: [], total: 0, travellingTime: 0 },
                grid: { onGrid: true, onWay: [], totalOn: 0, canMove: 0 },
                total: 0
            };
            $.each(battlePacket, function (id, item) {
                try {
                    if (attackersOnly && !item.target) return;
                    state.total++;
                    // ================ handle buffs ===============
                    if (item.type === 'buff') {
                        if (!aBuffs.getBuffAmount(item.name)) {
                            aUI.Alert('You don\'t have "{0}"!'.format(loca.GetText("RES", item.name)), 'ERROR');
                            canSubmitAttack = false;
                        }
                        return;
                    }
                    if (!item.spec) {
                        state.busy.total++;
                        state.busy.travelling.push(id);
                        return;
                    }
                    // ================ handle busy ================
                    if (item.spec.GetTask()) {
                        state.busy.total++;
                        const task = item.spec.GetTask();
                        const type = task.GetOriginalType();
                        if (type === 4 || type === 12) {
                            state.busy.moving.push(id);
                            try {
                                if (task.GetNewGarrisonGridIdx() === item.grid) {
                                    state.grid.onWay.push(id);
                                    state.grid.totalOn++;
                                }
                            } catch (err) { }
                        }
                        else if (type === 7) {
                            state.busy.travelling.push(id);
                            const travellingTime = task.GetRemainingTime();
                            state.busy.travellingTime = travellingTime > state.busy.travellingTime ? travellingTime : state.busy.travellingTime;
                        }
                        else if (type === 5) {
                            state.busy.attacking.push(id);
                        }
                    }
                    // ================ handle army ================
                    const armyMatched = armyGetChecksum(armyInfo[id]) === armyGetChecksum(item);
                    battlePacket[id].armyMatched = armyMatched;
                    $.each(item.army, function (name, amount) {
                        if (armyMatched || myArmy[name] >= amount) {
                            myArmy[name] -= amount;
                        } else {
                            state.army.required[name] = (state.army.required[name] || 0) + (amount - (myArmy[name] || 0));
                            if (myArmy[name]) { myArmy[name] = 0; }
                            state.army.canSubmit = false;
                        }
                    });
                    if (!armyMatched) {
                        state.army.matched = false;
                        if (item.spec.GetTask() || !item.spec.GetGarrison())
                            state.army.canSubmit = false;
                    }
                    // =============== handle move ================
                    if (item.onSameGrid) state.grid.totalOn++;
                    if (item.canSubmitMove) state.grid.canMove++;
                    if (!item.onSameGrid) state.grid.onGrid = false;
                    // =============== handle attack ================
                    if (item.target > 0) {
                        if (!item.canSubmitAttack)
                            canSubmitAttack = false;
                        attackSubmitChecker.push(item.canSubmitAttack);
                    }
                } catch (err) { }
            });
            state.canSubmitAttack = (canSubmitAttack && attackSubmitChecker.indexOf(false) === -1 && attackSubmitChecker.length > 0);
            return state;
        },
        attemptMove: function (attackerState, allState) {
            try {
                var num = 1;
                const landingFields = aAdventure.info.getLandingFields();
                $.each(battlePacket, function (id, general) {
                    if (!general.spec || general.spec.GetTask() || general.onSameGrid) return;
                    const order = "({0}/{1})".format(num++, allState.total);
                    if (general.canSubmitMove) {
                        if (general.grid > 0)
                            return aQueue.add('moveGeneral', { id: id, order: order });
                        else
                            return aQueue.add('retranchGeneral', { id: id, order: order });
                    }
                    if (landingFields.indexOf(general.grid) > -1 && general.spec.GetGarrisonGridIdx() > 0)
                        return aQueue.add('retranchGeneral', { id: id, order: order });
                });
                var message = null;
                if (attackerState.busy.total) {
                    message = "Waiting for Generals ({0}/{1}){2}!!".format(
                        allState.total - allState.busy.total,
                        allState.total,
                        allState.busy.travellingTime ? ", Continue in: " + aUtils.format.Time(allState.busy.travellingTime) : ""
                    );
                }
                return aAdventure.auto.result(message, false);
            } catch (er) { debug(er) }
        },
        attemptLoad: function (state, attackersOnly) {
            try {
                if (state.busy.total > 0)
                    return aAdventure.auto.result(
                        "Waiting for Generals ({0}/{1}){2}!!".format(
                            state.total - state.busy.total,
                            state.total,
                            state.busy.travellingTime ? ", Continue in: " + aUtils.format.Time(state.busy.travellingTime) : ""
                        ), false, 1);

                if (state.army.canSubmit) {
                    aUI.playSound('UnitProduced');
                    var num = 1;
                    $.each(battlePacket, function (id, general) {
                        if (attackersOnly && !general.target) return;
                        if (general.armyMatched) return;
                        var dRaiseArmyVO = new dRaiseArmyVODef();
                        dRaiseArmyVO.armyHolderSpecialistVO = general.spec.CreateSpecialistVOFromSpecialist();
                        $.each(general.army, function (res) {
                            var dResourceVO = new dResourceVODef();
                            dResourceVO.name_string = res;
                            dResourceVO.amount = general.army[res];
                            dRaiseArmyVO.unitSquads.addItem(dResourceVO);
                        });
                        aQueue.add('loadGeneralUnits', { army: dRaiseArmyVO, message: "Loading template units ({0}/{1})!!".format(num++, state.total) });
                    });
                    return aAdventure.auto.result();
                }
                if (Object.keys(state.army.required).length) {
                    var result = 'You need: ';
                    $.each(state.army.required, function (unit, amount) {
                        result += "{0} {1},".format(amount, loca.GetText('RES', unit));
                    });
                    return aAdventure.auto.result(result.substring(0, result.length - 1));
                }
                shortcutsFreeAllUnits();
                return aAdventure.auto.result("Unloading all Units");
            } catch (er) { debug(er) }
        },
        attemptAttack: function (state, killAll) {

            if (!state.total) {
                aUI.Alert('No attacks available!!', 'ARMY');
                return aAdventure.auto.result(null, true, 2);
            }

            if (state.busy.total > 0)
                return aAdventure.auto.result(
                    "Waiting for Generals ({0}/{1})!!".format(
                        state.total - state.busy.total,
                        state.total
                    ), false, 1);

            if (state.canSubmitAttack) {
                var num = 1;
                $.each(battlePacket, function (id, attacker) {
                    if (!attacker.target > 0) { return; }
                    if (attacker.type === 'buff') {
                        return aQueue.add('applyBuff', { what: "ON_ADVENTURE_BUFF", type: attacker.name, target: attacker.targetName });
                    }
                    const order = "({0}/{1})".format(num++, state.total);
                    aQueue.add('attackEnemy', { id: id, order: order }, attacker.time);
                });
                aSession.adventure.action = killAll ? 'attacking' : '';
                return aAdventure.auto.result(null, !killAll);
            }

            return aAdventure.auto.result(null, true);
        }
    },

    /**
     * Adventure information and state queries
     * @namespace aAdventure.info
     */
    info: {
        /**
         * Gets the zone ID of an active adventure
         * @param {string} [adventure] - Adventure name (defaults to current session adventure)
         * @returns {number} Zone ID of the adventure, or 0 if not found
         */
        getActiveAdvetureID: function (adventure) {
            try {
                var id = 0;
                adventure = adventure || aSession.adventure.name;
                AdventureManager.getAdventures().forEach(function (adv) {
                    if (adv.adventureName === adventure && AdventureManager.isMyAdventure(adv)) {
                        id = adv.zoneID;
                    }
                });
                return id;
            } catch (er) { return 0; }
        },

        /**
         * Checks if any generals in the list are currently busy
         * @param {Array|Object} generals - List of general IDs or general data object
         * @param {boolean} [attackersOnly] - If true, only check attacking generals
         * @returns {boolean} True if any general is busy, false otherwise
         */
        areGeneralsBusy: function (generals, attackersOnly) {
            try {
                var checkList = $.isArray(generals) ? generals : Object.keys(generals);
                if (attackersOnly) {
                    checkList = checkList.filter(function (general) {
                        return generals[general].target > 0;
                    });
                }
                return checkList.map(function (general) {
                    if (general.substr(0, 4) === 'buff') {
                        return aBuffs.getBuffAmount(general) || aUI.Alert('{0} not available!'.format(loca.GetText("RES", general))), false;
                    }
                    general = armyGetSpecialistFromID(general);
                    return general ? (!general.IsInUse() && !general.isTravellingAway()) : false;
                }).indexOf(false) > -1;
            } catch (er) { }
        },
        getGeneralsArrivalTime: function (generals) {
            try {
                var last = 0;
                var isFree = 0;
                $.each(generals, function (id) {
                    const general = armyGetSpecialistFromID(id);
                    if (!general) return;
                    if (general.GetTask()) {
                        last = general.GetTask().GetRemainingTime() > last ? general.GetTask().GetRemainingTime() : last;
                    } else {
                        isFree++;
                    }
                });
                var Result = "";
                Result += " ({0}/{1})".format(isFree, Object.keys(generals).length);
                Result += last > 0 ? ", Continue in {0}".format(aUtils.format.Time(last)) : "!!";
                return Result;
            } catch (e) { debug(e) }
        },
        checkBuffTargets: function (targets, name) {
            return targets.filter(function (target) {
                return aUtils.game.getText(target).indexOf(aUtils.game.getText(name)) !== -1;
            }).length;
        },
        canApplyBuff: function (item) {
            var status = null;
            const targets = [item].concat(aBuffs.getBuffTargets(item, null));
            const quests = game.quests.GetQuestPool().GetQuest_vector().toArray().filter(function (q) {
                return q.IsQuestActive() && q.getQuestName_string().indexOf('Main') === -1;
            });
            $.each(quests, function (i, quest) {
                $.each(quest.mQuestDefinition.endConditions_vector.toArray(), function (ii, trigger) {
                    if (["buffappliedonadventure", 'onmap', 'buildingdestroyed'].indexOf(trigger.action_string) === -1) return;
                    if (targets.indexOf(trigger.item_string) === -1 &&
                        !aAdventure.info.checkBuffTargets(targets, trigger.item_string)) return;
                    // if(trigger.target_string && targets.indexOf(trigger.target_string) === -1) return;
                    status = !quest.mQuestTriggersFinished_vector[trigger.triggerIdx].status;
                });
                if (status !== null) return;
                $.each(quest.mQuestDefinition.questTriggers_vector.toArray(), function (ii, trigger) {
                    if (trigger.type === 1 && targets.indexOf((trigger.item_string || trigger.name_string || trigger.type_string)) !== -1) {
                        status = !quest.mQuestTriggersFinished_vector[trigger.triggerIdx].status;
                    }
                });
            });
            return status;
        },
        checkArmyData: function () {

        },
        newGetBattleState: function (data) {
            aAdventure.army.updateArmy();
            const state = {
                attackers: {
                    army: { canSubmit: true, required: {}, matched: [] },
                    busy: { travelling: [], moving: [], attacking: [], total: 0 },
                    total: []
                },
                all: {
                    army: { canSubmit: true, required: {}, matched: [] },
                    busy: { travelling: [], moving: [], attacking: [], total: 0 },
                    total: []
                }
            }
            const army = {
                canSubmit: true,
                requiredArmy: {},
                allMatched: [],
                attackersMatched: [],
            };
            const busy = {
                attackers: 0,
                all: 0,
                moving: [],
                travelling: [],
                attacking: []
            }
            var canSubmitAttack = true,
                canSubmitMove = false,
                attackSubmitChecker = [],
                attacksAvailable = false,
                attackersOnGrid = [],
                onSameGrid = 0,
                onWayToGrid = [],
                totalGenerals = 0,
                totalAttackers = 0,
                cantMove = 0,
                remainingEnemies = [];

            battlePacket = battleLoadDataCheck(data);
            // const allGrids = Object.keys(data).map(function (item) { return data[item].grid; });

            //var checkedPacket = armyLoadDataCheck(battlePacket);
            $.each(battlePacket, function (id, item) {
                const isAttacker = item.target > 0;
                if (item.type === 'buff') {
                    if (!item.canSubmitAttack) {
                        aUI.Alert(item.target > 0 ? 'Can\'t find target on map, resuming!' :
                            'No target available, resuming!', item.name);
                    } else if (!aBuffs.getBuffAmount(item.name)) {
                        aUI.Alert('You don\'t have "{0}"!'.format(loca.GetText("RES", item.name)), 'ERROR');
                        canSubmitAttack = false;
                    }
                    if (remainingEnemies.indexOf(item.target) === -1) {
                        const enemy = game.zone.GetBuildingFromGridPosition(item.target);
                        if (enemy && enemy.getPlayerID() === -1)
                            remainingEnemies.push(item.target);
                    }
                    return;
                }

                if (item.spec.GetTask()) {
                    state.all.busy.total++;
                    if (isAttacker) state.attackers.busy.total++;
                    const type = item.spec.GetTask().GetOriginalType();
                    if ([4, 12].indexOf(type) !== -1) {
                        state.all.busy.moving.push(id);
                        if (isAttacker) state.attackers.busy.moving.push(id);
                        if (item.spec.GetTask().GetNewGarrisonGridIdx() === item.grid)
                            onWayToGrid++;
                    }
                    else if ([7].indexOf(type) !== -1) {
                        state.all.busy.travelling.push(id);
                        if (isAttacker) state.attackers.busy.travelling.push(id);
                    }
                    else if ([5].indexOf(type) !== -1) {
                        state.all.busy.attacking.push(id);
                        if (isAttacker) state.attackers.busy.attacking.push(id);
                    }
                }

                state.all.total++;
                item.onSameGrid && onSameGrid++;
                !item.canSubmitMove && cantMove++;
                if (item.canSubmitMove) { canSubmitMove = true; }

                // ===================== handling Army =====================
                const armyMatched = armyGetChecksum(armyInfo[id]) === armyGetChecksum(item);
                battlePacket[id].armyMatched = armyMatched;
                $.each(item.army, function (name, amount) {
                    if (armyMatched || armyInfo.total[name] >= amount) {
                        armyInfo.total[name] -= amount;
                    } else {
                        army.requiredArmy[name] = (army.requiredArmy[name] || 0) + (amount - (armyInfo.total[name] || 0));
                        if (armyInfo.total[name]) { armyInfo.total[name] = 0; }
                        army.canSubmit = false;
                    }
                });
                if (!armyMatched && (item.spec.GetTask() || !item.spec.GetGarrison())) {
                    army.canSubmit = false;
                }
                army.allMatched.push(armyMatched);
                isAttacker && army.attackersMatched.push(armyMatched);
                // ===================== handling if enemies =====================
                if (isAttacker) {
                    totalAttackers++;
                    if (!item.canSubmitAttack)
                        canSubmitAttack = false;
                    attacksAvailable = true;
                    attackersOnGrid.push(item.onSameGrid || false);
                    attackSubmitChecker.push(item.canSubmitAttack || false);
                    // armyPacketMatch.push(armyPacketMatches[id] || false);

                    if (remainingEnemies.indexOf(item.target) === -1) {
                        const enemy = game.zone.GetBuildingFromGridPosition(item.target);
                        if (enemy && enemy.getPlayerID() === -1)
                            remainingEnemies.push(item.target);
                    }
                }
            });
            army.allMatched = army.allMatched.indexOf(false) === -1;
            army.attackersMatched = army.attackersMatched.indexOf(false) === -1;

            return {
                busyMoving: moving,
                busyTravelling: travelling,
                busyAttacking: attacking,

                totalAttackers: totalAttackers,
                totalGenerals: totalGenerals,
                attacksAvailable: attacksAvailable,
                remainingEnemies: remainingEnemies,
                canSubmitAttack: (canSubmitAttack && attackSubmitChecker.indexOf(false) === -1 && attackSubmitChecker.length > 0),

                attackersOnGrid: attackersOnGrid.indexOf(false) === -1,
                allOnGrid: totalGenerals === onSameGrid,
                cantMoveAtAll: cantMove - onSameGrid - onWayToGrid,
                canSubmitMove: canSubmitMove,
                army: army,
                busy: busy
            }
        },
        getBattleState: function (data) {
            battlePacket = battleLoadDataCheck(data);
            var canSubmitAttack = true,
                canSubmitMove = [],
                attackSubmitChecker = [],
                attacksAvailable = false,
                allOnSameGrid = [],
                attackersOnGrid = [];
            $.each(battlePacket, function (id, val) {
                if (val.type === 'buff') {
                    if (!val.canSubmitAttack || !aBuffs.getBuffAmount(val.name)) {
                        aUI.Alert("Can't use {0}!".format(loca.GetText("RES", val.name)), 'ERROR');
                        canSubmitAttack = false;
                    }
                    return;
                }
                if (val.spec === null) {
                    (canSubmitAttack = false), (canSubmitMove = false);
                    return;
                }
                allOnSameGrid.push(val.onSameGrid);
                if (val.target > 0)
                    attackersOnGrid.push(val.onSameGrid)
                canSubmitMove.push(val.canSubmitMove || val.onSameGrid);
                attacksAvailable = attacksAvailable || val.target > 0;
                if (!val.canSubmitAttack && val.target > 0) { canSubmitAttack = false; }
                if (val.target > 0) { attackSubmitChecker.push(val.canSubmitAttack); }
            });
            return {
                canMove: (canSubmitMove.indexOf(false) === -1),
                allOnSameGrid: (allOnSameGrid.indexOf(false) === -1),
                canAttack: (canSubmitAttack && attackSubmitChecker.indexOf(false) === -1 && attackSubmitChecker.length > 0),
                attacksAvailable: attacksAvailable,
                attackersOnGrid: (attackersOnGrid.indexOf(false) === -1)
            }
        },
        allOnLandingField: function () {
            var result = true;
            const LFs = $.map(game.zone.mStreetDataMap.mLandingFields_vector, function (lf) { return lf.GetGrid() });
            $.each(battlePacket, function (id, general) {
                if (general.type === 'buff' || !general.grid || !result) return;
                result = LFs.indexOf(general.grid) > -1;
            });
            return result;
        },
        getLandingFields: function () {
            return $.map(game.zone.mStreetDataMap.mLandingFields_vector, function (lf) { return lf.GetGrid() });
        },
        isOnAdventure: function () {
            return game.gi.mCurrentViewedZoneID === aAdventure.info.getActiveAdvetureID();
        },
        getFinishedQuests: function (count) {
            const quests = game.quests.GetQuestPool().GetQuest_vector().toArray().filter(function (e) { return e && e.isFinished(); });
            return count ? quests.length : quests;
        }
    },
    data: {
        getAdventures: function (category) {
            var result = {};
            const adventuresDef = game.def('AdventureSystem::cAdventureDefinition');
            adventuresDef.map_AdventureName_AdventureDefinition.valueSet().filter(function (adv) {
                if (adv.mName_string.indexOf('Expedition') !== -1 || adv.GetRequiresEvent() !== '') return;
                if (adv.GetType_string() === 'Scenario' &&
                    (adv.mName_string.indexOf('Easter') !== -1 &&
                        adv.mName_string.indexOf('BuffAdventures') === -1) ||
                    adv.mName_string.indexOf('unity') > -1) return;
                if (loca.GetText('ADN', adv.mName_string).indexOf('undefined') !== -1) return;
                return true;
            }).sort(function (a, b) {
                return a.GetDifficulty() - b.GetDifficulty();
            }).forEach(function (adv) {
                const Cat = adv.GetCampaign_string() === 'None' ? adv.GetType_string() : loca.GetText('LAB', 'Campaign_{0}'.format(adv.GetCampaign_string()));
                if (!result[Cat])
                    result[Cat] = [];
                result[Cat].push(adv.mName_string);
            });
            return category ? result[category] : result;
        },
        getAdventureType: function (name) {
            return game.def('AdventureSystem::cAdventureDefinition').FindAdventureDefinition(name).GetType_string();
        },
        getItems: function (adventure) {
            const name = adventure || aSession.adventure.name;
            return game.auto.resources.AdventureItems[name.replace('BuffAdventures_', '')];
        }
    },

    /**
     * Adventure action execution functions
     * @namespace aAdventure.action
     */
    action: {
        /**
         * Sends all generals back to the star
         * @returns {void}
         */
        starGenerals: function () {
            try {
                $.each(battlePacket, function (id) {
                    var spec = armyGetSpecialistFromID(id);
                    if (!spec.GetGarrisonGridIdx()) return;
                    auto.cycle.Queue.add(function () {
                        try {
                            game.gi.mCurrentCursor.mCurrentSpecialist = spec;
                            var sTask = new armySpecTaskDef();
                            sTask.uniqueID = spec.GetUniqueID();
                            sTask.subTaskID = 0;
                            game.gi.SendServerAction(95, 12, game.gi.mCurrentCursor.GetGridPosition(), 0, sTask);
                            spec.SetTask(new armySpecTravelDef(game.gi, spec, 0, 12));
                            aUI.updateStatus("Sending generals to Star ({0}/{1})!!".format(auto.cycle.Queue.index, auto.cycle.Queue.len() - 1));
                        } catch (e) { }
                    });
                });
            } catch (er) { }
        },
        loadGenerals: function (attackersOnly, text) {
            try {
                var num = 1;
                const loadableGenerals = Object.keys(battlePacket).filter(function (general) {
                    if (attackersOnly && !general.target) return false;
                    return Object.keys(battlePacket[general].army).length;
                });
                $.each(battlePacket, function (id, general) {
                    if (loadableGenerals.indexOf(id) === -1) return;
                    var dRaiseArmyVO = new dRaiseArmyVODef();
                    var spec = armyGetSpecialistFromID(id);
                    if (spec === null) return;

                    dRaiseArmyVO.armyHolderSpecialistVO = spec.CreateSpecialistVOFromSpecialist();
                    $.each(general.army, function (res) {
                        var dResourceVO = new dResourceVODef();
                        dResourceVO.name_string = res;
                        dResourceVO.amount = general.army[res];
                        dRaiseArmyVO.unitSquads.addItem(dResourceVO);
                    });
                    const message = text + " ({0}/{1})!!".format(num++, loadableGenerals.length);
                    aQueue.add('loadGeneralUnits', { army: dRaiseArmyVO, message: message });
                });
            } catch (er) { debug(er); }
        },
        assignAllUnitsToFinish: function (army) {
            try {
                aUI.playSound('UnitProduced');
                aSpecialists.getSpecialists(0).forEach(function (general) {
                    if (general.GetTask() !== null) { return; }
                    const HasElite = general.GetArmy().HasEliteUnits();
                    var remainingCapacity = general.GetMaxMilitaryUnits() - general.GetArmy().GetUnitsCount();
                    if (remainingCapacity === 0) return;
                    var dRaiseArmyVO = new dRaiseArmyVODef();
                    dRaiseArmyVO.armyHolderSpecialistVO = general.CreateSpecialistVOFromSpecialist();
                    var newArmy = [];
                    var EliteArmy = false;
                    $.each(army, function (unit, amount) {
                        const IsElite = aAdventure.army.getUnit(unit).GetIsElite();
                        if (general.HasUnits()) if (HasElite !== IsElite) { return; }
                        else if (newArmy.length === 0) EliteArmy = IsElite;
                        else if (EliteArmy !== IsElite) return;
                        var currentSquad = general.GetArmy().GetSquad(unit) ? general.GetArmy().GetSquad(unit).GetAmount() : 0;
                        var dResourceVO = new dResourceVODef();
                        dResourceVO.name_string = unit;
                        if (remainingCapacity >= amount) {
                            dResourceVO.amount = currentSquad + amount;
                            delete army[unit];
                            remainingCapacity -= amount;
                        } else {
                            dResourceVO.amount = currentSquad + remainingCapacity;
                            army[unit] = amount - remainingCapacity;
                            remainingCapacity = 0;
                        }
                        if (dResourceVO.amount > 0) {
                            dRaiseArmyVO.unitSquads.addItem(dResourceVO);
                            newArmy.push(unit);
                        }
                    });
                    general.GetArmy().GetSquadsCollection_vector().forEach(function (squad) {
                        if (newArmy.indexOf(squad.GetType()) > -1) { return; }
                        var dResourceVO = new dResourceVODef();
                        dResourceVO.name_string = squad.GetType();
                        dResourceVO.amount = squad.GetAmount();
                        dRaiseArmyVO.unitSquads.addItem(dResourceVO);
                    });
                    aQueue.add('loadGeneralUnits', { army: dRaiseArmyVO, message: "Loading all free units to finish adventure!!" });
                });
            } catch (er) { debug(er) }
        },
        sendGeneralAction: function (id, type, order) {
            try {
                const general = battlePacket[id];
                const target = type === 5 ? general.target : general.grid;
                const targetName = type === 5 ? general.targetName : general.grid;
                game.gi.mCurrentCursor.mCurrentSpecialist = general.spec;
                var stask = new armySpecTaskDef();
                stask.uniqueID = general.spec.GetUniqueID();
                stask.subTaskID = 0;
                game.gi.SendServerAction(95, type, target, 0, stask);
                game.chatMessage("{0} {1} {2} {3}".format(order, general.name.replace(/(<([^>]+)>)/gi, ""), (type === 5 ? ' x ' : ' > '), targetName), 'battle');
            } catch (er) { }
        },
        move: function (state, file) {
            if (!state.canMove && !state.allOnSameGrid) {
                if (!aAdventure.info.allOnLandingField())
                    return aAdventure.auto.result("{0} Can't move generals yet!".format(file));

                $.each(battlePacket, function (id, general) {
                    if (!general.spec.GetGarrisonGridIdx()) return;
                    aQueue.add('retranchGeneral', { id: id, order: "({0}/{1})".format(general.order + 1, Object.keys(battlePacket).length) });
                });
                return aAdventure.auto.result();
            } else if (state.allOnSameGrid) {
                aSession.adventure.action = "load";
                aUI.Alert('All Generals are in place!!', 'ARMY');
                return null;
            } else if (state.canMove) {
                aSession.adventure.action = "load";
                var count = Object.keys(battlePacket).length;
                $.each(battlePacket, function (id, general) {
                    if (!general.canMove || general.type === 'buff') { return --count; }
                    const order = "({0}/{1})".format(general.order + 1, count);
                    if (general.grid > 0)
                        return aQueue.add('moveGeneral', { id: id, file: file, order: order });

                    if (!general.spec.GetGarrisonGridIdx()) return;
                    aQueue.add('retranchGeneral', { id: id, file: file, order: order });
                });
                return aAdventure.auto.result();
            }
        },
        load: function (state, file) {

            if (state && !state.attackersOnGrid) {
                aSession.adventure.action = "move";
                return aAdventure.auto.result();
            }

            updateFreeArmyInfo(true);

            const checkedPacket = armyLoadDataCheck(battlePacket);
            const armyPacketMatch = Object.keys(battlePacket).map(function (g) { return armyPacketMatches[g] });
            if (armyPacketMatch.indexOf(false) === -1) {
                aUI.Alert('All Units are loaded!!', 'ARMY');
                if (state) { return aSession.adventure.action = "attack", null; }
                return aAdventure.auto.result("Units Loaded!", true, 2);
            }
            if (!checkedPacket.canSubmit) {
                aAdventure.army.updateArmy();
                var result = 'You need: ';
                var freeAll = true;
                $.each(checkedPacket.army, function (unit, amount) {
                    var needed = amount - armyInfo.total[unit];
                    if (needed > 0) {
                        freeAll = false;
                        result += "{0} {1},".format(needed, loca.GetText('RES', unit));
                    }
                });
                if (!freeAll)
                    return aAdventure.auto.result(result.substring(0, result.length - 1));

                shortcutsFreeAllUnits();
                return aAdventure.auto.result("{0} Unloading all Units".format(file || ""));
            }
            aUI.playSound('UnitProduced');
            aAdventure.action.loadGenerals(false, "{0} Loading template units".format(file || ""));
            if (state)
                aSession.adventure.action = "attack";
            return aAdventure.auto.result();

        },
        attack: function (state, file, killAll) {
            if (!state.attacksAvailable) {
                aUI.Alert('No attacks available!!', 'ARMY');
                return aAdventure.auto.result(null, true, 2);
            }

            if (state.canAttack) {
                $.each(battlePacket, function (id, attacker) {
                    if (!attacker.canAttack) { return; }
                    if (attacker.type === 'buff') {
                        if (!aBuffs.getBuffAmount(attacker.name))
                            return aUI.Alert('"{0}" not available!'.format(loca.GetText("RES", attacker.name)), 'ERROR')

                        return aQueue.add('applyBuff', { what: "ON_ADVENTURE_BUFF", type: attacker.name, target: attacker.targetName });
                    }
                    const order = "({0}/{1})".format(attacker.order + 1, Object.keys(battlePacket).length);
                    aQueue.add('attackEnemy', { id: id, file: file, order: order }, attacker.time);
                });
                aSession.adventure.action = killAll ? 'attacking' : '';
                return aAdventure.auto.result(null, killAll ? false : true);
            }

            if (!state.attackersOnGrid) {
                aSession.adventure.action = "move";
                return aAdventure.auto.result();
            }

            return aAdventure.auto.result(null, true);
        },
        perform: function () {

            const step = aSession.adventure.currentStep();
            const onAdventure = step.name === 'AdventureTemplate';
            const filePath = step.file.split('\\');
            const file = "[{0}]".format(filePath[filePath.length - 1]);

            if ((onAdventure && !aAdventure.info.isOnAdventure()) ||
                (!onAdventure && !game.gi.isOnHomzone()))
                return aAdventure.auto.result("You must be on {0} island!".format(onAdventure ? "adventure" : "home"));

            const state = aAdventure.info.newGetBattleState(step.data);
            debug(state);
            // if (!aSession.adventure.action) aSession.adventure.action = "move";

            if (onAdventure) {

            }
            const areGeneralsBusy = onAdventure ? state.busy.attackers : state.busy.all;
            if (areGeneralsBusy) {
                if (state.busy.travelling.length)
                    return aAdventure.auto.result("Waiting for generals to arrive!", false, 2);
                if (state.busy.moving.length)
                    return aAdventure.auto.result("Waiting for generals to move to position!", false, 2);
                if (state.busy.attacking.length)
                    return aAdventure.auto.result("Waiting for generals to finish attacking!", false, 2);
            }

            const areArmyMatched = onAdventure ? state.army.attackersMatched : state.army.allMatched;
            if (!areArmyMatched) {
                if (state.army.canSubmit) {
                    // load & return;
                    aUI.playSound('UnitProduced');
                    aAdventure.action.loadGenerals(
                        onAdventure,
                        "{0} Loading template units".format(file)
                    );
                    return aAdventure.auto.result();
                } else if (Object.keys(state.army.requiredArmy).length === 0) {
                    // free all Units & return
                    shortcutsFreeAllUnits();
                    return aAdventure.auto.result("{0} Unloading all Units".format(file));
                } else {
                    // print required units & return;
                    var result = 'You need: ';
                    $.each(state.army.requiredArmy, function (unit, amount) {
                        result += "{0} {1},".format(amount, loca.GetText('RES', unit));
                    });
                    return aAdventure.auto.result(result.substring(0, result.length - 1));
                }
            } else if (!onAdventure) {
                return aAdventure.auto.result(null, true, 2);
            }

            if (state.canSubmitAttack) {
                //Attack
            }

        },
        trainLostUnits: function () {
            const lostArmy = aSession.adventure.getLostUnits();
            if (!lostArmy.total) return;

            if (game.getResources().GetFree() < lostArmy.total) {
                const population = aBuffs.getBuffAmount(['AddResource', 'Population']);
                if (population)
                    aQueue.addToWaiting('applyBuff', { what: 'RESOURCE', type: ['AddResource', 'Population'], amount: population });
            }
            aQueue.addToWaiting('status', ['Training Lost Units!', 'Adventure'], TIMEOUTS.ADVENTURE_RETRY_DELAY);
            $.each(lostArmy.army, function (unitName, unitsNeeded) {
                aQueue.addToWaiting('startProduction', [unitName, unitsNeeded, false]);
            });
        }
    },

    /**
     * Adventure automation control
     * @namespace aAdventure.auto
     */
    auto: {
        /**
         * Main entry point for adventure automation
         * Called by the queue to execute the current adventure step
         * @returns {void}
         */
        start: function () {
            if (!aSession.isOn.Adventure) return;
            if (!aSession.adventure.steps) {
                aUI.Alert("Please reselect the adventure!!", 'ARMY');
            } else if (aSession.adventure.repeatCount === 0) {
                aSession.isOn.Adventure = false;
                aSettings.save();
                aUI.Alert('Auto Adventure Completed!', 'ARMY');
                aUI.modals.adventure.AM_LoadInfo();
            } else if (aSession.adventure.index < aSession.adventure.steps.length) {
                if (aAdventure.info.isOnAdventure() && aAdventure.info.getFinishedQuests(true))
                    aQueue.add("finishAdventureQuests");
                var result = aAdventure.auto.execStep.current();
                if (result) {
                    if (result.next) { aSession.adventure.nextStep(); }
                    if (result.message) { aQueue.add('status', [result.message, 'Adventure']); }
                    if (result.interval) { aQueue.interval = result.interval; }
                    aSettings.save();
                }
            } else {
                aAdventure.army.updateArmy();
                if (!Object.keys(armyInfo.free).length)
                    aQueue.add("finishAdventureQuests", null, TIMEOUTS.ADVENTURE_START_DELAY);
            }
        },
        execStep: {
            current: function () {
                try {
                    var step = aSession.adventure.currentStep();
                    aUI.modals.adventure.AM_UpdateSteps();
                    if (aAdventure.auto.execStep[step.name])
                        return aAdventure.auto.execStep[step.name]();
                    else
                        return aAdventure.auto.result("Something is wrong, retrying!");
                } catch (e) {
                    return debug(e), aAdventure.auto.result("Error: " + e.message);
                }
            },
            StartAdventure: function () {
                try {
                    if (!game.gi.isOnHomzone())
                        return aAdventure.auto.result("You must be on home island!");

                    if (aSession.adventure.lastTime &&
                        (new Date().getTime() - aSession.adventure.lastTime <= 180000))
                        return aAdventure.auto.result("Next Adventure starts at: {0}".format(new Date(aSession.adventure.lastTime + 180000).toLocaleTimeString()));

                    const blackVortex = 'PropagationBuff_AdventureZoneTravelBoost_BlackTree';
                    if (aSettings.defaults.Adventures.blackVortex &&
                        !aSession.adventure.action &&
                        aAdventure.data.getAdventureType(aSession.adventure.name) !== "Scenario" &&
                        !game.gi.mZoneBuffManager.isBuffRunning(blackVortex) &&
                        aBuffs.getBuffAmount(blackVortex)
                    ) {
                        aQueue.add('applyBuff', { what: 'ADVENTURE_BUFF', type: blackVortex, grid: 0 });
                        aSession.adventure.action = "blackVortex";
                        return aAdventure.auto.result();
                    }

                    if (aAdventure.info.getActiveAdvetureID()) {
                        aSession.adventure.action = '';
                        return aAdventure.auto.result('"{0}" is active'.format(loca.GetText('ADN', aSession.adventure.name)), true, 3);
                    } else if (aSession.adventure.action.indexOf('WaitingAdventure') === 0) {
                        var num = parseInt(aSession.adventure.action.split('_')[1]);
                        aSession.adventure.action = num > 2 ? '' : 'WaitingAdventure_' + (num + 1);
                        return aAdventure.auto.result('Waiting for "{0}" to start'.format(loca.GetText('ADN', aSession.adventure.name)));
                    } else {
                        if (aBuffs.getBuffAmount(['Adventure', aSession.adventure.name])) {
                            aQueue.add('applyBuff', { what: 'ADVENTURE' });
                            aSession.adventure.action = 'WaitingAdventure_1';
                            return aAdventure.auto.result();
                        } else
                            return aAdventure.auto.result('No Adventure Map found!');
                    }
                } catch (er) { return debug(er), aAdventure.auto.result('Error: ' + er.message); }
            },
            InHomeLoadGenerals: function () {
                try {
                    if (!game.gi.isOnHomzone())
                        return aAdventure.auto.result("You must be on home island!");

                    aAdventure.army.updateArmy();
                    const step = aSession.adventure.currentStep();
                    battlePacket = battleLoadDataCheck(step.data);
                    const state = aAdventure.battle.getState();
                    if (state.army.matched)
                        return aAdventure.auto.result("All Units are loaded!!", true, 2);
                    return aAdventure.battle.attemptLoad(state, false);
                } catch (er) { debug(er) }
            },
            SendGeneralsToAdventure: function () {
                try {
                    if (!game.gi.isOnHomzone())
                        return aAdventure.auto.result("You must be on home island!");
                    const generals = aSession.adventure.getGenerals();
                    if (aAdventure.info.areGeneralsBusy(generals))
                        return aAdventure.auto.result(null);

                    if (!generals.length)
                        return aAdventure.auto.result("Can't send generals");

                    generals.forEach(function (id, index) {
                        aQueue.add('sendGeneralsToAdventure', { id: id, num: index + 1, total: generals.length });
                    });
                    return aAdventure.auto.result(null, true);

                } catch (er) { }
            },
            UseSpeedBuff: function () {
                try {
                    if (!aAdventure.info.isOnAdventure())
                        return aAdventure.auto.result(null);

                    const speedBuff = aSession.adventure.currentStep().data || aSettings.defaults.Adventures.speedBuff;
                    if (!speedBuff)
                        return aAdventure.auto.result("Continuing without speed buff", true, 1)

                    if (!aBuffs.getBuffAmount(speedBuff))
                        return aAdventure.auto.result("Can't find Buff in star menu, continuing without spped buff", true, 1)

                    aQueue.add('applyBuff', { what: 'ADVENTURE_BUFF', type: speedBuff, grid: 0 });

                } catch (er) { debug(er); }
                return aAdventure.auto.result(null, true, 1);
            },
            StarGenerals: function () {
                return aAdventure.auto.result(null, true);
            },
            VisitAdventure: function () {
                try {
                    if (!aAdventure.info.getActiveAdvetureID())
                        return aAdventure.auto.result("Can't find ({0}) in active adventures".format(loca.GetText('ADN', this.data.name)));
                    if (aSession.adventure.action !== 'Waiting') {
                        if (game.gi.isOnHomzone()) {
                            aQueue.add('travelToZone', 'Adventure');
                            aSession.adventure.action = 'Waiting';
                            return aAdventure.auto.result();
                        } else if (aAdventure.info.isOnAdventure()) {
                            return aAdventure.auto.result(null, true, 2);
                        }
                    }
                } catch (er) { debug(er) }
            },
            CollectPickups: function () {
                if (!aAdventure.info.isOnAdventure())
                    return aAdventure.auto.result("You must be on adventure island!");
                return aAdventure.auto.result("Waiting for pickups!");
            },
            ReturnHome: function () {
                try {
                    if (!game.gi.isOnHomzone() && aSession.adventure.action !== 'Waiting') {
                        aQueue.add('travelToZone', 'Home');
                        aSession.adventure.action = 'Waiting';
                    }
                    return aAdventure.auto.result();
                } catch (er) { debug(er) }
            },
            ProduceItem: function () {
                try {
                    const step = aSession.adventure.currentStep();
                    const buff = aBuffs.fullName(step.data);
                    const item = aAdventure.data.getItems()[step.data];
                    const amount = item.amount || item.grids.length;
                    if (!game.gi.isOnHomzone())
                        return aAdventure.auto.result("You must be on home island!");

                    if (aBuffs.getBuffAmount(buff) >= amount)
                        return aAdventure.auto.result("{0} produced successfully".format(loca.GetText('RES', buff)), true, 3);
                    else if (aBuildings.production.inProgress(1, buff))
                        return aAdventure.auto.result("{0} is being produced".format(loca.GetText('RES', buff)), step.skip || false, 3);
                    else {
                        aQueue.add('startProduction', [buff, amount]);
                        return aAdventure.auto.result(null, false, 5);
                    }
                } catch (er) { }
            },
            ApplyBuff: function () {
                try {
                    const step = aSession.adventure.currentStep();
                    const buff = aBuffs.fullName(step.data);
                    if (!aAdventure.info.isOnAdventure())
                        return aAdventure.auto.result("You must be on adventure island!");

                    const canApply = aAdventure.info.canApplyBuff(buff);

                    if (step.applied || canApply === false)
                        return aAdventure.auto.result("{0} is applied".format(loca.GetText('RES', buff)), true, 3);

                    if (canApply === null)
                        return aAdventure.auto.result('Something is wrong can\'t apply "{0}"!!'.format(loca.GetText('RES', buff)));

                    if (!aBuffs.getBuffAmount(buff))
                        return aAdventure.auto.result('"{0}" is missing!!'.format(loca.GetText('RES', buff)));

                    const item = aAdventure.data.getItems()[step.data];
                    const amount = item.amount || 1;
                    $.each(item.grids, function (i, grid) {
                        aBuffs.applyBuff(buff, grid, amount);
                    });
                    step.applied = true;
                    return aAdventure.auto.result("Applying {0}".format(loca.GetText('RES', buff)), false, 5);
                } catch (er) { }
            },
            AdventureTemplate: function () {
                try {
                    if (!aAdventure.info.isOnAdventure())
                        return aAdventure.auto.result("You must be on adventure island!");

                    aAdventure.army.updateArmy();
                    const step = aSession.adventure.currentStep();
                    battlePacket = battleLoadDataCheck(step.data);
                    const attackerState = aAdventure.battle.getState(true);
                    const allState = aAdventure.battle.getState();


                    if (!aSession.adventure.action)
                        aSession.adventure.action = "move";

                    if (aSession.adventure.action === 'attacking') {
                        const enemies = aSession.adventure.getEnemies(true);
                        if (enemies.remaining) {
                            return aAdventure.auto.result("{0} Waiting to kill enemies ({1}/{2})".format(fileName, enemies.remaining, enemies.all), false, 1);
                        } else {
                            aSession.adventure.action = '';
                            return aAdventure.auto.result("{0} All enemies killed, resuming!".format(fileName), true);
                        }

                    }

                    if (aSession.adventure.action === "move") {
                        if (!attackerState.grid.onGrid &&
                            attackerState.grid.totalOn < attackerState.total)
                            return aAdventure.battle.attemptMove(attackerState, allState);
                        if (attackerState.grid.onGrid && attackerState.busy.travelling.length)
                            return aAdventure.auto.result();
                        aSession.adventure.action = 'load';
                    }

                    if (aSession.adventure.action === "load") {
                        if (!attackerState.army.matched)
                            return aAdventure.battle.attemptLoad(attackerState, true);
                        aSession.adventure.action = "attack";
                    }

                    if (aSession.adventure.action === "attack") {
                        if (!attackerState.grid.onGrid) {
                            aSession.adventure.action = 'move';
                            return aAdventure.auto.result();
                        }
                        if (!attackerState.army.matched) {
                            aSession.adventure.action = 'load';
                            return aAdventure.auto.result();
                        }

                        return aAdventure.battle.attemptAttack(attackerState, step.killAll);
                    }

                } catch (err) { debug(err); }
                return aAdventure.auto.result();
            },
            AdventureTemplate2: function () {
                try {
                    if (!aAdventure.info.isOnAdventure())
                        return aAdventure.auto.result("You must be on adventure island!");
                    const step = aSession.adventure.currentStep();

                    const file = step.file.split('\\');
                    const fileName = "[{0}]".format(file[file.length - 1]);

                    if (!aSession.adventure.action)
                        aSession.adventure.action = "move";

                    if (aSession.adventure.action === 'attacking') {
                        const enemies = aSession.adventure.getEnemies(true);
                        if (enemies.remaining) {
                            return aAdventure.auto.result("{0} Waiting to kill enemies ({1}/{2})".format(fileName, enemies.remaining, enemies.all), false, 1);
                        } else {
                            aSession.adventure.action = '';
                            return aAdventure.auto.result("{0} All enemies killed, resuming!".format(fileName), true);
                        }
                    }

                    if (aAdventure.info.areGeneralsBusy(step.data, !aSession.adventure.action === "move"))
                        return aAdventure.auto.result("{0} Waiting for Generals{1}".format(fileName, aAdventure.info.getGeneralsArrivalTime(step.data)), false, 1);

                    const state = aAdventure.info.getBattleState(step.data);

                    if (aSession.adventure.action === "move") { // Move generals
                        const moveResult = aAdventure.action.move(state, fileName);
                        if (moveResult) return moveResult;
                    }
                    if (aSession.adventure.action === "load") { // FreeUnits & Load Units
                        const loadResult = aAdventure.action.load(state, fileName);
                        if (loadResult) return loadResult;
                    }
                    if (aSession.adventure.action === "attack") {
                        const attackResult = aAdventure.action.attack(state, fileName, step.killAll);
                        if (attackResult) return attackResult;
                    }
                } catch (er) { debug(er) }
            },
            LoadGeneralsToEnd: function () {
                try {
                    if (!aAdventure.info.isOnAdventure())
                        return aAdventure.auto.result("You must be on adventure island to load all units");

                    if (aSession.adventure.getEnemies().remaining > 0)
                        return aAdventure.auto.result("Waiting to kill enemies!!");

                    aAdventure.army.updateArmy();

                    if (!Object.keys(armyInfo.free).length)
                        return aAdventure.auto.result("No unassigned units, ready to finish", true);

                    aAdventure.action.assignAllUnitsToFinish(armyInfo.free);
                    return aAdventure.auto.result();
                } catch (err) { debug(err) }
            }
        },
        result: function (message, next, interval) {
            return {
                next: next || false,
                message: message || null,
                interval: interval || 0
            }
        }
    },

    /**
     * Army information and management
     * @namespace aAdventure.army
     */
    army: {
        /**
         * Gets unit data for a specific unit type
         * @param {string} [uName] - Unit type name, if omitted returns all units
         * @returns {Object|Array} Unit data object or array of all units
         */
        getUnit: function (uName) {
            const data = game.def('MilitarySystem::cMilitaryUnitBase').GetAllUnit(1);
            if (!uName) return data;
            return data.filter(function (unit) { return unit.GetType() === uName; })[0];
        },

        /**
         * Updates the global armyInfo object with current army composition
         * Categorizes units as free, assigned to generals, or total counts
         * @returns {void}
         * @sideEffect Updates global armyInfo object
         */
        updateArmy: function () {
            armyInfo = {
                free: {},
                assigned: {},
                total: {}
            };
            game.zone.GetArmy(game.player.GetPlayerId()).GetSquadsCollection_vector().sort(game.def("MilitarySystem::cSquad").SortByCombatPriority).forEach(function (item) {
                if (item.GetUnitBase().GetUnitCategory() !== 0) { return; }
                armyInfo.free[item.GetType()] = item.GetAmount();
                armyInfo.total[item.GetType()] = (armyInfo.total[item.GetType()] || 0) + item.GetAmount();
            });
            game.getSpecialists().forEach(function (general) {
                try {
                    const id = general.GetUniqueID().toKeyString();
                    armyInfo[id] = { army: {} };
                    general.GetArmy().GetSquads_vector().forEach(function (squad) {
                        if (!squad) return;
                        armyInfo[id].army[squad.GetType()] = squad.amount;
                        armyInfo.assigned[squad.GetType()] = (armyInfo.assigned[squad.GetType()] || 0) + squad.amount;
                        armyInfo.total[squad.GetType()] = (armyInfo.total[squad.GetType()] || 0) + squad.amount;
                    });
                } catch (e) { debug(e) }
            });
        }
    },
}

const auto = {
    version: '2.0.2',
    developer: true,
    update: {
        url: function () {
            return atob('aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2FkbHk5OC9hdXRvVFNPL21haW4v');
        },
        changelog: null,
        available: false,
        checkForUpdate: function (event) {
            if (event) aUI.Alert("Checking for update!", 'TransporterAdmiral');
            try {
                $.get(auto.update.url() + 'version.json', function (data) {
                    var json = JSON.parse(data);
                    auto.update.changelog = json.changelog;
                    if (auto.update.compareVersions(json.version, auto.version) === 1) {
                        if (!event) {
                            aUI.menu.Progress = 70;
                            if (aSettings.defaults.Auto.AutoUpdate) {
                                // Show changelog and request user consent before auto-updating
                                var userConsent = confirm(
                                    "New update available (v" + json.version + ")!\n\n" +
                                    "Changelog:\n" + (json.changelog || "No changelog available") + "\n\n" +
                                    "Do you want to update now?"
                                );
                                if (userConsent) {
                                    auto.update.updateScript();
                                } else {
                                    auto.update.available = true;
                                }
                            } else {
                                auto.update.available = true;
                            }
                        } else {
                            aUI.Alert("New Update Available!!", 'TransporterAdmiral');
                        }
                    } else {
                        if (!event)
                            aUI.menu.Progress = 80;
                        else
                            aUI.Alert("Latest Version :D", 'TransporterAdmiral');
                    }
                });
            } catch (e) {
                debug('Update check failed: ' + e);
                console.error('Update check error:', e);
            }
        },
        updateScript: function () {
            try {
                aSettings.save();
                $.get(auto.update.url() + 'user_auto.js', function (data) {
                    try {
                        const path = air.File.applicationDirectory.resolvePath("userscripts/user_auto.js").nativePath;
                        const backupPath = air.File.applicationDirectory.resolvePath("userscripts/user_auto.js.backup").nativePath;

                        // Create backup of current version before updating
                        try {
                            const currentFile = new air.File(path);
                            if (currentFile.exists) {
                                const fileStream = new air.FileStream();
                                fileStream.open(currentFile, air.FileMode.READ);
                                const currentData = fileStream.readUTFBytes(currentFile.size);
                                fileStream.close();
                                aUtils.file.Write(backupPath, currentData);
                                debug('Backup created successfully');
                            }
                        } catch (backupError) {
                            debug('Backup creation failed: ' + backupError);
                            console.error('Backup error:', backupError);
                        }

                        // Write new version
                        aUtils.file.Write(path, data);
                        aUI.menu.Progress = 90;
                        setTimeout(function () {
                            aUI.Alert("Updated Successfuly ^_^", 'TransporterAdmiral');
                            reloadScripts();
                        }, TIMEOUTS.ADVENTURE_RETRY_DELAY);
                    } catch (writeError) {
                        debug('Update write failed: ' + writeError);
                        console.error('Update write error:', writeError);
                        aUI.Alert("Update failed - check console for details", 'ERROR');
                    }
                });
            } catch (e) {
                debug('Update failed: ' + e);
                console.error('Update error:', e);
                aUI.Alert("New Version couldn't be downloaded @_@", 'ERROR');
            }
        },
        compareVersions: function (v1, v2) {
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
        checkFiles: function (force) {
            if (!force && game.auto.resources) return;
            game.auto.resources = {};
            var localResources = aUtils.file.Read(aUtils.file.Path('resources'));
            $.get(auto.update.url() + 'resources.json', function (data) {
                var json = JSON.parse(data);
                localResources = localResources || json;
                $.each(json, function (file, version) {
                    if (aUtils.file.checkResource(file) &&
                        localResources[file] >= version) {
                        game.auto.resources[file] = aUtils.file.Read(aUtils.file.getPath(1, file));
                    } else {
                        localResources[file] = version;
                        auto.update.downloadResource(file);
                    };
                });
                aUtils.file.Write(aUtils.file.Path('resources'), JSON.stringify(localResources, null, 2));
            });
        },
        downloadResource: function (file) {
            $.get(auto.update.url() + 'resources/{0}.json'.format(file), function (data) {
                aUtils.file.Write(aUtils.file.getPath(1, file), data);
                game.auto.resources[file] = JSON.parse(data);
            });
        }
    },
    load: function () {
        if (!game.hasOwnProperty('auto')) game.auto = {};
        aUI.menu.Progress = auto.developer ? 94 : 0;
        aUI.menu.init(true);
        aSettings.load();
        auto.update.checkFiles();
        aUI.menu.Timer = setInterval(function () {
            aUI.menu.Progress++;
            aUI.updateStatus("Initiating {0}%".format(aUI.menu.Progress));
            if (aUI.menu.Progress === 10) {
                auto.update.checkForUpdate();
            }
            if (aUI.menu.Progress >= 100) {
                clearInterval(aUI.menu.Timer);
                auto.init();
            }
        }, 300);
    },
    init: function () {
        try {
            var zRefreshTracker = game.getTracker('zRefresh', aUtils.trackers.zoneRefreshed);
            var battleFinishedTracker = game.getTracker('battleFinished', aUtils.trackers.battleFinished);

            game.gi.channels.ZONE.addPropertyObserver("ZONE_REFRESHED", zRefreshTracker);
            game.gi.channels.SPECIALIST.addPropertyObserver("generalbattlefought", battleFinishedTracker);

            aSession.observers.push({
                channel: game.gi.channels.ZONE,
                property: "ZONE_REFRESHED",
                tracker: zRefreshTracker
            });
            aSession.observers.push({
                channel: game.gi.channels.SPECIALIST,
                property: "generalbattlefought",
                tracker: battleFinishedTracker
            });
            //game.gi.channels.ZONE.addPropertyObserver(
            //    "CHAT_MESSAGE", game.getTracker('chatObserver', aUtils.trackers.chatObserver)
            //)
            aSession.isOn.Explorers = aSettings.defaults.Explorers.autoStart;
            aSession.isOn.Deposits = aSettings.defaults.Deposits.autoStart;
            aSession.isOn.Buildings = aSettings.defaults.Buildings.autoStart;
            aSession.isOn.Quests = aSettings.defaults.Quests.Config.AutoStart;
            aSession.isOn.CollectPickups = aSettings.defaults.Collect.Pickups;
            aSession.isOn.Mail = aSettings.defaults.Mail.AutoStart || (aSettings.defaults.Mail.AutoStartEvents && aEvents.getActiveEvent('Content'));
            aSession.isOn.FromStarToStore = aSettings.defaults.TransferToStore.autoStart;
            aSession.isOn.OpenMysteryBoxs = aSettings.defaults.Lootables.autoStart;
            if (rawArgs.hasOwnProperty('autorun')) {
                $.extend(aSession.isOn, JSON.parse(rawArgs.autorun));
                delete rawArgs.autorun;
            }
            aUtils.game.applyTweaks();
            aUI.menu.init();
            aQueue.run();
            //aQueue.watcher();
            // aSession.tickMonitor = setInterval(function () {
            //     if (game.gi.mGameTickCommand_vector.length > 1) {
            //         $.each(game.gi.mGameTickCommand_vector, function (i, tick) {
            //             if (!tick) return;
            //             if (tick.mode === 120) return;
            //             else if (tick.mode === 1062) {
            //                 $.each(tick.data, function (i, trade) {
            //                     $.each(aTrade.office.trades, function (key, val) {
            //                         if (trade.offer === val.Offer)
            //                             aTrade.office.trades[key].Live = trade.id;
            //                     })
            //                 });
            //             }
            //         });
            //     }
            // }, 2000);
            aSettings.save();
        } catch (er) { debug(er) }
    }
}

auto.load();