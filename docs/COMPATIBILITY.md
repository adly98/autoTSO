# Adobe AIR 32.0.0.116 Compatibility Guide

This document outlines JavaScript compatibility for The Settlers Online running on Adobe AIR 32.0.0.116.

## Runtime Environment

- **AIR Version**: 32.0.0.116
- **WebKit**: Outdated version with limited ES6 support
- **ECMAScript**: Primarily ES5 with some ES6 const support

## Supported Features ✅

### Variable Declarations
- `var` - Fully supported
- `const` - Supported for top-level declarations

### Functions
- Traditional `function` declarations and expressions
- `function() {}` syntax
- Closures and callbacks

### String Methods
- `.indexOf()` - Use for searching
- `.substring()`, `.substr()`, `.slice()`
- `.split()`, `.join()`
- `.toLowerCase()`, `.toUpperCase()`
- `.replace()` with strings and RegExp
- `.trim()` (ES5)

### Array Methods
- `.indexOf()` - Use for searching
- `[].length`
- `.push()`, `.pop()`, `.shift()`, `.unshift()`
- `.splice()`, `.slice()`
- `.concat()`, `.join()`
- `.sort()`, `.reverse()`

### Object Features
- Object literals `{ key: value }`
- Property access `.property` and `['property']`
- `new` operator
- `instanceof`, `typeof`

### Control Flow
- `if/else`, `switch`
- `for`, `while`, `do-while`
- `try/catch/finally`
- `break`, `continue`, `return`

### Other
- Regular expressions
- `JSON.parse()`, `JSON.stringify()`
- Ternary operator `? :`
- `debug()` function (custom logging)

## Console Polyfill

**Code Reference:** `user_auto.js` lines 55-62

Adobe AIR does not provide a native `console` object. To maintain compatibility with modern debugging practices, a console polyfill is implemented:

```javascript
if (typeof console === 'undefined') {
    var console = {
        log: function(msg) { debug('[LOG] ' + msg); },
        info: function(msg) { debug('[INFO] ' + msg); },
        error: function(msg) { debug('[ERROR] ' + msg); },
        warn: function(msg) { debug('[WARN] ' + msg); }
    };
}
```

**Features:**
- Provides `console.log()`, `console.info()`, `console.warn()`, `console.error()`
- All methods redirect to the native AIR `debug()` function
- Messages are prefixed with severity level (LOG, INFO, WARN, ERROR)
- Safe to use throughout the codebase
- Enables code portability between AIR and modern browsers

**Usage:**
```javascript
console.log('Operation completed');      // Output: [LOG] Operation completed
console.info('Starting process');        // Output: [INFO] Starting process
console.warn('Low memory detected');     // Output: [WARN] Low memory detected
console.error('Failed to load resource'); // Output: [ERROR] Failed to load resource
```

**Note:** While the polyfill makes `console` methods available, using `debug()` directly is still preferred for AIR-specific code as it's the native logging mechanism.

## NOT Supported ❌

### Variable Declarations
- `let` - **Parse error** - DO NOT USE
- Block-scoped variables

### Modern Syntax
- Arrow functions `() => {}` - **Not a function error**
- Template literals `` `${var}` ``
- Destructuring `{ x, y } = obj`
- Spread operator `...`
- Classes `class MyClass {}`

### String Methods
- `.includes()` - **Not a function** - use `.indexOf() > -1` instead
- `.startsWith()` - **Not a function** - use `.indexOf() === 0` instead
- `.endsWith()` - **Not a function**
- `.repeat()`
- `.padStart()`, `.padEnd()`

### Array Methods
- `.includes()` - **Not a function** - use `.indexOf() > -1` instead
- `.find()`, `.findIndex()`
- `.forEach()`, `.map()`, `.filter()`, `.reduce()` - **Unreliable**
- `.some()`, `.every()`
- Array spread `[...array]`

### Async Features
- `Promise`
- `async`/`await`
- Generators

### Object Features
- Object spread `{ ...obj }`
- `Object.assign()` (unreliable)
- `Object.values()`, `Object.entries()`
- Computed property names `{ [key]: value }`

### Other
- `Set`, `Map`, `WeakMap`, `WeakSet`
- Symbols
- Modules `import`/`export`

## Safe Coding Patterns

### ✅ String Prefix Check
```javascript
// Good - works in AIR
if (str.indexOf('prefix') === 0) {
    // String starts with 'prefix'
}

// Bad - crashes in AIR
if (str.startsWith('prefix')) {
    // NOT SUPPORTED
}
```

### ✅ Array Contains Check
```javascript
// Good - works in AIR
if (array.indexOf(item) > -1) {
    // Array contains item
}

// Bad - crashes in AIR
if (array.includes(item)) {
    // NOT SUPPORTED
}
```

### ✅ Logging
```javascript
// Best - native AIR logging function
debug('Log message: ' + variable);

// Also works - polyfill provided in user_auto.js
console.log('Log message: ' + variable);
console.info('Info message');
console.warn('Warning message');
console.error('Error message');

// Note: Console polyfill redirects to debug() function
// See user_auto.js lines 55-62 for implementation
```

### ✅ Variable Declarations
```javascript
// Good - works in AIR
var myVariable = 'value';
const CONSTANT_VALUE = 42; // Top-level only

// Bad - parse error in AIR
let myVariable = 'value';
```

### ✅ String Concatenation
```javascript
// Good - works in AIR
var message = 'Hello ' + name + '!';

// Bad - syntax error in AIR
var message = `Hello ${name}!`;
```

### ✅ Iteration
```javascript
// Good - works in AIR
for (var i = 0; i < array.length; i++) {
    var item = array[i];
    // Process item
}

// Bad - unreliable in AIR
array.forEach(function(item) {
    // May not work
});
```

## Testing Compatibility

Always test code in the actual AIR environment before deploying. The JavaScript console in the game client can be used to test compatibility:

```javascript
// Test if feature exists
typeof Array.prototype.includes  // Returns 'undefined' if not supported

// Safe feature detection
if (Array.prototype.includes) {
    // Use modern method
} else {
    // Use fallback
}
```

## Error Handling

When errors occur in AIR, the entire engine may crash. Use defensive programming:

```javascript
// Good - safe
try {
    var result = someOperation();
} catch (e) {
    debug('Error occurred: ' + e);
    // Graceful fallback
}

// Bad - may crash everything
var result = someOperation(); // No error handling
```

## Recommendations

1. **Always use `var`** instead of `let`
2. **Use `.indexOf()`** instead of `.includes()` or `.startsWith()`
3. **Use `debug()` or `console.*`** for logging (console polyfill available)
4. **Avoid modern array methods** like `.forEach()`, `.map()`, `.filter()`
5. **Test in actual AIR environment** before deploying
6. **Use ESLint** with the provided `.eslintrc.json` to catch incompatibilities

## CI/CD Linting

The project includes ESLint configured to warn about AIR-incompatible features:

```bash
npm run lint
```

This will catch:
- Use of `console.*` methods
- Undefined variables
- Other potential compatibility issues

## Summary

**When in doubt, use the oldest JavaScript patterns (ES3/ES5)**. Adobe AIR 32.0.0.116 has an outdated JavaScript engine that does not support modern ES6+ features despite being released in 2019.
