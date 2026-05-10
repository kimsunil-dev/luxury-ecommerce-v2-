const fs = require('fs'); 
const content = fs.readFileSync('assets/js/admin.js', 'utf8'); 
const prefix = `import { getProducts, getSettings, getMembers, saveProduct, deleteProductApi, saveSettings } from './modules/api.js';

// Global Error Tracking
window.addEventListener('error', function(e) {
    if (e.message === 'Script error.' && !e.filename) return; // Ignore opaque/extension errors
    if (e.message && e.message.includes('Script error.') && e.lineno === 0) return;
    const errDiv = document.createElement('div');
    errDiv.style = "position:fixed;top:50px;left:0;background:red;color:white;z-index:9999;padding:20px;font-size:16px;width:100%;box-sizing:border-box;box-shadow:0 4px 10px rgba(0,0,0,0.3);";
    errDiv.innerText = \`JS ERROR: \${e.message} at \${e.filename}:\${e.lineno}\`;
`;
const newContent = prefix + content;
fs.writeFileSync('assets/js/admin.js', newContent);
