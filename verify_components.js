const fs = require('fs');
const vm = require('vm');

function checkFile(filepath) {
    let code = fs.readFileSync(filepath, 'utf8');
    // Strip ES6 imports/exports
    code = code.replace(/import.*?['"`].*?['"`];?/g, '');
    code = code.replace(/export function/g, 'function');
    
    try {
        new vm.Script(code);
        console.log(`[OK] ${filepath}`);
    } catch(e) {
        console.log(`[ERROR] ${filepath}: ${e.message}`);
    }
}

checkFile('assets/js/app.js');
checkFile('assets/js/components/Nav.js');
checkFile('assets/js/components/Promo.js');
checkFile('assets/js/components/Footer.js');
