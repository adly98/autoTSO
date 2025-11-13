# autoTSO

Comprehensive automation script for The Settlers Online game client running on Adobe AIR.

[![CI Status](https://github.com/rknall/autoTSO/workflows/CI/badge.svg)](https://github.com/rknall/autoTSO/actions)

## Overview

This script provides extensive automation capabilities for The Settlers Online, including adventure management, resource collection, trading, and more. Built specifically for the Adobe AIR client with full compatibility for AIR 32.0.0.116.

## Key Features

### Adventure Automation
- ✅ Automated adventure completion with pathfinding
- ✅ Speed buff management
- ✅ Unit training and retraining
- ✅ Camp elimination tracking
- ✅ Step-by-step adventure monitoring

### Resource Management
- ✅ Automated deposit collection
- ✅ Star menu resource gathering
- ✅ Warehouse overflow management
- ✅ Building production monitoring

### Communication
- ✅ Automated mail collection
- ✅ Loot mail processing
- ✅ Gift acceptance
- ✅ Geologist message handling

### Trading & Economy
- ✅ Trade acceptance automation
- ✅ Market monitoring
- ✅ Resource trading
- ✅ Friend list management

### Specialists & Buffs
- ✅ Specialist deployment
- ✅ Buff application to friends
- ✅ Cooldown tracking
- ✅ Auto-buff on island visits

### Quality of Life
- ✅ Quest automation
- ✅ Mystery box opening
- ✅ Production monitoring
- ✅ Auto-update functionality
- ✅ Customizable settings

## Installation

### Quick Install

1. Download `user_auto.js` from this repository (click the file, then "Raw", then save)
2. Open your TSO client
3. Click on the settings icon to open the client folder:

![image](https://github.com/adly98/autoTSO/assets/111687237/c0de60f2-7475-4ca3-ae5d-efcd86cebb6e)

4. Navigate to the `userscripts` folder:

![image](https://github.com/adly98/autoTSO/assets/111687237/5edcf0cd-294a-422d-b596-a44e6084d3cf)

5. Copy `user_auto.js` into the `userscripts` folder
6. Restart the client or click **Tools → Update** in the menu
7. Verify installation - you should see "Automation" in the game menu

### First Time Setup

After installation:
1. Open the **Automation** menu in-game
2. Configure your preferences in **Settings**
3. Enable desired automation features
4. Start with **Auto Adventures** or **Auto Mail** as entry points

## Development

### Prerequisites

- Node.js 18+ (for development tools only, not required for game usage)
- Adobe AIR Runtime 32.0.0.116 (for testing)

### Setup

```bash
# Install development dependencies
npm install

# Run linter
npm run lint

# Run tests
npm test
```

### Code Quality

The project includes automated linting and CI/CD:

```bash
# Check code for AIR compatibility issues
npm run lint

# Run tests (when available)
npm test
```

### AIR Compatibility ⚠️

This project runs in **Adobe AIR 32.0.0.116**, which has **limited JavaScript support**:

- ✅ **Supported**: `const`, `var`, traditional functions, `.indexOf()`
- ❌ **NOT Supported**: `let`, `.includes()`, `.startsWith()`, arrow functions, template literals
- ❌ **NO `console` object**: Use `debug()` function instead

**Critical**: Code using unsupported features will crash the entire game client!

📖 See [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) for detailed compatibility information.

### Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes
4. **Test** in the AIR client to ensure no crashes
5. **Lint** your code (`npm run lint`)
6. **Commit** with clear messages (see commit history for examples)
7. **Push** to your fork
8. **Submit** a pull request

**Important Guidelines:**
- All code must be compatible with Adobe AIR 32.0.0.116
- Use `var` instead of `let`, `.indexOf()` instead of `.includes()`
- No `console.*` calls (use `debug()` instead)
- Test thoroughly in the actual game client
- Follow existing code style

📖 See [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) for detailed compatibility requirements.

## Project Structure

```
autoTSO/
├── user_auto.js              # Main automation script
├── docs/                     # Documentation
│   ├── COMPATIBILITY.md      # AIR JavaScript compatibility guide
│   └── user_auto_analysis.md # Code analysis and improvement suggestions
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI/CD pipeline
├── .eslintrc.json            # ESLint configuration (AIR-compatible)
└── package.json              # Dev dependencies (for CI/CD only)
```

## Documentation

- **[Compatibility Guide](docs/COMPATIBILITY.md)** - Detailed AIR JavaScript compatibility information
- **[Code Analysis](docs/user_auto_analysis.md)** - Code structure and improvement suggestions
- **[Contributing Guide](#contributing)** - How to contribute to the project

## Troubleshooting

### Script Not Loading
- Ensure `user_auto.js` is in the correct `userscripts` folder
- Try restarting the TSO client completely
- Check the JavaScript console for errors

### Game Crashes on Load
- Likely caused by AIR-incompatible JavaScript syntax
- Check for use of `let`, `.includes()`, or `console.*` calls
- Revert to a previous working version
- Report the issue with error details

### Features Not Working
- Check that automation is enabled in the game menu
- Verify settings are configured correctly
- Check the `debug()` output for error messages
- Ensure you have the required resources/items in-game

## Security & Safety

- ✅ **Path validation** prevents directory traversal attacks
- ✅ **Backup creation** before auto-updates
- ✅ **Error handling** throughout the codebase
- ✅ **No external dependencies** at runtime (pure JavaScript)
- ✅ **Open source** - review the code yourself

## Version History

Recent updates:
- **v2.0.3** (In Progress) - AIR compatibility fixes, CI/CD infrastructure, comprehensive documentation
- **v2.0.2** - Bug fixes and stability improvements
- **v2.0.0** - Major refactoring and new features

See commit history for detailed changelogs.

## License

Private project - All rights reserved.

## Acknowledgments

- **The Settlers Online** by Ubisoft Blue Byte
- **Original script authors** and contributors
- **Community** for testing and feedback

## Support

- 🐛 **Found a bug?** [Open an issue](https://github.com/rknall/autoTSO/issues)
- 💡 **Have a suggestion?** [Start a discussion](https://github.com/rknall/autoTSO/discussions)
- 🤝 **Want to contribute?** See [Contributing](#contributing) section above
