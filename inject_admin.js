const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'assets', 'js', 'admin.js');
let content = fs.readFileSync(filePath, 'utf8');

const insertCode = `
    // --- 1. 모듈화된 프레임(HTML 뷰) 동적 로딩 ---
    const views = ['notices', 'settings', 'lookbook', 'products', 'members', 'orders', 'cs'];
    const viewContainer = document.getElementById('admin-view-container');
    if (viewContainer) {
        for (const view of views) {
            try {
                const res = await fetch(\`views/admin/\${view}.html\`);
                const html = await res.text();
                const section = document.createElement('section');
                section.id = \`view-\${view}\`;
                section.className = 'admin-view';
                if (view === 'notices') section.classList.add('active'); // 첫 화면
                section.innerHTML = html;
                viewContainer.appendChild(section);
            } catch(e) {
                console.error(\`Failed to load view: \${view}\`, e);
            }
        }
    }
`;

content = content.replace("document.addEventListener('DOMContentLoaded', async () => {\\n", "document.addEventListener('DOMContentLoaded', async () => {\\n" + insertCode);

// Sometimes CRLF is used
content = content.replace("document.addEventListener('DOMContentLoaded', async () => {\\r\\n", "document.addEventListener('DOMContentLoaded', async () => {\\r\\n" + insertCode);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated admin.js successfully via Node');
