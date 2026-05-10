const fs = require('fs');
let code = fs.readFileSync('assets/js/nav.js', 'utf8');

// Replace the double closing braces with a single one before the if statement
code = code.replace(/\}\s*\}\s*if \(document\.readyState === 'loading'\)/, '}\n\nif (document.readyState === \'loading\')');

fs.writeFileSync('assets/js/nav.js', code, 'utf8');
console.log('Fixed nav.js extra brace');
