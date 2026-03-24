let logData = null; // 데이터를 저장할 전역 변수
let currentPage = 1;
const itemsPerPage = 10;
const ranks = ["unranked", "b5", "b4", "b3", "b2", "b1", "s5", "s4", "s3", "s2", "s1", "g5", "g4", "g3", "g2", "g1", "p5", "p4", "p3", "p2", "p1", "d5", "d4", "d3", "d2", "d1", "r5", "r4", "r3", "r2", "r1", "master"];

/**
 * 초기화 함수: 데이터를 불러온 후 첫 페이지를 렌더링합니다.
 */
async function init() {
    try {
        const response = await fetch('./news.json');
        
        if (!response.ok) {
            throw new Error(`[newsScript.js] 데이터를 불러오지 못했습니다. 상태: ${response.status}`);
        }

        // json() 역시 비동기이므로 await가 필요합니다.
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
    const container = document.getElementById('log-container');
    container.innerHTML = '';

    if (!logData || !logData.log || logData.log.length === 0) {
        container.innerHTML = `
            <div class="py-20 text-center">
                <p class="text-xl font-semibold text-slate-400">
                    앗, 아직 아무 변경사항도 없어요...
                </p>
            </div>
        `;
        updateUI(true);
        return;
    }

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

        const profileUrl = `https://solved.ac/profile/${item.userId}`;

        const card = document.createElement('div');
        
        // items-center를 추가하여 내부의 모든 요소가 수직 중앙에 오도록 설정
        card.className = "log-item bg-white px-4 py-5 md:p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-row items-center justify-between gap-2 overflow-hidden min-h-[80px]";
        
        let contentHtml = ""; 
        if (item.type == "tier") {
            const preTierImg = `<img src="./img/rank/${item.preTier}.svg" alt="${item.preTier}" class="tier-icon" onerror="this.style.display='none'; this.after('${item.preTier}')">`;
            const nowTierImg = `<img src="./img/rank/${item.nowTier}.svg" alt="${item.nowTier}" class="tier-icon" onerror="this.style.display='none'; this.after('${item.nowTier}')">`;
            contentHtml = `티어 상승! ${preTierImg} <span class="text-slate-400 mx-0.5">→</span> ${nowTierImg}`;
        } else if (item.type == "solved") {
            contentHtml = `${item.solvedCount} 문제 해결!`;
        } else if (item.type == "notice") {
            contentHtml = item.text;
        }

        card.innerHTML = `
            <h2 class="flex items-center text-lg md:text-2xl font-bold tracking-tight text-slate-800 leading-none whitespace-nowrap origin-left flex-grow overflow-hidden">
                <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" 
                class="text-blue-500 hover:text-blue-700 hover:underline transition-colors mr-1 shrink-0">
                    @${item.userId}
                </a>
                <span class="flex items-center shrink-0">님, ${contentHtml}</span>
            </h2>
            <time class="text-[11px] md:text-sm font-semibold text-blue-300 shrink-0 tracking-tighter ml-auto pl-2">
                ${dateStr}
            </time>
        `;
        container.appendChild(card);

        // --- 폰트 크기 자동 조절 로직 수정 ---
        const h2 = card.querySelector('h2');
        const adjustFontSize = () => {
            if (window.innerWidth < 768) { 
                let fontSize = 1.0; // 시작 크기를 1rem으로 조절
                h2.style.fontSize = fontSize + 'rem';
                
                const timeElement = card.querySelector('time');
                const reservedWidth = timeElement.offsetWidth + 40; // 날짜 너비 + 여백
                const containerWidth = card.offsetWidth - reservedWidth;
                
                // 최소 크기를 0.85rem으로 상향 조정하여 가독성 확보
                if (h2.scrollWidth > containerWidth) {
                    while (h2.scrollWidth > containerWidth && fontSize > 0.85) {
                        fontSize -= 0.01;
                        h2.style.fontSize = fontSize + 'rem';
                    }
                }
            } else {
                h2.style.fontSize = ""; 
            }
        };

        setTimeout(adjustFontSize, 50);
    });

    updateUI(false);
}

function updateUI(isEmpty) {
    const paginationNav = document.querySelector('nav');
    const lastUpdateElement = document.getElementById('last-update');
    
    if (isEmpty) {
        if(paginationNav) paginationNav.style.display = 'none';
        lastUpdateElement.innerText = 'No updates found';
    } else {
        if(paginationNav) paginationNav.style.display = 'flex';
        const totalPages = Math.ceil(logData.log.length / itemsPerPage) || 1;
        document.getElementById('page-info').innerText = `${currentPage} / ${totalPages}`;
        document.getElementById('prev-btn').disabled = currentPage === 1;
        document.getElementById('next-btn').disabled = currentPage === totalPages;
        
        const lastUpdateDate = new Date(logData.lastUpdate).toLocaleDateString();
        // 줄바꿈 적용을 위해 innerHTML 사용
        lastUpdateElement.innerHTML = `Last updated: ${lastUpdateDate}<br><span class="text-[11px] opacity-70">※ News는 매일 17:30에 업데이트됩니다.</span>`;
    }
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
