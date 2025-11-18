# Auto Building System Architecture

## Overview

The Auto Building System is a core component of autoTSO that automatically manages production buildings in The Settlers Online. It handles starting, monitoring, and completing production orders across various building types, applying buffs, and managing production queues.

## Core Components

### 1. Building Settings Structure

Building settings are stored in `aSettings.defaults.Buildings.TProduction` and define the configuration for each production building.

**Location:** `user_auto.js:729-758`

```javascript
TProduction: {
    ProvisionHouse: { item: '', amount: 0, stack: 1, buff: '' },
    Barracks: { item: '', amount: 0, stack: 1, buff: '' },
    Bookbinder: { item: '', amount: 0, buff: '' },
    // ... other buildings
}
```

#### Field Definitions

- **`item`** (string): The production item name/ID to produce
  - Empty string means no production selected
  - Must match a valid production type for the building

- **`amount`** (number): Dual-purpose field
  - **Enable/Disable flag**: `0` = disabled, `>0` = enabled
  - **Production quantity**: For most buildings, specifies how many items to keep in the production queue
  - **Special case - Bookbinder**: Only used as enable/disable (always produces quantity of 1)

- **`stack`** (number, optional): Number of production slots to fill
  - Applies to buildings with multiple production queues
  - Not present in buildings with single queue (e.g., SiegeWorkshop)

- **`buff`** (string, optional): Production buff type to apply
  - Examples: speed buffs, quality buffs, etc.
  - Empty string means no buff

### 2. The Amount Field - A Critical Design Detail

The `amount` field serves **two purposes**:

1. **Enable/Disable Control** (all buildings)
   - `amount = 0`: Production disabled for this building
   - `amount > 0`: Production enabled for this building

2. **Quantity Control** (most buildings except Bookbinder)
   - Specifies how many production orders to maintain in the queue
   - The system ensures `amount` items are always in production

**Why this dual-purpose design?**
- Provides consistent enable/disable interface across all buildings
- Eliminates need for separate enable flag
- Simplifies UI and logic

**Important:** All production buildings MUST have the `amount` field. Missing this field will prevent the building from being managed by the auto system.

### 3. Settings Migration System

**Location:** `user_auto.js:830-841`

The migration system ensures backward compatibility when upgrading from older versions.

```javascript
migrate: function () {
    // Migrate old settings to ensure all production buildings have the amount field
    if (aSettings.Buildings && aSettings.Buildings.TProduction) {
        $.each(aSettings.Buildings.TProduction, function (buildingName, settings) {
            if (!settings.hasOwnProperty('amount')) {
                settings.amount = 0; // Default to disabled
            }
        });
    }
}
```

**When it runs:** Automatically called after settings are loaded from disk (in `aSettings.load()`)

**What it does:**
- Checks each production building configuration
- Adds missing `amount` field with default value of `0` (disabled)
- Ensures all buildings work with current code expectations

**Why it's needed:**
- Older saved settings may not have the `amount` field for all buildings
- Prevents runtime errors when accessing `settings.amount`
- Allows seamless upgrades without breaking existing configurations

### 4. Production Management Flow

**Location:** `user_auto.js:4620-4652`

The `aBuildings.manage()` function is the heart of the auto building system. It runs periodically to check and manage all production buildings.

#### Management Flow

```
1. Check if on home zone and Buildings automation is enabled
   └─> If not, exit

2. For each building in TProduction settings:
   a. Find the building instance in game
      └─> Get highest upgrade level if multiple exist

   b. Apply production buff if configured
      └─> Only if building doesn't already have buff
      └─> Only if production queue has items

   c. Check if production should run
      └─> Skip if no item selected OR amount = 0 (disabled)

   d. Handle building-specific production logic
      └─> Bookbinder: Special handling (see below)
      └─> Other buildings: Standard quantity management
```

#### Standard Production Logic

**Location:** `user_auto.js:4647-4649`

```javascript
const inProgress = aBuildings.production.inProgress(building.productionQueue.mProductionType, settings.item);
if (settings.amount > inProgress)
    aQueue.add('startProduction', [settings.item, settings.amount, true, settings.stack, building.GetGrid()]);
```

**How it works:**
1. Count how many of the selected item are currently in production
2. If fewer than `amount` are in progress, start more production
3. Uses production queue to ensure continuous production

#### Bookbinder Special Handling

**Location:** `user_auto.js:4634-4645`

Bookbinder requires special logic because books (skill points) don't support quantity-based production.

```javascript
if (name === 'Bookbinder') {
    // Bookbinder special handling: books don't support quantity, only enable/disable
    if (TP[0]) {
        // Complete existing production
        var productionVO = TP[0].GetProductionOrder().GetProductionVO();
        if (productionVO.producedItems === 1)
            aQueue.add('completeProduction', [2, productionVO.type_string]);
    } else {
        // Start new production if enabled and no production exists
        aQueue.add('startProduction', [settings.item, 1, true, 1, building.GetGrid()]);
    }
    return;
}
```

**Why special handling?**
- Books use production queue type 2 (different from regular items)
- Books always produce exactly 1 item (no quantity support)
- Book production levels are based on total produced, not queue size
- The `amount` field only controls enable/disable, not quantity

**Logic flow:**
1. If production exists: Complete it when done (producedItems === 1)
2. If no production exists: Start new production with quantity = 1
3. The `amount` field is only checked for enable/disable (line 4633)

### 5. User Interface Integration

#### Settings UI

**Location:** `user_auto.js:2970-2980`

The enable/disable checkbox is automatically generated for buildings with the `amount` field:

```javascript
if (sObj.hasOwnProperty('amount')) {
    var createSwitch = function (id, checked) {
        return $('<label>', { 'class': 'switch' }).append([
            $('<input>', { 'type': 'checkbox', 'id': id, 'checked': checked }),
            $('<span>', { 'class': 'slider round' })
        ]);
    };
    html.push(createTableRow([
        [9, 'Enable Production'],
        [3, createSwitch('enableProduction', sObj.amount > 0)]
    ]));
}
```

#### Saving Settings

**Location:** `user_auto.js:2955-2958`

When user saves building settings:

```javascript
if (sObj.hasOwnProperty('amount')) {
    var enabled = aWindow.withsBody('#enableProduction').is(':checked');
    aSettings.defaults.Buildings.TProduction[buildingName].amount = enabled ? 1 : 0;
}
```

**Note:** For buildings with quantity support, the actual quantity value may be set separately. The checkbox sets it to 1 (enabled) or 0 (disabled).

### 6. Production Queue System

The game manages production through `building.productionQueue`:

```javascript
const TP = building.productionQueue.mTimedProductions_vector;
```

**Properties:**
- `mTimedProductions_vector`: Array of current production orders
- `mProductionType`: Type identifier for production category
- Each production has `GetProductionOrder()` and `GetProductionVO()` methods

**Production Types:**
- Type 0-1: Regular item production (weapons, tools, provisions)
- Type 2: Books/skill points (Bookbinder)
- Type 3+: Special productions (units, etc.)

### 7. Queue Management

Production orders are added to a queue system that ensures actions are executed in sequence:

```javascript
aQueue.add('startProduction', [item, amount, auto, stack, grid]);
aQueue.add('completeProduction', [productionType, itemName]);
aQueue.add('applyBuff', {what: 'BUILDING', type: buff, grid: grid, building: name});
```

This prevents race conditions and ensures proper order of operations.

## Adding New Buildings

To add a new production building to the auto system:

1. **Add building configuration** in `aSettings.defaults.Buildings.TProduction`:
   ```javascript
   NewBuilding: { item: '', amount: 0, stack: 1, buff: '' }
   ```

2. **Determine required fields:**
   - Always include: `item`, `amount`
   - Include `stack` if building supports multiple production slots
   - Include `buff` if building supports production buffs
   - Omit `stack` if single queue only

3. **Add special handling if needed** in `aBuildings.manage()`:
   - Most buildings work with standard logic automatically
   - Only add special cases if production mechanics differ significantly
   - Document why special handling is needed

4. **Test the building:**
   - Verify enable/disable checkbox appears in UI
   - Test that production starts when enabled
   - Verify production completes and restarts automatically
   - Test backward compatibility with old settings

## Common Pitfalls

### 1. Missing Amount Field
**Problem:** Building doesn't have `amount` field in settings
**Symptom:** No enable/disable checkbox, production never starts
**Solution:** Add `amount: 0` to building configuration

### 2. Undefined Amount Check
**Problem:** Checking `settings.amount === 0` when amount is undefined
**Symptom:** Building bypasses enable check but fails quantity check
**Solution:** Migration system adds amount field to all buildings on load

### 3. Quantity vs Enable/Disable
**Problem:** Confusing the dual purpose of the amount field
**Symptom:** Bookbinder or similar buildings don't work correctly
**Solution:** Use amount > 0 for enable check, but respect building's production limits

### 4. Production Type Mismatch
**Problem:** Using wrong production queue type
**Symptom:** Production fails to start or complete
**Solution:** Check building's `productionQueue.mProductionType` and use appropriate completion type

## Migration History

### Version 2.0.4 (2025-01-18)
- **Issue:** Bookbinder lacked `amount` field, preventing enable/disable functionality
- **Solution:**
  - Added `amount: 0` to Bookbinder default settings
  - Implemented `aSettings.migrate()` function for backward compatibility
  - Updated Bookbinder production logic to start new production when enabled
- **Impact:** All users with old settings automatically upgraded on next load

## Future Considerations

### Potential Improvements
1. **Separate enable flag:** Consider splitting enable/disable from quantity
   - Pros: Clearer data model, more explicit
   - Cons: More complex UI, backward compatibility challenges

2. **Building templates:** Support for saving/loading building configurations
   - Would need to migrate templates as well as main settings

3. **Production priorities:** Allow users to set priority order for buildings
   - Could optimize production scheduling across multiple buildings

### Backward Compatibility Strategy
When making future changes:
1. Always add migration logic in `aSettings.migrate()`
2. Test with both new and old settings formats
3. Document migration in this file
4. Preserve old functionality when possible

## Related Files

- `user_auto.js:729-758` - Building settings defaults
- `user_auto.js:825-841` - Settings load and migration
- `user_auto.js:2955-2980` - Building settings UI
- `user_auto.js:4620-4652` - Production management logic
- `user_auto.js:4467-4476` - Book production helpers

## Questions & Troubleshooting

**Q: Why doesn't my building show an enable/disable checkbox?**
A: The building is missing the `amount` field in its settings configuration. Add it with default value `0`.

**Q: Production keeps starting even when disabled?**
A: Check that `settings.amount === 0` check happens before production logic. The migration should prevent this issue.

**Q: How do I add a building that produces multiple item types?**
A: Currently, the system supports one item type per building. For multi-item buildings, you may need custom logic similar to Bookbinder.

**Q: Can I change the default quantity for a building?**
A: Yes, but remember `amount: 0` means disabled. Use `amount: 1` or higher for enabled with that quantity.

**Q: What happens to old settings when upgrading?**
A: The `migrate()` function automatically adds missing fields with safe defaults (amount: 0 = disabled).
