import { getSettings } from './modules/api.js';

// --- Global Navigation Initialization ---
async function initNav() {
    try {
        const navRow = document.querySelector('.header-nav-row');
        if (!navRow) return;

        // Settings 가?�오�?(Supabase API)
        const settings = await getSettings();

        if (!settings || !settings.menus) return;

        // Dropdown ?��????�적 추�? (중복 추�? 방�?)
        if (!document.getElementById('nav-dynamic-style')) {
            const style = document.createElement('style');
            style.id = 'nav-dynamic-style';
            style.innerHTML = `
                .nav-mega-item { position: static; display: inline-block; padding: 0.5rem 0; }
                .nav-mega-dropdown { 
                    visibility: hidden; opacity: 0; position: absolute; top: 100%; left: 0; right: 0; width: 100vw; 
                    background: #fff; box-shadow: 0 15px 35px rgba(0,0,0,0.05); padding: 1rem 0 5rem 20vw; 
                    border-top: 1px solid #f0f0f0; z-index: 100; display: flex; justify-content: flex-start; gap: 6rem;
                    transition: opacity 0.3s ease, visibility 0.3s;
                    text-align: left;
                    max-height: calc(100vh - 80px);
                    overflow-y: auto;
                }
                .nav-mega-item:hover .nav-mega-dropdown { visibility: visible; opacity: 1; }
                .nav-mega-column { display: flex; flex-direction: column; min-width: 140px; }
                .nav-mega-column-title { font-size: 0.75rem; font-weight: 400; color: #111; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.8rem; text-decoration: none; }
                .nav-mega-column-title:hover { opacity: 0.5; text-decoration: underline; text-underline-offset: 4px; }
                .nav-mega-link { font-size: 0.75rem; color: #555; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.6rem; transition: color 0.2s; font-weight: 400; }
                .nav-mega-link:hover { color: #000; text-decoration: underline; text-underline-offset: 4px; }
            `;
            document.head.appendChild(style);
        }

        function buildNavHTML(menus, depth) {
            if (!menus || menus.length === 0) return '';
            let html = '';
            menus.forEach(m => {
                const hasChildren = m.children && m.children.length > 0;
                const highlightCls = m.highlight ? 'nav-highlight' : '';
                const targetLink = m.link === '#' || !m.link ? 'products.html' : m.link;
                
                const menuName = (m.name || '').trim();
                const isSpacer = menuName === '';
                const displayName = isSpacer ? '&nbsp;' : menuName;
                
                if (depth === 1) {
                    html += `
                    <div class="nav-mega-item">
                        ${isSpacer ? `<span class="${highlightCls}" style="display:inline-block; pointer-events:none;">&nbsp;</span>` : `<a href="${targetLink}" class="${highlightCls}">${displayName}</a>`}
                        ${hasChildren ? `<div class="nav-mega-dropdown">${buildNavHTML(m.children, 2)}</div>` : ''}
                    </div>`;
                } else if (depth === 2) {
                    html += `
                    <div class="nav-mega-column">
                        ${isSpacer ? `<span class="nav-mega-column-title ${highlightCls}" style="visibility:hidden; height:1.2em;">&nbsp;</span>` : `<a href="${targetLink}" class="nav-mega-column-title ${highlightCls}">${displayName}</a>`}
                        ${hasChildren ? buildNavHTML(m.children, 3) : ''}
                    </div>`;
                } else {
                    html += isSpacer 
                        ? `<span class="nav-mega-link ${highlightCls}" style="visibility:hidden; height:1em; display:inline-block; margin-bottom:0.6rem;">&nbsp;</span>` 
                        : `<a href="${targetLink}" class="nav-mega-link ${highlightCls}">${displayName}</a>`;
                }
            });
            return html;
        }

        navRow.innerHTML = buildNavHTML(settings.menus, 1);
        
        // --- Global Footer Rendering ---
        const footerContainer = document.getElementById('global-footer-container');
        if (footerContainer) {
            const perksList = Array.isArray(settings.perks) ? settings.perks : [
                { title: 'Worldwide Instant Exchanges', desc: 'Easy online size swaps' },
                { title: 'Express Global Shipping', desc: 'Complimentary on orders over $400USD' },
                { title: 'SIR. Loyalty', desc: 'Earn points and move through our tiered program' }
            ];
            
            footerContainer.innerHTML = `
                <!-- Perks Section -->
                <section class="lb-perks">
                    <div class="perk-col">
                        <span class="perk-hashtag">${settings.perksHashtag || '#SIRTHELABEL'}</span>
                    </div>
                    ${perksList.map(perk => `
                    <div class="perk-col">
                        <h4>${perk.title || ''}</h4>
                        <p>${perk.desc || ''}</p>
                    </div>
                    `).join('')}
                </section>
                
                <!-- Detailed Footer -->
                <footer class="lb-footer">
                    <div class="footer-grid">
                        ${(settings.footerMenus || []).map(cat => `
                        <div class="footer-col">
                            <h3>${cat.title}</h3>
                            <ul>
                                ${(cat.items || []).map(item => {
                                    const linkHref = item.type === 'page' ? `page.html?title=${encodeURIComponent(item.title)}` : (item.link || '#');
                                    return `<li><a href="${linkHref}">${item.title}</a></li>`;
                                }).join('')}
                            </ul>
                        </div>
                        `).join('')}
                        <div class="footer-col newsletter-col">
                            <h3>Receive 10% Off Your First Order</h3>
                            <div class="email-input-wrapper">
                                <input type="email" id="signup-email" placeholder="Email address">
                                <button type="button" id="expand-signup-btn">구독</button>
                            </div>
                            <div class="footer-details" style="margin-top: 1rem;">
                                <p>We're located in Sydney, Australia</p>
                                <p style="margin-top:0.5rem;">Customer Care hours:<br>Sun - Thurs | 3pm - 10pm PST</p>
                                <p style="margin-top:0.5rem;"><a href="mailto:customercare@sirthelabel.com">customercare@sirthelabel.com</a></p>
                            </div>
                        </div>
                    </div>
                </footer>
            `;
        }
    } catch(err) {
        console.error("Navigation Module Error:", err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
} else {
    initNav();
}
