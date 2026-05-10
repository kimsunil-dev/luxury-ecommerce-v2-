import { initEditor } from '../modules/editor.js';
import { initNotices } from './notices.js';
import { initSettings } from './settings.js';
import { initFooter } from './footer.js';
import { initMembers, renderMembers } from './members.js';
import { initProducts } from './products.js';

// Global error handler
window.addEventListener('error', (e) => {
    console.error('JS 에러:', e.error);
    const errDiv = document.getElementById('debug-console') || document.createElement('div');
    errDiv.id = 'debug-console';
    errDiv.style = "position:fixed; bottom:0; left:0; right:0; background:rgba(200,0,0,0.8); color:#fff; padding:10px; z-index:999999; max-height:200px; overflow-y:auto; font-size:12px;";
    errDiv.innerHTML += `<div>${e.message} at ${e.filename}:${e.lineno}</div>`;
    if(!document.getElementById('debug-console')) document.body.appendChild(errDiv);
});

document.addEventListener('DOMContentLoaded', async () => {
    // 1. 공통 에디터 도구 초기화
    initEditor();

    // 2. 각 기능 모듈 초기화
    await Promise.all([
        initNotices(),
        initSettings(),
        initFooter(),
        initMembers(),
        initProducts()
        // lookbook은 기존 lookbook-builder.js에서 분리하여 처리 (스크립트 로드)
    ]);

    // 3. 네비게이션 탭 설정
    setupNavigation();
    
    // 라이브 시계
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
        setInterval(() => {
            const now = new Date();
            clockEl.innerText = now.toLocaleString('ko-KR');
        }, 1000);
    }
});

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const adminViews = document.querySelectorAll('.admin-view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            navItems.forEach(nav => nav.classList.remove('active'));
            adminViews.forEach(view => view.classList.remove('active'));
            
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.classList.add('active');
                if (targetId === 'view-members') {
                    renderMembers(); // 탭 전환 시 회원 목록 새로고침
                }
            }
        });
    });

    // Subtabs for Settings/Notices
    const subtabs = ['notices', 'footer', 'perks'];
    subtabs.forEach(tab => {
        const btn = document.getElementById(`subtab-${tab}`);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                subtabs.forEach(t => {
                    const tBtn = document.getElementById(`subtab-${t}`);
                    if(tBtn) {
                        tBtn.style.background = '#f5f5f5';
                        tBtn.style.color = '#333';
                    }
                    const subview = document.getElementById(`subview-${t}`);
                    if(subview) subview.style.display = 'none';
                });
                btn.style.background = '#111';
                btn.style.color = '#fff';
                const activeView = document.getElementById(`subview-${tab}`);
                if(activeView) activeView.style.display = 'block';
            });
        }
    });
}
