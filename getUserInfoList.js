const axios = require('axios');
const fs = require('fs');

const url = {
    'profile': 'https://solved.ac/api/v3/user/show?handle='
};

const path = {
    'userIdList' : "./userIdList.json",
    'userInfoList' : "./userInfoList.json",
    'news' : './news.json'
};

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
};

const ranks = ["unranked", "b5", "b4", "b3", "b2", "b1", "s5", "s4", "s3", "s2", "s1", "g5", "g4", "g3", "g2", "g1", "p5", "p4", "p3", "p2", "p1", "d5", "d4", "d3", "d2", "d1", "r5", "r4", "r3", "r2", "r1", "master"];

async function getUserInfoList() {
    try {
        // 이 프로그램이 촤초로 실행되었는가
        let hasPreUserInfo = true;
        let userIdList = JSON.parse(fs.readFileSync(path['userIdList'], 'utf8')); // userIdList
        let preUserInfoList = null; // 업데이트 이전의 userInfoList
        let news = null; // 티어 변동 및 n백번 째 문제 풀이 달성 히스토리
        const today = new Date().toString();

        if (!fs.existsSync(path['userInfoList'])) {
            hasPreUserInfo = false;
        } else {
            preUserInfoList = JSON.parse(fs.readFileSync(path['userInfoList'], 'utf8'));
        }

        if (!fs.existsSync(path['news'])) {
            fs.writeFileSync(path['news'], JSON.stringify({log: [], lastUpdate: ""}));
        } 
        news = JSON.parse(fs.readFileSync(path['news']));

        /*
         ************
         * userInfoList.json 업데이트
         ************
         */
        const promises = userIdList['userIdList'].map(async (userId) => {
            if (userId) {
                // getRank(비동기 함수)를 여기서 호출하지만 기다리지 않고 Promise만 반환합니다.
                const userInfo = await getUserInfo(userId);

                /*
                 ************
                 *티어 변동 확인 및 n백번째 문제풀이 진행
                 ************
                */
                if (hasPreUserInfo) {
                    if (preUserInfoList['users'][userId]) {
                        const preUserInfo = preUserInfoList['users'][userId];
                        
                        // 티어 변동 확인
                        const preTier = preUserInfo['rank'];
                        const nowTier = ranks[userInfo['tier']];
                        if (preTier != nowTier) {
                            news['log'].unshift({
                                date: today,
                                userId: userId,
                                text: `티어 상승 ! (${preTier} → ${nowTier})`
                            });
                        }

                        // n백번째 문제풀이 달성 히스토리
                        const preSolvedCount = Number(preUserInfo['solvedCount']);
                        const nowSolvedCount = Number(userInfo['solvedCount']);
                        if (nowSolvedCount < 100) {
                            if (Math.floor(preSolved / 10) != Math.floor(nowSolvedCount / 10)) {
                                news['log'].unshift({
                                    date: today,
                                    userId: userId,
                                    text: `${(Math.floor(nowSolvedCount / 10)*10).toLocaleString()}문제 해결 !`
                                });
                            }
                        } else {
                            if (Math.floor(preSolvedCount / 100) != Math.floor(nowSolvedCount / 100)) {
                                news['log'].unshift({
                                    date: today,
                                    userId: userId,
                                    text: `${(Math.floor(nowSolvedCount / 100)*100).toLocaleString()}문제 해결 !`
                                });
                            }
                        }
                    }
                }

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
        fs.writeFileSync(path['userInfoList'], JSON.stringify({
            userCount: Object.keys(sortedUsers).length,
            users: sortedUsers,
            lastUpdate: today
        }, null, 2));

        news['lastUpdate'] = today;
        fs.writeFileSync(path['news'], JSON.stringify(news, null, 4));

    } catch (error) {
        console.error("[getUserList] 오류 발생:", error.stack);
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
        if (error.response) {
            if (error.response.status == 404) {
                return {
                    'handle': userId,
                    'tier': 0,
                    'solvedCount': null
                };
            }
        }
        console.error(`[getRank] 오류 발생:\nuserId: ${userId}\n`, error.stack);
    }
}

// 함수 실행
getUserInfoList();
