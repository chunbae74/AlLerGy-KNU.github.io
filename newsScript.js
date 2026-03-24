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
        // 중요: h2에 가로 크기 제한을 인지할 수 있도록 스몰 디바이스 설정을 유지합니다.
        card.className = "log-item bg-white p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 overflow-hidden";
        let contentHtml = ""; // 텍스트 대신 HTML을 담을 변수

        if (item.type == "tier") {
            // --- 수정된 부분: 이미지 태그 삽입 ---
            // 이미지는 h2 높이(1em)에 맞춥니다. tier-icon 클래스 부여.
            // onError 처리를 통해 이미지 로드 실패 시 대체 텍스트(티어명) 출력
            const preTierImg = `<img src="./img/rank/${ranks[item.preTier]}.svg" alt="${item.preTier}" class="tier-icon inline-block align-middle mx-1" onerror="this.style.display='none'; this.after('${item.preTier}')">`;
            const nowTierImg = `<img src="./img/rank/${ranks[item.nowTier]}.svg" alt="${item.nowTier}" class="tier-icon inline-block align-middle mx-1" onerror="this.style.display='none'; this.after('${item.nowTier}')">`;
            
            contentHtml = `티어 상승! ${preTierImg} <span class="text-slate-400 mx-0.5">→</span> ${nowTierImg}`;
        } else if (item.type == "solved") {
            contentHtml = `${item.solvedCount} 문제 해결!`;
        } else if (item.type == "notice") {
            contentHtml = item.text;
        }

        card.innerHTML = `
            <h2 class="text-xl md:text-2xl font-bold tracking-tight text-slate-800 leading-tight whitespace-nowrap inline-block origin-left flex-grow min-width-0">
                <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" 
                   class="text-blue-500 hover:text-blue-700 hover:underline transition-colors mr-1">
                    @${item.userId}
                </a>님, ${contentHtml}
            </h2>
            <time class="text-sm font-semibold text-blue-300 shrink-0 tracking-tighter ml-auto pl-2">
                ${dateStr}
            </time>
        `;
        container.appendChild(card);

        // --- 폰트 크기 자동 조절 로직 시작 ---
        const h2 = card.querySelector('h2');
        const adjustFontSize = () => {
            if (window.innerWidth < 768) { 
                let fontSize = 1.1; // 기본 시작 크기 (rem)
                h2.style.fontSize = fontSize + 'rem';
                
                // 카드 내부 가용 너비 계산 (패딩 등을 제외한 실제 영역)
                const containerWidth = card.offsetWidth - 120; // 날짜 영역과 여백 확보를 위해 넉넉히 뺌
                
                // 글자 너비가 가용 너비보다 크면 0.1씩 줄임 (최소 0.6rem까지)
                while (h2.offsetWidth > containerWidth && fontSize > 0.6) {
                    fontSize -= 0.05;
                    h2.style.fontSize = fontSize + 'rem';
                }
            } else {
                h2.style.fontSize = ""; // PC 환경에서는 CSS 기본값 사용
            }
        };

        // 이미지 로딩이나 폰트 렌더링 시간을 고려해 살짝 지연 실행하거나 즉시 실행
        setTimeout(adjustFontSize, 0);
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
