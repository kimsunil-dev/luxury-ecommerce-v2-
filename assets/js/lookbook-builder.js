// assets/js/lookbook-builder.js

document.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('view-lookbook')) return;

    // State
    let activeLayout = { version: 2, title: '', zones: [] };
    let initialLayout = null;
    let selectedBlockPath = null; // { zoneIdx, blockIdx, childIdx }
    let productsList = [];

    // Init
    const settings = await getSettings();
    const products = await getProducts();
    productsList = products || [];

    // Migrate if needed
    if (settings.lookbook) {
        activeLayout = migrateLegacyLookbook(settings.lookbook);
        if (activeLayout.title) {
            document.getElementById('lookbook-title').value = activeLayout.title;
        }
    }
    initialLayout = JSON.parse(JSON.stringify(activeLayout));

    renderCanvas();
    renderLookbookHistory(settings);

    // Migration Logic
    function migrateLegacyLookbook(lb) {
        if (lb && lb.version === 2) return lb; 

        const newLb = { version: 2, title: '기존 마이그레이션 버전', zones: [] };
        if (!lb || Object.keys(lb).length === 0) return newLb;

        const cb = (img, vid, width = 100) => ({ id: 'b'+Date.now()+Math.random(), width, type: 'media', img: img||'', vid: vid||'', link: '' });

        if (lb.splitLeft || lb.splitRight) {
            newLb.zones.push({ id: 'z1', blocks: [cb(lb.splitLeft, lb.splitLeftVideo, 50), cb(lb.splitRight, lb.splitRightVideo, 50)] });
        }
        if (lb.fullWidth) {
            newLb.zones.push({ id: 'z2', blocks: [cb(lb.fullWidth, lb.fullWidthVideo, 100)] });
        }
        if (lb.splitLeft2 || lb.splitRight2) {
            newLb.zones.push({ id: 'z3', blocks: [cb(lb.splitLeft2, lb.splitLeft2Video, 50), cb(lb.splitRight2, lb.splitRight2Video, 50)] });
        }
        if (lb.asymLeft || lb.asymRight1) {
            newLb.zones.push({
                id: 'z4',
                blocks: [
                    cb(lb.asymLeft, lb.asymLeftVideo, 50),
                    { id: 'b_nest', width: 50, type: 'nested', grid: 4, children: [
                        cb(lb.asymRight1, lb.asymRight1Video), cb(lb.asymRight2, lb.asymRight2Video),
                        cb(lb.asymRight3, lb.asymRight3Video), cb(lb.asymRight4, lb.asymRight4Video)
                    ]}
                ]
            });
        }
        return newLb;
    }

    // --- Rendering Logic ---
    function renderCanvas() {
        const canvas = document.getElementById('layout-canvas');
        canvas.innerHTML = '';
        
        if (activeLayout.zones.length === 0) {
            canvas.innerHTML = '<div id="empty-canvas-msg" style="text-align: center; padding: 3rem; color: #aaa;">구역을 먼저 추가해주세요.</div>';
            return;
        }

        activeLayout.zones.forEach((zone, zIdx) => {
            const zoneEl = document.createElement('div');
            zoneEl.className = 'builder-zone';
            zoneEl.draggable = true;
            zoneEl.dataset.zidx = zIdx;

            const header = document.createElement('div');
            header.className = 'builder-zone-header';
            header.innerHTML = `
                <span>구역 ${zIdx + 1}</span>
                <div>
                    <button class="btn add-block-btn" data-zidx="${zIdx}" style="background:#007bff;color:#fff;padding:0.2rem 0.5rem;font-size:0.8rem;">+ 블럭 추가</button>
                </div>
            `;
            zoneEl.appendChild(header);

            const blocksContainer = document.createElement('div');
            blocksContainer.className = 'builder-blocks-container';

            zone.blocks.forEach((block, bIdx) => {
                const blockEl = createBlockElement(block, zIdx, bIdx);
                blocksContainer.appendChild(blockEl);

                // Add resizer if not last block
                if (bIdx < zone.blocks.length - 1) {
                    const resizer = document.createElement('div');
                    resizer.className = 'builder-resizer';
                    resizer.dataset.zidx = zIdx;
                    resizer.dataset.bidx = bIdx;
                    blocksContainer.appendChild(resizer);
                }
            });

            zoneEl.appendChild(blocksContainer);
            canvas.appendChild(zoneEl);
        });

        attachDragAndDrop();
        attachResizers();
    }

    function createBlockElement(block, zIdx, bIdx) {
        const el = document.createElement('div');
        el.className = 'builder-block' + (block.type === 'nested' ? ' has-children grid-' + block.grid : '');
        el.style.width = block.width + '%';
        el.dataset.zidx = zIdx;
        el.dataset.bIdx = bIdx;

        const isSelected = selectedBlockPath && selectedBlockPath.zIdx === zIdx && selectedBlockPath.bIdx === bIdx && selectedBlockPath.cIdx === undefined;
        if (isSelected) el.classList.add('selected');

        if (block.type === 'media') {
            const label = document.createElement('div');
            label.className = 'builder-block-label';
            label.innerText = `너비: ${block.width.toFixed(1)}%\n` + (block.img ? '(이미지 O)' : '(이미지 X)');
            el.appendChild(label);
            el.onclick = (e) => { e.stopPropagation(); selectBlock(zIdx, bIdx); };
        } else if (block.type === 'nested') {
            block.children.forEach((child, cIdx) => {
                const childEl = document.createElement('div');
                childEl.className = 'builder-child-block';
                const isCSelected = selectedBlockPath && selectedBlockPath.zIdx === zIdx && selectedBlockPath.bIdx === bIdx && selectedBlockPath.cIdx === cIdx;
                if (isCSelected) childEl.classList.add('selected');
                childEl.innerText = `하위 블럭 ${cIdx+1}\n` + (child.img ? '(이미지 O)' : '(이미지 X)');
                childEl.onclick = (e) => { e.stopPropagation(); selectBlock(zIdx, bIdx, cIdx); };
                el.appendChild(childEl);
            });
        }
        return el;
    }

    // --- Interaction Logic ---
    document.getElementById('reset-board-btn').onclick = () => {
        if (confirm('보드판을 페이지를 처음 열었을 때의 초기 상태로 되돌리시겠습니까? 저장되지 않은 작업 내역은 모두 사라집니다.')) {
            activeLayout = JSON.parse(JSON.stringify(initialLayout));
            document.getElementById('lookbook-title').value = activeLayout.title || '';
            selectedBlockPath = null;
            document.getElementById('block-editor-panel').style.display = 'none';
            renderCanvas();
        }
    };

    document.getElementById('add-zone-btn').onclick = () => {
        activeLayout.zones.push({ id: 'z'+Date.now(), blocks: [{ id: 'b'+Date.now(), width: 100, type: 'media', img: '', vid: '', link: '' }] });
        renderCanvas();
    };

    document.addEventListener('click', e => {
        if (e.target.classList.contains('add-block-btn')) {
            const zIdx = parseInt(e.target.dataset.zidx);
            const zone = activeLayout.zones[zIdx];
            if (zone.blocks.length >= 3) {
                alert('한 구역에는 최대 3개의 블럭만 추가할 수 있습니다.');
                return;
            }
            // Redistribute width
            const newWidth = 100 / (zone.blocks.length + 1);
            zone.blocks.forEach(b => b.width = newWidth);
            zone.blocks.push({ id: 'b'+Date.now(), width: newWidth, type: 'media', img: '', vid: '', link: '' });
            renderCanvas();
        }
    });

    // Resizer Logic
    function attachResizers() {
        const resizers = document.querySelectorAll('.builder-resizer');
        let isResizing = false;
        let currentResizer = null;
        let startX = 0;
        let leftBlock = null, rightBlock = null;
        let leftStartWidth = 0, rightStartWidth = 0;
        let containerWidth = 0;

        resizers.forEach(resizer => {
            resizer.addEventListener('mousedown', e => {
                isResizing = true;
                currentResizer = resizer;
                startX = e.clientX;
                const zIdx = parseInt(resizer.dataset.zidx);
                const bIdx = parseInt(resizer.dataset.bidx);
                
                leftBlock = activeLayout.zones[zIdx].blocks[bIdx];
                rightBlock = activeLayout.zones[zIdx].blocks[bIdx + 1];
                leftStartWidth = leftBlock.width;
                rightStartWidth = rightBlock.width;
                containerWidth = resizer.parentElement.clientWidth;
                
                document.body.style.cursor = 'col-resize';
                resizer.classList.add('active');
                e.preventDefault();
            });
        });

        document.addEventListener('mousemove', e => {
            if (!isResizing) return;
            const dx = e.clientX - startX;
            const dxPercent = (dx / containerWidth) * 100;
            
            let newLeftWidth = leftStartWidth + dxPercent;
            let newRightWidth = rightStartWidth - dxPercent;

            if (newLeftWidth < 10) { newLeftWidth = 10; newRightWidth = leftStartWidth + rightStartWidth - 10; }
            if (newRightWidth < 10) { newRightWidth = 10; newLeftWidth = leftStartWidth + rightStartWidth - 10; }

            leftBlock.width = newLeftWidth;
            rightBlock.width = newRightWidth;
            renderCanvas(); // In a real app, we'd update DOM directly for performance, but this is fine for now
            // Wait, re-rendering the whole canvas on mousemove destroys the resizer!
            // Let's just update styles instead.
        });

        // Fix for resizer destroying:
        // Actually, replacing renderCanvas on mousemove breaks the mouse tracking because the DOM node is destroyed.
        // I will write a direct DOM update logic.
    }

    // Rewrite attachResizers for smooth dragging without destroying DOM
    function attachResizers() {
        const resizers = document.querySelectorAll('.builder-resizer');
        let isResizing = false, currentResizer = null, startX = 0;
        let leftBlockNode = null, rightBlockNode = null;
        let leftBlockData = null, rightBlockData = null;
        let leftStartWidth = 0, rightStartWidth = 0, containerWidth = 0;

        resizers.forEach(resizer => {
            resizer.addEventListener('mousedown', e => {
                isResizing = true;
                startX = e.clientX;
                const zIdx = parseInt(resizer.dataset.zidx);
                const bIdx = parseInt(resizer.dataset.bidx);
                
                leftBlockData = activeLayout.zones[zIdx].blocks[bIdx];
                rightBlockData = activeLayout.zones[zIdx].blocks[bIdx + 1];
                leftStartWidth = leftBlockData.width;
                rightStartWidth = rightBlockData.width;
                
                leftBlockNode = resizer.previousElementSibling;
                rightBlockNode = resizer.nextElementSibling;
                containerWidth = resizer.parentElement.clientWidth;
                
                document.body.style.cursor = 'col-resize';
                e.preventDefault();
            });
        });

        document.addEventListener('mousemove', e => {
            if (!isResizing) return;
            const dx = e.clientX - startX;
            const dxPercent = (dx / containerWidth) * 100;
            
            let newLeftWidth = leftStartWidth + dxPercent;
            let newRightWidth = rightStartWidth - dxPercent;

            if (newLeftWidth < 10) { newLeftWidth = 10; newRightWidth = leftStartWidth + rightStartWidth - 10; }
            if (newRightWidth < 10) { newRightWidth = 10; newLeftWidth = leftStartWidth + rightStartWidth - 10; }

            leftBlockData.width = newLeftWidth;
            rightBlockData.width = newRightWidth;
            
            leftBlockNode.style.width = newLeftWidth + '%';
            rightBlockNode.style.width = newRightWidth + '%';
            
            leftBlockNode.querySelector('.builder-block-label').innerText = `너비: ${newLeftWidth.toFixed(1)}%\n` + (leftBlockData.img ? '(이미지 O)' : '(이미지 X)');
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
            }
        });
    }

    // Drag and drop zones
    function attachDragAndDrop() {
        const zones = document.querySelectorAll('.builder-zone');
        const trash = document.getElementById('canvas-trash-bin');
        let draggedZoneIdx = null;

        zones.forEach(zone => {
            zone.addEventListener('dragstart', e => {
                draggedZoneIdx = parseInt(zone.dataset.zidx);
                setTimeout(() => zone.classList.add('dragging'), 0);
                trash.style.display = 'block';
            });
            zone.addEventListener('dragend', () => {
                zone.classList.remove('dragging');
                trash.style.display = 'none';
                
                const newZones = [];
                document.querySelectorAll('.builder-zone').forEach(zNode => {
                    if(zNode.classList.contains('dragging')) return;
                    const oldIdx = parseInt(zNode.dataset.zidx);
                    newZones.push(activeLayout.zones[oldIdx]);
                });
                activeLayout.zones = newZones;
                renderCanvas();
            });
            zone.addEventListener('dragover', e => {
                e.preventDefault();
                const afterElement = getDragAfterElement(zone.parentElement, e.clientY);
                const container = zone.parentElement;
                const dragging = document.querySelector('.dragging');
                if (!dragging) return;
                if (afterElement == null) {
                    container.appendChild(dragging);
                } else {
                    container.insertBefore(dragging, afterElement);
                }
            });
        });

        trash.addEventListener('dragover', e => e.preventDefault());
        trash.addEventListener('drop', e => {
            if (draggedZoneIdx !== null) {
                activeLayout.zones.splice(draggedZoneIdx, 1);
                draggedZoneIdx = null;
                selectedBlockPath = null;
                document.getElementById('block-editor-panel').style.display = 'none';
            }
        });

        // Helper to determine drop position
        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.builder-zone:not(.dragging)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
    }

// --- Part 2 of assets/js/lookbook-builder.js ---
    // Property Binding
    function selectBlock(zIdx, bIdx, cIdx) {
        selectedBlockPath = { zIdx, bIdx, cIdx };
        renderCanvas(); // updates highlights
        
        const block = cIdx !== undefined 
            ? activeLayout.zones[zIdx].blocks[bIdx].children[cIdx]
            : activeLayout.zones[zIdx].blocks[bIdx];

        document.getElementById('block-editor-panel').style.display = 'block';
        document.getElementById('block-link-input').value = block.link || '';
        document.getElementById('block-img-input').value = '';
        document.getElementById('block-vid-input').value = '';
        
        const imgPreview = document.getElementById('block-img-preview');
        if (block.img) {
            imgPreview.style.backgroundImage = `url(${block.img})`;
            imgPreview.style.display = 'block';
        } else {
            imgPreview.style.display = 'none';
        }

        const vidPreview = document.getElementById('block-vid-preview');
        vidPreview.style.display = block.vid ? 'block' : 'none';

        // Show/hide add subblock btn
        const addSubBtn = document.getElementById('add-subblock-btn');
        if (cIdx === undefined && block.type === 'media') {
            addSubBtn.style.display = 'block';
        } else {
            addSubBtn.style.display = 'none';
        }
    }

    document.getElementById('close-editor-btn').onclick = () => {
        selectedBlockPath = null;
        document.getElementById('block-editor-panel').style.display = 'none';
        renderCanvas();
    };

    document.getElementById('add-subblock-btn').onclick = () => {
        if (!selectedBlockPath) return;
        const b = activeLayout.zones[selectedBlockPath.zIdx].blocks[selectedBlockPath.bIdx];
        if (confirm('이 블럭을 분할하여 여러 개의 하위 블럭으로 만드시겠습니까? 기존 이미지는 초기화됩니다.')) {
            b.type = 'nested';
            b.grid = 4; // default 2x2
            b.img = ''; b.vid = ''; b.link = '';
            b.children = [];
            for(let i=0; i<4; i++) {
                b.children.push({ id: 'b'+Date.now()+i, type: 'media', img: '', vid: '', link: '' });
            }
            document.getElementById('block-editor-panel').style.display = 'none';
            selectedBlockPath = null;
            renderCanvas();
        }
    };

    document.getElementById('apply-block-data-btn').onclick = async () => {
        if (!selectedBlockPath) return;
        const block = selectedBlockPath.cIdx !== undefined 
            ? activeLayout.zones[selectedBlockPath.zIdx].blocks[selectedBlockPath.bIdx].children[selectedBlockPath.cIdx]
            : activeLayout.zones[selectedBlockPath.zIdx].blocks[selectedBlockPath.bIdx];

        const imgFile = document.getElementById('block-img-input').files[0];
        const vidFile = document.getElementById('block-vid-input').files[0];
        const btn = document.getElementById('apply-block-data-btn');
        btn.innerText = '적용 중...';

        if (imgFile) {
            await new Promise(r => compressImage(imgFile, dataUrl => { block.img = dataUrl; r(); }));
        }
        if (vidFile) {
            await new Promise(r => {
                const reader = new FileReader();
                reader.onload = e => { block.vid = e.target.result; r(); };
                reader.readAsDataURL(vidFile);
            });
        }
        
        btn.innerText = '블럭에 내용 적용';
        selectBlock(selectedBlockPath.zIdx, selectedBlockPath.bIdx, selectedBlockPath.cIdx); // refresh preview
    };

    // Product Link Modal
    const pModal = document.getElementById('product-link-modal');
    document.getElementById('select-product-link-btn').onclick = () => {
        pModal.style.display = 'flex';
        renderProductList();
    };
    document.getElementById('close-product-modal-btn').onclick = () => pModal.style.display = 'none';
    
    document.getElementById('clear-product-link-btn').onclick = () => {
        document.getElementById('block-link-input').value = '';
        if (selectedBlockPath) {
            const block = selectedBlockPath.cIdx !== undefined ? activeLayout.zones[selectedBlockPath.zIdx].blocks[selectedBlockPath.bIdx].children[selectedBlockPath.cIdx] : activeLayout.zones[selectedBlockPath.zIdx].blocks[selectedBlockPath.bIdx];
            block.link = '';
        }
        pModal.style.display = 'none';
    };

    document.getElementById('product-search-input').addEventListener('input', e => {
        renderProductList(e.target.value);
    });

    function renderProductList(filter = '') {
        const listEl = document.getElementById('product-link-list');
        listEl.innerHTML = '';
        const f = filter.toLowerCase();
        productsList.forEach(p => {
            if (f && !p.name.toLowerCase().includes(f)) return;
            const item = document.createElement('div');
            item.className = 'product-list-item';
            item.innerHTML = `<img src="${p.image}" style="width:40px;height:40px;object-fit:cover;"> <div><strong>${p.name}</strong><br><span style="font-size:0.8rem;color:#666;">${p.category}</span></div>`;
            item.onclick = () => {
                const link = `product.html?id=${p.id}`;
                document.getElementById('block-link-input').value = link;
                if (selectedBlockPath) {
                    const block = selectedBlockPath.cIdx !== undefined ? activeLayout.zones[selectedBlockPath.zIdx].blocks[selectedBlockPath.bIdx].children[selectedBlockPath.cIdx] : activeLayout.zones[selectedBlockPath.zIdx].blocks[selectedBlockPath.bIdx];
                    block.link = link;
                }
                pModal.style.display = 'none';
            };
            listEl.appendChild(item);
        });
    }

    // Save Logic
    document.getElementById('save-lookbook-btn').onclick = async () => {
        const title = document.getElementById('lookbook-title').value.trim();
        if (!title) { alert('보드판의 제목(버전명)을 입력해주세요.'); return; }
        
        activeLayout.title = title;
        
        // Clean layout data before save
        const saveObj = JSON.parse(JSON.stringify(activeLayout));

        const action = confirm('화면 디자인을 저장했습니다.\n[확인] 프론트 화면에 즉시 적용\n[취소] 적용내역에 저장만 하기');
        
        if (!settings.lookbookHistory) settings.lookbookHistory = [];
        
        settings.lookbookHistory.unshift({
            id: title,
            timestamp: new Date().toISOString(),
            data: saveObj
        });

        if (action) { // Apply
            settings.lookbook = saveObj;
        }

        await saveSettings(settings);
        renderLookbookHistory(settings);
        alert(action ? '저장 및 적용되었습니다!' : '저장되었습니다.');
    };

    // History Table
    function renderLookbookHistory(settingsRef) {
        const tbody = document.getElementById('lookbook-history-table');
        if (!tbody) return;
        tbody.innerHTML = '';
        const history = settingsRef.lookbookHistory || [];
        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">저장된 화면 디자인 적용 히스토리가 없습니다.</td></tr>';
            return;
        }
        
        // Check current applied version
        let currentString = JSON.stringify(settingsRef.lookbook);

        history.forEach((item, idx) => {
            const tr = document.createElement('tr');
            const isCurrent = JSON.stringify(item.data) === currentString;
            const dt = new Date(item.timestamp).toLocaleString('ko-KR');
            tr.innerHTML = `
                <td><input type="checkbox" class="history-checkbox" data-idx="${idx}" ${isCurrent ? 'disabled' : ''}></td>
                <td>${history.length - idx}</td>
                <td>${dt}</td>
                <td style="font-weight: bold;">${item.id}</td>
                <td>${isCurrent ? '<span style="color: #03c75a; font-weight: bold;">현재 적용 중</span>' : '<span style="color: #999;">과거 내역</span>'}</td>
                <td>
                    <button class="btn btn-edit" data-idx="${idx}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background:#17a2b8; color:#fff; border:none; margin-right: 0.3rem;">불러오기(수정)</button>
                    ${!isCurrent ? `<button class="btn btn-restore" data-idx="${idx}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; margin-right: 0.3rem;">적용</button>` : ''}
                    <button class="btn btn-delete" data-idx="${idx}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: #dc3545; color:white; border:none;">개별 삭제</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Attach History Events
        tbody.querySelectorAll('.btn-edit').forEach(btn => btn.onclick = (e) => {
            const idx = e.target.getAttribute('data-idx');
            if (confirm('이 버전을 보드판으로 불러오시겠습니까? 현재 보드판 내용이 덮어씌워집니다.')) {
                activeLayout = JSON.parse(JSON.stringify(history[idx].data));
                document.getElementById('lookbook-title').value = activeLayout.title || history[idx].id;
                renderCanvas();
            }
        });

        tbody.querySelectorAll('.btn-restore').forEach(btn => btn.onclick = async (e) => {
            const idx = e.target.getAttribute('data-idx');
            if (confirm('이 버전을 즉시 라이브 화면에 적용하시겠습니까?')) {
                settingsRef.lookbook = JSON.parse(JSON.stringify(history[idx].data));
                await saveSettings(settingsRef);
                renderLookbookHistory(settingsRef);
                alert('적용되었습니다.');
            }
        });

        tbody.querySelectorAll('.btn-delete').forEach(btn => btn.onclick = async (e) => {
            const idx = e.target.getAttribute('data-idx');
            if (confirm('이 히스토리를 완전히 삭제하시겠습니까?')) {
                settingsRef.lookbookHistory.splice(idx, 1);
                await saveSettings(settingsRef);
                renderLookbookHistory(settingsRef);
            }
        });
    }

    // Bulk Delete
    document.getElementById('history-select-all').onchange = (e) => {
        document.querySelectorAll('.history-checkbox:not(:disabled)').forEach(cb => cb.checked = e.target.checked);
    };

    document.getElementById('delete-selected-history-btn').onclick = async () => {
        const cbs = document.querySelectorAll('.history-checkbox:checked');
        if (cbs.length === 0) return;
        if (!confirm(`선택한 ${cbs.length}개의 내역을 삭제하시겠습니까?`)) return;

        const indicesToDelete = Array.from(cbs).map(cb => parseInt(cb.dataset.idx)).sort((a,b) => b-a);
        indicesToDelete.forEach(idx => {
            settings.lookbookHistory.splice(idx, 1);
        });
        
        await saveSettings(settings);
        renderLookbookHistory(settings);
    };
});
