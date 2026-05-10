const vm = require('vm');
const fs = require('fs');
let code = fs.readFileSync('assets/js/nav.js', 'utf8');
code = code.replace(/import.*?['"`].*?['"`];?\n/g, 'const getSettings = async () => ({ menus: [{name: "Test"}], perks: [], footerMenus: [] });\n');

try {
    const script = new vm.Script(code);
    console.log("Syntax is 100% OK");
} catch(e) {
    console.log("Syntax Error:", e.message);
}
