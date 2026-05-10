import { getSettings } from './modules/api.js';
import { renderNav } from './components/Nav.js';
import { renderPromo } from './components/Promo.js';
import { renderFooter } from './components/Footer.js';

async function bootstrapApp() {
    try {
        // 1. Fetch data from DB exactly once
        const settings = await getSettings();

        // 2. Safely render each component with error boundaries
        try {
            renderPromo(settings);
        } catch (e) {
            console.error('[Error Boundary] Promo Failed to render:', e);
        }

        try {
            renderNav(settings);
        } catch (e) {
            console.error('[Error Boundary] Nav Failed to render:', e);
        }

        try {
            renderFooter(settings);
        } catch (e) {
            console.error('[Error Boundary] Footer Failed to render:', e);
        }

    } catch (e) {
        console.error('Failed to bootstrap app:', e);
    }
}

// Ensure DOM is ready before rendering
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
    bootstrapApp();
}
