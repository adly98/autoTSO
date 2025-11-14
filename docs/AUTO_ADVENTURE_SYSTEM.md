# Auto Adventure System Documentation

## Table of Contents
1. [Overview](#overview)
2. [High-Level Flow](#high-level-flow)
3. [Step Execution System](#step-execution-system)
4. [Queue System Integration](#queue-system-integration)
5. [Zone Transition Handling](#zone-transition-handling)
6. [Battle Plan Data Flow](#battle-plan-data-flow)
7. [Key Data Structures](#key-data-structures)
8. [Known Issues](#known-issues)

---

## Overview

The Auto Adventure system automates the complete flow of running Settlers Online adventures, from loading troops at home to executing battle plans on adventure maps. It uses a step-based execution model where each step represents a distinct phase of the adventure.

**Key Files:**
- `/Users/rknall/Development/Settlers/autoTSO/user_auto.js` - Main auto adventure logic
- `/Users/rknall/Development/Settlers/tso_client/client/files/content/scripts/5-battle.js` - Battle data helpers

---

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTO ADVENTURE FLOW                          │
└─────────────────────────────────────────────────────────────────┘

┌────────────────┐
│  User Selects  │
│  Adventure     │
│  Template      │
└───────┬────────┘
        │
        v
┌────────────────────────────────────────────────────────────────┐
│                   HOME ISLAND PHASE                            │
├────────────────────────────────────────────────────────────────┤
│  Step 1: InHomeLoadGenerals                                    │
│  ├─ Check on home island                                       │
│  ├─ Validate generals and army composition                     │
│  └─ Load troops to generals using attemptLoad()                │
│                                                                 │
│  Step 2: StartAdventure                                        │
│  ├─ Apply buffs (e.g., Black Vortex)                          │
│  └─ Activate adventure map                                     │
│                                                                 │
│  Step 3: SendGeneralsToAdventure                               │
│  ├─ Wait if generals are busy                                  │
│  ├─ Queue sendGeneralsToAdventure actions                      │
│  └─ Send each general to adventure zone                        │
└────────────────────────────────────────────────────────────────┘
        │
        v
┌────────────────────────────────────────────────────────────────┐
│                 ZONE TRANSITION PHASE                          │
├────────────────────────────────────────────────────────────────┤
│  Step 4: VisitAdventure                                        │
│  ├─ Queue travelToZone action                                  │
│  ├─ Wait for zone to load                                      │
│  └─ Zone load handler triggers nextStep()                      │
│                                                                 │
│  ** CRITICAL: State must survive this transition **            │
└────────────────────────────────────────────────────────────────┘
        │
        v
┌────────────────────────────────────────────────────────────────┐
│                 ADVENTURE ISLAND PHASE                         │
├────────────────────────────────────────────────────────────────┤
│  Step 5: CollectPickups (optional)                             │
│  └─ Wait for collection pickups                                │
│                                                                 │
│  Step 6: AdventureTemplate (MAIN BATTLE LOGIC)                 │
│  ├─ Load battle packet from step.data                          │
│  ├─ State Machine:                                             │
│  │   ├─ MOVE: Send generals to star/positions                  │
│  │   ├─ LOAD: Load troops to generals                          │
│  │   └─ ATTACK: Execute attacks on targets                     │
│  └─ Repeat for each wave                                       │
│                                                                 │
│  Step 7: ReturnHome                                            │
│  └─ Travel back to home island                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Step Execution System

### Step Structure

Each adventure template consists of a sequence of steps stored in `aSession.adventure.steps`:

```javascript
{
  name: 'StepName',        // Step identifier (e.g., 'AdventureTemplate')
  file: '/path/to/file',   // Optional: file path for template data
  data: { ... }            // Optional: battle packet or step-specific data
}
```

### Step Lifecycle

**Code Reference:** `user_auto.js:86-164` (aSession.adventure structure)

```
┌──────────────────────────────────────────────────────────────┐
│                    Step Execution Lifecycle                  │
└──────────────────────────────────────────────────────────────┘

┌─────────────┐
│  Template   │
│  Selected   │──► aSession.adventure.steps = [...]
└─────────────┘    aSession.adventure.index = 0
       │
       v
┌─────────────────────────────────────────────────────────────┐
│  executeStep() - Main loop                                  │
│  (user_auto.js:1046-1118)                                   │
├─────────────────────────────────────────────────────────────┤
│  1. Get current step: currentStep()                         │
│  2. Validate preconditions                                  │
│  3. Call step handler: aAdventure.steps[stepName]()         │
│  4. Process result:                                         │
│     ├─ result(msg, true) → nextStep(), continue             │
│     ├─ result(msg, false) → display message, retry          │
│     └─ result() → silent retry (wait state)                 │
└─────────────────────────────────────────────────────────────┘
       │
       v
┌─────────────────────────────────────────────────────────────┐
│  nextStep() - Advance to next step                         │
│  (user_auto.js:1000-1044)                                   │
├─────────────────────────────────────────────────────────────┤
│  1. Increment aSession.adventure.index                      │
│  2. Reset aSession.adventure.action = ''                    │
│  3. Clear aSession.adventure.message                        │
│  4. If no more steps → end adventure                        │
│  5. Continue execution with new step                        │
└─────────────────────────────────────────────────────────────┘
```

### Current Step Tracking

**Code Reference:** `user_auto.js:993-998`

```javascript
currentStep: function () {
    if (!aSession.adventure.steps.length) return;
    return aSession.adventure.steps[aSession.adventure.index];
}
```

**State Variables:**
- `aSession.adventure.steps` - Array of step objects
- `aSession.adventure.index` - Current step index (0-based)
- `aSession.adventure.action` - Sub-state within a step (e.g., 'move', 'load', 'attack')
- `aSession.adventure.message` - Current status message

---

## Queue System Integration

### Queue Architecture

**Code Reference:** `user_auto.js:460-577` (aQueue implementation)

The queue system handles asynchronous game actions:

```
┌──────────────────────────────────────────────────────────────┐
│                    Queue System Flow                         │
└──────────────────────────────────────────────────────────────┘

Step Executes ──► aQueue.add('actionName', args)
                          │
                          v
                  ┌──────────────────┐
                  │  Queue Manager   │
                  │  - active: []    │
                  │  - queue: []     │
                  └──────────────────┘
                          │
                          v
                  Game API Call ──► Wait for completion
                          │
                          v
                  Callback/Event ──► Queue processed
                          │
                          v
                  Step continues execution
```

### Key Queue Actions

**Code Reference:** `user_auto.js:495-577`

1. **sendGeneralsToAdventure** (lines 551-562)
   - Calls `armyServices.specialist.sendToZone()`
   - Sends general to adventure zone ID

2. **retranchGeneral** (lines 572-576)
   - Calls `armySendGeneralToStar()`
   - Sends general to star position on adventure map

3. **moveGeneral** (lines 564-570)
   - Calls `armyServices.specialist.sendToGrid()`
   - Moves general to specific grid position

4. **travelToZone** (lines 526-534)
   - Calls `zoneServices.zone.switchZone()`
   - Switches between home and adventure zones

### Queue State Management

**Critical Code:** `user_auto.js:474-493`

```javascript
execute: function () {
    if (!aQueue.active.length && aQueue.queue.length) {
        aQueue.queue.forEach(function (action) {
            aQueue.active.push(action);
            aQueue.actions[action.name](action.args);
        });
        aQueue.queue = [];
    }
}
```

**Issue:** Queue is processed all at once when empty. If queue gets cleared during zone transitions, pending actions are lost.

---

## Zone Transition Handling

### Zone Load Event Handler

**Code Reference:** `user_auto.js:1127-1144`

```javascript
$(g_RibbonController).on('FinishedZoneLoad', function (event, data) {
    if (!aSession.adventure.active || !aSession.adventure.steps.length)
        return;

    var step = aSession.adventure.currentStep();

    if (step && ((step.name === 'VisitAdventure' && aAdventure.info.isOnAdventure()) ||
                 (step.name === 'ReturnHome' && game.gi.isOnHomzone()))) {

        aUI.Alert("{0} Island Loaded!".format(
            step.name === 'VisitAdventure' ? 'Adventure' : 'Home'
        ), 'QUEST');

        aSession.adventure.action = '';  // Clear sub-state
        aSession.adventure.nextStep();   // Advance to next step
    }
});
```

### What Happens During Zone Transition

```
┌──────────────────────────────────────────────────────────────┐
│           Home → Adventure Zone Transition                   │
└──────────────────────────────────────────────────────────────┘

HOME ISLAND
│
├─ Step: SendGeneralsToAdventure
│  └─ Queue: sendGeneralsToAdventure for each general
│
├─ Step: VisitAdventure
│  └─ Queue: travelToZone (switch to adventure)
│
v
━━━━━━━━━━━━━━━━━ ZONE TRANSITION ━━━━━━━━━━━━━━━━━━━
│
│  Game Events:
│  1. Zone unload events fire
│  2. Map data cleared
│  3. New zone data loaded
│  4. FinishedZoneLoad event fires
│
v
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│
ADVENTURE ISLAND
│
├─ FinishedZoneLoad handler triggers
│  ├─ Detects VisitAdventure step complete
│  └─ Calls nextStep() → advance to AdventureTemplate
│
└─ Step: AdventureTemplate
   └─ Expects step.data to contain battle packet
```

### Potential State Loss Points

**Code Reference:** Memory leak fixes may have introduced queue/state clearing

1. **Zone unload handlers** - May clear global state
2. **Queue reset** - Queue might be cleared on zone change
3. **aSession reinitialization** - Adventure state may be reset
4. **Event handler unbinding** - Critical handlers may be removed

**⚠️ CRITICAL ISSUE:** If `aSession.adventure.steps` or queue is cleared during zone transition, all template data and pending actions are lost!

---

## Battle Plan Data Flow

### Template Creation

**Code Reference:** `user_auto.js:2335-2340, 2474-2479`

```javascript
// Template structure when created
{
  steps: [
    { name: 'InHomeLoadGenerals', file: LHTemp, data: aUtils.file.Read(LHTemp) },
    { name: 'StartAdventure' },
    { name: 'SendGeneralsToAdventure' }
  ].concat(aWindow.steps)  // aWindow.steps contains AdventureTemplate steps
}

// Adding a battle template step
const data = aUtils.file.Read(file.nativePath);  // Read battle packet from file
aWindow.steps.push({
  name: 'AdventureTemplate',
  file: file.nativePath,
  data: data  // ← Battle packet stored in step
});
```

### Battle Packet Structure

**Code Reference:** `5-battle.js:184-205`

```javascript
// Battle packet format (stored in step.data)
{
  "generalID1": {
    grid: 123,           // Target grid position
    army: {...},         // Army composition for this general
    target: 456,         // Attack target grid
    spec: <object>,      // [Added at runtime] Specialist game object
    onSameGrid: false,   // [Added at runtime] At target position?
    canMove: true,       // [Added at runtime] Can move?
    canSubmitMove: true  // [Added at runtime] Should move now?
  },
  "generalID2": { ... }
}
```

### Battle Data Usage Flow

```
┌──────────────────────────────────────────────────────────────┐
│              AdventureTemplate Step Execution                │
└──────────────────────────────────────────────────────────────┘

Step Executes
│
├─ Get step object: aSession.adventure.currentStep()
│
├─ Extract data: step.data (battle packet)
│
├─ Enhance data: battleLoadDataCheck(step.data)
│  ├─ Add runtime properties (spec, onSameGrid, canMove, etc.)
│  └─ Store in global: battlePacket = enhanced data
│
├─ Calculate state: newGetBattleState(battlePacket)
│  └─ Returns: { attackers: {...}, all: {...} }
│
└─ State Machine Loop:
   │
   ├─ action = 'move'
   │  ├─ Check: !attackerState.grid.onGrid
   │  ├─ Call: attemptMove() ──► Queue retranchGeneral/moveGeneral
   │  ├─ Wait: busy.travelling.length > 0
   │  └─ Transition: action = 'load'
   │
   ├─ action = 'load'
   │  ├─ Check: !attackerState.army.matched
   │  ├─ Call: attemptLoad() ──► Load troops to generals
   │  └─ Transition: action = 'attack'
   │
   └─ action = 'attack'
      ├─ Call: attemptAttack() ──► Queue attackCamp actions
      └─ Complete: result(msg, true) ──► nextStep()
```

### Data Dependencies

**⚠️ CRITICAL:** AdventureTemplate step **requires** `step.data` for every execution cycle!

**Code Reference:** `user_auto.js:6290-6296`

```javascript
AdventureTemplate: function () {
    aAdventure.army.updateArmy();
    const step = aSession.adventure.currentStep();
    battlePacket = battleLoadDataCheck(step.data);  // ← REQUIRES step.data!

    if (!battlePacket || !Object.keys(battlePacket).length)
        return aAdventure.auto.result("Invalid Template!");
    // ...
}
```

If `step.data` is `undefined` or `null`, the step returns "Invalid Template!" error.

---

## Key Data Structures

### aSession.adventure

**Code Reference:** `user_auto.js:86-164`

```javascript
aSession.adventure = {
    active: false,           // Is adventure automation running?
    index: 0,                // Current step index
    steps: [],               // Array of step objects
    action: '',              // Current sub-action ('move', 'load', 'attack')
    message: '',             // Status message
    interval: null,          // Execution interval timer

    // Methods
    currentStep: function () { ... },
    nextStep: function () { ... },
    start: function () { ... },
    stop: function () { ... }
}
```

### aQueue

**Code Reference:** `user_auto.js:460-493`

```javascript
aQueue = {
    active: [],              // Currently executing actions
    queue: [],               // Pending actions

    // Methods
    add: function (name, args) { ... },
    execute: function () { ... },

    // Action handlers
    actions: {
        sendGeneralsToAdventure: function (args) { ... },
        travelToZone: function (args) { ... },
        retranchGeneral: function (args) { ... },
        moveGeneral: function (args) { ... },
        // ... more actions
    }
}
```

### battlePacket (Global)

**Code Reference:** `user_auto.js:6292` (used globally within step execution)

```javascript
// Global variable set during AdventureTemplate execution
var battlePacket = {
    "generalID": {
        // Template data (from step.data)
        grid: 123,
        army: {...},
        target: 456,

        // Runtime data (added by battleLoadDataCheck)
        spec: <SpecialistObject>,
        onSameGrid: false,
        canMove: true,
        canSubmitMove: true
    }
}
```

---

## Known Issues

### Issue 1: Battle Plan Lost After Zone Transition ✅ FIXED

**Symptom:**
- Adventure starts successfully on home island
- Buffs may or may not apply
- Generals are sent to adventure map
- After arriving at adventure map: **nothing happens**
- Battle plan appears to be lost

**Root Cause Identified:**

The issue was caused by the memory leak fix in commit `07d73a8` which modified `aQueue.reset()` to clean up property observers. The problem flow:

1. Adventure starts, observers are registered in `init()` (line 6617-6629)
2. ZONE_REFRESHED observer is added to detect zone transitions
3. Queue completes its cycle and `aQueue.restart()` is called
4. `aQueue.restart()` calls `aQueue.run()` which calls `aQueue.reset()`
5. **`aQueue.reset()` removes ALL observers including ZONE_REFRESHED** (lines 242-249)
6. When zone transition occurs (home → adventure), the handler never fires
7. `VisitAdventure` step never advances because `zoneRefreshed()` is not called
8. Adventure gets stuck in "Waiting" state forever

**Code Location:**
- `user_auto.js:234-249` - aQueue.reset() was clearing observers
- `user_auto.js:1127-1144` - zoneRefreshed() handler that stops working
- `user_auto.js:6617-6629` - Observer initialization (only happens once)

**The Fix:**

Modified `aQueue.reset()` to NOT remove observers since they are global event handlers that need to persist across queue resets:

```javascript
reset: function () {
    aQueue.index = 0;
    aQueue.queue = [];
    if (game.aWatcherID) {
        clearInterval(game.aWatcherID);
        game.aWatcherID = null;
    }
    // NOTE: We do NOT clear observers here because they are global event handlers
    // that need to persist across queue resets (e.g., ZONE_REFRESHED for adventure transitions)
}
```

Added separate `aQueue.cleanup()` function for proper shutdown:

```javascript
cleanup: function () {
    // Clean up property observers
    aSession.observers.forEach(function (observer) {
        try {
            observer.channel.removePropertyObserver(observer.property, observer.tracker);
        } catch (e) {
            console.warn('Failed to remove observer: ' + e);
        }
    });
    aSession.observers = [];
    // ... cleanup resources
}
```

**Why This Works:**

- Observers are registered ONCE during application init
- They monitor game events globally (zone changes, battles, etc.)
- They should persist for the entire session
- `reset()` is called frequently during normal operation (every queue cycle)
- Removing observers on every reset breaks event-driven functionality
- `cleanup()` should only be called on application shutdown (if needed)

### Issue 2: Generals Not Sent to Star on Some Maps ⚠️ UNDER INVESTIGATION

**Symptom:**
- On some adventure maps, generals arrive at the map but are NOT sent to star
- The zone transition works correctly (Issue 1 is fixed)
- Generals remain at their landing position
- Battle sequence cannot proceed because generals are not at star

**Status:** Under investigation

**Possible Causes:**
- Landing field detection may be incorrect for certain maps
- `attemptMove()` conditions may not trigger correctly
- Grid position checks may fail on specific map layouts
- `canSubmitMove` calculation may be wrong for some scenarios

**Code Locations to Investigate:**
- `user_auto.js:5370-5396` - attemptMove() function
- `5-battle.js:184-205` - battleLoadDataCheck() and onSameGrid calculation
- Queue action `retranchGeneral` (lines 572-576)
- Landing field detection logic

---

### Issue 3: Troops Not Carried Back After Adventure ✅ FIXED

**Original Symptom:**
- Adventure completes successfully
- Generals return to home island with troops
- BUT some troops walk home on their own (2 hour travel time)
- Instead of being carried by troop carriers like Smuggler/Quartermaster (much faster)
- This significantly slows down automated adventure cycles

**Root Cause:**

The `LoadGeneralsToEnd` step had a critical timing issue in `user_auto.js:6410-6426`:

```javascript
aAdventure.army.updateArmy();  // Line 6418 - populate armyInfo.free

if (!Object.keys(armyInfo.free).length)  // Line 6420
    return aAdventure.auto.result("No unassigned units, ready to finish", true);

aAdventure.action.assignAllUnitsToFinish(armyInfo.free);  // Line 6423 - queue loads
return aAdventure.auto.result();  // Line 6424 - return immediately!
```

**The Problem:**
1. Step queues load operations for free troops (line 6423)
2. Returns immediately with `next: false` (line 6424) to wait
3. **Next cycle**: Checks `armyInfo.free` again (line 6418-6420)
4. But queued load operations haven't executed yet!
5. Two outcomes:
   - Troops still show as "free" → queues duplicate load operations
   - Or loads execute but aren't verified → step completes prematurely
6. Adventure closes before all troops loaded to carriers
7. Unloaded troops walk home alone (2 hour journey)

**How Adventure Return Actually Works:**
- Generals do NOT need to be explicitly sent home
- When adventure map closes (all steps complete), the game automatically returns generals
- Troops ON generals travel with them (fast, carrier speed)
- Troops NOT on generals walk home alone (slow, 2 hour default)
- The `LoadGeneralsToEnd` step MUST ensure ALL troops loaded before allowing map closure

**The Fix:**

**Code Reference:** `user_auto.js:6410-6428`

Changed line 6426 to properly wait and verify:

```javascript
aAdventure.action.assignAllUnitsToFinish(armyInfo.free);
// Wait for queued load operations to complete before re-checking
// Next cycle will verify armyInfo.free is empty after loads execute
return aAdventure.auto.result("Loading remaining troops to carriers", false, 2);
```

**Changes:**
1. Added status message: "Loading remaining troops to carriers"
2. Explicitly wait with `next: false` (step retries)
3. Added 2-second interval to allow loads to execute
4. Next cycle calls `updateArmy()` and verifies `armyInfo.free` is empty
5. Only advances when ALL troops confirmed loaded

**Pattern Reference:**
This follows the same pattern as `attemptLoad()` (`user_auto.js:5441-5443`):
- Queue load actions
- Return with `next: false` (wait/retry)
- Re-check on next cycle to verify completion

**Expected Behavior After Fix:**
1. `LoadGeneralsToEnd` detects free troops
2. Queues load operations to carriers
3. Waits with status message "Loading remaining troops to carriers"
4. Next cycle: Verifies all troops loaded (`armyInfo.free` empty)
5. Only then completes step → adventure closes
6. ALL troops carried back with carriers (fast travel)
7. No troops left to walk home alone

---

### Issue 4: GetGarrison() Check ✅ FIXED

**Original Symptom:**
- Generals at adventure cannot load troops because `GetGarrison()` returns null
- This blocked troop loading operations when generals were already deployed at star
- Army state check was too strict

**Root Cause:**

The garrison check was blocking valid troop loading operations. When generals are at the adventure map (not in home garrison), `GetGarrison()` returns null/falsy, which caused the system to block troop loading even when the general was idle and ready.

**Code Locations:**
- `user_auto.js:5367` - First location (getState function)
- `user_auto.js:5681` - Second location (newGetBattleState function)

**Original Code:**
```javascript
if (item.spec.GetTask() || !item.spec.GetGarrison())
    state.army.canSubmit = false;
```

**The Fix:**

Removed the `!item.spec.GetGarrison()` check. Now only blocks if the general has an active task (is busy):

```javascript
// Only block submission if general has an active task
// Allow loading even if not in garrison (could be at star already)
if (item.spec.GetTask())
    state.army.canSubmit = false;
```

**Why This Works:**
- Generals at adventure maps don't have a home garrison, so `GetGarrison()` is null
- The important check is `GetTask()` - whether the general is busy
- Idle generals (no active task) should be allowed to load troops regardless of location
- This allows proper troop loading after generals arrive at star position

**Related:**
- This fix was originally in commit `ec74a49` but was reverted in `b4bd2f4`
- Re-applied after fixing Issue 1 (observer persistence problem)
- Both checks needed to be updated for consistency

---

## Next Steps for Investigation

1. **Review memory leak fixes**
   - Check recent commits for queue/state clearing code
   - Identify what gets reset during zone transitions

2. **Add logging to zone transition**
   - Log `aSession.adventure.steps` before/after zone load
   - Track queue state during transitions
   - Monitor step.data persistence

3. **Test minimal adventure**
   - Single step that logs state after zone transition
   - Verify if ANY data survives the transition
   - Identify exact point where state is lost

4. **Examine FinishedZoneLoad handler**
   - Verify it fires when expected
   - Check if nextStep() is called correctly
   - Ensure no race conditions with state clearing

---

## Code References Quick Index

| Topic | File | Lines | Description |
|-------|------|-------|-------------|
| Step execution loop | user_auto.js | 1046-1118 | Main executeStep() function |
| Zone load handler | user_auto.js | 1127-1144 | FinishedZoneLoad event handler |
| AdventureTemplate step | user_auto.js | 6290-6346 | Main battle execution logic |
| Battle data check | 5-battle.js | 184-205 | battleLoadDataCheck() |
| Queue system | user_auto.js | 460-577 | aQueue implementation |
| Template creation | user_auto.js | 2335-2340, 2474-2479 | Template structure |
| attemptMove | user_auto.js | 5370-5396 | Send generals to star/positions |
| nextStep | user_auto.js | 1000-1044 | Step advancement |
| currentStep | user_auto.js | 993-998 | Get current step object |

---

*Last Updated: 2025-11-14*
*Issue Under Investigation: Battle plan lost after zone transition*
