const fs = require('fs');
const vm = require('vm');

const files = [
  'js/store.js',
  'js/auth.js',
  'js/events.js',
  'js/form-builder.js',
  'js/registration.js',
  'js/participants.js',
  'js/chat.js',
  'js/attendance.js',
  'js/list-seminar.js',
  'js/questionnaire.js',
  'js/app.js'
];

const sandbox = {
  window: {},
  document: {
    addEventListener: () => {},
    createElement: () => ({ style: {} }),
    body: { appendChild: () => {} },
    getElementById: () => null,
    querySelectorAll: () => []
  },
  navigator: {},
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  console: console,
  setTimeout: setTimeout,
  setInterval: setInterval
};
sandbox.window = sandbox;

const context = vm.createContext(sandbox);

try {
  files.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    new vm.Script(code).runInContext(context);
    console.log(`SUCCESS: ${file} parsed and executed successfully in sandbox.`);
  });
  console.log("\nALL FILES LOADED SUCCESSFULLY! No global syntax or immediate execution errors.");
} catch (err) {
  console.error("\n🔴 RUNTIME/SYNTAX ERROR DETECTED DURING LOAD:");
  console.error(err.stack);
  process.exit(1);
}

