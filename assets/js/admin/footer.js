import { getSettings, saveSettings } from '../modules/api.js';
import { compressImage } from '../modules/utils.js';

let settings;
const footerBoardContainer = document.getElementById('footer-board-container');

export async function initFooter() {
    settings = await getSettings();

    window.addFooterItem = addFooterItem;
    window.updateFooterItem = updateFooterItem;
    window.deleteFooterItem = deleteFooterItem;
    window.openFooterModal = openFooterModal;
    window.saveFooterConfig = saveFooterConfig;
    window.savePerksConfig = savePerksConfig;

    renderFooterBoard();
    initPerks();
}

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

export function updateFooterItem(catIdx, itemIdx, field, val) {
    settings.footerMenus[catIdx].items[itemIdx][field] = val;
    renderFooterBoard();
}

export function addFooterItem(catIdx) {
    if (!settings.footerMenus[catIdx].items) settings.footerMenus[catIdx].items = [];
    settings.footerMenus[catIdx].items.push({ title: '새 메뉴', type: 'page', content: '' });
    renderFooterBoard();
}

export function deleteFooterItem(catIdx, itemIdx) {
    settings.footerMenus[catIdx].items.splice(itemIdx, 1);
    renderFooterBoard();
}

export async function saveFooterConfig() {
    await saveSettings(settings);
    alert('하단 푸터 구조가 저장되었습니다.');
}

export function openFooterModal(catIdx, itemIdx) {
    const item = settings.footerMenus[catIdx].items[itemIdx];
    document.getElementById('notice-modal-heading').innerText = `푸터 페이지 수정: ${item.title}`;
    document.getElementById('notice-modal-index').value = `footer_${catIdx}_${itemIdx}`;
    
    // Hide notice specific fields
    const dateInput = document.getElementById('notice-modal-date');
    if (dateInput) { dateInput.style.display = 'none'; dateInput.previousElementSibling.style.display = 'none'; }
    const titleInput = document.getElementById('notice-modal-title-input');
    if (titleInput) { titleInput.style.display = 'none'; titleInput.previousElementSibling.style.display = 'none'; }
    const vidInput = document.getElementById('notice-modal-vid');
    if (vidInput) { vidInput.style.display = 'none'; vidInput.previousElementSibling.style.display = 'none'; }
    
    const imgInput = document.getElementById('notice-modal-img');
    if (imgInput) { imgInput.style.display = 'block'; imgInput.previousElementSibling.style.display = 'block'; }
    const imgPreview = document.getElementById('notice-modal-img-preview');
    if (imgPreview) {
        imgPreview.style.display = 'block';
        imgPreview.innerHTML = item.image ? `<img src="${item.image}" style="max-width:100%; max-height:150px;">` : '';
    }
    
    document.getElementById('footer-editor-toolbar').style.display = 'flex';
    document.getElementById('table-properties-toolbar').style.display = 'flex';
    document.getElementById('footer-layout-label').style.display = 'block';
    document.getElementById('footer-layout-select').style.display = 'block';
    document.getElementById('notice-content-label').style.display = 'none';
    
    let layoutData = null;
    let isJson = false;
    try {
        if (item.content && item.content.startsWith('{')) {
            layoutData = JSON.parse(item.content);
            isJson = true;
        }
    } catch(e) {}

    const layoutSelect = document.getElementById('footer-layout-select');
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

    // Replace the save handler dynamically for footer
    const saveBtn = document.querySelector('#notice-modal button.btn[onclick="saveNoticeModal()"]');
    if(saveBtn) {
        saveBtn.setAttribute('onclick', 'saveFooterModal()');
        window.saveFooterModal = async () => {
            const layoutType = layoutSelect.value;
            let finalContent = '';
            
            if (layoutType === 'contact') {
                finalContent = JSON.stringify({
                    type: 'contact',
                    left: document.getElementById('editor-contact-left').innerHTML,
                    right: document.getElementById('editor-contact-right').innerHTML,
                    bottom: document.getElementById('editor-contact-bottom').innerHTML
                });
            } else {
                finalContent = JSON.stringify({
                    type: 'standard',
                    content: document.getElementById('editor-standard').innerHTML
                });
            }
            
            const imgFile = imgInput.files[0];
            const finishFooterSave = async (imgDataUrl) => {
                item.content = finalContent;
                if (imgDataUrl) item.image = imgDataUrl;
                await saveSettings(settings);
                document.getElementById('notice-modal').style.display = 'none';
                renderFooterBoard();
                
                // Restore onclick to original
                saveBtn.setAttribute('onclick', 'saveNoticeModal()');
                
                // Reset displays for notice modal
                if (dateInput) { dateInput.style.display = 'block'; dateInput.previousElementSibling.style.display = 'block'; }
                if (titleInput) { titleInput.style.display = 'block'; titleInput.previousElementSibling.style.display = 'block'; }
                if (vidInput) { vidInput.style.display = 'block'; vidInput.previousElementSibling.style.display = 'block'; }
                document.getElementById('notice-content-label').style.display = 'block';
                document.getElementById('footer-layout-label').style.display = 'none';
                document.getElementById('footer-layout-select').style.display = 'none';
            };

            saveBtn.textContent = '저장 중...';

            if (imgFile) {
                compressImage(imgFile, dataUrl => {
                    finishFooterSave(dataUrl);
                });
            } else {
                finishFooterSave(null);
            }
        };
    }

    document.getElementById('notice-modal').style.display = 'flex';
}

function initPerks() {
    const perkInputs = document.querySelectorAll('#perks-container input[type="text"]');
    const hashtagInput = document.getElementById('perks-hashtag-input');
    
    if (hashtagInput) hashtagInput.value = settings.perksHashtag || '#SIRTHELABEL';
    
    if (perkInputs.length === 6 && settings.perks && settings.perks.length === 3) {
        perkInputs[0].value = settings.perks[0].title;
        perkInputs[1].value = settings.perks[0].desc;
        perkInputs[2].value = settings.perks[1].title;
        perkInputs[3].value = settings.perks[1].desc;
        perkInputs[4].value = settings.perks[2].title;
        perkInputs[5].value = settings.perks[2].desc;
    }
}

export async function savePerksConfig() {
    const perkInputs = document.querySelectorAll('#perks-container input[type="text"]');
    const hashtagInput = document.getElementById('perks-hashtag-input');
    
    if (hashtagInput) settings.perksHashtag = hashtagInput.value || '#SIRTHELABEL';
    if (perkInputs.length === 6) {
        settings.perks[0].title = perkInputs[0].value;
        settings.perks[0].desc = perkInputs[1].value;
        settings.perks[1].title = perkInputs[2].value;
        settings.perks[1].desc = perkInputs[3].value;
        settings.perks[2].title = perkInputs[4].value;
        settings.perks[2].desc = perkInputs[5].value;
    }
    await saveSettings(settings);
    alert('하단 브랜드 해시태그 및 혜택 정보가 저장되었습니다.');
}
