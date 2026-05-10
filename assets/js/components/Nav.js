export function renderNav(settings) {
    const navRow = document.querySelector('.header-nav-row');
    if (!navRow || !settings.menus) return;

    // Inject dynamic styles for mega dropdown if not already present
    if (!document.getElementById('nav-dynamic-style')) {
        const style = document.createElement('style');
        style.id = 'nav-dynamic-style';
        style.innerHTML = `
            .nav-mega-item { position: static; display: inline-block; padding: 0.5rem 0; }
            .nav-mega-dropdown { 
                position: absolute; top: 100%; left: 0; width: 100%; 
                background: #fff; display: none; padding: 2rem 5%; 
                border-top: 1px solid #eee; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            .nav-mega-item:hover .nav-mega-dropdown { display: flex; gap: 3rem; }
            .mega-col h3 { font-size: 0.8rem; font-weight: 500; margin-bottom: 1rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
            .mega-col ul { list-style: none; padding: 0; margin: 0; }
            .mega-col ul li { margin-bottom: 0.8rem; }
            .mega-col ul li a { font-size: 0.85rem; color: #111; text-decoration: none; transition: color 0.2s; font-weight: 400; }
            .mega-col ul li a:hover { color: #666; }
        `;
        document.head.appendChild(style);
    }

    function buildNavHTML(menuList, level = 1) {
        if (!menuList || menuList.length === 0) return '';
        let html = '';
        menuList.forEach(menu => {
            const hasChildren = menu.children && menu.children.length > 0;
            const highlightCls = menu.highlight ? 'nav-highlight' : '';
            const displayName = menu.name || menu.title;
            const targetLink = menu.link || '#';
            
            if (hasChildren && level === 1) {
                html += `
                    <div class="nav-mega-item">
                        <a href="${targetLink}" class="${highlightCls}">${displayName}</a>
                        <div class="nav-mega-dropdown">
                            ${menu.children.map(col => `
                                <div class="mega-col">
                                    <h3>${col.name || col.title}</h3>
                                    ${col.children && col.children.length > 0 ? `
                                        <ul>
                                            ${col.children.map(sub => `
                                                <li><a href="${sub.link || '#'}">${sub.name || sub.title}</a></li>
                                            `).join('')}
                                        </ul>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                html += `<a href="${targetLink}" class="${highlightCls}">${displayName}</a>`;
            }
        });
        return html;
    }

    navRow.innerHTML = buildNavHTML(settings.menus, 1);
}
