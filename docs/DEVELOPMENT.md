# Development Guide

This guide covers the development setup, workflow, and best practices for contributing to autoTSO.

## Table of Contents

- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Code Quality Tools](#code-quality-tools)
- [Testing](#testing)
- [Git Workflow](#git-workflow)
- [AIR Compatibility](#air-compatibility)
- [Troubleshooting](#troubleshooting)

## Initial Setup

### Prerequisites

- **Node.js 18+** - For development tools only (not required for game usage)
- **Git** - For version control
- **Adobe AIR Runtime 32.0.0.116** - For testing the script in-game

### Clone and Install

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rknall/autoTSO.git
   cd autoTSO
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

   This will automatically:
   - Install all development dependencies (ESLint, Husky, lint-staged)
   - Set up git hooks via Husky (see `package.json` prepare script)
   - Configure the pre-commit hook for automatic linting

3. **Verify installation:**
   ```bash
   npm run lint
   ```

### Git Hooks with Husky

This project uses [Husky](https://typicode.github.io/husky/) to manage git hooks and ensure code quality before commits.

**Automatic Installation:**
When you run `npm install`, the `prepare` script automatically runs `husky install`, which:
- Sets up the `.husky` directory
- Configures git to use hooks from `.husky` instead of `.git/hooks`
- Makes the pre-commit hook executable

**Manual Installation (if needed):**
If the hooks didn't install automatically:
```bash
npx husky install
```

**Pre-commit Hook:**
The pre-commit hook (`.husky/pre-commit`) automatically:
- Runs ESLint on staged files using `lint-staged`
- Checks for AIR compatibility issues
- Prevents commits with linting errors

**Bypassing Hooks (not recommended):**
Only in exceptional cases:
```bash
git commit --no-verify -m "message"
```

## Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** to `user_auto.js`

3. **Test in the AIR client:**
   - Copy `user_auto.js` to your TSO client's `userscripts` folder
   - Restart the client or use **Tools → Update**
   - Verify the functionality works and doesn't crash

4. **Run the linter:**
   ```bash
   npm run lint

   # Auto-fix issues where possible
   npm run lint:fix
   ```

5. **Commit your changes:**
   ```bash
   git add user_auto.js
   git commit -m "Add feature: your description"
   ```

   The pre-commit hook will automatically lint your staged files.

6. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** on GitHub

## Code Quality Tools

### ESLint

Configuration is in `.eslintrc.json` and includes:
- AIR-compatible JavaScript rules
- Disallows `let`, `const` declarations (use `var`)
- Disallows modern methods (`.includes()`, `.startsWith()`, etc.)
- Enforces `debug()` instead of `console.*`

**Commands:**
```bash
# Check for linting errors
npm run lint

# Auto-fix fixable issues
npm run lint:fix
```

### lint-staged

Configured in `package.json` to run ESLint only on staged files during pre-commit.

```json
"lint-staged": {
  "user_auto.js": [
    "eslint"
  ]
}
```

## Testing

### Automated Tests

Currently minimal:
```bash
npm test
```

### Manual Testing Checklist

When testing changes in the AIR client:

- [ ] Script loads without crashing the client
- [ ] No JavaScript errors in the console
- [ ] Changed functionality works as expected
- [ ] Existing functionality still works (regression check)
- [ ] Settings persist correctly
- [ ] Error handling works properly

**Testing locations:**
- Main island
- Adventure screen
- Friend islands
- Trade/market screens
- Mail interface

## Git Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

Examples:
```bash
git checkout -b feature/auto-quest-completion
git checkout -b fix/adventure-pathfinding
git checkout -b docs/update-readme
```

### Commit Messages

Keep commits concise and descriptive:
```bash
# Good
git commit -m "Add auto-quest completion for daily quests"
git commit -m "Fix adventure pathfinding for camp elimination"
git commit -m "Update README with installation steps"

# Too verbose
git commit -m "I added a new feature that automatically completes quests..."

# Too vague
git commit -m "Update"
git commit -m "Fix bug"
```

### Pull Requests

1. Ensure your branch is up to date with `main`:
   ```bash
   git checkout main
   git pull
   git checkout your-branch
   git rebase main
   ```

2. Push your branch:
   ```bash
   git push origin your-branch
   ```

3. Create PR with:
   - Clear title describing the change
   - Description of what changed and why
   - Any testing performed
   - Screenshots/logs if applicable

## AIR Compatibility

This is the **most critical** aspect of development. See [COMPATIBILITY.md](COMPATIBILITY.md) for full details.

### Quick Reference

**Supported:**
- `var` declarations
- Traditional function syntax
- `array.indexOf(item)`
- String concatenation with `+`
- `typeof`, `instanceof`

**NOT Supported (will crash):**
- `let`, `const`
- Arrow functions `() => {}`
- Template literals `` `string ${var}` ``
- `.includes()`, `.startsWith()`, `.endsWith()`
- `console.log()` (use `debug()` instead)
- Spread operator `...`
- Destructuring `{a, b} = obj`
- `for...of` loops

### Checking Compatibility

ESLint is configured to catch most compatibility issues:
```bash
npm run lint
```

Common errors:
```
error: Unexpected let declaration (use var instead)
error: Unexpected console statement (use debug() instead)
error: Array.prototype.includes is not supported in AIR
```

## Troubleshooting

### Husky hooks not running

**Problem:** Pre-commit hook doesn't run when committing

**Solutions:**
```bash
# Reinstall Husky
rm -rf .husky
npm install

# Manually install hooks
npx husky install

# Check hook permissions
ls -la .husky/pre-commit
# Should show: -rwxr-xr-x

# Make executable if needed
chmod +x .husky/pre-commit
```

### Linting errors blocking commits

**Problem:** Can't commit due to linting errors

**Solutions:**
```bash
# View all linting errors
npm run lint

# Auto-fix what's possible
npm run lint:fix

# Fix remaining errors manually
# Then commit again
```

### AIR client crashes on script load

**Problem:** Game crashes when loading `user_auto.js`

**Diagnosis:**
1. Check ESLint output: `npm run lint`
2. Look for unsupported syntax (let, arrow functions, etc.)
3. Check for `console.*` calls (should be `debug()`)

**Fix:**
1. Revert to last working version
2. Identify the problematic code
3. Replace with AIR-compatible syntax
4. Test again

### npm install fails

**Problem:** Dependencies won't install

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Use specific Node version if needed
nvm use 18
npm install
```

## Additional Resources

- [COMPATIBILITY.md](COMPATIBILITY.md) - Detailed AIR JavaScript compatibility
- [user_auto_analysis.md](user_auto_analysis.md) - Code structure analysis
- [Adobe AIR Documentation](https://airsdk.dev/) - Official AIR docs
- [ESLint Documentation](https://eslint.org/) - ESLint rules reference

## Getting Help

- Check existing [Issues](https://github.com/rknall/autoTSO/issues)
- Review [Pull Requests](https://github.com/rknall/autoTSO/pulls) for examples
- Start a [Discussion](https://github.com/rknall/autoTSO/discussions)
- Contact maintainers through GitHub
