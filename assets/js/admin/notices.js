import { getSettings, saveSettings } from '../modules/api.js';
import { compressImage } from '../modules/utils.js';

let settings;
let currentNoticePage = 1;
const noticeBoardContainer = document.getElementById('notice-board-container');

export async function initNotices() {
    settings = await getSettings();
    
    // 모달 DOM 생성 (없을 경우)
    createNoticeModalDOM();
    
    // 전역 함수 등록 (HTML onclick 용)
    window.openNoticeModal = openNoticeModal;
    window.closeNoticeModal = closeNoticeModal;
    window.saveNoticeModal = saveNoticeModal;
    window.deleteNotice = deleteNotice;
    window.deleteSelectedNotices = deleteSelectedNotices;
    window.changeNoticePage = changeNoticePage;
    window.savePromoSpeed = savePromoSpeed;

    renderNoticeBoard();
}

function createNoticeModalDOM() {
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
                    <label style="font-size:0.8rem; display:flex; align-items:center; gap:0.3rem; margin-left:0.5rem;">
                        가로 너비 <input type="range" min="20" max="100" value="100" onchange="changeTableWidth(this.value)" style="width:60px; cursor:pointer;">
                    </label>
                    <label style="font-size:0.8rem; display:flex; align-items:center; gap:0.3rem; margin-left:0.5rem;">
                        세로 높이 <input type="range" min="50" max="800" value="100" onchange="changeTableHeight(this.value)" style="width:60px; cursor:pointer;">
                    </label>
                    <span style="border-left:1px solid #ccc; height:1rem; margin:0 0.2rem;"></span>
                    <label style="font-size:0.8rem; display:flex; align-items:center; gap:0.3rem;">
                        글자 정렬 
                        <select onchange="changeCellTextAlign(this.value)" style="padding:0.1rem;">
                            <option value="">-선택-</option>
                            <option value="left">왼쪽 정렬</option>
                            <option value="center">가운데 정렬</option>
                            <option value="right">오른쪽 정렬</option>
                        </select>
                    </label>
                    <span style="border-left:1px solid #ccc; height:1rem; margin:0 0.2rem;"></span>
                    <button class="btn" onclick="insertTableColumn()" style="padding:0.1rem 0.4rem; font-size:0.75rem; background:#fff; color:#333; border:1px solid #ddd;">✚ 칸 추가</button>
                    <button class="btn" onclick="deleteTableColumn()" style="padding:0.1rem 0.4rem; font-size:0.75rem; background:#fff; color:#cb1400; border:1px solid #ddd;">➖ 칸 삭제</button>
                    <span style="border-left:1px solid #ccc; height:1rem; margin:0 0.2rem;"></span>
                    <label style="font-size:0.8rem; display:flex; align-items:center; gap:0.3rem;">
                        테두리 굵기 
                        <select onchange="changeTableBorderThickness(this.value)" style="padding:0.1rem;">
                            <option value="0px">없음</option>
                            <option value="1px">얇게 (1px)</option>
                            <option value="2px">보통 (2px)</option>
                            <option value="3px">굵게 (3px)</option>
                        </select>
                    </label>
                    <label style="font-size:0.8rem; display:flex; align-items:center; gap:0.3rem; margin-left:0.5rem;">
                        선 색상 <input type="color" onchange="changeTableBorderColor(this.value)" value="#e5e5e5" style="width:24px; height:24px; padding:0; border:1px solid #ddd; cursor:pointer;">
                    </label>
                    <span style="border-left:1px solid #ccc; height:1rem; margin:0 0.2rem;"></span>
                    <div style="display:flex; align-items:center; gap:0.15rem;">
                        <span style="font-size:0.8rem; margin-right:0.3rem;">칸 색상</span>
                        <div onclick="changeCellColor('#ffffff')" style="width:16px;height:16px;background:#ffffff;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#f0f0f0')" style="width:16px;height:16px;background:#f0f0f0;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#e0e0e0')" style="width:16px;height:16px;background:#e0e0e0;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#111111')" style="width:16px;height:16px;background:#111111;border:1px solid #ccc;cursor:pointer;"></div>
                        <div onclick="changeCellColor('#000000')" style="width:16px;height:16px;background:#000000;border:1px solid #ccc;cursor:pointer;"></div>
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
}

export function renderNoticeBoard() {
    if(!noticeBoardContainer) return;
    
    // 최신 글이 위로 오도록 정렬
    settings.noticesBoard.sort((a, b) => {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        return dateB - dateA || b.id - a.id;
    });

    const pageSize = 10;
    const totalItems = settings.noticesBoard.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    
    if (currentNoticePage > totalPages) currentNoticePage = totalPages;
    if (currentNoticePage < 1) currentNoticePage = 1;

    const startIndex = (currentNoticePage - 1) * pageSize;
    const paginatedNotices = settings.noticesBoard.slice(startIndex, startIndex + pageSize);

    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>전체 <strong>${totalItems}</strong>개 (페이지 ${currentNoticePage}/${totalPages})</div>
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
    let startPage = Math.floor((currentNoticePage - 1) / 10) * 10 + 1;
    let endPage = Math.min(startPage + 9, totalPages);
    
    for (let p = startPage; p <= endPage; p++) {
        if (p === currentNoticePage) {
            pageButtons += `<button class="btn" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; background: #111; color: #fff; border: 1px solid #111;">${p}</button>`;
        } else {
            pageButtons += `<button class="btn" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; background: transparent; color: #111; border: 1px solid #ccc;" onclick="changeNoticePage(${p})">${p}</button>`;
        }
    }

    html += `</tbody></table>
        <div style="position: relative; display: flex; justify-content: center; align-items: center; margin-top:1rem; min-height: 2rem;">
            <button class="btn btn-danger" onclick="deleteSelectedNotices()" style="position: absolute; left: 0; padding: 0.3rem 0.6rem; font-size: 0.75rem;">선택 삭제</button>
            
            <div class="pagination" style="display:flex; gap:0.3rem; align-items:center;">
                <button class="btn" onclick="changeNoticePage(${currentNoticePage - 1})" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; background: transparent; color: #111; border: 1px solid #ccc;" ${currentNoticePage === 1 ? 'disabled' : ''}>이전</button>
                ${pageButtons}
                <button class="btn" onclick="changeNoticePage(${currentNoticePage + 1})" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; background: transparent; color: #111; border: 1px solid #ccc;" ${currentNoticePage === totalPages ? 'disabled' : ''}>다음</button>
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

export function changeNoticePage(page) {
    currentNoticePage = page;
    renderNoticeBoard();
}

export function openNoticeModal(index) {
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
    
    // UI 표시 제어 (footer 모드와 공유하므로 강제 리셋)
    document.getElementById('footer-editor-toolbar').style.display = 'flex';
    document.getElementById('table-properties-toolbar').style.display = 'flex';
    document.getElementById('footer-layout-label').style.display = 'none';
    document.getElementById('footer-layout-select').style.display = 'none';
    document.getElementById('editor-standard-container').style.display = 'block';
    document.getElementById('editor-contact-container').style.display = 'none';
    
    modal.style.display = 'flex';
}

export function closeNoticeModal() {
    document.getElementById('notice-modal').style.display = 'none';
}

export async function saveNoticeModal() {
    const idxVal = document.getElementById('notice-modal-index').value;
    
    // Footer 로직을 이곳에서 분리 (footer.js 에서 별도 처리)
    if (typeof idxVal === 'string' && idxVal.startsWith('footer_')) {
        // footer.js의 saveFooterModal 로직을 호출해야 함 (의존성 분리 완료 시 불필요)
        return;
    }
    
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
        if (idxVal && parseInt(idxVal) !== -1) {
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

export function deleteNotice(i) { 
    if(confirm('이 공지사항을 삭제하시겠습니까?')) {
        settings.noticesBoard.splice(i, 1); 
        saveSettings(settings).then(() => renderNoticeBoard()); 
    }
}

export async function deleteSelectedNotices() {
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
}

export async function savePromoSpeed() {
    const promoSpeedInput = document.getElementById('promo-speed-input');
    if(promoSpeedInput) settings.promoSpeed = promoSpeedInput.value;
    await saveSettings(settings);
    alert('흐르는 속도가 성공적으로 저장되었습니다.');
    renderNoticeBoard();
}
