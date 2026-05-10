import os

path = r"C:\Users\LG\.gemini\antigravity\scratch\luxury-ecommerce-v2\assets\js\admin.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

insert_code = """
    // --- 1. 모듈화된 프레임(HTML 뷰) 동적 로딩 ---
    const views = ['notices', 'settings', 'lookbook', 'products', 'members', 'orders', 'cs'];
    const viewContainer = document.getElementById('admin-view-container');
    if (viewContainer) {
        for (const view of views) {
            try {
                const res = await fetch(`views/admin/${view}.html`);
                const html = await res.text();
                const section = document.createElement('section');
                section.id = `view-${view}`;
                section.className = 'admin-view';
                if (view === 'notices') section.classList.add('active'); // 첫 화면
                section.innerHTML = html;
                viewContainer.appendChild(section);
            } catch(e) {
                console.error(`Failed to load view: ${view}`, e);
            }
        }
    }
"""

# Replace exactly
content = content.replace("document.addEventListener('DOMContentLoaded', async () => {\n", "document.addEventListener('DOMContentLoaded', async () => {\n" + insert_code)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated admin.js successfully")
