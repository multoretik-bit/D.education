/* D-Education Platform Logic FULL RESTORE */

const URL = 'https://jjjkypymutcvrlngyhtt.supabase.co';
const KEY = 'sb_publishable_L1a5vhq7PjjSh7QTIrPGRg_RO-bH6FN';
let sb;

window.state = { profile: { xp: 0, coins: 0, streak: 0 }, lessons: {}, schedule: [] };
window.selectedDate = new Date();
window.currentView = 'home';

// --- Инициализация ---
window.onload = async () => {
    if (window.supabase) sb = window.supabase.createClient(URL, KEY);
    
    const user = localStorage.getItem('d_edu_user');
    if (user) {
        window.currentUser = user;
        window.initializeApp();
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
    }
};

window.handleLogin = async function() {
    const email = document.getElementById('username-input').value.trim();
    if (!email) return alert("Введите Email");
    
    const btn = document.getElementById('login-btn');
    btn.innerText = "Вход...";
    btn.disabled = true;

    try {
        if (!sb) sb = window.supabase.createClient(URL, KEY);
        window.currentUser = email;
        localStorage.setItem('d_edu_user', email);

        // Проверка и миграция
        const { data: old } = await sb.from('user_progress').select('data').eq('user_id', email).maybeSingle();
        if (old && old.data) await migrate(email, old.data);

        window.initializeApp();
    } catch (e) {
        alert("Ошибка входа: " + e.message);
        btn.innerText = "Войти в аккаунт";
        btn.disabled = false;
    }
};

async function migrate(uid, d) {
    if (d.stats) await sb.from('user_profiles').upsert({ user_id: uid, xp: d.stats.totalXp||0, coins: d.stats.coins||0, streak: d.stats.streak||0 });
    if (d.lessons) {
        const ent = Object.entries(d.lessons).map(([id, v]) => ({ user_id: uid, lesson_id: id, status: v.status||'completed', progress: v.progress||100 }));
        if (ent.length > 0) await sb.from('user_lessons').upsert(ent, { onConflict: 'user_id, lesson_id' });
    }
    if (d.schedule) {
        const sch = [];
        Object.entries(d.schedule).forEach(([date, tasks]) => {
            if (Array.isArray(tasks)) tasks.forEach(t => sch.push({
                user_id: uid, task_date: date, task_id: typeof t === 'string' ? t : t.id,
                task_type: t.type||'lesson', start_time: t.startTime||'19:00', duration: t.duration||60
            }));
        });
        if (sch.length > 0) await sb.from('user_schedule').insert(sch);
    }
}

window.initializeApp = async function() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    
    if (!sb) sb = window.supabase.createClient(URL, KEY);

    await loadData();
    window.render();
};

async function loadData() {
    const [p, l, s] = await Promise.all([
        sb.from('user_profiles').select('*').eq('user_id', window.currentUser).maybeSingle(),
        sb.from('user_lessons').select('*').eq('user_id', window.currentUser),
        sb.from('user_schedule').select('*').eq('user_id', window.currentUser)
    ]);
    if (p.data) window.state.profile = p.data;
    if (l.data) l.data.forEach(x => window.state.lessons[x.lesson_id] = x);
    if (s.data) window.state.schedule = s.data;
}

window.render = function() {
    if (window.currentView === 'home') {
        renderHome();
    } else if (window.currentView === 'catalog') {
        renderCatalog();
    }
};

function renderHome() {
    document.getElementById('view-title').innerText = "Главная";
    document.getElementById('view-subtitle').innerText = "Ваши сегодняшние задачи";
    document.getElementById('day-selector').style.display = 'flex';
    
    renderDaySelector();
    renderLessonsForDay();
}

window.renderDaySelector = function() {
    const cont = document.getElementById('day-selector');
    cont.innerHTML = '';
    const today = new Date();
    const names = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) + i);
        const active = d.toDateString() === window.selectedDate.toDateString();
        const card = document.createElement('div');
        card.className = `day-card ${active ? 'active' : ''}`;
        card.innerHTML = `<span class="day-name">${names[i]}</span><span class="day-date">${d.getDate()}</span>`;
        card.onclick = () => { window.selectedDate = d; window.render(); };
        cont.appendChild(card);
    }
};

function renderLessonsForDay() {
    const cont = document.getElementById('lessons-list');
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
            <button class="btn-start" style="margin-top:1rem; width:100%;" onclick="startLesson('${t.task_id}')">Начать обучение</button>
        `;
        cont.appendChild(card);
    });
}

function renderCatalog() {
    document.getElementById('view-title').innerText = "Мои Блоки";
    document.getElementById('view-subtitle').innerText = "Все доступные курсы и материалы";
    document.getElementById('day-selector').style.display = 'none';
    
    const cont = document.getElementById('lessons-list');
    cont.innerHTML = '';

    if (typeof KNOWLEDGE_BASE !== 'undefined') {
        KNOWLEDGE_BASE.areas.forEach(area => {
            const card = document.createElement('div');
            card.className = "lesson-card blue";
            card.style.cursor = "pointer";
            card.onclick = () => renderArea(area);
            card.innerHTML = `
                <div class="lesson-header"><strong style="font-size:1.2rem;">${area.title}</strong> <ion-icon name="folder-open-outline"></ion-icon></div>
                <p style="opacity:0.7; font-size:0.9rem;">Нажмите, чтобы открыть блок</p>
            `;
            cont.appendChild(card);
        });
    }
}

function renderArea(area) {
    document.getElementById('view-title').innerText = area.title;
    const cont = document.getElementById('lessons-list');
    cont.innerHTML = '<button class="btn-primary" style="margin-bottom:1rem;" onclick="renderCatalog()">Назад</button>';
    
    area.subsystems.forEach(sub => {
        const div = document.createElement('div');
        div.style.marginBottom = "1.5rem";
        div.innerHTML = `<h3 style="margin-bottom:0.5rem; opacity:0.8;">${sub.title}</h3>`;
        
        sub.skills.forEach(skill => {
            const skillDiv = document.createElement('div');
            skillDiv.style.paddingLeft = "1rem";
            skillDiv.innerHTML = `<p style="font-weight:bold; margin-bottom:0.3rem;">${skill.title}</p>`;
            
            skill.lessons.forEach(lId => {
                const lesson = KNOWLEDGE_BASE.lessons[lId];
                if (lesson) {
                    const lCard = document.createElement('div');
                    lCard.className = "lesson-card purple";
                    lCard.style.padding = "10px 15px";
                    lCard.style.marginBottom = "5px";
                    const prog = window.state.lessons[lId]?.progress || 0;
                    lCard.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span>${lesson.title}</span>
                            <span style="font-size:0.8rem; opacity:0.6;">${prog}%</span>
                        </div>
                    `;
                    lCard.onclick = () => startLesson(lId);
                    skillDiv.appendChild(lCard);
                }
            });
            div.appendChild(skillDiv);
        });
        cont.appendChild(div);
    });
}

window.switchView = function(view) {
    window.currentView = view;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById('nav-' + view).classList.add('active');
    window.render();
};

function startLesson(id) {
    alert("Запуск урока: " + id + "\nЗдесь откроются ваши учебные карточки.");
}

function logout() {
    localStorage.clear();
    location.reload();
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); }
function openAddLessonModal() { alert("Добавление урока скоро будет доступно в новом дизайне."); }
