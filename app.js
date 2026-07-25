// 全局变量
let usedNames = new Set();
let thaiVoices = [];

// DOM 元素加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    initSpeechSynthesis();
    checkCookieConsent();

    // 绑定事件
    document.getElementById('generate-btn').addEventListener('click', generateName);
    document.getElementById('speak-btn').addEventListener('click', speakThaiName);
});

// --- 核心业务逻辑：生成名字 ---
function generateName() {
    const btn = document.getElementById('generate-btn');
    const selectedCategory = document.getElementById('category').value;
    const selectedGender = document.querySelector('input[name="gender"]:checked').value;
    const errorMsg = document.getElementById('error-msg');
    const resultArea = document.getElementById('result-area');

    // 过滤可用名字
    const filteredNames = nameDB.filter(item => {
        const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchGender = selectedGender === 'all' || item.gender === selectedGender;
        return matchCategory && matchGender;
    });
    const availableNames = filteredNames.filter(item => !usedNames.has(item.name));

    // 无结果处理
    if (availableNames.length === 0) {
        errorMsg.innerHTML = `⚠️ 当前条件下的名字已被你抽完了！<br><button class="reset-btn" onclick="resetPool()">点击重置字库</button>`;
        errorMsg.style.display = 'block';
        resultArea.style.display = 'none';
        return;
    }
    
    errorMsg.style.display = 'none';

    // 体验优化：添加短暂的加载动画，提升期待感
    btn.classList.add('loading');
    btn.innerText = '正在匹配...';
    
    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * availableNames.length);
        const result = availableNames[randomIndex];
        usedNames.add(result.name);

        // 渲染数据
        document.getElementById('res-thai').innerText = result.name;
        document.getElementById('res-pronunciation').innerText = result.pron;
        document.getElementById('res-meaning').innerText = result.meaning;
        document.getElementById('res-explanation').innerText = `【${result.category} · ${result.gender}】${result.desc}`;
        
        resultArea.style.display = 'block';
        
        // 恢复按钮状态
        btn.classList.remove('loading');
        btn.innerText = '🎲 随机生成泰文小名';
    }, 400); // 400ms 的模拟延迟
}

function resetPool() {
    usedNames.clear();
    document.getElementById('error-msg').style.display = 'none';
    document.getElementById('result-area').style.display = 'none';
}

// --- UX优化：更健壮的语音播报系统 ---
function initSpeechSynthesis() {
    if ('speechSynthesis' in window) {
        // 某些浏览器需要等待 onvoiceschanged 事件
        speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }
}

function loadVoices() {
    const voices = speechSynthesis.getVoices();
    // 优先寻找泰语语音包
    thaiVoices = voices.filter(voice => voice.lang.includes('th') || voice.lang.includes('TH'));
}

function speakThaiName() {
    const thaiName = document.getElementById('res-thai').innerText;
    if (!thaiName || thaiName === 'ชื่อ') return;
    
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(thaiName);
        utterance.lang = 'th-TH'; 
        utterance.rate = 0.85;    
        
        // 如果系统找到了具体的泰语发音人，则指定它，防止有些系统强制用英文引擎读泰文
        if (thaiVoices.length > 0) {
            utterance.voice = thaiVoices[0];
        }
        
        window.speechSynthesis.speak(utterance);
    } else {
        alert("抱歉，您的浏览器环境暂不支持文字转语音功能。");
    }
}

// --- 商业合规：Cookie 授权逻辑 ---
function checkCookieConsent() {
    const banner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('accept-cookie');
    
    // 检查本地是否已经同意过
    if (!localStorage.getItem('cookieConsentAccepted')) {
        // 延迟弹出，体验更好
        setTimeout(() => {
            banner.style.bottom = '0';
        }, 1500);
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookieConsentAccepted', 'true');
        banner.style.bottom = '-100px';
    });
}