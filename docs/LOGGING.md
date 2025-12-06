# Logging System

AutoTSO includes a comprehensive logging system for debugging and monitoring automation activities.

## Overview

The logging system consists of two components:

1. **Console File Logger** (`aConsoleLogger`) - Writes all console output to rotating log files
2. **Debug Logger** (`aDebug`) - Category-based debug logging for specific subsystems

## Configuration

All logging settings are accessible via the in-game Settings modal.

### File Logging Settings

Located under `aSettings.defaults.Auto.Logging`:

| Setting | Default | Description |
|---------|---------|-------------|
| `logToFile` | `true` | Enable/disable writing logs to file |
| `maxLogFileSize` | `5000` | Maximum log file size in KB before rotation (0 = no rotation) |
| `keepRotatedLogs` | `3` | Number of rotated log files to keep |

### Debug Logging Settings

Located under `aSettings.defaults.Debug`:

| Setting | Default | Description |
|---------|---------|-------------|
| `enable` | `true` | Master switch for all debug logging |
| `Adventures` | `true` | Log adventure queue and step transitions |
| `Combat` | `true` | Log battle events and casualties |
| `Geologists` | `true` | Log geologist dispatch and return events |
| `Explorers` | `true` | Log explorer activities |

## Log File Location

Log files are stored in:
```
<application_directory>/auto/logs/console.log
```

When rotation occurs, older logs are renamed:
- `console.log` (current)
- `console.log.1` (previous)
- `console.log.2` (older)
- `console.log.3` (oldest, if `keepRotatedLogs` >= 3)

## Log Format

Each log entry follows this format:
```
[TYPE] [YYYY-MM-DD HH:MM:SS] message
```

Example:
```
[LOG] [2024-01-15 14:32:01] nextStep: Advancing from step 2 : LoadUnits
[LOG] [2024-01-15 14:32:01] nextStep: New index: 3 , next step: VisitAdventure
```

## Using Debug Logging

### In Code

Use `aDebug.log()` with a category as the first argument:

```javascript
aDebug.log('adventure', 'Starting adventure:', adventureName);
aDebug.log('combat', 'Battle finished, casualties:', casualties);
aDebug.log('geologists', 'Dispatching geologist to zone:', zoneId);
aDebug.log('explorers', 'Explorer returned with treasures');
```

### Checking if Logging is Enabled

```javascript
if (aDebug.isEnabled('adventure')) {
    // Perform expensive logging operation
    aDebug.log('adventure', 'Detailed state:', JSON.stringify(state));
}
```

## Log Rotation

Log rotation is triggered automatically when:
1. A new log entry is written
2. The current log file exceeds `maxLogFileSize` (in KB)

The rotation process:
1. Delete the oldest rotated log if at the limit
2. Shift existing logs (`.1` -> `.2`, `.2` -> `.3`, etc.)
3. Rename current log to `.1`
4. Continue writing to a fresh `console.log`

Set `maxLogFileSize` to `0` to disable rotation entirely.

## Troubleshooting

### Logs not appearing

1. Verify `Auto.Logging.logToFile` is `true`
2. Check that the `auto/logs/` directory is writable
3. Ensure `Security.validateFilePaths` isn't blocking the log path

### Debug messages missing

1. Verify `Debug.enable` is `true`
2. Check the specific category flag (e.g., `Debug.Adventures`)
3. Confirm you're using the correct category string in `aDebug.log()`

### Log files growing too large

1. Reduce `maxLogFileSize` to trigger more frequent rotation
2. Reduce `keepRotatedLogs` to retain fewer old logs
3. Disable verbose categories you don't need
