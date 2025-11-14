# Memory Leak Analysis Report for user_auto.js

**Date:** 2025-11-14
**File:** user_auto.js (6,601 lines)
**Analysis:** Comprehensive review of potential memory leaks

---

## Console Polyfill

**Important:** Adobe AIR runtime does not have a built-in `console` object. This project includes a console polyfill that provides:

- `console.log()` - Outputs `[LOG] message`
- `console.info()` - Outputs `[INFO] message`
- `console.error()` - Outputs `[ERROR] message`
- `console.warn()` - Outputs `[WARN] message`

All console methods internally call the `debug()` function with appropriate prefixes. Use these methods instead of calling `debug()` directly for consistent, categorized logging throughout the application.

---

## HIGH SEVERITY ISSUES

### 1. Event Listeners Never Removed (Lines 1060, 1066, 1483, 2442)

#### Line 1060-1061:
```javascript
var file = new air.File();
file.browseForOpen("Select a Template");
file.addEventListener(air.Event.SELECT, callback);
```

**Why it's a memory leak:**
The event listener is attached to the `file` object but never removed. If this function is called multiple times (which appears possible from the UI interactions), multiple listeners accumulate.

**Fix:**
```javascript
var file = new air.File();
file.browseForOpen("Select a Template");
var selectHandler = function(event) {
    file.removeEventListener(air.Event.SELECT, selectHandler);
    callback(event);
};
file.addEventListener(air.Event.SELECT, selectHandler);
```

---

#### Line 1066:
```javascript
file.addEventListener(air.Event.COMPLETE, (function (t) {
    if (mainSettings.changeTemplateFolder) {
        var a = {};
        a["autoAdvlastDir"] = t.target.parent.nativePath,
        mainSettings["autoAdvlastDirlastDir"] = t.target.parent.nativePath,
        settings.store(a);
    };
}))
```

**Why it's a memory leak:**
Event listener added but never removed, and it captures the entire closure context.

**Fix:**
Remove the listener after it executes, or use a once-only listener pattern.

---

#### Line 1483:
```javascript
window.nativeWindow.stage.addEventListener("click", auto.generateGrid);
```

**Why it's a memory leak:**
While there's a corresponding `removeEventListener` at line 1488, the removal uses a hardcoded event code `64` instead of the string "click", which means they don't match and the listener is never actually removed.

```javascript
// Line 1488 - INCORRECT removal
window.nativeWindow.stage.removeEventListener(64, auto.generateGrid);
```

**Fix:**
```javascript
// Use consistent event identifier
window.nativeWindow.stage.removeEventListener("click", auto.generateGrid);
```

---

#### Line 2442:
```javascript
root.addEventListener(window.runtime.flash.events.FileListEvent.SELECT_MULTIPLE, function (event) {
    event.files.forEach(function (file) {
        const data = aUtils.file.Read(file.nativePath);
        if (!data) return alert('Invalid file');
        aWindow.steps.push({ name: 'AdventureTemplate', file: file.nativePath, data: data });
    });
    aUI.modals.adventure.TM_UpdateView();
});
```

**Why it's a memory leak:**
Anonymous event handler is added but never removed, and it captures `aWindow` in closure.

**Fix:**
Remove listener after use or use a named function that can be properly removed.

---

### 2. Unchecked setInterval That May Not Be Cleared (Line 573)

#### Line 573:
```javascript
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
```

**Why it's a memory leak:**
This interval runs every 30 seconds indefinitely. While there's a check `if (game.aWatcherID) return;` at line 572, there's no code anywhere that calls `clearInterval(game.aWatcherID)`. The interval will run for the entire lifetime of the application, holding references to `aQueue`, `aUI`, etc.

**Fix:**
Add cleanup logic when stopping automation or provide a way to clear this interval.

---

### 3. Property Observers Never Removed (Lines 6556-6560)

#### Lines 6556-6560:
```javascript
game.gi.channels.ZONE.addPropertyObserver(
    "ZONE_REFRESHED", game.getTracker('zRefresh', aUtils.trackers.zoneRefreshed)
);
game.gi.channels.SPECIALIST.addPropertyObserver(
    "generalbattlefought", game.getTracker('battleFinished', aUtils.trackers.battleFinished)
);
```

**Why it's a memory leak:**
Property observers are added but never removed. There's no corresponding `removePropertyObserver` anywhere in the code. These observers will persist for the application lifetime, preventing garbage collection of the tracker functions and their closures.

**Fix:**
Add cleanup logic to remove observers when the automation is stopped or the application is closed.

---

## MEDIUM SEVERITY ISSUES

### 4. jQuery Event Handlers Without Cleanup (Multiple locations: 1952-2538)

**Examples:**
```javascript
// Line 1952
aWindow.withBody('#aAdventure_TemplateMaker').click(function () { aUI.modals.adventure.templateMaker(); });

// Line 1962
aWindow.withBody('.buildingSettings').click(function () {
    aUI.modals.buildingSettings($(this).attr('id').replace('aBuildings_', ''));
});

// Line 2437
aWindow.sFooter().find('.dropdown-menu a').click(function () { ... });

// Line 2538
$('#aAdventureModal').on('click', '#aAdventureToggle', function () { ... });
```

**Why it's a memory leak:**
Multiple jQuery event handlers are attached throughout the code (410+ jQuery calls total), but there's no code that removes these handlers. If modals/windows are recreated, old event handlers remain attached to detached DOM nodes, preventing garbage collection.

**Fix:**
- Use `.off()` or `.unbind()` before re-attaching handlers
- Use event delegation on parent containers that persist
- Clear handlers when modals are closed

---

### 5. Unbounded Array Growth in Session State (Lines 80-86, 616-617)

#### Lines 80-86:
```javascript
mail: {
    monitor: new Date().getTime(),
    pendingTrades: {},    // ← Can grow unbounded
    pendingInvites: {},   // ← Can grow unbounded
    lootMails: game.def("mx.collections::ArrayCollection", !0)
},
adventure: {
    name: null,
    lostArmy: {},         // ← Can grow unbounded
```

**Why it's a memory leak:**
These objects accumulate data over time. While `pendingTrades` has entries deleted at line 4681, `pendingInvites` only has deletions in specific code paths. If the application runs for extended periods, these could grow significantly.

#### Lines 616-617:
```javascript
Adventures: {
    speedBuff: "GeneralSpeedBuff_Bronze",
    blackVortex: false,
    templates: [],        // ← Can grow unbounded
    lastAdv: {},
```

**Why it's a memory leak:**
The `templates` array can grow as users add adventure templates, but there's no upper limit or cleanup of old templates.

**Fix:**
- Implement periodic cleanup of old/stale entries
- Add size limits with LRU eviction
- Clear completed/expired entries

---

### 6. setTimeout Callbacks Without Proper Cleanup (Lines 225, 295, 321)

#### Lines 225, 295, 321:
```javascript
// Line 225
game.auto.aQueueIDs.push(setTimeout(function () { aQueue.next() }, delay || aQueue.delay));

// Line 295
game.auto.aQueueIDs.push(setTimeout(aQueue.restart, TIMEOUTS.QUEUE_RESTART_DELAY));

// Line 321
game.auto.aQueueIDs.push(setTimeout(function () { aQueue.next(); }, next.delay || aQueue.delay));
```

**Why it's a memory leak:**
While there is cleanup logic at lines 270-277, the `game.auto.aQueueIDs` array can grow large if many timeouts are scheduled rapidly. Additionally, the closure in the anonymous functions captures the surrounding scope.

**Mitigation:**
The `clearIDs` function at line 270-277 does clean these up, which is good. However, there's a potential race condition where the array could grow very large between cleanup calls.

---

### 7. Closure Memory Retention in Responders (Lines 1248-1330)

#### Lines 1263-1300:
```javascript
sendOfficeTrades: function () {
    return game.createResponder(function (e, d) {
        try {
            const data = d.data.data;
            var nextSlot = aTrade.office.nextSlotType(data);
            var nextCoinSlotPos = game.gi.mHomePlayer.mTradeData.getNextFreeSlotForType(2);
            $.each(aTrade.office.trades, function (key, trade) {
                // ... nested closures
                aTrade.send(data, function () {
                    try {
                        var k = key;
                        aTrade.office.trades[k].Live = true;
                    } catch (e) { debug(e) }
                });
            });
        } catch (e) { }
    });
},
```

**Why it's a memory leak:**
Multiple nested closures that capture variables from outer scopes. The responder functions are created frequently but may hold references to large objects longer than necessary. Each closure captures the entire scope chain.

**Fix:**
- Minimize closure scope by extracting functions
- Explicitly null out references when done
- Avoid nested closures where possible

---

## LOW SEVERITY ISSUES

### 8. Global Namespace Pollution (Lines 19, 50-56, 59-161)

#### Lines 19, 59-161:
```javascript
var AdventureManager = game.def("com.bluebyte.tso.adventure.logic::AdventureManager").getInstance();

const aSession = { ... };
const aQueue = { ... };
const aSettings = { ... };
```

**Why it's a concern:**
Multiple global variables and constants are created that persist for the application lifetime. While not strictly a leak, they prevent any contained objects from being garbage collected.

**Mitigation:**
This is acceptable for an application-level singleton pattern, but awareness is important.

---

### 9. Potential Memory Growth in Trade Office (Lines 4720-4722, 4727, 1289, 1297)

#### Lines 4720-4722:
```javascript
office: {
    trades: {},           // ← Can grow unbounded
    coinSlots: [],
```

#### Lines 1289, 1297:
```javascript
// Line 1289
aTrade.office.coinSlots.push(nextCoinSlotPos);

// Line 1297 - Good! Array is cleared
aTrade.office.coinSlots = [];
```

**Why it's a minor concern:**
The `coinSlots` array is properly cleared at line 1297. However, `aTrade.office.trades` can accumulate trade data without cleanup.

**Fix:**
Implement periodic cleanup of completed/expired trades.

---

### 10. Commented Out setInterval (Lines 6581-6596)

#### Lines 6581-6596:
```javascript
// aSession.tickMonitor = setInterval(function () {
//     if (game.gi.mGameTickCommand_vector.length > 1) {
//         $.each(game.gi.mGameTickCommand_vector, function (i, tick) {
//             ...
//         });
//     }
// }, 2000);
```

**Why it's noted:**
This is commented out, so it's not currently a leak, but if uncommented without proper cleanup, it would become a high-severity leak.

---

## SUMMARY

### Critical Issues to Address:
1. ✅ Fix event listener removal mismatch (line 1488) - use "click" instead of 64
2. ✅ Add cleanup for `game.aWatcherID` interval (line 573)
3. ✅ Remove property observers when stopping automation (lines 6556-6560)
4. ✅ Add cleanup for file event listeners (lines 1060, 1066, 2442)

### Recommended Improvements:
1. Implement a cleanup/shutdown method that removes all event listeners and intervals
2. Add `.off()` calls before re-attaching jQuery event handlers
3. Implement size limits or periodic cleanup for `aSession.mail.pendingTrades`, `pendingInvites`, and `templates` arrays
4. Consider extracting nested closures to reduce scope capture

### Positive Findings:
- The `clearIDs` function properly cleans up setTimeout references
- `coinSlots` array is properly cleared after use
- Most interval IDs are stored for later cleanup (though cleanup isn't always called)
