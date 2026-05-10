const fs = require('fs');
let code = fs.readFileSync('assets/js/promo.js', 'utf8');

// Fix the array sort closure
code = code.replace(/return dateB - dateA \|\| b\.id - a\.id;\s*\}\s*\}\);/g, 'return dateB - dateA || b.id - a.id;\n        });');

// Replace DOMContentLoaded wrapper with initPromo()
code = code.replace(/document\.addEventListener\('DOMContentLoaded',\s*async\s*\(\)\s*=>\s*\{/, 'async function initPromo() {');

// Fix the trailing garbage at the end
code = code.replace(/\}\s*\}\);\s*$/, '}\n\nif (document.readyState === "loading") {\n    document.addEventListener("DOMContentLoaded", initPromo);\n} else {\n    initPromo();\n}\n');

fs.writeFileSync('assets/js/promo.js', code, 'utf8');
console.log('Fixed promo.js');
