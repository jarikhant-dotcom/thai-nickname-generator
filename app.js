// Global variables
let usedNames = new Set();
let thaiVoices = [];
let currentThaiName = '';
let isGenerating = false;

// DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    initSpeechSynthesis();
    checkCookieConsent();
    initPrivacyModal();
    initCustomLanguageSelector();
    updatePoolStatus();

    // Bind events
    document.getElementById('generate-btn').addEventListener('click', generateName);
    document.getElementById('speak-btn').addEventListener('click', speakThaiName);
    document.getElementById('category').addEventListener('change', updatePoolStatus);
    document.querySelectorAll('input[name="gender"]').forEach(radio => {
        radio.addEventListener('change', updatePoolStatus);
    });
});

// Check if database loaded properly
function isDatabaseReady() {
    return typeof nameDB !== 'undefined' && Array.isArray(nameDB) && nameDB.length > 0;
}

// Helper: Get filtered names based on current UI selection
function getFilteredNames() {
    if (!isDatabaseReady()) return [];

    const categoryEl = document.getElementById('category');
    const genderEl = document.querySelector('input[name="gender"]:checked');
    const selectedCategory = categoryEl ? categoryEl.value : 'all';
    const selectedGender = genderEl ? genderEl.value : 'all';

    return nameDB.filter(item => {
        const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchGender = selectedGender === 'all' || item.gender === selectedGender;
        return matchCategory && matchGender;
    });
}

// Update remaining count indicator
function updatePoolStatus() {
    const statusEl = document.getElementById('pool-status');
    const errorMsg = document.getElementById('error-msg');
    if (!statusEl) return;

    if (!isDatabaseReady()) {
        statusEl.innerText = 'Database not loaded';
        if (errorMsg) {
            errorMsg.innerHTML = '⚠️ Error: <code>data.js</code> failed to load. Please ensure <code>data.js</code> is in the same folder as <code>index.html</code>.';
            errorMsg.style.display = 'block';
        }
        return;
    }

    const filtered = getFilteredNames();
    const available = filtered.filter(item => !usedNames.has(item.name));
    statusEl.innerText = `Available: ${available.length} / ${filtered.length} nicknames`;
}

// --- Core Logic: Generate Name ---
function generateName() {
    if (isGenerating) return;

    const btn = document.getElementById('generate-btn');
    const errorMsg = document.getElementById('error-msg');
    const resultArea = document.getElementById('result-area');

    if (!isDatabaseReady()) {
        errorMsg.innerHTML = '⚠️ Error: <code>data.js</code> is missing or has a syntax error. Cannot generate names.';
        errorMsg.style.display = 'block';
        return;
    }

    const filteredNames = getFilteredNames();
    const availableNames = filteredNames.filter(item => !usedNames.has(item.name));

    // Handle no results
    if (availableNames.length === 0) {
        errorMsg.innerHTML = `⚠️ All ${filteredNames.length} names in this filter have been generated!<br><button class="reset-btn" onclick="resetPool()">Reset Name Pool</button>`;
        errorMsg.style.display = 'block';
        resultArea.style.display = 'none';
        return;
    }
    
    errorMsg.style.display = 'none';
    isGenerating = true;

    const originalBtnHTML = btn.innerHTML;
    btn.classList.add('loading');
    btn.innerText = 'Matching...';
    
    setTimeout(() => {
        try {
            const randomIndex = Math.floor(Math.random() * availableNames.length);
            const result = availableNames[randomIndex];
            usedNames.add(result.name);
            currentThaiName = result.name;

            // Render data
            document.getElementById('res-thai').innerText = result.name;
            document.getElementById('res-pronunciation').innerText = result.pron;
            document.getElementById('res-meaning').innerText = result.meaning;
            document.getElementById('res-explanation').innerText = `[${result.category} · ${result.gender}] ${result.desc}`;
            
            resultArea.style.display = 'block';
            updatePoolStatus();
        } finally {
            btn.classList.remove('loading');
            btn.innerHTML = originalBtnHTML;
            isGenerating = false;
        }
    }, 350);
}

function resetPool() {
    usedNames.clear();
    currentThaiName = '';
    document.getElementById('error-msg').style.display = 'none';
    document.getElementById('result-area').style.display = 'none';
    updatePoolStatus();
}

// --- Custom Language Selector -> Drives Hidden Google Translate ---
function initCustomLanguageSelector() {
    const customSelect = document.getElementById('custom-lang-select');
    if (!customSelect) return;

    // Sync dropdown if user already has a Google Translate cookie
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    if (match && match[1]) {
        customSelect.value = match[1];
    }

    customSelect.addEventListener('change', (e) => {
        const targetLang = e.target.value;
        const googleCombo = document.querySelector('.goog-te-combo');

        if (googleCombo) {
            googleCombo.value = targetLang;
            googleCombo.dispatchEvent(new Event('change'));
        } else {
            // Fallback via googtrans cookie if script is still loading
            document.cookie = `googtrans=/en/${targetLang}; path=/`;
            location.reload();
        }
    });
}

// --- Speech Synthesis ---
function initSpeechSynthesis() {
    if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }
}

function loadVoices() {
    const voices = speechSynthesis.getVoices();
    thaiVoices = voices.filter(voice => voice.lang.toLowerCase().includes('th'));
}

function speakThaiName() {
    if (!currentThaiName) return;
    
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(currentThaiName);
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

// --- Cookie Consent ---
function checkCookieConsent() {
    const banner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('accept-cookie');
    
    if (!localStorage.getItem('cookieConsentAccepted')) {
        setTimeout(() => {
            banner.classList.add('show');
        }, 1200);
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookieConsentAccepted', 'true');
        banner.classList.remove('show');
    });
}

// --- Privacy Policy Modal ---
function initPrivacyModal() {
    const modal = document.getElementById('privacy-modal');
    const openLinks = [document.getElementById('open-privacy'), document.getElementById('banner-privacy')];
    const closeBtn = document.getElementById('close-privacy');

    openLinks.forEach(link => {
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.add('active');
            });
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}