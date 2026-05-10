const defaultProducts = [
    {
        id: 1,
        name: "Klara Ruched Mini Dress",
        price: 380000,
        image: "https://picsum.photos/800/1200?random=11",
        category: "Dresses"
    },
    {
        id: 2,
        name: "Aline Silk Maxi Slip",
        price: 420000,
        image: "https://picsum.photos/800/1200?random=12",
        category: "Dresses"
    },
    {
        id: 3,
        name: "Linen Tailored Blazer",
        price: 550000,
        image: "https://picsum.photos/800/1200?random=13",
        category: "Outerwear"
    },
    {
        id: 4,
        name: "Classic Cotton Shirt",
        price: 220000,
        image: "https://picsum.photos/800/1200?random=14",
        category: "Tops"
    }
];

const defaultLayout = [
    { id: 'block-promo', type: 'promo', title: '프로모션 공지 바', visible: true, content: '🔥 썸머 시즌 오프! 전 상품 무료 배송 혜택' },
    { id: 'block-hero', type: 'hero', title: '히어로 배너 (메인 대형 사진)', visible: true, image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=2000', video: '' },
    { id: 'block-products', type: 'products', title: '상품 진열 리스트', visible: true }
];

const defaultSettings = {
    promoSpeed: 30,
    noticesMarquee: [
        { id: 1, text: "SIGN UP FOR 10% OFF YOUR FIRST ORDER." },
        { id: 2, text: "FOR US CUSTOMERS, ALL PRICES ARE INCLUSIVE OF US DUTIES AND TARIFFS." }
    ],
    noticesBoard: [
        { id: 1, title: "배송 관련 공지사항", content: "현재 택배사 파업으로 인해 일부 지역 배송이 지연되고 있습니다. 양해 부탁드립니다.", date: "2026-05-08" }
    ],
    menus: [
        { id: 101, name: 'SHOP', link: '#', highlight: false, children: [
            { id: 104, name: 'CLOTHING', link: '#', children: [
                { id: 105, name: 'DRESSES', link: '#', children: [] },
                { id: 106, name: 'TOPS', link: '#', children: [] }
            ]}
        ]}, 
        { id: 102, name: 'NEW ARRIVALS', link: '#', highlight: false, children: []}, 
        { id: 103, name: 'YES SIR.', link: '#', highlight: true, children: []}
    ],
    lookbook: {
        splitLeft: 'https://picsum.photos/800/1200?random=1',
        splitRight: 'https://picsum.photos/800/1200?random=2',
        fullWidth: 'https://picsum.photos/2000/800?random=3',
        asymLeft: 'https://picsum.photos/1000/1500?random=4',
        asymRight1: 'https://picsum.photos/800/800?random=5',
        asymRight2: 'https://picsum.photos/800/800?random=6',
        asymRight3: 'https://picsum.photos/800/800?random=7',
        asymRight4: 'https://picsum.photos/800/800?random=8',
        splitLeft2: 'https://picsum.photos/800/1200?random=9',
        splitRight2: 'https://picsum.photos/800/1200?random=10'
    },
    perks: [
        { title: 'Worldwide Instant Exchanges', desc: 'Easy online size swaps' },
        { title: 'Express Global Shipping', desc: 'Complimentary on orders over $400USD' },
        { title: 'SIR. Loyalty', desc: 'Earn points and move through our tiered program' }
    ],
    footerMenus: [
        {
            title: 'Customer Care',
            items: [
                { title: 'Contact', type: 'page', content: 'Contact information content...' },
                { title: 'Shipping & Delivery', type: 'page', content: 'Shipping & Delivery details...' },
                { title: 'Returns', type: 'page', content: 'Returns policy...' },
                { title: 'Afterpay', type: 'page', content: 'Afterpay details...' },
                { title: 'Klarna', type: 'page', content: 'Klarna details...' },
                { title: 'FAQ', type: 'page', content: 'Frequently asked questions...' },
                { title: 'Gift Cards', type: 'page', content: 'Gift card information...' }
            ]
        },
        {
            title: 'Info',
            items: [
                { title: 'Our Story', type: 'page', content: 'Our story...' },
                { title: 'Values', type: 'page', content: 'Our values...' },
                { title: 'Loyalty', type: 'page', content: 'Loyalty program details...' },
                { title: 'Size Guide', type: 'page', content: 'Size guide...' },
                { title: 'Stores', type: 'page', content: 'Store locations...' },
                { title: 'Stockists', type: 'page', content: 'Our stockists...' },
                { title: 'Privacy Policy', type: 'page', content: 'Privacy Policy details...' },
                { title: 'Terms & Conditions', type: 'page', content: 'Terms & Conditions details...' }
            ]
        },
        {
            title: 'Join Us',
            items: [
                { title: 'Tiktok', type: 'link', link: '#' },
                { title: 'Instagram', type: 'link', link: '#' },
                { title: 'Pinterest', type: 'link', link: '#' },
                { title: 'Facebook', type: 'link', link: '#' },
                { title: 'Join SIR. SMS', type: 'link', link: '#' },
                { title: 'Loyalty', type: 'page', content: 'Loyalty details...' },
                { title: 'Linkedin', type: 'link', link: '#' }
            ]
        }
    ]
};

const defaultMembers = [
    { id: 10, joinDate: "2026-05-08 14:01", name: "김고객", email: "customer1@example.com", marketing: "동의함 (이메일, SMS)", status: "정상" },
    { id: 9, joinDate: "2026-05-08 13:30", name: "이유저", email: "user2@example.com", marketing: "거부", status: "정상" },
    { id: 8, joinDate: "2026-05-07 10:15", name: "박쇼퍼", email: "shopper3@example.com", marketing: "동의함 (이메일)", status: "정상" },
    { id: 7, joinDate: "2026-05-06 18:22", name: "최멤버", email: "member4@test.com", marketing: "동의함 (SMS)", status: "정상" },
    { id: 6, joinDate: "2026-05-05 09:10", name: "정테스트", email: "test5@mail.com", marketing: "거부", status: "정상" },
    { id: 5, joinDate: "2026-05-04 16:45", name: "강프론트", email: "front6@web.com", marketing: "동의함 (이메일, SMS)", status: "정상" },
    { id: 4, joinDate: "2026-05-03 11:20", name: "조백엔드", email: "backend7@dev.com", marketing: "거부", status: "정상" },
    { id: 3, joinDate: "2026-05-02 14:05", name: "윤디자인", email: "design8@ui.com", marketing: "동의함 (이메일)", status: "정상" },
    { id: 2, joinDate: "2026-05-01 08:30", name: "장기획", email: "plan9@biz.com", marketing: "거부", status: "정상" },
    { id: 1, joinDate: "2026-04-30 20:00", name: "임운영", email: "ops10@sys.com", marketing: "동의함 (이메일, SMS)", status: "휴면" }
];

const DB_NAME = 'SirEcommerceDB';
const STORE_NAME = 'sirStore';

let dbPromise = null;

function initDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e.target.error);
        });
    }
    return dbPromise;
}

let pageCache = { products: null, layout: null, settings: null, members: null };

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : '';

async function dbGet(key) {
    try {
        if (key === 'app_settings') {
            const res = await fetch(`${API_BASE}/api/settings`);
            if(res.ok) return await res.json();
        }
        if (key === 'products') {
            const res = await fetch(`${API_BASE}/api/products`);
            if(res.ok) return await res.json();
        }
        if (key === 'members') {
            const res = await fetch(`${API_BASE}/api/members`);
            if(res.ok) return await res.json();
        }
    } catch(e) { console.error('API fetch error', e); }

    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e.target.error);
    });
}

async function dbPut(key, val) {
    try {
        if (key === 'app_settings') {
            const res = await fetch(`${API_BASE}/api/settings`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(val)
            });
            if(res.ok) return;
        }
        if (key === 'products') {
            const res = await fetch(`${API_BASE}/api/products`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(val)
            });
            if(res.ok) return;
        }
    } catch(e) { console.error('API push error', e); }

    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).put(val, key);
        req.onsuccess = () => resolve();
        req.onerror = e => reject(e.target.error);
    });
}

async function migrateLegacyData() {
    try {
        const migrated = localStorage.getItem('sir_db_migrated');
        if (!migrated) {
            let oldProds = localStorage.getItem('sir_products');
            if (oldProds) {
                try {
                    let parsed = JSON.parse(oldProds);
                    if (Array.isArray(parsed)) await dbPut('products', parsed);
                } catch(e) {}
            }
            let oldLayout = localStorage.getItem('sir_layout');
            if (oldLayout) {
                try {
                    let p = JSON.parse(oldLayout);
                    if(Array.isArray(p)) await dbPut('layout', p);
                } catch(e) {}
            }
            localStorage.setItem('sir_db_migrated', 'true');
        }
    } catch (e) {
        // localStorage might be blocked
    }
}

async function getProducts() {
    if (pageCache.products) return pageCache.products;
    try {
        const data = await dbGet('products');
        pageCache.products = Array.isArray(data) ? data : defaultProducts;
        return pageCache.products;
    } catch(e) {
        return defaultProducts;
    }
}

async function saveProducts(products) {
    await dbPut('products', products);
    pageCache.products = products;
}

async function getLayout() {
    if (pageCache.layout) return pageCache.layout;
    try {
        const data = await dbGet('layout');
        pageCache.layout = Array.isArray(data) ? data : defaultLayout;
        return pageCache.layout;
    } catch(e) {
        return defaultLayout;
    }
}

async function saveLayout(layout) {
    await dbPut('layout', layout);
    pageCache.layout = layout;
}

async function getSettings() {
    if (pageCache.settings) return pageCache.settings;
    try {
        const data = await dbGet('app_settings');
        if (!data) return defaultSettings;
        
        const lbData = data.lookbook || {};
        
        // 데이터 무결성 검증 함수: 손상된 짧은 Data URL이나 빈 문자열을 걸러냅니다.
        function getValidMedia(src, defaultSrc) {
            if (!src || typeof src !== 'string') return defaultSrc;
            
            // 과거에 DB에 저장되어버린 깨진 Unsplash URL 강제 교체 (404 에러 방지)
            if (src.includes('images.unsplash.com')) {
                return defaultSrc; 
            }

            if (src.startsWith('data:')) {
                return src.length > 100 ? src : defaultSrc; 
            }
            if (src.startsWith('http')) return src;
            return defaultSrc;
        }

        const safeLookbook = {
            splitLeft: getValidMedia(lbData.splitLeft, defaultSettings.lookbook.splitLeft),
            splitRight: getValidMedia(lbData.splitRight, defaultSettings.lookbook.splitRight),
            fullWidth: getValidMedia(lbData.fullWidth, defaultSettings.lookbook.fullWidth),
            asymLeft: getValidMedia(lbData.asymLeft, defaultSettings.lookbook.asymLeft),
            asymRight1: getValidMedia(lbData.asymRight1, defaultSettings.lookbook.asymRight1),
            asymRight2: getValidMedia(lbData.asymRight2, defaultSettings.lookbook.asymRight2),
            asymRight3: getValidMedia(lbData.asymRight3, defaultSettings.lookbook.asymRight3),
            asymRight4: getValidMedia(lbData.asymRight4, defaultSettings.lookbook.asymRight4),
            splitLeft2: getValidMedia(lbData.splitLeft2, defaultSettings.lookbook.splitLeft2),
            splitRight2: getValidMedia(lbData.splitRight2, defaultSettings.lookbook.splitRight2),
            splitLeftVideo: getValidMedia(lbData.splitLeftVideo, ''),
            splitRightVideo: getValidMedia(lbData.splitRightVideo, ''),
            fullWidthVideo: getValidMedia(lbData.fullWidthVideo, ''),
            asymLeftVideo: getValidMedia(lbData.asymLeftVideo, ''),
            asymRight1Video: getValidMedia(lbData.asymRight1Video, ''),
            asymRight2Video: getValidMedia(lbData.asymRight2Video, ''),
            asymRight3Video: getValidMedia(lbData.asymRight3Video, ''),
            asymRight4Video: getValidMedia(lbData.asymRight4Video, ''),
            splitLeft2Video: getValidMedia(lbData.splitLeft2Video, ''),
            splitRight2Video: getValidMedia(lbData.splitRight2Video, '')
        };

        // Legacy PromoText Migration
        let migratedMarquee = data.noticesMarquee;
        if (!migratedMarquee && data.promoText) {
            migratedMarquee = data.promoText.split('|').map((t, i) => ({ id: i+1, text: t.trim() })).slice(0, 3);
        }

        const finalSettings = {
            ...defaultSettings,
            ...data,
            lookbook: safeLookbook,
            perks: Array.isArray(data.perks) ? data.perks : defaultSettings.perks,
            noticesMarquee: Array.isArray(migratedMarquee) ? migratedMarquee : defaultSettings.noticesMarquee,
            noticesBoard: Array.isArray(data.noticesBoard) ? data.noticesBoard : defaultSettings.noticesBoard,
            menus: Array.isArray(data.menus) ? data.menus : defaultSettings.menus,
            footerMenus: Array.isArray(data.footerMenus) ? data.footerMenus : defaultSettings.footerMenus
        };
        pageCache.settings = finalSettings;
        return finalSettings;
    } catch(e) {
        return defaultSettings;
    }
}

async function saveSettings(settings) {
    await dbPut('app_settings', settings);
    pageCache.settings = settings;
}

async function getMembers() {
    if (pageCache.members) return pageCache.members;
    try {
        const data = await dbGet('members');
        pageCache.members = Array.isArray(data) ? data : defaultMembers;
        return pageCache.members;
    } catch(e) {
        return defaultMembers;
    }
}

async function saveMembers(members) {
    await dbPut('members', members);
}

// Auto-cleanup old test data from previous sessions
(async function cleanupOldGarbage() {
    try {
        const products = await getProducts();
        const cleanedProducts = products.filter(p => {
            const n = p.name ? p.name.toLowerCase() : '';
            if (n.includes('shopee') || n.includes('margin') || n.includes('test')) return false;
            return true;
        });
        if (cleanedProducts.length !== products.length) {
            await saveProducts(cleanedProducts);
            console.log('Old test images cleaned up.');
        }
    } catch(e) {}
})();

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}


