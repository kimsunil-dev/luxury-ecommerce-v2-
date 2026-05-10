// Global Error Tracking
window.addEventListener('error', function(e) {
    if (e.message === 'Script error.' && !e.filename) return; // Ignore opaque/extension errors
    if (e.message && e.message.includes('Script error.') && e.lineno === 0) return;
    const errDiv = document.createElement('div');
    errDiv.style = "position:fixed;top:50px;left:0;background:red;color:white;z-index:9999;padding:20px;font-size:16px;width:100%;box-sizing:border-box;box-shadow:0 4px 10px rgba(0,0,0,0.3);";
    errDiv.innerText = `JS ERROR: ${e.message} at ${e.filename}:${e.lineno}`;
    document.body.appendChild(errDiv);
});
window.addEventListener('unhandledrejection', function(e) {
    const errDiv = document.createElement('div');
    errDiv.style = "position:fixed;top:100px;left:0;background:orange;color:white;z-index:9999;padding:20px;font-size:16px;width:100%;box-sizing:border-box;";
    errDiv.innerText = `PROMISE REJECTION: ${e.reason}`;
    document.body.appendChild(errDiv);
});

document.addEventListener('DOMContentLoaded', async () => {
    let products = [];
    let settings = {};
    let members = [];
    try {
        await migrateLegacyData();
        products = await getProducts();
        settings = await getSettings();
        members = await getMembers();
    } catch (e) {
        console.error("Database connection failed. UI will load without data:", e);
    }
    try {
        const tableBody = document.getElementById('admin-table-body');
        const form = document.getElementById('product-form');

    // 이미지 리사이징 함수 (1200px) - 화질 저하 없이 사진 용량만 효율화
    window.compressImage = function(file, callback) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 2560; 
                const MAX_HEIGHT = 2560;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/webp', 0.85); // 최적화된 WEBP 포맷 적용
                callback(dataUrl);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function renderTable() {
        try {
            if (!tableBody) return;
            tableBody.innerHTML = '';
            const displayProducts = [...products].reverse();
            displayProducts.forEach(product => {
                const tr = document.createElement('tr');
                const priceNum = Number(product.price) || 0;
                tr.innerHTML = `
                    <td><img src="${product.image || ''}" class="admin-thumbnail" alt="${product.name || 'No Name'}"></td>
                    <td>${product.name || '이름 없음'}</td>
                    <td>${product.category || '카테고리 없음'}</td>
                    <td>₩${priceNum.toLocaleString()}</td>
                    <td>
                        <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">삭제</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        } catch(e) {
            console.error("테이블 렌더링 오류:", e);
        }
    }

    window.deleteProduct = async function(id) {
        if(confirm('정말로 이 상품을 삭제하시겠습니까?')) {
            products = products.filter(p => String(p.id) !== String(id));
            await saveProducts(products);
            renderTable();
        }
    };

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
        
        const imageFile = document.getElementById('product-image').files[0];
        const subImageFiles = document.getElementById('product-sub-images') ? document.getElementById('product-sub-images').files : [];
        const videoFile = document.getElementById('product-video').files[0];
        
        if (!imageFile) {
            alert('메인 이미지를 선택해주세요.');
            return;
        }

        if (subImageFiles.length > 12) {
            alert('서브 이미지는 최대 12장까지만 등록 가능합니다.');
            return;
        }

        const compressImageAsync = (file) => {
            return new Promise(resolve => {
                compressImage(file, resolve);
            });
        };

        try {
            const mainImgData = await compressImageAsync(imageFile);
            
            const subImagesData = [];
            for (let i = 0; i < subImageFiles.length; i++) {
                const subImgData = await compressImageAsync(subImageFiles[i]);
                subImagesData.push(subImgData);
            }

            let vidData = null;
            if (videoFile) {
                vidData = await new Promise(resolve => {
                    const videoReader = new FileReader();
                    videoReader.onload = vEvent => resolve(vEvent.target.result);
                    videoReader.readAsDataURL(videoFile);
                });
            }

            const newProduct = {
                id: Date.now(),
                name: document.getElementById('product-name').value,
                price: parseFloat(document.getElementById('product-price').value),
                color: document.getElementById('product-color') ? document.getElementById('product-color').value || '#ffffff' : '#ffffff',
                sizes: document.getElementById('product-sizes') ? document.getElementById('product-sizes').value : '',
                description: document.getElementById('editor-product') ? document.getElementById('editor-product').innerHTML : '',
                image: mainImgData,
                subImages: subImagesData,
                video: vidData,
                category: document.getElementById('product-category').value,
                relatedProducts: document.getElementById('product-related') ? document.getElementById('product-related').value : ''
            };

            products.push(newProduct);
            await saveProducts(products);
            renderTable();
            form.reset();
            alert('상품이 성공적으로 추가되었습니다!');
        } catch (error) {
            console.error(error);
            alert('저장 오류가 발생했습니다.');
            if (products.length > 0) {
                products.pop();
            }
        }
        });
    }

    renderTable();

    // --- 기본 설정 및 룩북 관리 로직 ---
    /* settings already fetched */
    /* members already fetched */

    // --- 회원 관리 로직 ---
    const memberTableBody = document.getElementById('member-table-body');
    const memberTotalCount = document.getElementById('member-total-count');
    const memberNewCount = document.getElementById('member-new-count');

    // --- 1. Notice Board ---
    const noticeBoardContainer = document.getElementById('notice-board-container');
    
    // 모달 DOM 생성 (없을 경우)
    let noticeModal = document.getElementById('notice-modal');
    if(!noticeModal) {
        noticeModal = document.createElement('div');
        noticeModal.id = 'notice-modal';
        noticeModal.style = "display:none; position:fixed; top:0; left:250px; width:calc(100% - 250px); height:100%; background:rgba(0,0,0,0.5); z-index:10000; justify-content:center; align-items:center;";
        noticeModal.innerHTML = `
            <div style="background:#fff; width:95%; max-width:1200px; border-radius:8px; padding:2rem; position:relative; max-height:90vh; overflow-y:auto; color:#111;">
                <button onclick="closeNoticeModal()" style="position:absolute; right:1.5rem; top:1.5rem; background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                <h3 style="margin-bottom:1.5rem; font-size:1.2rem;" id="notice-modal-heading">새 공지사항 추가</h3>
                
                <input type="hidden" id="notice-modal-index">
                
                <label style="display:block; margin-bottom:0.5rem; font-weight:600; font-size:0.9rem;">날짜</label>
                <input type="date" id="notice-modal-date" class="form-control" style="margin-bottom:1rem;">
                
                <label style="display:block; margin-bottom:0.5rem; font-weight:600; font-size:0.9rem;">제목</label>
                <input type="text" id="notice-modal-title-input" class="form-control" placeholder="공지 제목 입력" style="margin-bottom:1rem;">
                
                <label style="display:block; margin-bottom:0.5rem; font-weight:600; font-size:0.9rem;">이미지 추가 (선택)</label>
                <input type="file" id="notice-modal-img" accept="image/*" class="form-control" style="margin-bottom:0.5rem; font-size:0.8rem;">
                <div id="notice-modal-img-preview" style="margin-bottom:1rem;"></div>
                
                <label style="display:block; margin-bottom:0.5rem; font-weight:600; font-size:0.9rem;">영상 추가 (선택)</label>
                <input type="file" id="notice-modal-vid" accept="video/*" class="form-control" style="margin-bottom:1rem; font-size:0.8rem;">
                <div id="notice-modal-vid-preview" style="margin-bottom:1rem;"></div>
                
                <label id="footer-layout-label" style="display:none; margin-bottom:0.5rem; font-weight:600; font-size:0.9rem;">페이지 레이아웃</label>
                <select id="footer-layout-select" class="form-control" style="display:none; margin-bottom:1rem;">
                    <option value="standard">일반 1단 페이지</option>
                    <option value="contact">2단 분할 레이아웃 (Contact 등)</option>
                </select>

                <div id="footer-editor-toolbar" style="display:none; gap:0.5rem; margin-bottom:0.5rem; flex-wrap:wrap; align-items:center;">
                    <button class="btn" onclick="document.execCommand('bold')" style="padding:0.2rem 0.5rem; font-size:0.8rem; background:#f0f0f0; color:#333; border:1px solid #ddd; font-weight:bold;">B (굵게)</button>
                    <button class="btn" onclick="document.execCommand('formatBlock', false, 'H3')" style="padding:0.2rem 0.5rem; font-size:0.8rem; background:#f0f0f0; color:#333; border:1px solid #ddd; font-weight:bold;">H3 (소제목)</button>
                    <span style="border-left:1px solid #ccc; height:1rem; margin:0 0.2rem;"></span>
                    <button class="btn" onclick="insertTable()" style="padding:0.2rem 0.5rem; font-size:0.8rem; background:#fff; color:#333; border:1px solid #ddd;">▦ 표 삽입</button>
                    <button class="btn" onclick="insertTableRow()" style="padding:0.2rem 0.5rem; font-size:0.8rem; background:#fff; color:#333; border:1px solid #ddd;">➕ 줄 추가</button>
                    <button class="btn" onclick="deleteTableRow()" style="padding:0.2rem 0.5rem; font-size:0.8rem; background:#fff; color:#cb1400; border:1px solid #ddd;">➖ 줄 삭제</button>
                    <span style="border-left:1px solid #ccc; height:1rem; margin:0 0.2rem;"></span>
                </div>
                
                <div id="table-properties-toolbar" style="display:none; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap; align-items:center; background:#f9f9f9; padding:0.8rem; border:1px solid #ddd; border-radius:4px;">
                    <span style="font-size:0.8rem; font-weight:600; color:#111;">[표 디자인 설정]</span>
                    <label style="font-size:0.8rem; display:flex; align-items:center; gap:0.3rem; margin-left:0.5rem;" title="마우스로 드래그해서 표 전체 가로 너비를 조절하세요">
                        가로 너비 <input type="range" min="20" max="100" value="100" onchange="changeTableWidth(this.value)" style="width:60px; cursor:pointer;">
                    </label>
                    <label style="font-size:0.8rem; display:flex; align-items:center; gap:0.3rem; margin-left:0.5rem;" title="마우스로 드래그해서 표 전체 세로 높이를 조절하세요">
                        세로 높이 <input type="range" min="50" max="800" value="100" onchange="changeTableHeight(this.value)" style="width:60px; cursor:pointer;">
                    </label>
                    <span style="border-left:1px solid #ccc; height:1rem; margin:0 0.2rem;"></span>
                    <label style="font-size:0.8rem; display:flex; align-items:center; gap:0.3rem;" title="칸 안의 글자 정렬 방향을 선택하세요">
                        글자 정렬 
                        <select onchange="changeCellTextAlign(this.value)" style="padding:0.1rem;">
                            <option value="">-선택-</option>
                            <option value="left">왼쪽 정렬</option>
                            <option value="center">가운데 정렬</option>
                            <option value="right">오른쪽 정렬</option>
                        </select>
                    </label>
                    <span style="border-left:1px solid #ccc; height:1rem; margin:0 0.2rem;"></span>
                    <button class="btn" onclick="insertTableColumn()" style="padding:0.1rem 0.4rem; font-size:0.75rem; background:#fff; color:#333; border:1px solid #ddd;" title="클릭한 칸의 오른쪽에 새 칸을 추가합니다">✚ 칸 추가</button>
                    <button class="btn" onclick="deleteTableColumn()" style="padding:0.1rem 0.4rem; font-size:0.75rem; background:#fff; color:#cb1400; border:1px solid #ddd;" title="클릭한 칸을 삭제합니다">➖ 칸 삭제</button>
                    <span style="border-left:1px solid #ccc; height:1rem; margin:0 0.2rem;"></span>
                    <label style="font-size:0.8rem; display:flex; align-items:center; gap:0.3rem;" title="테두리 두께를 선택하세요">
                        테두리 굵기 
                        <select onchange="changeTableBorderThickness(this.value)" style="padding:0.1rem;">
                            <option value="0px">없음</option>
                            <option value="1px">얇게 (1px)</option>
                            <option value="2px">보통 (2px)</option>
                            <option value="3px">굵게 (3px)</option>
                        </select>
                    </label>
                    <label style="font-size:0.8rem; display:flex; align-items:center; gap:0.3rem; margin-left:0.5rem;" title="테두리 색상을 선택하세요">
                        선 색상 <input type="color" onchange="changeTableBorderColor(this.value)" value="#e5e5e5" style="width:24px; height:24px; padding:0; border:1px solid #ddd; cursor:pointer;">
                    </label>
                    <span style="border-left:1px solid #ccc; height:1rem; margin:0 0.2rem;"></span>
                    <div style="display:flex; align-items:center; gap:0.15rem;" title="클릭한 칸(셀)에 색상을 입힙니다">
                        <span style="font-size:0.8rem; margin-right:0.3rem;">칸 색상</span>
                        <div onclick="changeCellColor('#ffffff')" style="width:16px;height:16px;background:#ffffff;border:1px solid #ccc;cursor:pointer;" title="순백색"></div>
                        <div onclick="changeCellColor('#fcfcfc')" style="width:16px;height:16px;background:#fcfcfc;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#f8f8f8')" style="width:16px;height:16px;background:#f8f8f8;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#f0f0f0')" style="width:16px;height:16px;background:#f0f0f0;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#e8e8e8')" style="width:16px;height:16px;background:#e8e8e8;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#e0e0e0')" style="width:16px;height:16px;background:#e0e0e0;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#d0d0d0')" style="width:16px;height:16px;background:#d0d0d0;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#b8b8b8')" style="width:16px;height:16px;background:#b8b8b8;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#a0a0a0')" style="width:16px;height:16px;background:#a0a0a0;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#808080')" style="width:16px;height:16px;background:#808080;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#606060')" style="width:16px;height:16px;background:#606060;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#404040')" style="width:16px;height:16px;background:#404040;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#282828')" style="width:16px;height:16px;background:#282828;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#111111')" style="width:16px;height:16px;background:#111111;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#000000')" style="width:16px;height:16px;background:#000000;border:1px solid #ccc;cursor:pointer;" title="순흑색"></div>
                    </div>
                </div>

                <label id="notice-content-label" style="display:block; margin-bottom:0.5rem; font-weight:600; font-size:0.9rem;">상세 내용</label>
                <div id="editor-standard-container" style="display:block;">
                    <div id="editor-standard" contenteditable="true" class="form-control rich-editor" style="min-height:500px; resize:vertical; margin-bottom:1rem; overflow-y:auto; background:#fafafa; font-size:0.9rem; line-height:1.6;"></div>
                </div>

                <div id="editor-contact-container" style="display:none; flex-direction:column; gap:1rem; margin-bottom:1rem;">
                    <div style="display:flex; gap:1rem;">
                        <div style="flex:1;">
                            <label style="display:block; margin-bottom:0.5rem; font-weight:600; font-size:0.85rem; color:#555;">왼쪽 단 내용</label>
                            <div id="editor-contact-left" contenteditable="true" class="form-control rich-editor" style="min-height:400px; resize:vertical; overflow-y:auto; background:#fafafa; font-size:0.9rem; line-height:1.6;"></div>
                        </div>
                        <div style="flex:1;">
                            <label style="display:block; margin-bottom:0.5rem; font-weight:600; font-size:0.85rem; color:#555;">오른쪽 단 내용</label>
                            <div id="editor-contact-right" contenteditable="true" class="form-control rich-editor" style="min-height:400px; resize:vertical; overflow-y:auto; background:#fafafa; font-size:0.9rem; line-height:1.6;"></div>
                        </div>
                    </div>
                    <div>
                        <label style="display:block; margin-bottom:0.5rem; font-weight:600; font-size:0.85rem; color:#555;">하단 내용 (가로 전체)</label>
                        <div id="editor-contact-bottom" contenteditable="true" class="form-control rich-editor" style="min-height:300px; resize:vertical; overflow-y:auto; background:#fafafa; font-size:0.9rem; line-height:1.6;"></div>
                    </div>
                </div>
                
                <div style="display:flex; justify-content:flex-end;">
                    <button class="btn" onclick="saveNoticeModal()" style="background:#111; padding:0.8rem 2.5rem; font-size:1rem;">저장</button>
                </div>
            </div>
        `;
        document.body.appendChild(noticeModal);

        // 레이아웃 변경 이벤트 리스너
        document.getElementById('footer-layout-select').addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'contact') {
                document.getElementById('editor-standard-container').style.display = 'none';
                document.getElementById('editor-contact-container').style.display = 'flex';
            } else {
                document.getElementById('editor-standard-container').style.display = 'block';
                document.getElementById('editor-contact-container').style.display = 'none';
            }
        });
    }

    window.currentNoticePage = window.currentNoticePage || 1;

    function renderNoticeBoard() {
        if(!noticeBoardContainer) return;
        
        // 최신 글이 위로 오도록 정렬 (top-down)
        settings.noticesBoard.sort((a, b) => {
            const dateA = new Date(a.date).getTime() || 0;
            const dateB = new Date(b.date).getTime() || 0;
            return dateB - dateA || b.id - a.id;
        });

        const pageSize = 10;
        const totalItems = settings.noticesBoard.length;
        const totalPages = Math.ceil(totalItems / pageSize) || 1;
        
        if (window.currentNoticePage > totalPages) window.currentNoticePage = totalPages;
        if (window.currentNoticePage < 1) window.currentNoticePage = 1;

        const startIndex = (window.currentNoticePage - 1) * pageSize;
        const paginatedNotices = settings.noticesBoard.slice(startIndex, startIndex + pageSize);

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div>전체 <strong>${totalItems}</strong>개 (페이지 ${window.currentNoticePage}/${totalPages})</div>
                <button class="btn" onclick="openNoticeModal(-1)">+ 새 공지사항 추가</button>
            </div>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th style="width:50px; text-align:center;">번호</th>
                        <th style="width:50px; text-align:center;">선택</th>
                        <th>날짜</th>
                        <th>제목</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>`;
                
        if (paginatedNotices.length === 0) {
            html += `<tr><td colspan="5" style="text-align:center; padding: 2rem;">등록된 공지사항이 없습니다.</td></tr>`;
        } else {
            paginatedNotices.forEach((notice, i) => {
                const absoluteIndex = startIndex + i;
                const displayNo = totalItems - absoluteIndex; // 역순 번호
                html += `<tr>
                    <td style="text-align:center; padding: 0.3rem;">${displayNo}</td>
                    <td style="text-align:center; padding: 0.3rem;"><input type="checkbox" class="notice-checkbox" data-index="${absoluteIndex}"></td>
                    <td style="width:130px; padding: 0.3rem; font-size: 0.85rem;">${notice.date}</td>
                    <td style="cursor:pointer; padding: 0.3rem; font-size: 0.85rem;" onclick="openNoticeModal(${absoluteIndex})"><span style="border-bottom:1px solid #111;">${notice.title || '(제목 없음)'}</span></td>
                    <td style="width:120px; text-align:center; padding: 0.3rem;">
                        <div style="display: flex; gap: 0.2rem; justify-content: center;">
                            <button class="btn" onclick="openNoticeModal(${absoluteIndex})" style="background:#111; padding: 0.2rem 0.4rem; font-size: 0.7rem; flex: 1;">수정</button>
                            <button class="btn btn-danger" onclick="deleteNotice(${absoluteIndex})" style="padding: 0.2rem 0.4rem; font-size: 0.7rem; flex: 1;">삭제</button>
                        </div>
                    </td>
                </tr>`;
            });
        }
        
        let pageButtons = '';
        let startPage = Math.floor((window.currentNoticePage - 1) / 10) * 10 + 1;
        let endPage = Math.min(startPage + 9, totalPages);
        
        for (let p = startPage; p <= endPage; p++) {
            if (p === window.currentNoticePage) {
                pageButtons += `<button class="btn" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; background: #111; color: #fff; border: 1px solid #111;">${p}</button>`;
            } else {
                pageButtons += `<button class="btn" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; background: transparent; color: #111; border: 1px solid #ccc;" onclick="changeNoticePage(${p})">${p}</button>`;
            }
        }

        html += `</tbody></table>
            <div style="position: relative; display: flex; justify-content: center; align-items: center; margin-top:1rem; min-height: 2rem;">
                <button class="btn btn-danger" onclick="deleteSelectedNotices()" style="position: absolute; left: 0; padding: 0.3rem 0.6rem; font-size: 0.75rem;">선택 삭제</button>
                
                <div class="pagination" style="display:flex; gap:0.3rem; align-items:center;">
                    <button class="btn" onclick="changeNoticePage(${window.currentNoticePage - 1})" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; background: transparent; color: #111; border: 1px solid #ccc;" ${window.currentNoticePage === 1 ? 'disabled' : ''}>이전</button>
                    ${pageButtons}
                    <button class="btn" onclick="changeNoticePage(${window.currentNoticePage + 1})" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; background: transparent; color: #111; border: 1px solid #ccc;" ${window.currentNoticePage === totalPages ? 'disabled' : ''}>다음</button>
                </div>
            </div>
            
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e5e5; display: flex; flex-direction: column; gap: 0.5rem;">
                <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600;">상단 띠 배너(Marquee) 흐름 속도 제어</h4>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.75rem; color: #666; display: block; margin-bottom: 0.3rem;">좌측: 느림 ◀ ▶ 우측: 빠름</label>
                    <input type="range" id="promo-speed-input" min="10" max="60" value="${settings.promoSpeed || 40}" style="width: 100%; margin-bottom: 0.3rem;" oninput="document.getElementById('promo-speed-display').innerText = this.value">
                    <small class="help-text" style="font-size: 0.7rem; color: #999;">현재 속도 레벨: <span id="promo-speed-display" style="font-weight: 600; color: #111;">${settings.promoSpeed || 40}</span> / 60</small>
                </div>
                <button class="btn" onclick="savePromoSpeed()" style="background:#111; padding: 0.4rem 1rem; font-size: 0.8rem; align-self: flex-start;">속도 설정 저장</button>
            </div>`;
            
        noticeBoardContainer.innerHTML = html;
    }
    
    window.changeNoticePage = (page) => {
        window.currentNoticePage = page;
        renderNoticeBoard();
    };
    
    window.openNoticeModal = (index) => {
        const modal = document.getElementById('notice-modal');
        const h3 = document.getElementById('notice-modal-heading');
        const idxInput = document.getElementById('notice-modal-index');
        const dateInput = document.getElementById('notice-modal-date');
        const titleInput = document.getElementById('notice-modal-title-input');
        const editorStandard = document.getElementById('editor-standard');
        const imgInput = document.getElementById('notice-modal-img');
        const vidInput = document.getElementById('notice-modal-vid');
        const imgPreview = document.getElementById('notice-modal-img-preview');
        const vidPreview = document.getElementById('notice-modal-vid-preview');
        
        // 초기화
        imgInput.value = '';
        vidInput.value = '';
        imgPreview.innerHTML = '';
        vidPreview.innerHTML = '';
        
        if (index === -1) {
            h3.innerText = '새 공지사항 추가';
            idxInput.value = '-1';
            dateInput.value = new Date().toISOString().split('T')[0];
            titleInput.value = '';
            editorStandard.innerHTML = '';
        } else {
            h3.innerText = '공지사항 수정 및 상세 보기';
            const notice = settings.noticesBoard[index];
            idxInput.value = index.toString();
            dateInput.value = notice.date;
            titleInput.value = notice.title;
            editorStandard.innerHTML = notice.content || '';
            
            if (notice.image) {
                imgPreview.innerHTML = `<img src="${notice.image}" style="max-height:100px; border-radius:4px;">`;
            }
            if (notice.video) {
                vidPreview.innerHTML = `<span style="font-size:0.8rem; color:#03c75a;">[✓ 영상 등록됨]</span>`;
            }
        }
        
        document.getElementById('footer-editor-toolbar').style.display = 'flex';
        document.getElementById('table-properties-toolbar').style.display = 'flex';
        document.getElementById('editor-standard-container').style.display = 'block';
        modal.style.display = 'flex';
        
        const modalContent = modal.querySelector('div');
        if (modalContent) modalContent.scrollTop = 0;
    };

    window.closeNoticeModal = () => {
        document.getElementById('notice-modal').style.display = 'none';
    };

    window.saveNoticeModal = async () => {
        const idx = parseInt(document.getElementById('notice-modal-index').value);
        const dateVal = document.getElementById('notice-modal-date').value;
        const titleVal = document.getElementById('notice-modal-title-input').value;
        const contentVal = document.getElementById('editor-standard').innerHTML;
        
        const imgFile = document.getElementById('notice-modal-img').files[0];
        const vidFile = document.getElementById('notice-modal-vid').files[0];
        
        let noticeObj = {};
        if (idx === -1) {
            noticeObj = { id: Date.now(), date: dateVal, title: titleVal, content: contentVal };
            settings.noticesBoard.push(noticeObj);
        } else {
            noticeObj = settings.noticesBoard[idx];
            noticeObj.date = dateVal;
            noticeObj.title = titleVal;
            noticeObj.content = contentVal;
        }

        // 압축 후 저장 헬퍼
        const processFiles = async () => {
            if (imgFile) {
                await new Promise(resolve => {
                    compressImage(imgFile, (dataUrl) => {
                        noticeObj.image = dataUrl;
                        resolve();
                    });
                });
            }
            if (vidFile) {
                await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = e => {
                        noticeObj.video = e.target.result;
                        resolve();
                    };
                    reader.readAsDataURL(vidFile);
                });
            }
        };
        
        try {
            await processFiles();
            await saveSettings(settings);
            closeNoticeModal();
            renderNoticeBoard();
            alert('공지사항이 성공적으로 저장되었습니다.');
        } catch(e) {
            console.error(e);
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    window.deleteNotice = (i) => { 
        if(confirm('이 공지사항을 삭제하시겠습니까?')) {
            settings.noticesBoard.splice(i, 1); 
            saveSettings(settings).then(() => renderNoticeBoard()); 
        }
    };

    window.deleteSelectedNotices = async () => {
        const checkboxes = noticeBoardContainer.querySelectorAll('.notice-checkbox:checked');
        if (checkboxes.length === 0) {
            alert('삭제할 공지사항을 선택해주세요.');
            return;
        }
        if (confirm(`선택한 ${checkboxes.length}개의 공지사항을 삭제하시겠습니까?`)) {
            const indexesToDelete = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-index'))).sort((a, b) => b - a);
            indexesToDelete.forEach(idx => {
                settings.noticesBoard.splice(idx, 1);
            });
            await saveSettings(settings);
            renderNoticeBoard();
        }
    };

    renderNoticeBoard();

    window.savePromoSpeed = async () => {
        const promoSpeedInput = document.getElementById('promo-speed-input');
        if(promoSpeedInput) settings.promoSpeed = promoSpeedInput.value;
        await saveSettings(settings);
        alert('흐르는 속도가 성공적으로 저장되었습니다.');
        renderNoticeBoard();
    };
    
    // --- 2. Footer Board (CMS) ---
    const footerBoardContainer = document.getElementById('footer-board-container');
    function renderFooterBoard() {
        if(!footerBoardContainer) return;
        let html = '';
        settings.footerMenus.forEach((cat, catIdx) => {
            html += `<div style="margin-bottom: 2rem; border: 1px solid #eee; padding: 1rem; border-radius: 4px;">`;
            html += `<h4 style="font-size: 1.1rem; margin-bottom: 1rem; color: #111;">${cat.title} <button class="btn" style="padding:0.2rem 0.5rem; font-size:0.8rem; margin-left:0.5rem;" onclick="addFooterItem(${catIdx})">+ 메뉴 추가</button></h4>`;
            html += `<table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                <tr style="border-bottom: 1px solid #ccc; background: #f9f9f9;">
                    <th style="padding: 0.8rem;">타입</th>
                    <th style="padding: 0.8rem;">메뉴명</th>
                    <th style="padding: 0.8rem;">링크 / 내용 (미리보기)</th>
                    <th style="padding: 0.8rem; width: 150px;">관리</th>
                </tr>`;
            if (cat.items && cat.items.length > 0) {
                cat.items.forEach((item, itemIdx) => {
                    const isPage = item.type === 'page';
                    html += `<tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 0.6rem;">
                            <select onchange="updateFooterItem(${catIdx}, ${itemIdx}, 'type', this.value)" style="padding:0.3rem;">
                                <option value="page" ${isPage ? 'selected' : ''}>텍스트 페이지</option>
                                <option value="link" ${!isPage ? 'selected' : ''}>외부 링크</option>
                            </select>
                        </td>
                        <td style="padding: 0.6rem;"><input type="text" value="${item.title}" onchange="updateFooterItem(${catIdx}, ${itemIdx}, 'title', this.value)" style="width:100%; padding:0.3rem;" placeholder="메뉴명"></td>
                        <td style="padding: 0.6rem;">
                            ${isPage 
                                ? `<button class="btn" onclick="openFooterModal(${catIdx}, ${itemIdx})" style="padding:0.3rem 0.8rem; background:#444;">페이지 내용 작성</button> <span style="font-size:0.8rem; color:#888;">${(item.content || '').substring(0,20)}...</span>` 
                                : `<input type="text" value="${item.link || '#'}" onchange="updateFooterItem(${catIdx}, ${itemIdx}, 'link', this.value)" style="width:100%; padding:0.3rem;" placeholder="https://...">`
                            }
                        </td>
                        <td style="padding: 0.6rem; display: flex; gap: 0.5rem;">
                            <button class="btn btn-danger" onclick="deleteFooterItem(${catIdx}, ${itemIdx})" style="padding: 0.3rem 0.6rem;">삭제</button>
                        </td>
                    </tr>`;
                });
            } else {
                html += `<tr><td colspan="4" style="padding: 1rem; text-align: center; color: #888;">등록된 하위 메뉴가 없습니다.</td></tr>`;
            }
            html += `</table></div>`;
        });
        footerBoardContainer.innerHTML = html;
    }

    window.updateFooterItem = (catIdx, itemIdx, field, val) => {
        settings.footerMenus[catIdx].items[itemIdx][field] = val;
        renderFooterBoard();
    };
    window.addFooterItem = (catIdx) => {
        if (!settings.footerMenus[catIdx].items) settings.footerMenus[catIdx].items = [];
        settings.footerMenus[catIdx].items.push({ title: '새 메뉴', type: 'page', content: '' });
        renderFooterBoard();
    };
    window.deleteFooterItem = (catIdx, itemIdx) => {
        settings.footerMenus[catIdx].items.splice(itemIdx, 1);
        renderFooterBoard();
    };

    const saveFooterBtn = document.getElementById('save-footer-btn');
    if (saveFooterBtn) {
        saveFooterBtn.onclick = async () => {
            await saveSettings(settings);
            alert('하단 푸터 구조가 저장되었습니다.');
        };
    }

    window.openFooterModal = (catIdx, itemIdx) => {
        // Reuse noticeModal DOM but adjust labels
        const item = settings.footerMenus[catIdx].items[itemIdx];
        document.getElementById('notice-modal-heading').innerText = `푸터 페이지 수정: ${item.title}`;
        document.getElementById('notice-modal-index').value = `footer_${catIdx}_${itemIdx}`; // Custom index format
        
        // Hide unused fields
        const dateInput = document.getElementById('notice-modal-date');
        if (dateInput && dateInput.previousElementSibling) dateInput.previousElementSibling.style.display = 'none';
        if (dateInput) dateInput.style.display = 'none';

        const titleInput = document.getElementById('notice-modal-title-input');
        if (titleInput && titleInput.previousElementSibling) titleInput.previousElementSibling.style.display = 'none';
        if (titleInput) titleInput.style.display = 'none';

        const vidInput = document.getElementById('notice-modal-vid');
        if (vidInput && vidInput.previousElementSibling) vidInput.previousElementSibling.style.display = 'none';
        if (vidInput) vidInput.style.display = 'none';
        const vidPreview = document.getElementById('notice-modal-vid-preview');
        if (vidPreview) vidPreview.style.display = 'none';

        // Show Image Input for Hero Banner
        const imgInput = document.getElementById('notice-modal-img');
        if (imgInput && imgInput.previousElementSibling) imgInput.previousElementSibling.style.display = 'block';
        if (imgInput) imgInput.style.display = 'block';
        const imgPreview = document.getElementById('notice-modal-img-preview');
        if (imgPreview) {
            imgPreview.style.display = 'block';
            imgPreview.innerHTML = item.image ? `<img src="${item.image}" style="max-width:100%; height:auto; margin-top:1rem; max-height:150px; object-fit:contain; border:1px solid #eee;">` : '';
        }
        
        const toolbar = document.getElementById('footer-editor-toolbar');
        if (toolbar) toolbar.style.display = 'flex';
        const propToolbar = document.getElementById('table-properties-toolbar');
        if (propToolbar) propToolbar.style.display = 'flex';
        const layoutLabel = document.getElementById('footer-layout-label');
        if (layoutLabel) layoutLabel.style.display = 'block';
        const layoutSelect = document.getElementById('footer-layout-select');
        if (layoutSelect) layoutSelect.style.display = 'block';
        
        const contentLabel = document.getElementById('notice-content-label');
        if (contentLabel) contentLabel.style.display = 'none';
        const textarea = document.getElementById('notice-modal-content');
        if (textarea) textarea.style.display = 'none';
        
        let layoutData = null;
        let isJson = false;
        try {
            if (item.content && item.content.startsWith('{')) {
                layoutData = JSON.parse(item.content);
                isJson = true;
            }
        } catch(e) {}

        if (isJson && layoutData.type === 'contact') {
            layoutSelect.value = 'contact';
            document.getElementById('editor-standard-container').style.display = 'none';
            document.getElementById('editor-contact-container').style.display = 'flex';
            document.getElementById('editor-contact-left').innerHTML = layoutData.left || '';
            document.getElementById('editor-contact-right').innerHTML = layoutData.right || '';
            document.getElementById('editor-contact-bottom').innerHTML = layoutData.bottom || '';
        } else {
            layoutSelect.value = 'standard';
            document.getElementById('editor-standard-container').style.display = 'block';
            document.getElementById('editor-contact-container').style.display = 'none';
            document.getElementById('editor-standard').innerHTML = isJson ? (layoutData.content || '') : (item.content || '');
        }

        document.getElementById('notice-modal').style.display = 'flex';
    };

    // Override saveNoticeModal to handle footer logic too
    const originalSaveNoticeModal = window.saveNoticeModal;
    window.saveNoticeModal = async () => {
        const idxVal = document.getElementById('notice-modal-index').value;
        if (typeof idxVal === 'string' && idxVal.startsWith('footer_')) {
            const parts = idxVal.split('_');
            const catIdx = parseInt(parts[1]);
            const itemIdx = parseInt(parts[2]);
            
            const layoutType = document.getElementById('footer-layout-select').value;
            let finalContent = '';
            
            if (layoutType === 'contact') {
                const layoutData = {
                    type: 'contact',
                    left: document.getElementById('editor-contact-left').innerHTML,
                    right: document.getElementById('editor-contact-right').innerHTML,
                    bottom: document.getElementById('editor-contact-bottom').innerHTML
                };
                finalContent = JSON.stringify(layoutData);
            } else {
                const layoutData = {
                    type: 'standard',
                    content: document.getElementById('editor-standard').innerHTML
                };
                finalContent = JSON.stringify(layoutData);
            }
            
            const imgFile = document.getElementById('notice-modal-img').files[0];
            const noticeModalObj = document.getElementById('notice-modal');
            const saveBtn = noticeModalObj.querySelector('button.btn');
            
            const finishFooterSave = async (imgDataUrl) => {
                const item = settings.footerMenus[catIdx].items[itemIdx];
                item.content = finalContent;
                if (imgDataUrl) {
                    item.image = imgDataUrl;
                }
                await saveSettings(settings);
                closeNoticeModal();
                renderFooterBoard();
                if(saveBtn) saveBtn.textContent = '저장';
            };

            if(saveBtn) saveBtn.textContent = '저장 중...';

            if (imgFile) {
                compressImage(imgFile, dataUrl => {
                    finishFooterSave(dataUrl);
                });
            } else {
                finishFooterSave(null);
            }
        } else {
            // Proceed with original notice save logic
            const date = document.getElementById('notice-modal-date').value;
            const title = document.getElementById('notice-modal-title-input').value;
            const content = document.getElementById('editor-standard').innerHTML;
            
            if(!title) { alert('제목을 입력하세요.'); return; }
            if(!date) { alert('날짜를 선택하세요.'); return; }

            const noticeData = { id: Date.now(), date, title, content };
            
            const imgFile = document.getElementById('notice-modal-img').files[0];
            const vidFile = document.getElementById('notice-modal-vid').files[0];

            const noticeModalObj = document.getElementById('notice-modal');
            const saveBtn = noticeModalObj.querySelector('button.btn');
            
            const finishSave = async () => {
                if (idxVal && idxVal !== "-1") {
                    settings.noticesBoard[parseInt(idxVal)] = noticeData;
                } else {
                    settings.noticesBoard.push(noticeData);
                }
                await saveSettings(settings);
                renderNoticeBoard();
                closeNoticeModal();
                if(saveBtn) saveBtn.textContent = '저장';
            };

            if(saveBtn) saveBtn.textContent = '저장 중...';

            let filesToProcess = 0;
            let filesProcessed = 0;

            const checkFinish = () => {
                filesProcessed++;
                if(filesProcessed >= filesToProcess) finishSave();
            };

            if(imgFile) filesToProcess++;
            if(vidFile) filesToProcess++;

            if(filesToProcess === 0) {
                finishSave();
            } else {
                if(imgFile) {
                    compressImage(imgFile, dataUrl => {
                        noticeData.image = dataUrl;
                        checkFinish();
                    });
                }
                if(vidFile) {
                    const reader = new FileReader();
                    reader.onload = e => {
                        noticeData.video = e.target.result;
                        checkFinish();
                    };
                    reader.readAsDataURL(vidFile);
                }
            }
        }
    };
    
    // Override closeNoticeModal to reset hidden fields
    window.closeNoticeModal = () => {
        document.getElementById('notice-modal').style.display = 'none';
        
        // Reset display
        const dateInput = document.getElementById('notice-modal-date');
        if (dateInput && dateInput.previousElementSibling) dateInput.previousElementSibling.style.display = 'block';
        if (dateInput) dateInput.style.display = 'block';

        const titleInput = document.getElementById('notice-modal-title-input');
        if (titleInput && titleInput.previousElementSibling) titleInput.previousElementSibling.style.display = 'block';
        if (titleInput) titleInput.style.display = 'block';

        const imgInput = document.getElementById('notice-modal-img');
        if (imgInput && imgInput.previousElementSibling) imgInput.previousElementSibling.style.display = 'block';
        if (imgInput) imgInput.style.display = 'block';
        const imgPreview = document.getElementById('notice-modal-img-preview');
        if (imgPreview) imgPreview.style.display = 'block';

        const vidInput = document.getElementById('notice-modal-vid');
        if (vidInput && vidInput.previousElementSibling) vidInput.previousElementSibling.style.display = 'block';
        if (vidInput) vidInput.style.display = 'block';
        const vidPreview = document.getElementById('notice-modal-vid-preview');
        if (vidPreview) vidPreview.style.display = 'block';
        
        const contentLabel = document.getElementById('notice-content-label');
        if (contentLabel) contentLabel.style.display = 'block';
        const textarea = document.getElementById('notice-modal-content');
        if (textarea) textarea.style.display = 'block';

        const toolbar = document.getElementById('footer-editor-toolbar');
        if (toolbar) toolbar.style.display = 'none';
        const propToolbar = document.getElementById('table-properties-toolbar');
        if (propToolbar) propToolbar.style.display = 'none';
        const layoutLabel = document.getElementById('footer-layout-label');
        if (layoutLabel) layoutLabel.style.display = 'none';
        const layoutSelect = document.getElementById('footer-layout-select');
        if (layoutSelect) layoutSelect.style.display = 'none';
        document.getElementById('editor-standard-container').style.display = 'none';
        document.getElementById('editor-contact-container').style.display = 'none';
    };

    renderFooterBoard();

    // --- 3. Menu Builder (3 Depths) ---
    const menuContainer = document.getElementById('menu-builder-container');
    function renderMenuBuilder() {
        if(!menuContainer) return;
        let html = buildMenuHtml(settings.menus, 1, 'menus');
        menuContainer.innerHTML = html;
    }

    let draggedMenuPath = null;
    let draggedSourceElement = null;

    window.menuDragStart = (e, path) => {
        draggedMenuPath = path;
        draggedSourceElement = e.currentTarget;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', path);
        setTimeout(() => e.target.style.opacity = '0.5', 0);
        e.stopPropagation();
    };
    window.menuDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.stopPropagation();
    };
    window.menuDragEnter = (e) => {
        e.preventDefault();
        if (e.currentTarget !== draggedSourceElement) {
            e.currentTarget.style.borderTop = "3px solid #3b82f6";
        }
        e.stopPropagation();
    };
    window.menuDragLeave = (e) => {
        e.currentTarget.style.borderTop = "";
        e.stopPropagation();
    };
    window.menuDrop = (e, targetPath) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.style.borderTop = "";
        if (draggedSourceElement) draggedSourceElement.style.opacity = '1';

        if (!draggedMenuPath || draggedMenuPath === targetPath) return;
        if (targetPath.startsWith(draggedMenuPath)) {
            alert('상위 메뉴를 자신의 하위 메뉴로 이동할 수 없습니다.');
            return;
        }

        const dragged = resolvePath(draggedMenuPath);
        const target = resolvePath(targetPath);
        
        const arrFrom = dragged.parent;
        const arrTo = target.parent;
        const fromIdx = parseInt(dragged.key);
        const toIdx = parseInt(target.key);

        const item = arrFrom.splice(fromIdx, 1)[0];
        
        if (arrFrom === arrTo && fromIdx < toIdx) {
            arrTo.splice(toIdx, 0, item);
        } else {
            arrTo.splice(toIdx, 0, item);
        }
        
        renderMenuBuilder();
    };
    
    window.toggleMenuOptions = (e, path) => {
        e.stopPropagation();
        // Close all other dropdowns
        document.querySelectorAll('.menu-options-dropdown').forEach(el => {
            if (el.id !== 'dropdown-' + path) el.style.display = 'none';
        });
        const dropdown = document.getElementById('dropdown-' + path);
        if(dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    };

    document.addEventListener('click', () => {
        document.querySelectorAll('.menu-options-dropdown').forEach(el => el.style.display = 'none');
    });

    function buildMenuHtml(menusArr, depth, pathStr) {
        if (depth > 3) return '';
        
        // 상위메뉴-하위메뉴 간격은 좁게 (margin-top 음수 활용), 동등한 메뉴(Depth 1) 간격은 넓게
        let containerStyle = depth === 1 ? 'margin-bottom: 0.75rem;' : `margin-left: ${(depth-1)*0.8}rem; margin-top: -0.2rem; padding-bottom: 0.1rem;`;
        let html = `<div style="${containerStyle}">`;
        
        menusArr.forEach((menu, index) => {
            const currentPath = `${pathStr}[${index}]`;
            
            let cardBg = depth === 1 ? '#f8f9fa' : '#ffffff';
            let cardBorder = depth === 1 ? '1px solid #e2e8f0' : '1px solid #f1f5f9';
            let cardRadius = '8px';
            let indentIcon = depth > 1 ? `<span style="color:#cbd5e1; font-weight:bold; margin-right:0.5rem;">└</span>` : '';
            
            // 형제 노드 간의 간격
            let wrapperStyle = depth === 1 ? 'margin-bottom: 0.3rem;' : 'margin-bottom: 0.1rem;';
            
            html += `<div style="${wrapperStyle}" id="menu-wrapper-${currentPath}" class="menu-card-wrapper">
                <div style="background: ${cardBg}; border: ${cardBorder}; border-radius: ${cardRadius}; padding: 0.4rem 0.6rem; display:flex; align-items:center; gap:0.5rem; flex-wrap: wrap; box-shadow: ${depth === 1 ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'}; transition: all 0.2s;"
                     ondragstart="menuDragStart(event, '${currentPath}')"
                     ondragover="menuDragOver(event)"
                     ondragenter="menuDragEnter(event)"
                     ondragleave="menuDragLeave(event)"
                     ondrop="menuDrop(event, '${currentPath}')">
                    
                    ${indentIcon}
                    <div style="cursor: grab; color: #94a3b8; font-size: 1.5rem; margin-right: 0.5rem; display: flex; align-items: center; user-select: none;" title="마우스로 끌어서 이동" onmouseover="this.closest('.menu-card-wrapper').setAttribute('draggable', true)" onmouseout="this.closest('.menu-card-wrapper').removeAttribute('draggable')">≡</div>
                    
                    <input type="text" class="form-control" value="${menu.name}" onfocus="if(this.value==='새 메뉴') this.value='';" onchange="updateMenu('${currentPath}', 'name', this.value)" placeholder="메뉴명" style="width:160px; padding:0.4rem; font-size:0.9rem; border:1px solid #cbd5e1; border-radius:4px; font-weight: ${depth===1 ? 'bold' : 'normal'}; color: #334155;">
                    
                    <span style="flex-grow:1;"></span>

                    <input type="text" class="form-control" value="${menu.link}" onchange="updateMenu('${currentPath}', 'link', this.value)" placeholder="링크 URL" style="width:260px; padding:0.4rem; font-size:0.9rem; border:1px solid #cbd5e1; border-radius:4px; text-align: right; color: #64748b;">
                    
                    <label style="display:flex; align-items:center; margin:0; margin-left: 0.5rem; margin-right: 0.5rem;" title="하이라이트(강조)">
                        <input type="checkbox" ${menu.highlight ? 'checked' : ''} onchange="updateMenu('${currentPath}', 'highlight', this.checked)" style="transform: scale(1.2); cursor: pointer; margin: 0;">
                    </label>
                    
                    <div style="position:relative;">
                        <button class="btn" onclick="toggleMenuOptions(event, '${currentPath}')" style="background:transparent; border:none; font-size:1.2rem; cursor:pointer; color:#64748b; padding:0.2rem 0.5rem;" title="옵션 메뉴">⋮</button>
                        <div id="dropdown-${currentPath}" class="menu-options-dropdown" style="display:none; position:absolute; right:0; top:100%; background:#fff; border:1px solid #e2e8f0; border-radius:6px; box-shadow:0 4px 6px rgba(0,0,0,0.1); z-index:100; min-width:140px; overflow:hidden;">
                            ${depth < 3 ? `<div onmousedown="addSubMenu('${currentPath}')" style="padding:0.6rem 1rem; font-size:0.85rem; cursor:pointer; border-bottom:1px solid #f1f5f9; color:#334155;">+ 하위 메뉴 추가</div>` : ''}
                            <div onmousedown="deleteMenu('${currentPath}')" style="padding:0.6rem 1rem; font-size:0.85rem; cursor:pointer; color:#ef4444;">🗑️ 메뉴 삭제</div>
                        </div>
                    </div>
                </div>`;
                
            if (menu.children && menu.children.length > 0) {
                html += buildMenuHtml(menu.children, depth + 1, `${currentPath}.children`);
            }
            html += `</div>`;
        });
        html += `</div>`;
        return html;
    }
    
    function resolvePath(path) {
        let parts = path.replace(/\]/g, '').split(/\[|\./);
        let obj = settings;
        for(let i=0; i<parts.length-1; i++) {
            if(parts[i]) obj = obj[parts[i]];
        }
        return { parent: obj, key: parts[parts.length-1] };
    }

    window.updateMenu = (path, field, val) => {
        const {parent, key} = resolvePath(path);
        parent[key][field] = val;
    };
    window.deleteMenu = (path) => {
        const {parent, key} = resolvePath(path);
        parent.splice(parseInt(key, 10), 1);
        renderMenuBuilder();
    };
    window.addSubMenu = (path) => {
        const {parent, key} = resolvePath(path);
        if(!parent[key].children) parent[key].children = [];
        parent[key].children.push({ id: Date.now(), name: '', link: '#', children: [] });
        renderMenuBuilder();
    };
    
    const addDepth1Btn = document.getElementById('add-depth1-btn');
    if(addDepth1Btn) addDepth1Btn.onclick = () => { settings.menus.push({ id: Date.now(), name: '', link: '#', highlight: false, children: [] }); renderMenuBuilder(); };
    
    const saveMenuBtn = document.getElementById('save-menu-btn');
    if(saveMenuBtn) saveMenuBtn.onclick = async () => {
        await saveSettings(settings);
        alert('글로벌 메뉴 3단계 구성이 저장되었습니다.');
    };
    renderMenuBuilder();

    // 4. 하단 혜택 (Perks) 설정 연동
    const perkInputs = document.querySelectorAll('#perks-container input[type="text"]');
    const perksBtn = document.getElementById('save-perks-btn');
    const hashtagInput = document.getElementById('perks-hashtag-input');
    
    if (hashtagInput) {
        hashtagInput.value = settings.perksHashtag || '#SIRTHELABEL';
    }
    
    if (!settings.perks || settings.perks.length !== 3) {
        settings.perks = [
            { title: 'Worldwide Instant Exchanges', desc: 'Easy online size swaps' },
            { title: 'Express Global Shipping', desc: 'Complimentary on orders over $400USD' },
            { title: 'SIR. Loyalty', desc: 'Earn points and move through our tiered program' }
        ];
    }
    
    if (perkInputs.length === 6) {
        perkInputs[0].value = settings.perks[0].title;
        perkInputs[1].value = settings.perks[0].desc;
        perkInputs[2].value = settings.perks[1].title;
        perkInputs[3].value = settings.perks[1].desc;
        perkInputs[4].value = settings.perks[2].title;
        perkInputs[5].value = settings.perks[2].desc;

        if (perksBtn) {
            perksBtn.onclick = async () => {
                if (hashtagInput) settings.perksHashtag = hashtagInput.value || '#SIRTHELABEL';
                settings.perks[0].title = perkInputs[0].value;
                settings.perks[0].desc = perkInputs[1].value;
                settings.perks[1].title = perkInputs[2].value;
                settings.perks[1].desc = perkInputs[3].value;
                settings.perks[2].title = perkInputs[4].value;
                settings.perks[2].desc = perkInputs[5].value;
                await saveSettings(settings);
                alert('하단 브랜드 해시태그 및 혜택 정보가 저장되었습니다.');
            };
        }
    }

    // --- 서브 탭 전환 로직 (게시판 관리 내) ---
    const subtabNotices = document.getElementById('subtab-notices');
    const subtabFooter = document.getElementById('subtab-footer');
    const subtabPerks = document.getElementById('subtab-perks');
    const subviewNotices = document.getElementById('subview-notices');
    const subviewFooter = document.getElementById('subview-footer');
    const subviewPerks = document.getElementById('subview-perks');
    
    if (subtabNotices && subtabFooter && subtabPerks) {
        function resetSubtabs() {
            subtabNotices.style.background = '#f5f5f5'; subtabNotices.style.color = '#333';
            subtabFooter.style.background = '#f5f5f5'; subtabFooter.style.color = '#333';
            subtabPerks.style.background = '#f5f5f5'; subtabPerks.style.color = '#333';
            subviewNotices.style.display = 'none';
            subviewFooter.style.display = 'none';
            subviewPerks.style.display = 'none';
        }
        
        subtabNotices.addEventListener('click', () => {
            resetSubtabs();
            subtabNotices.style.background = '#111'; subtabNotices.style.color = '#fff';
            subviewNotices.style.display = 'block';
        });
        subtabFooter.addEventListener('click', () => {
            resetSubtabs();
            subtabFooter.style.background = '#111'; subtabFooter.style.color = '#fff';
            subviewFooter.style.display = 'block';
        });
        subtabPerks.addEventListener('click', () => {
            resetSubtabs();
            subtabPerks.style.background = '#111'; subtabPerks.style.color = '#fff';
            subviewPerks.style.display = 'block';
        });
    }

    // --- 회원 관리 (view-members) 로직 추가 ---
    async function renderMembers() {
        const tableBody = document.getElementById('member-table-body');
        const totalCountEl = document.getElementById('member-total-count');
        const newCountEl = document.getElementById('member-new-count');
        
        if (!tableBody) return;
        
        try {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">데이터를 불러오는 중입니다...</td></tr>';
            const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3000' : '';
            const res = await fetch(`${apiBase}/api/members`);
            if (!res.ok) throw new Error('서버 에러');
            const members = await res.json();
            
            totalCountEl.innerText = members.length + '명';
            
            // 이번 주 신규 가입 계산
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const newMembers = members.filter(m => new Date(m.joinDate) >= oneWeekAgo);
            newCountEl.innerText = newMembers.length + '명';
            
            tableBody.innerHTML = '';
            if (members.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">가입된 회원이 없습니다.</td></tr>';
                return;
            }
            
            members.forEach(m => {
                const tr = document.createElement('tr');
                const joinDateStr = new Date(m.joinDate).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                tr.innerHTML = `
                    <td>${joinDateStr}</td>
                    <td>${m.phone || '미입력'}</td>
                    <td>${m.email}</td>
                    <td>${m.marketing}</td>
                    <td><span style="color: ${m.status === '정상' ? '#03c75a' : '#666'};">${m.status}</span></td>
                `;
                tableBody.appendChild(tr);
            });
        } catch(err) {
            console.error('회원 목록 불러오기 실패:', err);
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #d93025;">서버와의 통신에 실패했습니다. 백엔드 서버가 켜져 있는지 확인해주세요.</td></tr>';
        }
    }

    // --- 사이드바 탭 전환 로직 ---
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
    // --- Table UI Logic ---
    window.lastEditorRange = null;
    document.addEventListener('selectionchange', () => {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            let node = sel.getRangeAt(0).commonAncestorContainer;
            if (node.nodeType === 3) node = node.parentNode;
            if (node.closest && node.closest('[contenteditable="true"]')) {
                window.lastEditorRange = sel.getRangeAt(0).cloneRange();
            }
        }
    });

    function restoreEditorSelection() {
        const sel = window.getSelection();
        let node = sel.focusNode;
        if (node && node.nodeType === 3) node = node.parentNode;
        
        if ((!sel.rangeCount || !node || !node.closest || !node.closest('[contenteditable="true"]')) && window.lastEditorRange) {
            sel.removeAllRanges();
            sel.addRange(window.lastEditorRange);
        }
        return window.getSelection();
    }

    function getSelectedTable() {
        const sel = restoreEditorSelection();
        if (!sel.rangeCount) return null;
        let node = sel.focusNode;
        while (node && node.nodeName !== 'TABLE' && !node.classList?.contains('rich-editor')) {
            node = node.parentNode;
        }
        return node && node.nodeName === 'TABLE' ? node : null;
    }

    window.insertTable = () => {
        const tableHTML = `<div class="table-wrapper" style="resize: both; overflow: hidden; min-width: 150px; min-height: 50px; display: inline-block; border: 1px dashed #ddd; padding: 5px;"><table class="page-table" style="width: 100%; height: 100%; min-width: 100%; min-height: 100%;">
            <thead>
                <tr>
                    <th style="border-bottom: 1px solid #ccc;">서비스명</th>
                    <th style="border-bottom: 1px solid #ccc;">배달 시간</th>
                    <th style="border-bottom: 1px solid #ccc;">비용 정보</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>내용을 입력하세요</td>
                    <td>내용을 입력하세요</td>
                    <td>내용을 입력하세요</td>
                </tr>
                <tr>
                    <td>내용을 입력하세요</td>
                    <td>내용을 입력하세요</td>
                    <td>내용을 입력하세요</td>
                </tr>
            </tbody>
        </table></div><p><br></p>`;
        document.execCommand('insertHTML', false, tableHTML);
    };

    window.insertTableRow = () => {
        const sel = restoreEditorSelection();
        if (!sel.rangeCount) { alert('줄을 추가할 표의 칸을 클릭해주세요.'); return; }
        let node = sel.focusNode;
        while (node && node.nodeName !== 'TR' && node.nodeName !== 'TABLE' && !node.classList?.contains('rich-editor')) {
            node = node.parentNode;
        }
        if (node && node.nodeName === 'TR') {
            const newRow = node.cloneNode(true);
            newRow.querySelectorAll('th, td').forEach(cell => cell.innerHTML = '');
            node.parentNode.insertBefore(newRow, node.nextSibling);
        } else {
            alert('줄을 추가할 표의 칸(셀)을 선택한 상태에서 클릭해주세요.');
        }
    };

    window.deleteTableRow = () => {
        const sel = restoreEditorSelection();
        if (!sel.rangeCount) { alert('줄을 삭제할 표의 칸을 클릭해주세요.'); return; }
        let node = sel.focusNode;
        while (node && node.nodeName !== 'TR' && node.nodeName !== 'TABLE' && !node.classList?.contains('rich-editor')) {
            node = node.parentNode;
        }
        if (node && node.nodeName === 'TR') {
            if (node.parentNode.children.length <= 1) {
                alert('마지막 줄은 삭제할 수 없습니다. 표 전체를 지우려면 표 밖에서 표 전체를 드래그하고 Backspace 키를 누르세요.');
            } else {
                node.remove();
            }
        } else {
            alert('줄을 삭제할 표의 칸(셀)을 선택한 상태에서 클릭해주세요.');
        }
    };

    window.changeCellColor = (color) => {
        const sel = restoreEditorSelection();
        if (!sel.rangeCount) return;
        
        let container = sel.getRangeAt(0).commonAncestorContainer;
        if (container.nodeType === 3) container = container.parentNode;
        
        while (container && !container.classList?.contains('rich-editor')) {
            container = container.parentNode;
        }

        let selectedCells = [];
        if (container) {
            let singleCell = sel.focusNode;
            while (singleCell && singleCell.nodeName !== 'TD' && singleCell.nodeName !== 'TH' && singleCell !== container) {
                singleCell = singleCell.parentNode;
            }
            if (singleCell && (singleCell.nodeName === 'TD' || singleCell.nodeName === 'TH')) {
                selectedCells.push(singleCell);
            }

            const allCells = container.querySelectorAll('td, th');
            allCells.forEach(cell => {
                if (sel.containsNode(cell, true) && !selectedCells.includes(cell)) {
                    selectedCells.push(cell);
                }
            });
        }

        if (selectedCells.length > 0) {
            selectedCells.forEach(node => {
                node.style.backgroundColor = color;
                let hex = color.replace('#', '');
                let r = parseInt(hex.substr(0, 2), 16) || 255;
                let g = parseInt(hex.substr(2, 2), 16) || 255;
                let b = parseInt(hex.substr(4, 2), 16) || 255;
                let yiq = ((r*299)+(g*587)+(b*114))/1000;
                node.style.color = (yiq >= 128) ? '#111' : '#fff';
            });
        } else {
            alert('색상을 변경할 표의 칸(셀)을 하나 이상 드래그하여 선택한 후 색상을 골라주세요.');
        }
    };

    function getSelectedTable() {
        const sel = window.getSelection();
        if (!sel.rangeCount) return null;
        let node = sel.focusNode;
        while (node && node.nodeName !== 'TABLE' && !node.classList?.contains('rich-editor')) {
            node = node.parentNode;
        }
        return node && node.nodeName === 'TABLE' ? node : null;
    }

    window.changeTableWidth = (widthPercent) => {
        let table = getSelectedTable();
        if (table) {
            table.style.width = `${widthPercent}%`;
            let wrapper = table.closest('.table-wrapper');
            if (wrapper) wrapper.style.width = `${widthPercent}%`;
        } else {
            alert('크기를 변경할 표의 안쪽을 먼저 클릭해주세요.');
        }
    };

    window.changeTableBorderThickness = (thickness) => {
        let table = getSelectedTable();
        if (table) {
            let color = table.dataset.borderColor || '#e5e5e5';
            table.style.border = thickness === '0px' ? 'none' : `${thickness} solid ${color}`;
            table.querySelectorAll('th, td').forEach(cell => {
                cell.style.borderBottom = thickness === '0px' ? 'none' : `${thickness} solid ${color}`;
            });
            table.dataset.borderThickness = thickness;
        } else {
            alert('테두리를 변경할 표의 안쪽을 먼저 클릭해주세요.');
        }
    };

    window.changeTableBorderColor = (color) => {
        let table = getSelectedTable();
        if (table) {
            let thickness = table.dataset.borderThickness || '1px';
            if (thickness !== '0px') {
                table.style.border = `${thickness} solid ${color}`;
                table.querySelectorAll('th, td').forEach(cell => {
                    cell.style.borderBottom = `${thickness} solid ${color}`;
                });
            }
            table.dataset.borderColor = color;
        } else {
            alert('선 색상을 변경할 표의 안쪽을 먼저 클릭해주세요.');
        }
    };

    window.changeTableHeight = (heightPx) => {
        let table = getSelectedTable();
        if (table) {
            table.style.height = `${heightPx}px`;
        } else {
            alert('세로 높이를 조절할 표의 안쪽을 먼저 클릭해주세요.');
        }
    };


    window.changeCellTextAlign = (align) => {
        const sel = restoreEditorSelection();
        if (!sel.rangeCount) return;
        
        let container = sel.getRangeAt(0).commonAncestorContainer;
        if (container.nodeType === 3) container = container.parentNode;
        
        while (container && !container.classList?.contains('rich-editor')) {
            container = container.parentNode;
        }

        let selectedCells = [];
        if (container) {
            let singleCell = sel.focusNode;
            while (singleCell && singleCell.nodeName !== 'TD' && singleCell.nodeName !== 'TH' && singleCell !== container) {
                singleCell = singleCell.parentNode;
            }
            if (singleCell && (singleCell.nodeName === 'TD' || singleCell.nodeName === 'TH')) {
                selectedCells.push(singleCell);
            }

            const allCells = container.querySelectorAll('td, th');
            allCells.forEach(cell => {
                if (sel.containsNode(cell, true) && !selectedCells.includes(cell)) {
                    selectedCells.push(cell);
                }
            });
        }

        if (selectedCells.length > 0) {
            selectedCells.forEach(node => {
                node.style.textAlign = align;
            });
        } else {
            alert('정렬할 표의 칸(셀)을 하나 이상 드래그하여 선택해주세요.');
        }
    };


    window.insertTableColumn = () => {
        const sel = restoreEditorSelection();
        if (!sel.rangeCount) return;
        let node = sel.focusNode;
        while (node && node.nodeName !== 'TD' && node.nodeName !== 'TH' && !node.classList?.contains('rich-editor')) {
            node = node.parentNode;
        }
        if (node && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
            let cellIndex = Array.from(node.parentNode.children).indexOf(node);
            let table = node.closest('table');
            if (table) {
                table.querySelectorAll('tr').forEach(row => {
                    let newCell = document.createElement(row.parentNode.nodeName === 'THEAD' ? 'TH' : 'TD');
                    newCell.innerHTML = '새 칸';
                    row.insertBefore(newCell, row.children[cellIndex].nextSibling);
                });
            }
        } else {
            alert('칸을 추가할 위치의 기준 셀을 클릭해주세요.');
        }
    };

    window.deleteTableColumn = () => {
        const sel = restoreEditorSelection();
        if (!sel.rangeCount) return;
        let node = sel.focusNode;
        while (node && node.nodeName !== 'TD' && node.nodeName !== 'TH' && !node.classList?.contains('rich-editor')) {
            node = node.parentNode;
        }
        if (node && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
            let cellIndex = Array.from(node.parentNode.children).indexOf(node);
            let table = node.closest('table');
            if (table) {
                if (node.parentNode.children.length <= 1) {
                    alert('마지막 칸은 삭제할 수 없습니다.');
                    return;
                }
                table.querySelectorAll('tr').forEach(row => {
                    if (row.children[cellIndex]) row.children[cellIndex].remove();
                });
            }
        } else {
            alert('삭제할 칸(셀)을 먼저 클릭해주세요.');
        }
    };

    } catch (globalErr) {
        console.error("Initialization error:", globalErr);
    }
});
