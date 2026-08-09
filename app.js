// Global variables
let usedNames = new Set();
let thaiVoices = [];

// DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    initSpeechSynthesis();
    checkCookieConsent();

    // Bind events
    document.getElementById('generate-btn').addEventListener('click', generateName);
    document.getElementById('speak-btn').addEventListener('click', speakThaiName);
});

// --- Core Logic: Generate Name ---
function generateName() {
    const btn = document.getElementById('generate-btn');
    const selectedCategory = document.getElementById('category').value;
    const selectedGender = document.querySelector('input[name="gender"]:checked').value;
    const errorMsg = document.getElementById('error-msg');
    const resultArea = document.getElementById('result-area');

    // Filter available names
    const filteredNames = nameDB.filter(item => {
        const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchGender = selectedGender === 'all' || item.gender === selectedGender;
        return matchCategory && matchGender;
    });
    const availableNames = filteredNames.filter(item => !usedNames.has(item.name));

    // Handle no results
    if (availableNames.length === 0) {
        errorMsg.innerHTML = `⚠️ All names in this category have been generated!<br><button class="reset-btn" onclick="resetPool()">Reset Name Pool</button>`;
        errorMsg.style.display = 'block';
        resultArea.style.display = 'none';
        return;
    }
    
    errorMsg.style.display = 'none';

    // UX Optimization: Loading state
    btn.classList.add('loading');
    btn.innerText = 'Matching...';
    
    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * availableNames.length);
        const result = availableNames[randomIndex];
        usedNames.add(result.name);

        // Render data
        document.getElementById('res-thai').innerText = result.name;
        document.getElementById('res-pronunciation').innerText = result.pron;
        document.getElementById('res-meaning').innerText = result.meaning;
        document.getElementById('res-explanation').innerText = `[${result.category} · ${result.gender}] ${result.desc}`;
        
        resultArea.style.display = 'block';
        
        // Restore button state
        btn.classList.remove('loading');
        btn.innerText = '🎲 Generate Random Nickname';
    }, 400); // 400ms delay
}

function resetPool() {
    usedNames.clear();
    document.getElementById('error-msg').style.display = 'none';
    document.getElementById('result-area').style.display = 'none';
}

// --- UX Optimization: Speech Synthesis ---
function initSpeechSynthesis() {
    if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }
}

function loadVoices() {
    const voices = speechSynthesis.getVoices();
    thaiVoices = voices.filter(voice => voice.lang.includes('th') || voice.lang.includes('TH'));
}

function speakThaiName() {
    const thaiName = document.getElementById('res-thai').innerText;
    if (!thaiName || thaiName === 'ชื่อ') return;
    
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(thaiName);
        utterance.lang = 'th-TH'; 
        utterance.rate = 0.85;    
        
        if (thaiVoices.length > 0) {
            utterance.voice = thaiVoices[0];
        }
        
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Sorry, your browser does not support Text-to-Speech.");
    }
}

// --- Commercial Compliance: Cookie Consent ---
function checkCookieConsent() {
    const banner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('accept-cookie');
    
    if (!localStorage.getItem('cookieConsentAccepted')) {
        setTimeout(() => {
            banner.style.bottom = '0';
        }, 1500);
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookieConsentAccepted', 'true');
        banner.style.bottom = '-100px';
    });
}