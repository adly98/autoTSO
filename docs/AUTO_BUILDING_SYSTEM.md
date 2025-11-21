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

- **`amount`** (number): Enable/disable flag and queue management
  - **UI usage**: `0` = disabled, `1` = enabled (user can only toggle on/off)
  - **Script usage**: Can be set to higher values for automated quest/task management
  - The UI never exposes queue slot configuration - that's handled by the script
  - Example: UI sets `amount: 1` when enabled, but quest automation might set `amount: 5` internally

- **`stack`** (number, optional): Items per queue slot
  - Specifies how many items to produce in each queue slot
  - Default: 1 if not specified
  - Example: `stack: 5` means each queue slot produces 5 items
  - Combined with amount: `amount: 2, stack: 5` = 2 queue slots × 5 items each = 10 total items

- **`buff`** (string, optional): Production buff type to apply
  - Examples: speed buffs, quality buffs, etc.
  - Empty string means no buff

### 2. Understanding Amount and Stack Fields

The `amount` and `stack` fields work together to control production:

#### Amount Field - Two Different Contexts

**In the UI (User-facing):**
- Simple boolean: enabled (1) or disabled (0)
- Users cannot configure queue slots through the UI
- The UI dialog is for continuous production: "produce item Y indefinitely until I say stop"

**In the Script (Internal automation):**
- Can be set to any value for automated quest/task management
- Example: Quest requires 50 items → script sets `amount: 5, stack: 10` temporarily
- After quest completes, returns to user's settings (`amount: 1` if enabled)

#### Stack Field

- **Items per production run**: Controls how many items each production run produces
- Max typically 15-25 depending on building/item
- User configures this via "Items per run" dropdown in UI

#### Examples

**User Configuration (via UI):**
```javascript
{ item: 'Manuscript', amount: 1, stack: 5, buff: 'barazek' }
```
- Enabled with 5 items per run
- Script maintains 1 queue slot continuously

**Script Automation (quest handling):**
```javascript
{ item: 'Sword', amount: 10, stack: 1, buff: '' }
```
- Script temporarily sets 10 queue slots for quest
- Produces 10 swords total, then reverts to user settings

**Why this design?**
- **UI simplicity**: Users just enable/disable and set items per run
- **Script flexibility**: Automation can use queue slots for efficiency
- **Clear separation**: Dialog is for continuous production, scripts handle complex automation

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

#### Settings UI Structure

**Location:** `user_auto.js:2981-3027`

The building settings dialog presents a simple, streamlined interface focused on continuous production:

**Description:** "Enable/disable production of the item below. Buff is applied during production. Items per run can be configured where supported."

**Fields:**

**1. Enable Production** (Checkbox)
- Simple on/off toggle for continuous production
- When disabled, `amount` is set to 0
- When enabled, `amount` is set to 1 (one queue slot)
- Queue management beyond this is handled internally by the script

**2. Item** (Dropdown)
- Selects which item to produce continuously
- Saved to `settings.item`

**3. Items per run** (Dropdown: 1-25)
- Only visible for buildings with `stack` field
- Specifies how many items each production run produces
- Saved to `settings.stack`
- Limited by game mechanics (typically max 15-25)

**4. Buff** (Dropdown)
- Optional production buff to apply during production
- Saved to `settings.buff`
- Only shown for buildings that support buffs

#### UI Design Principles

- **Simplicity**: No queue slot configuration - that's for script automation
- **Continuous production focus**: Dialog is about "produce Y indefinitely"
- **Contextual**: Only shows fields relevant to the building type
- **Separation of concerns**: Users configure continuous production, scripts handle complex automation

#### Saving Settings

**Location:** `user_auto.js:2965-2980`

When user saves building settings:

```javascript
if (sObj.hasOwnProperty('amount')) {
    var enabled = aWindow.withsBody('#enableProduction').is(':checked');
    var queueSlots = parseInt(aWindow.withsBody('#queueSlots').val()) || 1;
    aSettings.defaults.Buildings.TProduction[buildingName].amount = enabled ? queueSlots : 0;
}
if (sObj.hasOwnProperty('stack'))
    aSettings.defaults.Buildings.TProduction[buildingName].stack = parseInt(aWindow.withsBody('#itemsPerSlot').val());
```

**Key Changes:**
- When enabled, `amount` is always set to 1 (one queue slot for continuous production)
- When disabled, `amount` is set to 0
- Queue slot management beyond 1 is handled by script automation, not the UI
- Stack controlled via `#itemsPerRun` field

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

#### Issue 1: Bookbinder Missing Amount Field
- **Problem:** Bookbinder lacked `amount` field, preventing enable/disable functionality
- **Solution:**
  - Added `amount: 0` to Bookbinder default settings
  - Implemented `aSettings.migrate()` function for backward compatibility
  - Updated Bookbinder production logic to start new production when enabled
- **Impact:** All users with old settings automatically upgraded on next load

#### Issue 2: Amount/Stack Parameter Calculation Bug
- **Problem:** Production buildings (e.g., ProvisionHouse2) weren't calculating total items correctly
  - Settings: `amount: 1, stack: 5` (expected 5 items total)
  - Actual: Only 1 item produced
  - Root cause: `manage()` was passing `settings.amount` directly instead of `settings.amount * settings.stack`
- **Solution:**
  - Fixed line 4649 in `manage()` function to calculate total items: `settings.amount * settings.stack`
  - Updated documentation to clarify `amount` = queue slots, `stack` = items per slot
- **Files Changed:**
  - `user_auto.js:4649` - Fixed parameter calculation
  - `docs/AUTO_BUILDING_SYSTEM.md` - Enhanced documentation with examples
- **Impact:** Buildings now correctly produce `amount × stack` total items

#### Issue 3: Confusing UI for Building Settings
- **Problem:** The settings UI was confusing and exposed unnecessary complexity
  - Enable Production checkbox setting queue slots was misleading
  - Users don't need queue slot configuration - that's for script automation
  - Dialog mixed continuous production (user concern) with queue management (script concern)
  - Too verbose with unnecessary information
- **Solution:** Radically simplified building settings dialog:
  - **Removed queue slots from UI entirely** - script handles this internally
  - **Enable Production**: Simple on/off toggle (sets amount to 1 or 0)
  - **Items per run**: How many items per production run (max 15-25 typically)
  - **Simplified description**: Single line explaining continuous production concept
  - **Clear separation**: Dialog for continuous production, script uses `amount` field for automation
- **Files Changed:**
  - `user_auto.js:2965-3080` - Redesigned settings UI, removed queue slots
  - `docs/AUTO_BUILDING_SYSTEM.md` - Documented UI/script separation
- **Impact:**
  - Much simpler dialog focused on continuous production
  - No confusion about queue slots vs items per run
  - Script can still use `amount` field for quest/task automation
  - Clear mental model: "produce item Y indefinitely until I say stop"

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
