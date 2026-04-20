/* D-Education Platform Logic - FULL RECOVERY (No XP/Coins) */

const supabaseUrl = 'https://jjjkypymutcvrlngyhtt.supabase.co';
const supabaseKey = 'sb_publishable_L1a5vhq7PjjSh7QTIrPGRg_RO-bH6FN';
let supabaseClient = null;

function getSupabase() {
    if (supabaseClient) return supabaseClient;
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        return supabaseClient;
    }
    return null;
}

let currentView = 'home';
let currentUser = localStorage.getItem('d_edu_user');

const DAYS_SHORT = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const DAYS_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const MONTHS_FULL = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];

let selectedDate = new Date();
let userProgress = {
    lessons: {},
    skills: {},
    stats: { streak: 0, masteredSkills: 0 },
    schedule: {},
    customLessons: {},
    customAreas: {},
    customSubsystems: {},
    customSkills: {},
    ankiCards: {},
    ankiFolders: {}
};

let currentLessonState = { lessonId: null, step: 0, cards: [] };

// --- CLOUD SYNC ---
async function loadProgressFromCloud() {
    if (!currentUser) return;
    const client = getSupabase();
    if (!client) {
        setTimeout(loadProgressFromCloud, 1000);
        return;
    }
    
    try {
        const { data } = await client.from('user_progress').select('data').eq('user_id', currentUser).maybeSingle();
        if (data && data.data) {
            userProgress = { ...userProgress, ...data.data };
        } else {
            const local = JSON.parse(localStorage.getItem('d_edu_v2_progress'));
            if (local) userProgress = { ...userProgress, ...local };
        }
        injectCustomCourse();
    } catch (e) {
        console.error("Cloud sync error:", e);
    }
}

function injectCustomCourse() {
    Object.values(userProgress.customAreas || {}).forEach(area => {
        const idx = KNOWLEDGE_BASE.areas.findIndex(a => a.id === area.id);
        if (idx === -1) KNOWLEDGE_BASE.areas.push({ ...area });
        else KNOWLEDGE_BASE.areas[idx] = { ...area };
    });
    Object.values(userProgress.customSubsystems || {}).forEach(sub => KNOWLEDGE_BASE.subsystems[sub.id] = { ...sub });
    Object.values(userProgress.customSkills || {}).forEach(skill => KNOWLEDGE_BASE.skills[skill.id] = { ...skill, lessons: [] });
    Object.keys(userProgress.customLessons || {}).forEach(id => {
        const lesson = userProgress.customLessons[id];
        const skillId = lesson.skillId || 'skill_custom';
        if (KNOWLEDGE_BASE.skills[skillId]) KNOWLEDGE_BASE.skills[skillId].lessons.push(id);
        KNOWLEDGE_BASE.lessons[id] = { id, skillId, title: lesson.title, content: { notes: lesson.notes } };
    });
}

async function saveProgressToCloud() {
    localStorage.setItem('d_edu_v2_progress', JSON.stringify(userProgress));
    if (!currentUser) return;
    try {
        const client = getSupabase();
        if (client) await client.from('user_progress').upsert({ user_id: currentUser, data: userProgress, last_updated: new Date().toISOString() }, { onConflict: 'user_id' });
    } catch (e) { console.error("Cloud save failed:", e); }
}

// --- APP LOGIC ---
async function initApp() {
    if (currentUser) {
        await loadProgressFromCloud();
        render();
    } else {
        renderLoginAuth();
    }
}

function renderLoginAuth() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div style="text-align: center; margin-top: 5rem;" class="fade-in">
            <ion-icon name="cloud-done-outline" style="font-size: 5rem; color: var(--primary); margin-bottom: 2rem;"></ion-icon>
            <h2>Добро пожаловать в D-SYSTEM</h2>
            <p style="color: var(--text-secondary); margin: 1rem 0 2rem 0;">Введите ваш Email для входа и синхронизации прогресса.</p>
            <input type="email" id="username-input" class="check-input" placeholder="john@gmail.com" style="max-width: 300px; margin: 0 auto; display: block;">
            <button class="btn btn-primary" style="margin-top: 1rem; width: 100%; max-width: 300px;" onclick="handleLogin()">Войти в Систему</button>
        </div>
    `;
}

async function handleLogin() {
    const name = document.getElementById('username-input').value.trim();
    if (name.length < 3) return alert('Введите корректный Email');
    currentUser = name;
    localStorage.setItem('d_edu_user', currentUser);
    await loadProgressFromCloud();
    render();
}

window.render = function() {
    const main = document.getElementById('main-content');
    if (!main) return;
    if (currentView === 'catalog') renderAreas();
    else if (currentView === 'home') renderHome();
    else if (currentView === 'stats') renderStats();
    else if (currentView === 'profile') renderProfile();
};

function renderHome() {
    document.getElementById('view-title').innerText = "Главная";
    const sub = document.getElementById('view-subtitle');
    sub.innerHTML = `Сегодняшние уроки • <span>${selectedDate.getDate()} ${MONTHS_FULL[selectedDate.getMonth()]}</span>`;
    document.getElementById('day-selector').style.display = 'flex';
    renderDaySelector();
    renderLessonsList();
}

function renderDaySelector() {
    const cont = document.getElementById('day-selector');
    cont.innerHTML = '';
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (today.getDay() || 7) + 1);
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const active = d.toDateString() === selectedDate.toDateString();
        const div = document.createElement('div');
        div.className = `day-item ${active ? 'active' : ''}`;
        div.innerHTML = `<div class="day-short">${DAYS_SHORT[d.getDay()]}</div><div class="day-full">${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}</div>`;
        div.onclick = () => { selectedDate = d; render(); };
        cont.appendChild(div);
    }
}

function renderLessonsList() {
    const cont = document.getElementById('lessons-list');
    cont.innerHTML = '';
    const dStr = selectedDate.toISOString().split('T')[0];
    const tasks = userProgress.schedule[dStr] || [];
    if (tasks.length === 0) {
        cont.innerHTML = '<p style="text-align:center; padding:5rem; opacity:0.3;">На этот день планов нет.</p>';
        return;
    }
    tasks.forEach(t => {
        const lesson = KNOWLEDGE_BASE.lessons[t.id || t];
        const prog = userProgress.lessons[t.id || t]?.progress || 0;
        const card = document.createElement('div');
        card.className = "premium-lesson-card c-purple fade-in";
        card.innerHTML = `
            <h2>${lesson ? lesson.title : "Урок"}</h2>
            <div class="lesson-progress-row">
                <div class="progress-track"><div class="progress-bar-done" style="width: ${prog}%"></div></div>
                <span>${prog}%</span>
            </div>
            <button class="btn-start-premium" onclick="startLesson('${t.id || t}')">Начать изучение</button>
        `;
        cont.appendChild(card);
    });
}

function renderAreas() {
    document.getElementById('view-title').innerText = "Каталог курсов";
    document.getElementById('day-selector').style.display = 'none';
    const cont = document.getElementById('lessons-list');
    cont.innerHTML = '';
    KNOWLEDGE_BASE.areas.forEach(area => {
        const card = document.createElement('div');
        card.className = `area-card c-${area.color || 'blue'} fade-in`;
        card.innerHTML = `<h3>${area.title}</h3><p>${area.subsystems.length} разделов</p>`;
        card.onclick = () => renderSubsystems(area.id);
        cont.appendChild(card);
    });
}

function renderSubsystems(areaId) {
    const area = KNOWLEDGE_BASE.areas.find(a => a.id === areaId);
    const cont = document.getElementById('lessons-list');
    cont.innerHTML = `<button class="btn" onclick="renderAreas()">← Назад</button><h2>${area.title}</h2>`;
    area.subsystems.forEach(subId => {
        const sub = KNOWLEDGE_BASE.subsystems[subId];
        const div = document.createElement('div');
        div.className = "area-card c-purple fade-in";
        div.style.marginBottom = "10px";
        div.innerHTML = `<h3>${sub.title}</h3>`;
        div.onclick = () => renderSkills(subId);
        cont.appendChild(div);
    });
}

function renderSkills(subId) {
    const sub = KNOWLEDGE_BASE.subsystems[subId];
    const cont = document.getElementById('lessons-list');
    cont.innerHTML = `<button class="btn" onclick="renderSubsystems('${sub.areaId}')">← Назад</button><h2>${sub.title}</h2>`;
    sub.skills.forEach(skillId => {
        const skill = KNOWLEDGE_BASE.skills[skillId];
        const div = document.createElement('div');
        div.className = "area-card c-blue fade-in";
        div.innerHTML = `<h3>${skill.title}</h3>`;
        div.onclick = () => renderLessonsGrid(skillId);
        cont.appendChild(div);
    });
}

function renderLessonsGrid(skillId) {
    const skill = KNOWLEDGE_BASE.skills[skillId];
    const cont = document.getElementById('lessons-list');
    cont.innerHTML = `<button class="btn" onclick="renderSkills('${skill.subsystemId}')">← Назад</button><h2>${skill.title}</h2>`;
    skill.lessons.forEach(lId => {
        const lesson = KNOWLEDGE_BASE.lessons[lId];
        const div = document.createElement('div');
        div.className = "premium-lesson-card c-purple fade-in";
        div.innerHTML = `<h3>${lesson.title}</h3><button class="btn-start-premium" onclick="startLesson('${lId}')">Изучить</button>`;
        cont.appendChild(div);
    });
}

function startLesson(id) {
    const lesson = KNOWLEDGE_BASE.lessons[id];
    currentLessonState = { lessonId: id, step: 0, cards: [
        { title: "Контекст", text: lesson.content?.context || lesson.content?.notes || "Нет данных" },
        { title: "Суть", text: lesson.content?.essence || "Изучите материал" },
        { title: "Проверка", type: "check", question: "Вы поняли материал?" }
    ]};
    renderLessonStep();
}

function renderLessonStep() {
    const main = document.getElementById('main-content');
    const step = currentLessonState.cards[currentLessonState.step];
    if (step.type === "check") {
        main.innerHTML = `<h2>${step.question}</h2><button class="btn btn-primary" onclick="finishLesson()">Завершить</button>`;
    } else {
        main.innerHTML = `<h2>${step.title}</h2><p>${step.text}</p><button class="btn btn-primary" onclick="nextStep()">Далее</button>`;
    }
}

function nextStep() { currentLessonState.step++; renderLessonStep(); }

async function finishLesson() {
    const id = currentLessonState.lessonId;
    if (!userProgress.lessons[id]) userProgress.lessons[id] = { progress: 0 };
    userProgress.lessons[id].progress = Math.min(userProgress.lessons[id].progress + 25, 100);
    await saveProgressToCloud();
    render();
    alert("Прогресс сохранен!");
}

function switchView(view) { currentView = view; render(); }
function renderStats() { document.getElementById('main-content').innerHTML = "<h2>Ваш прогресс</h2><p>Раздел в разработке</p>"; }
function renderProfile() { document.getElementById('main-content').innerHTML = `<h2>Профиль: ${currentUser}</h2><button class="btn" onclick="localStorage.clear(); location.reload();">Выйти</button>`; }

initApp();
