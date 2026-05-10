// assets/js/layout-builder.js

document.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('view-lookbook')) return;

    const settings = await getSettings();

    // 1. Sub-tab navigation logic
    const tabLookbook = document.getElementById('subtab-lookbook');
    const tabShop = document.getElementById('subtab-shop');
    const tabDetail = document.getElementById('subtab-detail');
    
    const viewLookbook = document.getElementById('subview-lookbook-main');
    const viewShop = document.getElementById('subview-shop-layout');
    const viewDetail = document.getElementById('subview-detail-layout');

    function switchSubTab(targetView, targetBtn) {
        [viewLookbook, viewShop, viewDetail].forEach(v => v.style.display = 'none');
        [tabLookbook, tabShop, tabDetail].forEach(btn => {
            btn.style.background = '#f5f5f5';
            btn.style.color = '#333';
        });
        
        targetView.style.display = 'block';
        targetBtn.style.background = '#111';
        targetBtn.style.color = '#fff';
    }

    tabLookbook.onclick = () => switchSubTab(viewLookbook, tabLookbook);
    tabShop.onclick = () => switchSubTab(viewShop, tabShop);
    tabDetail.onclick = () => switchSubTab(viewDetail, tabDetail);

    // 2. Data Definitions
    const SHOP_COMPONENTS = {
        'shop_header': '카테고리 타이틀 헤더',
        'shop_filter_sidebar': '좌측 필터 사이드바 (카테고리/가격)',
        'shop_product_grid': '상품 리스트 그리드',
        'promo_banner': '가로형 프로모션 배너'
    };

    const DETAIL_COMPONENTS = {
        'detail_breadcrumb': '상단 이동 경로 (Breadcrumb)',
        'detail_gallery': '상품 사진 및 영상 갤러리',
        'detail_title_info': '상품 제목 및 핵심 요약 정보',
        'detail_purchase_form': '옵션 선택 및 구매 버튼',
        'detail_description': '상세설명 탭 내용',
        'detail_recommended': '추천 상품 리스트',
        'detail_recently_viewed': '자주본 상품 리스트',
        'detail_reviews': '상품 리뷰 게시판',
        'detail_qna': 'Q&A 게시판'
    };

    const DEFAULT_SHOP_LAYOUT = {
        zones: [
            { id: 'z1', blocks: [{ width: 100, component: 'shop_header' }] },
            { id: 'z2', blocks: [{ width: 25, component: 'shop_filter_sidebar' }, { width: 75, component: 'shop_product_grid' }] }
        ]
    };

    const DEFAULT_DETAIL_LAYOUT = {
        zones: [
            { id: 'z1', blocks: [{ width: 100, component: 'detail_breadcrumb' }] },
            { id: 'z2', blocks: [{ width: 50, component: 'detail_gallery' }, { width: 50, component: 'detail_purchase_form' }] },
            { id: 'z3', blocks: [{ width: 100, component: 'detail_title_info' }] },
            { id: 'z4', blocks: [{ width: 100, component: 'detail_description' }] },
            { id: 'z5', blocks: [{ width: 100, component: 'detail_recommended' }] },
            { id: 'z6', blocks: [{ width: 100, component: 'detail_recently_viewed' }] }
        ]
    };

    // Initialize data if not present
    if (!settings.shopLayout) settings.shopLayout = JSON.parse(JSON.stringify(DEFAULT_SHOP_LAYOUT));
    if (!settings.detailLayout) settings.detailLayout = JSON.parse(JSON.stringify(DEFAULT_DETAIL_LAYOUT));

    // 3. Generic Builder Function
    function createComponentBuilder(containerId, layoutData, componentDict, saveKey) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        function render() {
            let html = `
                <div style="background: #f9f9f9; border: 2px dashed #ccc; min-height: 200px; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            `;
            
            if (layoutData.zones.length === 0) {
                html += '<div style="text-align: center; padding: 3rem; color: #aaa;">구역이 없습니다. 추가해주세요.</div>';
            }

            layoutData.zones.forEach((zone, zIdx) => {
                html += `
                    <div style="background: #fff; border: 1px solid #ddd; margin-bottom: 1rem; padding: 1rem; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee;">
                            <span style="font-weight: 600; color: #555;">구역 ${zIdx + 1}</span>
                            <div>
                                <button class="btn add-cb-btn" data-zidx="${zIdx}" style="background:#f1f5f9; color:#334155; padding:0.2rem 0.5rem; font-size:0.8rem; border:1px solid #cbd5e1; margin-right: 0.5rem;">+ 컬럼 분할 추가</button>
                                <button class="btn del-zone-btn" data-zidx="${zIdx}" style="background:#fee2e2; color:#ef4444; padding:0.2rem 0.5rem; font-size:0.8rem; border:1px solid #fecaca;">삭제</button>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                `;
                
                zone.blocks.forEach((block, bIdx) => {
                    let selectOptions = `<option value="">-- 컴포넌트 선택 --</option>`;
                    for (const [key, name] of Object.entries(componentDict)) {
                        selectOptions += `<option value="${key}" ${block.component === key ? 'selected' : ''}>${name}</option>`;
                    }

                    html += `
                        <div style="flex: ${block.width}%; border: 1px solid #e2e8f0; border-radius: 4px; padding: 1rem; background: #f8fafc; text-align: center;">
                            <div style="margin-bottom: 0.5rem; font-size: 0.8rem; color: #64748b;">너비: ${block.width.toFixed(1)}%</div>
                            <select class="form-control comp-select" data-zidx="${zIdx}" data-bidx="${bIdx}" style="width: 100%; font-size: 0.85rem; padding: 0.4rem;">
                                ${selectOptions}
                            </select>
                            <button class="btn del-cb-btn" data-zidx="${zIdx}" data-bidx="${bIdx}" style="margin-top: 0.5rem; font-size: 0.75rem; background: transparent; color: #ef4444; text-decoration: underline; border: none; cursor: pointer; padding: 0;">블럭 삭제</button>
                        </div>
                    `;
                });
                
                html += `</div></div>`;
            });
            
            html += `</div>
                <div style="display: flex; justify-content: space-between;">
                    <button class="btn add-zone-main-btn" style="background: #28a745; color: white;">+ 구역(행) 추가</button>
                    <div>
                        <button class="btn reset-layout-btn" style="background: #dc3545; color: white; margin-right: 0.5rem;">초기화(디폴트)</button>
                        <button class="btn save-layout-btn" style="background: #111; color: white;">적용 및 저장</button>
                    </div>
                </div>
            `;
            
            container.innerHTML = html;
            attachEvents();
        }

        function attachEvents() {
            container.querySelector('.add-zone-main-btn').onclick = () => {
                layoutData.zones.push({ id: 'z'+Date.now(), blocks: [{ width: 100, component: '' }] });
                render();
            };

            container.querySelectorAll('.add-cb-btn').forEach(btn => btn.onclick = (e) => {
                const zIdx = parseInt(e.target.dataset.zidx);
                const zone = layoutData.zones[zIdx];
                if(zone.blocks.length >= 4) { alert('최대 4단 분할까지만 가능합니다.'); return; }
                const newWidth = 100 / (zone.blocks.length + 1);
                zone.blocks.forEach(b => b.width = newWidth);
                zone.blocks.push({ width: newWidth, component: '' });
                render();
            });

            container.querySelectorAll('.del-zone-btn').forEach(btn => btn.onclick = (e) => {
                const zIdx = parseInt(e.target.dataset.zidx);
                if(confirm('이 구역을 삭제하시겠습니까?')) {
                    layoutData.zones.splice(zIdx, 1);
                    render();
                }
            });

            container.querySelectorAll('.del-cb-btn').forEach(btn => btn.onclick = (e) => {
                const zIdx = parseInt(e.target.dataset.zidx);
                const bIdx = parseInt(e.target.dataset.bidx);
                const zone = layoutData.zones[zIdx];
                if(zone.blocks.length <= 1) { alert('최소 1개의 블럭은 존재해야 합니다. 구역 자체를 삭제하세요.'); return; }
                zone.blocks.splice(bIdx, 1);
                const newWidth = 100 / zone.blocks.length;
                zone.blocks.forEach(b => b.width = newWidth);
                render();
            });

            container.querySelectorAll('.comp-select').forEach(sel => sel.onchange = (e) => {
                const zIdx = parseInt(e.target.dataset.zidx);
                const bIdx = parseInt(e.target.dataset.bidx);
                layoutData.zones[zIdx].blocks[bIdx].component = e.target.value;
            });

            container.querySelector('.save-layout-btn').onclick = async () => {
                settings[saveKey] = JSON.parse(JSON.stringify(layoutData));
                await saveSettings(settings);
                alert('레이아웃이 성공적으로 저장되었습니다!');
            };

            container.querySelector('.reset-layout-btn').onclick = () => {
                if(confirm('프론트엔드 기본 구조(디폴트)로 되돌리시겠습니까?')) {
                    layoutData = JSON.parse(JSON.stringify(saveKey === 'shopLayout' ? DEFAULT_SHOP_LAYOUT : DEFAULT_DETAIL_LAYOUT));
                    render();
                }
            };
        }

        render();
    }

    // 4. Initialize Builders
    createComponentBuilder('shop-layout-container', settings.shopLayout, SHOP_COMPONENTS, 'shopLayout');
    createComponentBuilder('detail-layout-container', settings.detailLayout, DETAIL_COMPONENTS, 'detailLayout');
});
