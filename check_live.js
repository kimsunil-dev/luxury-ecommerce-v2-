const fs = require('fs');
const https = require('https');
const vm = require('vm');

https.get('https://luxury-ecommerce-xi.vercel.app/assets/js/nav.js?v=' + Date.now(), (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        let code = data.replace(/import.*?['"`].*?['"`];?\n/g, 'const getSettings = async () => ({ menus: [{name: "Test"}], perks: [], footerMenus: [] });\n');
        try {
            new vm.Script(code);
            console.log("LIVE NAV.JS Syntax OK");
        } catch(e) {
            console.log("LIVE NAV.JS Syntax Error:", e.message);
        }
    });
});

https.get('https://luxury-ecommerce-xi.vercel.app/assets/js/promo.js?v=' + Date.now(), (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        let code = data.replace(/import.*?['"`].*?['"`];?\n/g, 'const getSettings = async () => ({ noticesBoard: [] });\n');
        try {
            new vm.Script(code);
            console.log("LIVE PROMO.JS Syntax OK");
        } catch(e) {
            console.log("LIVE PROMO.JS Syntax Error:", e.message);
        }
    });
});
