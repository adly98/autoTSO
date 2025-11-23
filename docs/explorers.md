# Explorer Event Optimization

## Overview

The explorer event optimization algorithm automatically selects the best treasure search task for each explorer during active events to maximize event item collection efficiency.

## How It Works

### The Goal

Find the treasure search task that yields the **most event items per hour** for each explorer.

### The Formula

```
value = (treasureValue × itemModifier) / duration
```

Where:
- `treasureValue` = Expected event items per search (from event data)
- `itemModifier` = Loot multiplier from explorer skills (typically 1.0)
- `duration` = Search time in hours (after skills and time bonuses)

### The Process

1. **Evaluate all treasure search tasks**
   - Short (subTaskID: 0)
   - Medium (subTaskID: 1)
   - Long (subTaskID: 2)
   - EvenLonger (subTaskID: 3)
   - Prolonged (subTaskID: 6, task index: 4)

2. **For each task, calculate**:
   - Base duration from game definition
   - Apply explorer skill modifiers for search time
   - Apply specialist time bonus
   - Convert to hours: `Math.round((duration / timeBonus) / 360) / 100`
   - Get treasure value from event array
   - Calculate efficiency value

3. **Select the task with highest value**

## Example Calculation

From actual logs during HW event:

### Treasure Values
Event data: `[2.6, 3.9, 6.5, 11.8, 15.6]`

### Task Evaluation

| Task | SubTaskID | Base Duration | Modified Duration | Treasure Value | Efficiency (items/hour) | Winner |
|------|-----------|---------------|-------------------|----------------|------------------------|--------|
| Short | 0 | 21,600,000 | 1.2h | 2.6 | **2.167** | ✓ |
| Medium | 1 | 43,200,000 | 2.4h | 3.9 | 1.625 | |
| Long | 2 | 86,400,000 | 4.8h | 6.5 | 1.354 | |
| EvenLonger | 3 | 172,800,000 | 9.6h | 11.8 | 1.229 | |
| Prolonged | 6 | 259,200,000 | 14.4h | 15.6 | 1.083 | |

### Why Short Wins

The treasure values represent **expected items per search**, not per hour. While Prolonged searches give more total items (15.6 vs 2.6), they take proportionally longer:

- Short: 2.6 items / 1.2 hours = **2.17 items/hour**
- Prolonged: 15.6 items / 14.4 hours = **1.08 items/hour**

You can run **12 Short searches** in the time it takes to do 1 Prolonged search, yielding **31.2 items** vs **15.6 items**.

## Skill Modifiers

The algorithm considers two types of explorer skills:

### 1. Search Time Modifiers
```javascript
if (skillDef.modifier_string.toLowerCase() === 'searchtime') {
    duration = skillDef.value !== 0 ? skillDef.value : ((duration * skillDef.multiplier) + skillDef.adder);
}
```

Skills that reduce search duration make all tasks complete faster.

### 2. Loot Table Roll Modifiers
```javascript
else if (skillDef.modifier_string.toLowerCase() === 'changeloottablerolls') {
    itemModifier = skillDef.multiplier > itemModifier ? skillDef.multiplier : itemModifier;
}
```

Skills that increase loot rolls boost the treasure value proportionally.

## Configuration

Enable/disable in settings:
```javascript
aSettings.defaults.Explorers.eventOptimize = true/false
```

When disabled, explorers use:
1. Template assignments (if `useTemplate` is enabled)
2. Default tasks by explorer type (from `mainSettings.explDefTaskByType`)

## Data Source

Treasure values come from `aEvents.treasureItems[eventCode]`, populated when events are loaded. Each event has its own array of 5 values corresponding to the 5 task types.

## Debugging

Enable debug logging by searching console for `[EVENT-OPTIMIZE]` entries. The logs show:
- Explorer details
- Event name
- Available treasure values
- Each task evaluation with calculations
- Final decision

## Code Location

Implementation: `user_auto.js:4369-4430` in the `manageExplorers` function.
