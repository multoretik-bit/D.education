/* D-Education Platform Logic 3.1 (Global Scope Fix) */

// Глобальный перехват ошибок для диагностики
window.onerror = function(msg, url, line, col, error) {
    alert("Ошибка: " + msg + "\nГде: " + url + ":" + line);
    return false;
};

// --- CONFIG ---
const supabaseUrl = 'https://jjjkypymutcvrlngyhtt.supabase.co';
const supabaseKey = 'sb_publishable_L1a5vhq7PjjSh7QTIrPGRg_RO-bH6FN';
let supabase;

// Состояние
window.currentUser = localStorage.getItem('d_edu_user');
window.selectedDate = new Date();
window.state = { profile: { xp: 0, coins: 0, streak: 0 }, lessons: {}, schedule: [] };

// --- FUNCTIONS ---

window.handleLogin = async function() {
    console.log("handleLogin start");
    const email = document.getElementById('username-input').value.trim();
    if (!email || !email.includes('@')) return alert('Введите корректный Email');

    const loginBtn = document.getElementById('login-btn');
    loginBtn.innerText = 'Синхронизация...';
    loginBtn.disabled = true;

    try {
        if (!window.supabase) {
             window.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        }
        supabase = window.supabase;

        window.currentUser = email;
        localStorage.setItem('d_edu_user', window.currentUser);
        
        // Авто-миграция
        const { data: oldData } = await supabase.from('user_progress').select('data').eq('user_id', window.currentUser).maybeSingle();
        if (oldData && oldData.data) {
            console.log("Legacy data found, migrating...");
            await migrateLegacyData(oldData.data);
        }

        await window.initializeApp();
    } catch (err) {
        console.error(err);
        alert("Ошибка входа: " + (err.message || "Нет связи с базой"));
        loginBtn.innerText = 'Войти и синхронизировать';
        loginBtn.disabled = false;
    }
};

async function migrateLegacyData(legacy) {
    try {
        if (legacy.stats) {
            await supabase.from('user_profiles').upsert({
                user_id: window.currentUser,
                xp: legacy.stats.totalXp || 0,
                coins: legacy.stats.coins || 0,
                streak: legacy.stats.streak || 0
            });
        }
        if (legacy.lessons) {
            const entries = Object.entries(legacy.lessons).map(([id, d]) => ({
                user_id: window.currentUser, lesson_id: id, status: d.status || 'completed', progress: d.progress || 100
            }));
            if (entries.length > 0) await supabase.from('user_lessons').upsert(entries, { onConflict: 'user_id, lesson_id' });
        }
        if (legacy.schedule) {
            const sch = [];
            Object.entries(legacy.schedule).forEach(([date, tasks]) => {
                if (Array.isArray(tasks)) {
                    tasks.forEach(t => sch.push({
                        user_id: window.currentUser, task_date: date, task_id: typeof t === 'string' ? t : t.id,
                        task_type: t.type || 'lesson', start_time: t.startTime || '19:00', duration: t.duration || 60
                    }));
                }
            });
            if (sch.length > 0) await supabase.from('user_schedule').insert(sch);
        }
    } catch (e) { console.warn("Migration failed but skipping:", e); }
}

window.initializeApp = async function() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    
    if (!window.supabase) {
        window.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    }
    supabase = window.supabase;

    await loadData();
    window.renderDaySelector();
    window.renderLessons();
};

async function loadData() {
    try {
        const [p, l, s] = await Promise.all([
            supabase.from('user_profiles').select('*').eq('user_id', window.currentUser).maybeSingle(),
            supabase.from('user_lessons').select('*').eq('user_id', window.currentUser),
            supabase.from('user_schedule').select('*').eq('user_id', window.currentUser)
        ]);
        if (p.data) window.state.profile = p.data;
        if (l.data) l.data.forEach(x => window.state.lessons[x.lesson_id] = x);
        if (s.data) window.state.schedule = s.data;
    } catch (e) { console.error(e); }
}

window.renderDaySelector = function() {
    const container = document.getElementById('day-selector');
    if (!container) return;
    container.innerHTML = '';
    const today = new Date();
    const dayNames = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1) + i);
        const active = d.toDateString() === window.selectedDate.toDateString();
        const card = document.createElement('div');
        card.className = `day-card ${active ? 'active' : ''}`;
        card.innerHTML = `<span class="day-name">${dayNames[i]}</span><span class="day-date">${d.getDate()}</span>`;
        card.onclick = () => { window.selectedDate = d; window.renderDaySelector(); window.renderLessons(); };
        container.appendChild(card);
    }
};

window.renderLessons = function() {
    const container = document.getElementById('lessons-list');
    if (!container) return;
    container.innerHTML = '';
    const dateStr = window.selectedDate.toISOString().split('T')[0];
    const tasks = window.state.schedule.filter(s => s.task_date === dateStr);
    
    if (tasks.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:2rem; opacity:0.5;">Свободный день</p>';
        return;
    }

    tasks.forEach((t, i) => {
        const lesson = (typeof KNOWLEDGE_BASE !== 'undefined') ? KNOWLEDGE_BASE.lessons[t.task_id] : null;
        const progress = window.state.lessons[t.task_id]?.progress || 0;
        const card = document.createElement('div');
        card.className = `lesson-card ${i % 2 === 0 ? 'purple' : 'blue'}`;
        card.innerHTML = `
            <div class="lesson-header"><strong>${lesson ? lesson.title : "Урок"}</strong> <span>${t.start_time}</span></div>
            <div class="lesson-progress-container"><div class="lesson-progress-fill" style="width:${progress}%"></div></div>
            <button class="btn-start" style="margin-top:1rem; width:100%;" onclick="alert('Начинаем!')">Начать</button>
        `;
        container.appendChild(card);
    });
};

window.switchView = function(v) {
    document.getElementById('view-title').innerText = v === 'home' ? 'Главная' : v;
};

// Самовызов инициализации
if (window.currentUser) {
    window.addEventListener('load', () => { window.initializeApp(); });
}
