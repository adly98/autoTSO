# Development Guide

This guide covers the development setup, workflow, and best practices for contributing to autoTSO.

## Table of Contents

- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Code Quality Tools](#code-quality-tools)
- [Testing](#testing)
- [Git Workflow](#git-workflow)
- [Release Process](#release-process)
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

## Release Process

This project uses GitHub Releases with automated CI/CD for distribution. The release process automatically handles version management.

### How Releases Work

1. **Version Source**: The git tag is the single source of truth for version numbers
2. **Automatic Versioning**: CI/CD automatically updates `auto.version` in the JavaScript file to match the tag
3. **Update Mechanism**: Users receive updates through GitHub Releases API (not raw file URLs)

### Creating a Release

**Prerequisites:**
- Ensure all changes are merged to `main`
- Ensure all tests pass and code is stable
- Pull latest changes: `git pull origin main`

**Steps:**

1. **Create and push a version tag:**
   ```bash
   # Tag format: v<MAJOR>.<MINOR>.<PATCH>
   git tag v2.1.0
   git push origin v2.1.0
   ```

2. **CI/CD automatically:**
   - Extracts version from tag (e.g., `v2.1.0` → `2.1.0`)
   - Updates `auto.version` field in `user_auto.js`
   - Creates GitHub Release with auto-generated release notes
   - Uploads release assets:
     - `user_auto.js` (with updated version)
     - `resources.json`
     - All files from `resources/` folder

3. **Verify release:**
   - Check [Releases page](https://github.com/adly98/autoTSO/releases)
   - Verify all assets are attached
   - Review auto-generated release notes
   - Edit release notes if needed to add highlights or breaking changes

### Versioning Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (v3.0.0): Breaking changes, major feature overhauls
- **MINOR** (v2.1.0): New features, backward-compatible
- **PATCH** (v2.0.1): Bug fixes, minor improvements

Examples:
```bash
# Bug fix release
git tag v2.0.3
git push origin v2.0.3

# New feature release
git tag v2.1.0
git push origin v2.1.0

# Breaking change release
git tag v3.0.0
git push origin v3.0.0
```

### Pre-releases and Testing

For beta testing:

```bash
# Create a pre-release tag
git tag v2.1.0-beta.1
git push origin v2.1.0-beta.1
```

Mark the release as "pre-release" in the GitHub UI after it's created.

### User Update Process

Users automatically receive updates when:
1. They start the game (update check runs at initialization)
2. They manually check via **Tools → Check for Updates**

The update system:
- Queries GitHub Releases API for latest release
- Compares tag version with current `auto.version`
- Shows changelog (from release notes) and prompts for update
- Downloads and installs files from release assets
- Creates backup before updating

### Release Workflow Details

The CI/CD workflow (`.github/workflows/release.yml`):

```yaml
# Triggers on version tags
on:
  push:
    tags:
      - 'v*'

# Main steps:
1. Checkout code
2. Extract version from tag
3. Update auto.version in user_auto.js
4. Copy files to release-assets/
5. Create GitHub Release with assets
```

### Troubleshooting Releases

**Problem:** Tag pushed but no release created

**Solutions:**
- Check [Actions tab](https://github.com/adly98/autoTSO/actions) for workflow errors
- Ensure tag format starts with `v` (e.g., `v2.1.0`)
- Verify `GITHUB_TOKEN` permissions in workflow

**Problem:** Release created but missing assets

**Solutions:**
- Check workflow logs for file copy errors
- Verify all files exist in repository
- Ensure `resources/` folder has required JSON files

**Problem:** Users not receiving updates

**Solutions:**
- Verify release is published (not draft)
- Check that `auto.version` in release matches tag
- Ensure release assets are publicly accessible
- Check browser console for API errors (rate limits, network issues)

### Rollback Process

If a release has critical issues:

1. **Delete the problematic tag:**
   ```bash
   git tag -d v2.1.0
   git push origin :refs/tags/v2.1.0
   ```

2. **Delete the GitHub Release** through the web UI

3. **Fix the issues** and create a new patch release:
   ```bash
   git tag v2.1.1
   git push origin v2.1.1
   ```

Note: Users on the broken version may need manual intervention.

### Release Checklist

Before creating a release:

- [ ] All changes merged to `main`
- [ ] CI tests passing
- [ ] Manual testing completed
- [ ] No known critical bugs
- [ ] CHANGELOG or release notes prepared (if custom notes desired)
- [ ] Version number follows semantic versioning
- [ ] Tag format is correct (vX.Y.Z)

After creating a release:

- [ ] Verify release appears on GitHub
- [ ] Check all assets uploaded correctly
- [ ] Review auto-generated release notes
- [ ] Test update mechanism with actual game client
- [ ] Monitor for user-reported issues

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
