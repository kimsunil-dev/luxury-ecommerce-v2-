export function renderFooter(settings) {
    const footerContainer = document.getElementById('global-footer-container');
    if (!footerContainer) return;

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
