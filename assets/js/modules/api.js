// Supabase API 연동 모듈
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = IS_LOCAL ? 'http://localhost:3000' : '';

/**
 * 전역 설정 데이터 (공지, 메뉴, 푸터 등) 불러오기
 */
export async function getSettings() {
    try {
        const res = await fetch(`${API_BASE}/api/settings`);
        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        
        // 기본값 초기화
        const defaultSettings = {
            noticesBoard: [],
            menus: [],
            footerMenus: [
                { title: '고객 센터', items: [] },
                { title: '회사 정보', items: [] },
                { title: '법적 고지', items: [] }
            ],
            perks: [
                { title: 'Worldwide Instant Exchanges', desc: 'Easy online size swaps' },
                { title: 'Express Global Shipping', desc: 'Complimentary on orders over $400USD' },
                { title: 'SIR. Loyalty', desc: 'Earn points and move through our tiered program' }
            ],
            perksHashtag: '#SIRTHELABEL',
            promoSpeed: 40
        };
        
        return { ...defaultSettings, ...data };
    } catch (e) {
        console.error('getSettings error:', e);
        // Fallback to local storage if API fails temporarily
        const local = localStorage.getItem('complexnumber_settings');
        return local ? JSON.parse(local) : {
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
            footerMenus: [
                { title: '고객 센터', items: [] },
                { title: '회사 정보', items: [] },
                { title: '법적 고지', items: [] }
            ],
            perks: [
                { title: 'Worldwide Instant Exchanges', desc: 'Easy online size swaps' },
                { title: 'Express Global Shipping', desc: 'Complimentary on orders over $400USD' },
                { title: 'SIR. Loyalty', desc: 'Earn points and move through our tiered program' }
            ],
            perksHashtag: '#SIRTHELABEL',
            promoSpeed: 40
        };

        if (local) {
            try {
                const parsed = JSON.parse(local);
                if (parsed && typeof parsed === 'object') return { ...defaultSettings, ...parsed };
            } catch(err) {}
        }
        return defaultSettings;
    }
}

/**
 * 전역 설정 데이터 (공지, 메뉴, 푸터 등) 저장하기
 */
export async function saveSettings(settingsData) {
    try {
        const res = await fetch(`${API_BASE}/api/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsData)
        });
        if (!res.ok) throw new Error('Failed to save settings');
        
        // 로컬 스토리지 백업 (실패 대비)
        localStorage.setItem('complexnumber_settings', JSON.stringify(settingsData));
        return await res.json();
    } catch (e) {
        console.error('saveSettings error:', e);
        // Fallback to local storage
        localStorage.setItem('complexnumber_settings', JSON.stringify(settingsData));
        return { success: true, offline: true };
    }
}

/**
 * 회원 목록 불러오기
 */
export async function getMembers() {
    try {
        const res = await fetch(`${API_BASE}/api/members`);
        if (!res.ok) throw new Error('Failed to fetch members');
        return await res.json();
    } catch (e) {
        console.error('getMembers error:', e);
        return [];
    }
}

/**
 * 상품 목록 불러오기
 */
export async function getProducts() {
    try {
        const res = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return await res.json();
    } catch (e) {
        console.error('getProducts error:', e);
        const local = localStorage.getItem('complexnumber_products');
        if (local) {
            try {
                const parsed = JSON.parse(local);
                return Array.isArray(parsed) ? parsed : [];
            } catch(err) { return []; }
        }
        return [];
    }
}

/**
 * 상품 개별 저장 (Insert or Update)
 */
export async function saveProduct(productData) {
    try {
        const res = await fetch(`${API_BASE}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (!res.ok) throw new Error('Failed to save product');
        return await res.json();
    } catch (e) {
        console.error('saveProduct error:', e);
        return { success: false, error: e.message };
    }
}

/**
 * 상품 개별 삭제
 */
export async function deleteProductApi(id) {
    try {
        const res = await fetch(`${API_BASE}/api/products/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete product');
        return await res.json();
    } catch (e) {
        console.error('deleteProduct error:', e);
        return { success: false, error: e.message };
    }
}
