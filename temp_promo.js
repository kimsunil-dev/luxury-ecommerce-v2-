import { getSettings } from './modules/api.js';

// --- Global Promo Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const appContent = document.getElementById('app-content');
        if (!appContent) return; // Only show on index.html where app-content is defined, or adjust logic

        const settings = await getSettings();

        // INJECT PROMO BAR (Marquee)
        const promoSection = document.createElement('div');
        promoSection.className = 'notice-marquee-wrapper';
        
        let speedVal = parseInt(settings.promoSpeed, 10) || 40;
        let duration = 70 - speedVal; 
        if (duration < 5) duration = 5;
        if (duration > 100) duration = 100;
        
        let notices = settings.noticesBoard || [];
        let sortedNotices = [...notices].sort((a, b) => {
            const dateA = new Date(a.date).getTime() || 0;
            const dateB = new Date(b.date).getTime() || 0;
            return dateB - dateA || b.id - a.id;
        }
});
        let top4Notices = sortedNotices.slice(0, 4).map(n => n.title);
        
        while (top4Notices.length < 4) {
            top4Notices.push('?�로??공�??�항???�습?�다.');
        }

        promoSection.innerHTML = `
            <style>
                .notice-marquee-wrapper {
                    position: fixed;
                    top: 0;
                    left: 0;
                    z-index: 9999;
                    overflow: hidden;
                    width: 100%;
                    background: #fff;
                    padding: 0.6rem 0;
                    border-bottom: 1px solid #eee;
                }
                .seamless-marquee-track {
                    display: flex;
                    width: 200vw;
                    animation: seamlessMarquee ${duration}s linear infinite;
                }
                .seamless-marquee-set {
                    display: flex;
                    width: 100vw;
                    justify-content: space-around;
                    align-items: center;
                    flex-shrink: 0;
                }
                .seamless-marquee-item {
                    font-size: 0.8rem;
                    letter-spacing: 0.05em;
                    color: #111;
                    white-space: nowrap;
                    font-weight: 500;
                }
                @keyframes seamlessMarquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100vw); }
                }
                .notice-marquee-wrapper:hover .seamless-marquee-track {
                    animation-play-state: paused;
                    cursor: pointer;
                }
            </style>
            <div class="seamless-marquee-track">
                <div class="seamless-marquee-set">
                    <div class="seamless-marquee-item">${top4Notices[0]}</div>
                    <div class="seamless-marquee-item">${top4Notices[1]}</div>
                    <div class="seamless-marquee-item">${top4Notices[2]}</div>
                    <div class="seamless-marquee-item">${top4Notices[3]}</div>
                </div>
                <div class="seamless-marquee-set" aria-hidden="true">
                    <div class="seamless-marquee-item">${top4Notices[0]}</div>
                    <div class="seamless-marquee-item">${top4Notices[1]}</div>
                    <div class="seamless-marquee-item">${top4Notices[2]}</div>
                    <div class="seamless-marquee-item">${top4Notices[3]}</div>
                </div>
            </div>
        `;
        
        const header = document.getElementById('main-header');
        if (header && header.parentNode) {
            header.parentNode.insertBefore(promoSection, header);
        }
    } catch(err) {
        console.error("Promo Module Error:", err);
    }
}
});
