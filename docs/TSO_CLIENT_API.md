# TSO Client JavaScript API Documentation

## Table of Contents
1. [Adobe AIR File System APIs](#adobe-air-file-system-apis)
2. [Game Object APIs](#game-object-apis)
3. [Localization APIs](#localization-apis)
4. [UI and Modal APIs](#ui-and-modal-apis)
5. [Utility Functions](#utility-functions)
6. [Working Examples](#working-examples)

---

## Adobe AIR File System APIs

### Available Directory Paths

Adobe AIR provides several predefined directory locations for file operations:

```javascript
// Application installation directory (READ-ONLY in most cases)
air.File.applicationDirectory

// Application storage directory (WRITABLE)
air.File.applicationStorageDirectory

// User's documents directory (WRITABLE)
air.File.documentsDirectory

// User's desktop directory (WRITABLE)
air.File.desktopDirectory

// User's home directory (WRITABLE)
air.File.userDirectory
```

#### Important Notes on Directory Access:
- **applicationDirectory**: This is where the app is installed. On macOS/Windows, this is typically READ-ONLY for security reasons. You can read files but NOT write to subdirectories in production builds.
- **applicationStorageDirectory**: This is the RECOMMENDED location for app data. It's writable and persistent.
- **documentsDirectory**: User's documents folder, writable but visible to user.

### File Object API

#### Creating File References

```javascript
// Method 1: Direct path
var file = new air.File(nativePath);

// Method 2: Resolve from a base directory
var file = air.File.applicationDirectory.resolvePath("userscripts/myfile.js");

// Method 3: Resolve relative path
var settingsFile = air.File.applicationStorageDirectory.resolvePath("settings.json");

// Get native path
var path = file.nativePath;
```

#### File Properties

```javascript
file.exists          // Boolean - does file exist?
file.size           // Number - file size in bytes
file.nativePath     // String - OS-specific file path
file.name           // String - file name without path
file.parent         // File - parent directory
file.isDirectory    // Boolean - is this a directory?
```

#### File Operations

```javascript
// Check if file exists
if (file.exists) {
    // File exists
}

// Delete file
file.deleteFile();

// Move/rename file
file.moveTo(newFile, overwrite);

// Copy file
file.copyTo(newFile, overwrite);

// Get directory listing
var files = directory.getDirectoryListing();
files.forEach(function(item) {
    console.log(item.name);
});
```

#### File Browser Dialogs

```javascript
// Browse for file to open
var file = new air.File();
file.browseForOpen("Select a file");
file.addEventListener(air.Event.SELECT, function(event) {
    var selectedFile = event.target;
    console.log("Selected:", selectedFile.nativePath);
});

// Browse for multiple files
var file = new air.File();
var filter = new air.FileFilter("Text files", "*.txt;*.json");
file.browseForOpenMultiple("Select files", [filter]);
file.addEventListener(air.FileListEvent.SELECT_MULTIPLE, function(event) {
    event.files.forEach(function(file) {
        console.log("Selected:", file.nativePath);
    });
});

// Save file dialog
var file = new air.File();
file.save("File content here");
file.addEventListener(air.Event.COMPLETE, function(event) {
    console.log("File saved to:", event.target.nativePath);
});
```

### FileStream API

FileStream is used for reading and writing file contents.

#### File Modes

```javascript
air.FileMode.READ      // Read only
air.FileMode.WRITE     // Write (overwrites existing content)
air.FileMode.APPEND    // Append to end of file
air.FileMode.UPDATE    // Read and write
```

#### Reading Files

```javascript
// Read text file
var file = new air.File(filePath);
if (file.exists) {
    var stream = new air.FileStream();
    stream.open(file, air.FileMode.READ);
    var content = stream.readUTFBytes(file.size);
    stream.close();

    // Parse JSON if needed
    var data = JSON.parse(content);
}
```

#### Writing Files

```javascript
// Write text file
var file = new air.File(filePath);
var stream = new air.FileStream();
stream.open(file, air.FileMode.WRITE);
stream.writeUTFBytes("Content to write");
stream.close();

// Write JSON
var data = { key: "value" };
var stream = new air.FileStream();
stream.open(file, air.FileMode.WRITE);
stream.writeUTFBytes(JSON.stringify(data, null, 2));
stream.close();
```

#### Appending to Files

```javascript
// Append to log file
var file = new air.File(logPath);
var stream = new air.FileStream();
stream.open(file, air.FileMode.APPEND);
stream.writeUTFBytes(logLine + '\n');
stream.close();
```

### Complete Working File I/O Example

```javascript
// Example: Settings manager using applicationStorageDirectory
var SettingsManager = {
    file: air.File.applicationStorageDirectory.resolvePath("settings.json"),

    load: function() {
        try {
            if (this.file.exists) {
                var stream = new air.FileStream();
                stream.open(this.file, air.FileMode.READ);
                var content = stream.readUTFBytes(this.file.size);
                stream.close();
                return JSON.parse(content);
            }
            return {};
        } catch (e) {
            console.error("Error loading settings:", e);
            return {};
        }
    },

    save: function(data) {
        try {
            var stream = new air.FileStream();
            stream.open(this.file, air.FileMode.WRITE);
            stream.writeUTFBytes(JSON.stringify(data, null, 2));
            stream.close();
            return true;
        } catch (e) {
            console.error("Error saving settings:", e);
            return false;
        }
    }
};
```

---

## Game Object APIs

### Main Game Objects

The TSO client exposes several global game objects:

```javascript
game        // Main game controller
swmmo       // Flash/ActionScript bridge
loca        // Localization system
assets      // Asset/resource manager
```

### game Object

```javascript
// Game Interface
game.gi                              // Main game interface
game.gi.mCurrentPlayerZone          // Current zone
game.gi.mHomePlayer                 // Player object
game.gi.mCurrentViewedZoneID        // Current zone ID
game.gi.isOnHomzone()               // Returns true if on home island

// Messaging
game.chatMessage(message, channel)   // Send chat message
game.showAlert(message)             // Show game alert

// Get Flash definitions
game.def(className)                 // Get ActionScript class by name
game.def(className, isNew)          // Get definition, create if new

// Trackers
game.getTracker(name, callback)     // Create property observer

// Zone operations
game.gi.visitZone(zoneId)          // Visit another zone
game.zone.ScrollToGrid(grid)       // Scroll to grid position
game.gi.SelectBuilding(building)   // Select a building

// Server actions
game.gi.SendServerAction(actionId, p1, p2, p3, data)
```

### swmmo Object

```javascript
// Application access
swmmo.application                        // Main application
swmmo.application.mGameInterface        // Game interface
swmmo.application.blueFireComponent     // UI component

// Get ActionScript definitions
swmmo.getDefinitionByName(className)    // Get class definition

// Examples:
var defines = swmmo.getDefinitionByName("defines");
var global = swmmo.getDefinitionByName("global");
```

### Zone and Building APIs

```javascript
// Current zone
var zone = game.gi.mCurrentPlayerZone;

// Buildings
zone.mStreetDataMap.mBuildingContainer.forEach(function(building) {
    console.log(building.GetBuildingName_string());
    console.log(building.GetGrid());
    console.log(building.GetUpgradeLevel());
});

// Get buildings by name
var buildings = zone.mStreetDataMap.getBuildingsByName_vector(buildingName);

// Specialists
zone.GetSpecialists_vector().forEach(function(specialist) {
    console.log(specialist.getName(false));
    console.log(specialist.GetType());
});

// Deposits
zone.mStreetDataMap.mDepositContainer.forEach(function(deposit) {
    console.log(deposit.GetName_string());
    console.log(deposit.GetAmount());
});
```

### Player APIs

```javascript
var player = game.gi.mHomePlayer;

player.getPlayerID()              // Get player ID
player.GetName()                  // Get player name
player.GetGuildLevel()            // Get guild level
```

### Time APIs

```javascript
// Get client time
var clientTime = swmmo.application.mGameInterface.GetClientTime();

// Create dates
var date = new window.runtime.Date(timestamp);
```

---

## Localization APIs

The `loca` object provides access to game text translations.

### Basic Usage

```javascript
// Get localized text
loca.GetText(category, key)

// Examples:
loca.GetText("LAB", "Close")           // Returns "Close"
loca.GetText("BUI", buildingName)      // Returns building name
loca.GetText("RES", resourceName)      // Returns resource name
loca.GetText("MEL", messageName)       // Returns message text
```

### Common Categories

```javascript
"LAB"    // Labels and UI text
"BUI"    // Building names
"RES"    // Resource names
"MEL"    // Messages
"ALT"    // Alerts
"QUL"    // Quest/lore text
"SHG"    // Shop/guild text
"ACL"    // Action labels
"SHI"    // Shop items
"QTG"    // Quest tags
"HIL"    // Help/information labels
```

---

## UI and Modal APIs

### Modal Windows

```javascript
// Create modal window
createModalWindow(id, title, removeOnHide);

// Example:
createModalWindow('myModal', 'My Window Title', true);

// Show modal
$('#myModal').modal({ backdrop: 'static' });

// Hide modal
$('#myModal').modal('hide');

// Access modal parts
$('#myModal .modal-title')     // Title element
$('#myModal .modal-body')      // Body element
$('#myModal .modal-footer')    // Footer element
```

### Modal Class API

```javascript
var modal = new Modal(id, title, removeOnHide);

modal.create()              // Create the modal
modal.show()               // Show modal
modal.hide()               // Hide modal
modal.Body()               // Get body element
modal.Title()              // Get title element
modal.Footer()             // Get footer element
modal.Data()               // Get data container

// Add content
modal.Body().html(content);
```

### Creating Tables

```javascript
// Create table row
createTableRow(columnData, isHeader);

// Example:
var row = createTableRow([
    [4, "Column 1"],          // [width, content]
    [4, "Column 2"],
    [4, "Column 3"]
], false);

$('#myContainer').append(row);
```

### Creating Switches/Checkboxes

```javascript
// Create switch
createSwitch(id, isChecked, changeCallback);

// Example:
var switch = createSwitch('mySwitch', true, function() {
    console.log('Switch changed');
});
```

---

## Utility Functions

### Utils Object

```javascript
utils.getImage(bitmapData, width, height)           // Convert bitmap to img tag
utils.getImageTag(name, width, height)              // Get image by asset name
utils.getImageByModule(module, name, w, h)          // Get image by module
utils.createTableRow(data, isHeader)                // Create table row
utils.createSwitch(id, checked, callback)           // Create switch element
utils.encodeObject(obj)                             // Encode object to base64
utils.decodeObject(str)                             // Decode base64 to object
```

### Assets

```javascript
// Get bitmap data
assets.GetBitmapData(assetName)

// Get resource icon
assets.GetResourceIcon(resourceName)

// Examples:
var icon = assets.GetResourceIcon("Coin");
var bitmap = assets.GetBitmapData("icon_settings.png");
```

### Settings Management

```javascript
// Store settings
settings.store(data, module);

// Read settings
settings.read(key, module);

// Example:
settings.store({ myKey: "myValue" }, "myModule");
var value = settings.read("myKey", "myModule");
```

### String Extensions

```javascript
// Format string
"{0} and {1}".format(value1, value2)

// Repeat string
"x".repeat(5)  // "xxxxx"
```

---

## Working Examples

### Example 1: Reading a JSON File from Application Directory

This shows the **working pattern** used successfully in tso_client:

```javascript
function loadTemplateFile(filePath) {
    try {
        var file = new air.File(filePath);
        if (!file.exists) {
            console.error('File not found:', filePath);
            return null;
        }

        var fileStream = new air.FileStream();
        fileStream.open(file, air.FileMode.READ);
        var content = fileStream.readUTFBytes(file.size);
        fileStream.close();

        if (content === "") {
            return null;
        }

        return JSON.parse(content);
    } catch (e) {
        console.error('Error reading file:', e);
        return null;
    }
}

// Usage:
var data = loadTemplateFile(
    air.File.applicationDirectory.resolvePath('auto/myfile.json').nativePath
);
```

### Example 2: Writing a JSON File to Writable Location

**IMPORTANT**: Use `applicationStorageDirectory` for writable files:

```javascript
function saveDataFile(filename, data) {
    try {
        // Use applicationStorageDirectory - it's guaranteed writable
        var file = air.File.applicationStorageDirectory.resolvePath(filename);
        var fileStream = new air.FileStream();

        fileStream.open(file, air.FileMode.WRITE);
        fileStream.writeUTFBytes(JSON.stringify(data, null, 2));
        fileStream.close();

        console.info('File saved to:', file.nativePath);
        return true;
    } catch (e) {
        console.error('Error writing file:', e);
        return false;
    }
}

// Usage:
var success = saveDataFile('mydata.json', { key: "value" });
```

### Example 3: Appending to a Log File

```javascript
function appendToLog(message) {
    try {
        var logFile = air.File.applicationStorageDirectory.resolvePath('app.log');
        var stream = new air.FileStream();

        // Use APPEND mode to add to existing file
        stream.open(logFile, air.FileMode.APPEND);

        var timestamp = new Date().toISOString();
        var logLine = '[' + timestamp + '] ' + message + '\n';

        stream.writeUTFBytes(logLine);
        stream.close();

        return true;
    } catch (e) {
        console.error('Error appending to log:', e);
        return false;
    }
}

// Usage:
appendToLog('Application started');
```

### Example 4: File Selection Dialog

```javascript
function selectAndLoadFile() {
    var file = new air.File();

    // Event listener for file selection
    file.addEventListener(air.Event.SELECT, function(event) {
        var selectedFile = event.target;

        // Load the selected file
        var stream = new air.FileStream();
        stream.open(selectedFile, air.FileMode.READ);
        var content = stream.readUTFBytes(selectedFile.size);
        stream.close();

        // Process content
        console.log('Loaded file:', selectedFile.name);
        var data = JSON.parse(content);

        // Do something with data
        processData(data);
    });

    // Show file browser
    file.browseForOpen("Select a Template");
}
```

### Example 5: Save Dialog with User Selection

```javascript
function saveWithDialog(data) {
    var file = air.File.documentsDirectory.resolvePath("export.json");

    // Event listener for save completion
    file.addEventListener(air.Event.COMPLETE, function(event) {
        console.log('File saved to:', event.target.nativePath);
        game.showAlert('File saved successfully');
    });

    // Show save dialog
    file.save(JSON.stringify(data, null, 2));
}
```

### Example 6: Settings Manager Pattern (from tso_client)

This is the **proven pattern** from tso_client that works:

```javascript
var Settings = function() {
    // NOTE: This uses applicationDirectory which works for tso_client
    // For autoTSO subdirectories, use applicationStorageDirectory instead
    this.file = new air.File("file:///" +
        air.File.applicationDirectory.resolvePath("settings.json").nativePath);
    this.fs = new air.FileStream();
    this.settings = {};
};

Settings.prototype = {
    load: function() {
        try {
            if (this.file.exists) {
                this.fs.open(this.file, "read");  // Can use string "read" or air.FileMode.READ
                this.settings = JSON.parse(this.fs.readUTFBytes(this.fs.bytesAvailable));
                this.fs.close();
            }
        } catch (e) {
            console.error("Error loading settings:", e);
        }
    },

    save: function() {
        try {
            this.fs.open(this.file, "write");  // Can use string "write" or air.FileMode.WRITE
            this.fs.writeUTFBytes(JSON.stringify(this.settings, null, "  "));
            this.fs.close();
        } catch (e) {
            console.error("Error saving settings:", e);
        }
    },

    store: function(data, module) {
        var edata = {};
        edata[module || "global"] = data;
        $.extend(true, this.settings, edata);
        this.save();
    },

    read: function(key, module) {
        try {
            module = module || "global";
            if (!this.settings[module] || (key && !this.settings[module][key])) {
                return null;
            }
            return key ? this.settings[module][key] : this.settings[module];
        } catch (e) {
            console.error("Settings read error:", e);
        }
    }
};

// Usage:
var settings = new Settings();
settings.load();
settings.store({ myKey: "myValue" }, "myModule");
var value = settings.read("myKey", "myModule");
```

---

## Critical File I/O Recommendations

### Why File Logging May Not Work

Based on the codebase analysis, here are the common issues:

1. **Wrong Directory**: Writing to `applicationDirectory` subdirectories fails because:
   - `applicationDirectory` is READ-ONLY in production builds
   - Even if `auto/` folder exists, you cannot write to it
   - This is an AIR security restriction

2. **Solution**: Use `applicationStorageDirectory` instead:

```javascript
// ❌ DOESN'T WORK (trying to write to app directory)
var logPath = air.File.applicationDirectory.resolvePath('auto/debug.log').nativePath;

// ✅ WORKS (using storage directory)
var logPath = air.File.applicationStorageDirectory.resolvePath('autoTSO_debug.log').nativePath;
```

3. **Path Construction**: Use proper path resolution:

```javascript
// ❌ DOESN'T WORK (manual path construction)
var file = new air.File(air.File.applicationDirectory.nativePath + '/auto/file.json');

// ✅ WORKS (proper resolution)
var file = air.File.applicationStorageDirectory.resolvePath('file.json');
```

4. **Error Handling**: Always wrap in try-catch:

```javascript
function writeFile(path, content) {
    try {
        var file = new air.File(path);
        var stream = new air.FileStream();
        stream.open(file, air.FileMode.WRITE);
        stream.writeUTFBytes(content);
        stream.close();
        return true;
    } catch (e) {
        console.error('Write failed:', e.message);
        return false;
    }
}
```

### Recommended File Structure for autoTSO

```javascript
// Initialize storage directory structure
var autoStorageDir = air.File.applicationStorageDirectory.resolvePath('autoTSO');
if (!autoStorageDir.exists) {
    autoStorageDir.createDirectory();
}

// Templates directory
var templatesDir = autoStorageDir.resolvePath('templates');
if (!templatesDir.exists) {
    templatesDir.createDirectory();
}

// Resources directory
var resourcesDir = autoStorageDir.resolvePath('resources');
if (!resourcesDir.exists) {
    resourcesDir.createDirectory();
}

// Now you can write to these locations:
var logFile = autoStorageDir.resolvePath('debug.log');
var settingsFile = autoStorageDir.resolvePath('settings.json');
var templateFile = templatesDir.resolvePath('adventure_template.json');
```

---

## Adobe AIR Aliases Reference

These are the key AIR classes available via the `air` object:

```javascript
air.File                    // File system
air.FileStream             // File I/O
air.FileMode               // File open modes
air.FileFilter             // File type filters
air.Event                  // Events
air.Clipboard              // Clipboard access
air.NativeApplication      // Application
air.NativeWindow           // Window management
air.ByteArray              // Binary data
air.URLRequest             // Network requests
air.navigateToURL          // Open URLs
air.trace                  // Debug output
```

Full AIR API is available through `window.runtime.flash.*` namespace.

---

## Additional Resources

- All file paths should use `nativePath` property for compatibility
- Use `air.File.applicationStorageDirectory` for writable application data
- Use `air.File.documentsDirectory` for user-accessible files
- FileStream methods: `readUTFBytes()`, `writeUTFBytes()`, `readObject()`, `writeObject()`
- Always close FileStream after operations: `stream.close()`
- Check `file.exists` before reading
- Use try-catch for all file operations

---

**Document Version**: 1.0
**Last Updated**: 2025-11-16
**Author**: TSO Client API Investigation
