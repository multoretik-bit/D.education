/* D-Education Platform Logic FINAL RECOVERY - STABILIZED */

const URL = 'https://jjjkypymutcvrlngyhtt.supabase.co';
const KEY = 'sb_publishable_L1a5vhq7PjjSh7QTIrPGRg_RO-bH6FN';
let sb;

window.state = { profile: { xp: 0, coins: 0, streak: 0 }, lessons: {}, schedule: [] };
window.selectedDate = new Date();
window.currentView = 'home';

// --- INITIALIZATION ---
window.onload = async () => {
    console.log("D-Education: App loading...");
    try {
        if (window.supabase) {
            sb = window.supabase.createClient(URL, KEY);
        }
    } catch (e) {
        console.error("Supabase Init Error:", e);
    }
    
    const user = localStorage.getItem('d_edu_user');
    if (user) {
        window.currentUser = user;
        await window.initializeApp();
    } else {
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) authScreen.style.display = 'flex';
    }
};

window.handleLogin = async function() {
    const email = document.getElementById('username-input').value.trim();
    if (!email) return alert("Введите Email");
    
    localStorage.setItem('d_edu_user', email);
    window.currentUser = email;
    await window.initializeApp();
};

window.initializeApp = async function() {
    console.log("Initializing app for:", window.currentUser);
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');
    
    if (authScreen) authScreen.style.display = 'none';
    if (appScreen) appScreen.style.display = 'flex';
    
    try {
        if (!sb && window.supabase) sb = window.supabase.createClient(URL, KEY);
        await checkAndMigrate();
        await loadData();
    } catch (e) {
        console.error("Load Data Error:", e);
    }
    window.render();
};

async function checkAndMigrate() {
    if (!sb) return;
    console.log("Checking legacy data...");
    try {
        const { data: old } = await sb.from('user_progress').select('data').eq('user_id', window.currentUser).maybeSingle();
        if (old && old.data) {
            const d = old.data;
            if (d.stats) await sb.from('user_profiles').upsert({ user_id: window.currentUser, xp: d.stats.totalXp||0, coins: d.stats.coins||0, streak: d.stats.streak||0 });
            if (d.lessons) {
                const ent = Object.entries(d.lessons).map(([id, v]) => ({ user_id: window.currentUser, lesson_id: id, status: v.status||'completed', progress: v.progress||100 }));
                if (ent.length > 0) await sb.from('user_lessons').upsert(ent, { onConflict: 'user_id, lesson_id' });
            }
            if (d.schedule) {
                const sch = [];
                Object.entries(d.schedule).forEach(([date, tasks]) => {
                    if (Array.isArray(tasks)) tasks.forEach(t => sch.push({
                        user_id: window.currentUser, task_date: date, task_id: typeof t === 'string' ? t : t.id,
                        task_type: t.type||'lesson', start_time: t.startTime||'19:00', duration: t.duration||60
                    }));
                });
                if (sch.length > 0) {
                    await sb.from('user_schedule').delete().eq('user_id', window.currentUser);
                    await sb.from('user_schedule').insert(sch);
                }
            }
        }
    } catch (e) { console.error("Migration error:", e); }
}

async function loadData() {
    if (!sb) return;
    const uid = window.currentUser;
    try {
        const [p, l, s] = await Promise.all([
            sb.from('user_profiles').select('*').eq('user_id', uid).maybeSingle(),
            sb.from('user_lessons').select('*').eq('user_id', uid),
            sb.from('user_schedule').select('*').eq('user_id', uid)
        ]);
        if (p.data) window.state.profile = p.data;
        if (l.data) {
            window.state.lessons = {};
            l.data.forEach(x => window.state.lessons[x.lesson_id] = x);
        }
        if (s.data) window.state.schedule = s.data;
    } catch (e) { console.error("Database load error:", e); }
}

// --- RENDERING ---
window.render = function() {
    const prof = window.state.profile || { xp: 0, coins: 0 };
    const level = Math.floor((prof.xp || 0) / 100) + 1;
    const sub = document.getElementById('view-subtitle');
    if (sub) sub.innerText = `Уровень ${level} • ${prof.xp || 0} XP • ${prof.coins || 0} Монет`;

    if (window.currentView === 'home') renderHome();
    else if (window.currentView === 'catalog') renderCatalog();
};

function renderHome() {
    const title = document.getElementById('view-title');
    const daySel = document.getElementById('day-selector');
    if (title) title.innerText = "Главная";
    if (daySel) daySel.style.display = 'flex';
    renderDaySelector();
    renderLessonsList();
}

function renderCatalog() {
    const title = document.getElementById('view-title');
    const daySel = document.getElementById('day-selector');
    if (title) title.innerText = "Мои Блоки";
    if (daySel) daySel.style.display = 'none';
    
    const cont = document.getElementById('lessons-list');
    if (!cont) return;
    cont.innerHTML = '';

    if (typeof KNOWLEDGE_BASE !== 'undefined') {
        KNOWLEDGE_BASE.areas.forEach(area => {
            const card = document.createElement('div');
            card.className = "lesson-card blue";
            card.innerHTML = `<div class="lesson-header"><strong>${area.title}</strong></div><p>Нажмите для просмотра</p>`;
            card.onclick = () => renderArea(area);
            cont.appendChild(card);
        });
    }
}

function renderArea(area) {
    const cont = document.getElementById('lessons-list');
    if (!cont) return;
    cont.innerHTML = `<button class="btn-primary" style="margin-bottom:1rem;" onclick="renderCatalog()">Назад к блокам</button>`;
    
    area.subsystems.forEach(sub => {
        const div = document.createElement('div');
        div.style.marginBottom = "1rem";
        div.innerHTML = `<h3 style="opacity:0.8;">${sub.title}</h3>`;
        sub.skills.forEach(skill => {
            const sDiv = document.createElement('div');
            sDiv.style.paddingLeft = "1rem";
            sDiv.innerHTML = `<p style="font-weight:bold;">${skill.title}</p>`;
            skill.lessons.forEach(lId => {
                const lesson = KNOWLEDGE_BASE.lessons[lId];
                if (lesson) {
                    const lCard = document.createElement('div');
                    lCard.className = "lesson-card purple";
                    const prog = window.state.lessons[lId]?.progress || 0;
                    lCard.innerHTML = `<div style="display:flex;justify-content:space-between;"><span>${lesson.title}</span><span>${prog}%</span></div>`;
                    lCard.onclick = () => alert("Урок: " + lesson.title);
                    sDiv.appendChild(lCard);
                }
            });
            div.appendChild(sDiv);
        });
        cont.appendChild(div);
    });
}

window.renderDaySelector = function() {
    const cont = document.getElementById('day-selector');
    if (!cont) return;
    cont.innerHTML = '';
    const today = new Date();
    const names = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        const start = today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1);
        d.setDate(start + i);
        const active = d.toDateString() === window.selectedDate.toDateString();
        const card = document.createElement('div');
        card.className = `day-card ${active ? 'active' : ''}`;
        card.innerHTML = `<span class="day-name">${names[i]}</span><span class="day-date">${d.getDate()}</span>`;
        card.onclick = () => { window.selectedDate = d; window.render(); };
        cont.appendChild(card);
    }
};

function renderLessonsList() {
    const cont = document.getElementById('lessons-list');
    if (!cont) return;
    cont.innerHTML = '';
    const dStr = window.selectedDate.toISOString().split('T')[0];
    const tasks = window.state.schedule.filter(s => s.task_date === dStr);
    
    if (tasks.length === 0) {
        cont.innerHTML = '<p style="text-align:center; padding:3rem; opacity:0.5;">Свободный день</p>';
        return;
    }

    tasks.forEach((t, i) => {
        const lesson = (typeof KNOWLEDGE_BASE !== 'undefined') ? KNOWLEDGE_BASE.lessons[t.task_id] : null;
        const prog = window.state.lessons[t.task_id]?.progress || 0;
        const card = document.createElement('div');
        card.className = `lesson-card ${i % 2 === 0 ? 'purple' : 'blue'}`;
        card.innerHTML = `
            <div class="lesson-header"><strong>${lesson ? lesson.title : "Урок"}</strong> <span>${t.start_time}</span></div>
            <div class="lesson-progress-container"><div class="lesson-progress-fill" style="width:${prog}%"></div></div>
            <button class="btn-start" style="margin-top:1rem; width:100%;" onclick="alert('Урок запускается...')">Начать обучение</button>
        `;
        cont.appendChild(card);
    });
}

window.switchView = function(view) {
    window.currentView = view;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeEl = document.getElementById('nav-' + view);
    if (activeEl) activeEl.classList.add('active');
    window.render();
};

function logout() { localStorage.clear(); location.reload(); }
