import { getSettings, saveSettings } from '../modules/api.js';

let settings;

export async function initSettings() {
    settings = await getSettings();

    window.updateMenu = updateMenu;
    window.deleteMenu = deleteMenu;
    window.addSubMenu = addSubMenu;
    window.addDepth1Menu = addDepth1Menu;
    window.saveMenuConfig = saveMenuConfig;

    const addBtn = document.getElementById('add-depth1-btn');
    if (addBtn) addBtn.addEventListener('click', addDepth1Menu);

    const saveBtn = document.getElementById('save-menu-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveMenuConfig);

    renderMenuBuilder();
}

function renderMenuBuilder() {
    const menuContainer = document.getElementById('menu-builder-container');
    if(!menuContainer) return;
    let html = buildMenuHtml(settings.menus, 1, 'menus');
    menuContainer.innerHTML = html;
}

function buildMenuHtml(menusArr, depth, pathStr) {
    if (depth > 3) return '';
    let html = `<div style="margin-left: ${depth > 1 ? 20 : 0}px; border-left: ${depth > 1 ? '2px solid #ccc' : 'none'}; padding-left: ${depth > 1 ? '10px' : '0'}; margin-top: 10px;">`;
    menusArr.forEach((menu, index) => {
        const currentPath = `${pathStr}[${index}]`;
        html += `<div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
            <span style="font-weight:600; color:#666;">Depth ${depth}</span>
            <input type="text" class="form-control" value="${menu.name}" onchange="updateMenu('${currentPath}', 'name', this.value)" placeholder="메뉴명" style="width:150px; padding:0.3rem;">
            <input type="text" class="form-control" value="${menu.link}" onchange="updateMenu('${currentPath}', 'link', this.value)" placeholder="링크" style="width:150px; padding:0.3rem;">
            <label style="font-size:0.8rem; display:flex; align-items:center; gap:0.2rem; margin:0;"><input type="checkbox" ${menu.highlight ? 'checked' : ''} onchange="updateMenu('${currentPath}', 'highlight', this.checked)"> 하이라이트</label>
            <span style="flex-grow:1;"></span>
            <button class="btn btn-danger" onclick="deleteMenu('${currentPath}')" style="padding:0.3rem 0.6rem;">삭제</button>
            ${depth < 3 ? `<button class="btn" onclick="addSubMenu('${currentPath}')" style="padding:0.3rem 0.6rem; background:#666;">+ 하위 메뉴</button>` : ''}
        </div>`;
        if (menu.children && menu.children.length > 0) {
            html += buildMenuHtml(menu.children, depth + 1, `${currentPath}.children`);
        }
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

export function updateMenu(path, field, val) {
    const {parent, key} = resolvePath(path);
    parent[key][field] = val;
}

export function deleteMenu(path) {
    const {parent, key} = resolvePath(path);
    parent.splice(key, 1);
    renderMenuBuilder();
}

export function addSubMenu(path) {
    const {parent, key} = resolvePath(path);
    if(!parent[key].children) parent[key].children = [];
    parent[key].children.push({ id: Date.now(), name: '새 메뉴', link: '#', children: [] });
    renderMenuBuilder();
}

export function addDepth1Menu() {
    settings.menus.push({ id: Date.now(), name: '새 메뉴', link: '#', highlight: false, children: [] });
    renderMenuBuilder();
}

export async function saveMenuConfig() {
    await saveSettings(settings);
    alert('글로벌 메뉴 3단계 구성이 저장되었습니다.');
}
