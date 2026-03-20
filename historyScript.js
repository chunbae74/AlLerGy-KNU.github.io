let logData = null; // 데이터를 저장할 전역 변수
let currentPage = 1;
const itemsPerPage = 10;

/**
 * 초기화 함수: 데이터를 불러온 후 첫 페이지를 렌더링합니다.
 */
async function init() {
    try {
        const response = await fetch('./history.json');
        
        if (!response.ok) {
            throw new Error(`[historyScript.js] 데이터를 불러오지 못했습니다. 상태: ${response.status}`);
        }

        logData = await response.json();
        
        // 데이터 로드 완료 후 첫 화면 렌더링
        renderLogs(currentPage);
        setupEventListeners();

    } catch (error) {
        console.error("초기화 중 오류 발생:", error);
        document.getElementById('log-container').innerHTML = 
            `<p class="text-center text-red-500 py-10">데이터를 불러오는 중 오류가 발생했습니다.</p>`;
    }
}

function renderLogs(page) {
    if (!logData || !logData.log) return;

    const container = document.getElementById('log-container');
    container.innerHTML = '';
    
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagedData = logData.log.slice(start, end);

    pagedData.forEach(item => {
        const dateObj = new Date(item.date);
        const dateStr = dateObj.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\.$/, "");

        const card = document.createElement('div');
        card.className = "log-item bg-white p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4";
        
        card.innerHTML = `
            <h2 class="text-xl md:text-2xl font-bold tracking-tight text-slate-800 leading-tight">
                [${item.userId}] ${item.text}
            </h2>
            <time class="text-sm font-semibold text-blue-300 shrink-0 tracking-tighter">
                ${dateStr}
            </time>
        `;
        container.appendChild(card);
    });

    updateUI();
}

function updateUI() {
    const totalPages = Math.ceil(logData.log.length / itemsPerPage) || 1;
    document.getElementById('page-info').innerText = `${currentPage} / ${totalPages}`;
    document.getElementById('prev-btn').disabled = currentPage === 1;
    document.getElementById('next-btn').disabled = currentPage === totalPages;
    
    const lastUpdateDate = new Date(logData.lastUpdate).toLocaleDateString();
    document.getElementById('last-update').innerText = `Last updated · ${lastUpdateDate}`;
}

function setupEventListeners() {
    document.getElementById('prev-btn').onclick = () => {
        if (currentPage > 1) { 
            currentPage--; 
            renderLogs(currentPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    document.getElementById('next-btn').onclick = () => {
        const totalPages = Math.ceil(logData.log.length / itemsPerPage);
        if (currentPage < totalPages) { 
            currentPage++; 
            renderLogs(currentPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
}

// 애플리케이션 시작
init();