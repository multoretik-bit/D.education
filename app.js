/* D-Education Platform Logic FINAL */

const supUrl = 'https://jjjkypymutcvrlngyhtt.supabase.co';
const supKey = 'sb_publishable_L1a5vhq7PjjSh7QTIrPGRg_RO-bH6FN';
let supabase;

window.state = { profile: { xp: 0, coins: 0, streak: 0 }, lessons: {}, schedule: [] };
window.selectedDate = new Date();

// --- Инициализация ---
window.onload = async () => {
    if (window.supabase) {
        supabase = window.supabase.createClient(supUrl, supKey);
    }
    
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.onclick = window.handleLogin;

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
    btn.innerText = "Синхронизация...";
    btn.disabled = true;

    try {
        if (!supabase) supabase = window.supabase.createClient(supUrl, supKey);
        
        window.currentUser = email;
        localStorage.setItem('d_edu_user', email);

        // МИГРАЦИЯ (если есть старые данные)
        const { data: old } = await supabase.from('user_progress').select('data').eq('user_id', email).maybeSingle();
        if (old && old.data) {
            console.log("Migrating data...");
            await migrate(email, old.data);
        }

        window.initializeApp();
    } catch (e) {
        alert("Ошибка входа: " + e.message);
        btn.innerText = "Войти в систему";
        btn.disabled = false;
    }
};

async function migrate(uid, d) {
    try {
        if (d.stats) await supabase.from('user_profiles').upsert({ user_id: uid, xp: d.stats.totalXp||0, coins: d.stats.coins||0, streak: d.stats.streak||0 });
        if (d.lessons) {
            const ent = Object.entries(d.lessons).map(([id, val]) => ({ user_id: uid, lesson_id: id, status: val.status||'completed', progress: val.progress||100 }));
            if (ent.length > 0) await supabase.from('user_lessons').upsert(ent, { onConflict: 'user_id, lesson_id' });
        }
        if (d.schedule) {
            const sch = [];
            Object.entries(d.schedule).forEach(([date, tasks]) => {
                if (Array.isArray(tasks)) tasks.forEach(t => sch.push({
                    user_id: uid, task_date: date, task_id: typeof t === 'string' ? t : t.id,
                    task_type: t.type||'lesson', start_time: t.startTime||'19:00', duration: t.duration||60
                }));
            });
            if (sch.length > 0) await supabase.from('user_schedule').insert(sch);
        }
    } catch (e) { console.warn("Migration warning:", e); }
}

window.initializeApp = async function() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    
    if (!supabase) supabase = window.supabase.createClient(supUrl, supKey);

    await loadAllData();
    window.renderUI();
};

async function loadAllData() {
    const uid = window.currentUser;
    const [p, l, s] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('user_lessons').select('*').eq('user_id', uid),
        supabase.from('user_schedule').select('*').eq('user_id', uid)
    ]);
    if (p.data) window.state.profile = p.data;
    if (l.data) l.data.forEach(x => window.state.lessons[x.lesson_id] = x);
    if (s.data) window.state.schedule = s.data;
}

window.renderUI = function() {
    window.renderDaySelector();
    window.renderLessons();
    
    const prof = window.state.profile;
    const level = Math.floor((prof.xp || 0) / 100) + 1;
    document.getElementById('view-subtitle').innerText = `Уровень ${level} • ${prof.xp || 0} XP • ${prof.coins || 0} Монет`;
};

window.renderDaySelector = function() {
    const cont = document.getElementById('day-selector');
    if (!cont) return;
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
        card.onclick = () => { window.selectedDate = d; window.renderUI(); };
        cont.appendChild(card);
    }
};

window.renderLessons = function() {
    const cont = document.getElementById('lessons-list');
    if (!cont) return;
    cont.innerHTML = '';
    const dStr = window.selectedDate.toISOString().split('T')[0];
    const tasks = window.state.schedule.filter(s => s.task_date === dStr);
    
    if (tasks.length === 0) {
        cont.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-dim);"><p>План на этот день пуст.</p></div>`;
        return;
    }

    tasks.forEach((t, i) => {
        const lesson = (typeof KNOWLEDGE_BASE !== 'undefined') ? KNOWLEDGE_BASE.lessons[t.task_id] : null;
        const prog = window.state.lessons[t.task_id]?.progress || 0;
        const card = document.createElement('div');
        card.className = `lesson-card ${i % 2 === 0 ? 'purple' : 'blue'}`;
        card.innerHTML = `
            <div class="lesson-header"><span class="lesson-title">${lesson ? lesson.title : "Урок"}</span><span>${t.start_time}</span></div>
            <div class="lesson-progress-container"><div class="lesson-progress-fill" style="width:${prog}%"></div></div>
            <div class="lesson-footer">
                <button class="btn-start" onclick="alert('Начинаем урок!')">Начать обучение</button>
            </div>
        `;
        cont.appendChild(card);
    });
};

window.switchView = function(v) {
    document.getElementById('view-title').innerText = v === 'home' ? 'Главная' : v.toUpperCase();
    if (v !== 'home') {
        document.getElementById('day-selector').style.display = 'none';
        document.getElementById('lessons-list').innerHTML = `<p style="padding:2rem; color:var(--text-dim);">Раздел ${v} скоро будет готов.</p>`;
    } else {
        document.getElementById('day-selector').style.display = 'flex';
        window.renderUI();
    }
};
