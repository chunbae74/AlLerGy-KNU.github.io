const axios = require('axios');
const fs = require('fs');

const url = {
    'profile': 'https://solved.ac/api/v3/user/show?handle='
};

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
};

const ranks = ["unranked", "b5", "b4", "b3", "b2", "b1", "s5", "s4", "s3", "s2", "s1", "g5", "g4", "g3", "g2", "g1", "p5", "p4", "p3", "p2", "p1", "d5", "d4", "d3", "d2", "d1", "r5", "r4", "r3", "r2", "r1", "master"];

async function getUserInfoList() {
    try {
        const data = fs.readFileSync('./userIdList.json', 'utf8');
        
        const { userIdList } = JSON.parse(data);const promises = userIdList.map(async (userId) => {
            if (userId) {
                // getRank(비동기 함수)를 여기서 호출하지만 기다리지 않고 Promise만 반환합니다.
                const userInfo = await getUserInfo(userId);
                return {
                    userId: userId,
                    data: {
                        rank: ranks[userInfo['tier']],
                        solvedCount: userInfo['solvedCount']
                    }
                };
            }
            return null;
        });

        // 2. Promise.all을 사용해 모든 요청이 병렬로 실행되도록 하고 전체가 끝날 때까지 기다립니다.
        const results = await Promise.all(promises);

        // 3. 배열로 받은 결과를 다시 객체(userIds) 형태로 변환합니다.
        const userIds = {};
        results.forEach(res => {
            if (res) {
                userIds[res.userId] = res.data;
            }
        });

        const sortedEntries = Object.entries(userIds).sort((a, b) => {
            return b[1].solvedCount - a[1].solvedCount;
        });

        const sortedUsers = Object.fromEntries(sortedEntries);

        fs.writeFileSync('userInfoList.json', JSON.stringify({
            userCount: Object.keys(sortedUsers).length,
            users: sortedUsers,
            lastUpdate: new Date().toISOString()
        }, null, 2));
    } catch (error) {
        console.error("[getUserList] 오류 발생:", error.message);
        process.exit(1); // 에러 발생 시 Actions가 실패로 인식하게 함
    }
}

async function getUserInfo(userId) {
    try {
        // HTTP GET 요청 전송
        const response = await axios.get(url['profile'] + userId);
        const data = response.data;
        return data;
    } catch (error) {
        console.error(`[getRank] 오류 발생:\nuserId: ${userId}\n`, error.message);
        return {
            'handle': userId,
            'tier': 0,
            'solvedCount': null
        };
    }
}

// 함수 실행
getUserInfoList();
