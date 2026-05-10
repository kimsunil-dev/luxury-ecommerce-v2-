import { getMembers } from '../modules/api.js';

export async function initMembers() {
    renderMembers();
}

export async function renderMembers() {
    const tableBody = document.getElementById('member-table-body');
    const totalCountEl = document.getElementById('member-total-count');
    const newCountEl = document.getElementById('member-new-count');
    
    if (!tableBody) return;
    
    try {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">데이터를 불러오는 중입니다...</td></tr>';
        
        const members = await getMembers();
        
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
