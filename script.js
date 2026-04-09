// ═══════════════════════════════════
// FIREBASE INITIALIZATION
// ═══════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyDFoT38ZRpWKchJnTkbwst7tJIMdMoQ4jU",
  authDomain: "revision-21cab.firebaseapp.com",
  projectId: "revision-21cab",
  storageBucket: "revision-21cab.firebasestorage.app",
  messagingSenderId: "493952584873",
  appId: "1:493952584873:web:1a122a44fef6d42553adb8"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ═══════════════════════════════════
// OTHER CONFIGS
// ═══════════════════════════════════
const EJS_PUBLIC_KEY = 'saPEjicUFr73FNtI2';
const EJS_SERVICE_ID = 'service_6vwug5c';
const EJS_TEMPLATE_ID = 'template_ipzdewe';
const TUTOR_EMAIL = 'emily@dentalnurse.training';
emailjs.init(EJS_PUBLIC_KEY);

const ADMIN_PW = 'emrevision2025';

// ═══════════════════════════════════
// GLOBAL STATE & CONSTANTS
// ═══════════════════════════════════
let CL = null; // Logged-in learner data
let varkAnswers = [], varkIdx = 0;
let diagAnswers = [], diagIdx = 0;
let currentTab = 'flashcards';

const STYLE_INFO = {
    V: { label: 'Visual', tagClass: 'tag-v', tips: ['Labelled diagrams', 'Mind maps'] },
    A: { label: 'Auditory', tagClass: 'tag-a', tips: ['Record notes', 'Verbal quizzes'] },
    R: { label: 'Reading/Writing', tagClass: 'tag-r', tips: ['Written summaries', 'Practice papers'] },
    K: { label: 'Kinesthetic', tagClass: 'tag-k', tips: ['OSCE practice', 'Physical models'] }
};

// ═══════════════════════════════════
// LOGIN LOGIC
// ═══════════════════════════════════
async function handleLogin() {
    const name = document.getElementById('login-name').value.trim().toLowerCase();
    const pin = document.getElementById('login-pin').value.trim();
    const err = document.getElementById('login-error');
    
    err.style.display = 'none';
    if (!name || !pin) {
        err.textContent = 'Enter name and PIN';
        err.style.display = 'block';
        return;
    }

    try {
        const snap = await db.collection('learners')
            .where('nameLower', '==', name)
            .where('pin', '==', pin)
            .limit(1).get();

        if (snap.empty) {
            err.textContent = 'Not recognized';
            err.style.display = 'block';
            return;
        }

        CL = { id: snap.docs[0].id, ...snap.docs[0].data() };
        
        // Direct learner to the correct starting point
        if (!CL.varkDone) startVark();
        else if (!CL.diagDone) startDiag();
        else if (!CL.accessGranted) showPage('page-waiting');
        else goResources();

    } catch (e) {
        console.error(e);
        err.textContent = 'Connection error';
        err.style.display = 'block';
    }
}

// ═══════════════════════════════════
// NAVIGATION & PAGE CONTROL
// ═══════════════════════════════════
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
}

function signOut() {
    CL = null;
    document.getElementById('login-name').value = '';
    document.getElementById('login-pin').value = '';
    showPage('page-login');
}

// ═══════════════════════════════════
// RESOURCE ROUTING
// ═══════════════════════════════════
function goResources() {
    document.getElementById('res-name').textContent = CL.name;
    if (CL.style) {
        const info = STYLE_INFO[CL.style];
        document.getElementById('res-style-tag').innerHTML = `<span class="tag ${info.tagClass}">${info.label}</span>`;
    }
    showPage('page-resources');
    renderResTab();
}

async function renderResTab() {
    const content = document.getElementById('res-content');
    content.innerHTML = '<div class="spinner"></div>';

    if (currentTab === 'flashcards') content.innerHTML = await renderFlashcards();
    else if (currentTab === 'diagrams') content.innerHTML = await renderDiagrams();
    // Add other tab rendering functions as needed...
}

// ═══════════════════════════════════
// FLASHCARDS
// ═══════════════════════════════════
async function renderFlashcards() {
    let cards = [];
    const snap = await db.collection('learners').doc(CL.id).collection('flashcards').orderBy('createdAt', 'desc').get();
    snap.forEach(d => cards.push({ id: d.id, ...d.data() }));

    let html = `<button class="btn btn-teal" onclick="showAddCard()">+ New Card</button><div class="grid-2">`;
    cards.forEach(fc => {
        html += `<div class="flashcard" onclick="this.classList.toggle('flipped')">
            <div class="fc-inner">
                <div class="fc-front"><p>${fc.front}</p></div>
                <div class="fc-back"><p>${fc.back}</p></div>
            </div>
        </div>`;
    });
    html += `</div>`;
    return html;
}