// 에디터 및 표(Table) 그리기 모듈

let lastEditorRange = null;

export function initEditor() {
    document.addEventListener('selectionchange', () => {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            let node = sel.getRangeAt(0).commonAncestorContainer;
            if (node.nodeType === 3) node = node.parentNode;
            if (node.closest && node.closest('[contenteditable="true"]')) {
                lastEditorRange = sel.getRangeAt(0).cloneRange();
            }
        }
    });

    // 전역 함수로 등록 (HTML의 onclick 속성에서 호출될 수 있도록)
    window.insertTable = insertTable;
    window.insertTableRow = insertTableRow;
    window.deleteTableRow = deleteTableRow;
    window.changeCellColor = changeCellColor;
    window.changeTableWidth = changeTableWidth;
    window.changeTableHeight = changeTableHeight;
    window.changeTableBorderThickness = changeTableBorderThickness;
    window.changeTableBorderColor = changeTableBorderColor;
    window.changeCellTextAlign = changeCellTextAlign;
    window.insertTableColumn = insertTableColumn;
    window.deleteTableColumn = deleteTableColumn;
}

function restoreEditorSelection() {
    const sel = window.getSelection();
    let node = sel.focusNode;
    if (node && node.nodeType === 3) node = node.parentNode;
    
    if ((!sel.rangeCount || !node || !node.closest || !node.closest('[contenteditable="true"]')) && lastEditorRange) {
        sel.removeAllRanges();
        sel.addRange(lastEditorRange);
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

export function insertTable() {
    const tableHTML = `<div class="table-wrapper"><table class="page-table" style="width:100%; border:1px solid #e5e5e5; border-collapse:collapse;">
        <thead>
            <tr>
                <th style="border-bottom:1px solid #e5e5e5; padding:8px;">서비스명</th>
                <th style="border-bottom:1px solid #e5e5e5; padding:8px;">배달 시간</th>
                <th style="border-bottom:1px solid #e5e5e5; padding:8px;">비용 정보</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="border-bottom:1px solid #e5e5e5; padding:8px;">내용을 입력하세요</td>
                <td style="border-bottom:1px solid #e5e5e5; padding:8px;">내용을 입력하세요</td>
                <td style="border-bottom:1px solid #e5e5e5; padding:8px;">내용을 입력하세요</td>
            </tr>
            <tr>
                <td style="border-bottom:1px solid #e5e5e5; padding:8px;">내용을 입력하세요</td>
                <td style="border-bottom:1px solid #e5e5e5; padding:8px;">내용을 입력하세요</td>
                <td style="border-bottom:1px solid #e5e5e5; padding:8px;">내용을 입력하세요</td>
            </tr>
        </tbody>
    </table></div><p><br></p>`;
    document.execCommand('insertHTML', false, tableHTML);
}

export function insertTableRow() {
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
}

export function deleteTableRow() {
    const sel = restoreEditorSelection();
    if (!sel.rangeCount) { alert('줄을 삭제할 표의 칸을 클릭해주세요.'); return; }
    let node = sel.focusNode;
    while (node && node.nodeName !== 'TR' && node.nodeName !== 'TABLE' && !node.classList?.contains('rich-editor')) {
        node = node.parentNode;
    }
    if (node && node.nodeName === 'TR') {
        if (node.parentNode.children.length <= 1) {
            alert('마지막 줄은 삭제할 수 없습니다.');
        } else {
            node.remove();
        }
    } else {
        alert('줄을 삭제할 표의 칸(셀)을 선택한 상태에서 클릭해주세요.');
    }
}

export function changeCellColor(color) {
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
}

export function changeTableWidth(widthPercent) {
    let table = getSelectedTable();
    if (table) {
        table.style.width = `${widthPercent}%`;
        let wrapper = table.closest('.table-wrapper');
        if (wrapper) wrapper.style.width = `${widthPercent}%`;
    } else {
        alert('크기를 변경할 표의 안쪽을 먼저 클릭해주세요.');
    }
}

export function changeTableHeight(heightPx) {
    let table = getSelectedTable();
    if (table) {
        table.style.height = `${heightPx}px`;
    } else {
        alert('세로 높이를 조절할 표의 안쪽을 먼저 클릭해주세요.');
    }
}

export function changeTableBorderThickness(thickness) {
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
}

export function changeTableBorderColor(color) {
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
}

export function changeCellTextAlign(align) {
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
}

export function insertTableColumn() {
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
                const newCell = row.children[cellIndex].cloneNode(true);
                newCell.innerHTML = '';
                row.insertBefore(newCell, row.children[cellIndex].nextSibling);
            });
        }
    } else {
        alert('칸을 추가할 표의 칸(셀)을 선택한 상태에서 클릭해주세요.');
    }
}

export function deleteTableColumn() {
    const sel = restoreEditorSelection();
    if (!sel.rangeCount) return;
    let node = sel.focusNode;
    while (node && node.nodeName !== 'TD' && node.nodeName !== 'TH' && !node.classList?.contains('rich-editor')) {
        node = node.parentNode;
    }
    if (node && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
        let cellIndex = Array.from(node.parentNode.children).indexOf(node);
        let table = node.closest('table');
        if (table && table.rows[0].cells.length > 1) {
            table.querySelectorAll('tr').forEach(row => {
                if(row.children[cellIndex]) row.children[cellIndex].remove();
            });
        } else {
            alert('마지막 칸은 삭제할 수 없습니다.');
        }
    } else {
        alert('칸을 삭제할 표의 칸(셀)을 선택한 상태에서 클릭해주세요.');
    }
}
