/* D-Education Platform Logic FINAL v2 */

const supUrl = 'https://jjjkypymutcvrlngyhtt.supabase.co';
const supKey = 'sb_publishable_L1a5vhq7PjjSh7QTIrPGRg_RO-bH6FN';
let supabase;

window.state = { profile: { xp: 0, coins: 0, streak: 0 }, lessons: {}, schedule: [] };
window.selectedDate = new Date();

// Глобальный перехват ошибок
window.onerror = function(m, u, l) {
    console.error("Critical Error:", m, "at line", l);
    // Пытаемся хотя бы показать экран если всё упало
    hideLoading();
    const auth = document.getElementById('auth-screen');
    if (auth && auth.style.display === 'none' && document.getElementById('app-screen').style.display === 'none') {
        auth.style.display = 'flex';
    }
};

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.opacity = '0';
    setTimeout(() => { if(overlay) overlay.style.display = 'none'; }, 500);
}

// --- Инициализация ---
window.onload = async () => {
    console.log("App Started");
    try {
        if (window.supabase) {
            supabase = window.supabase.createClient(supUrl, supKey);
        } else {
            throw new Error("Supabase Library Not Loaded");
        }
        
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) loginBtn.onclick = window.handleLogin;

        const user = localStorage.getItem('d_edu_user');
        if (user) {
            window.currentUser = user;
            await window.initializeApp();
        } else {
            document.getElementById('auth-screen').style.display = 'flex';
            hideLoading();
        }
    } catch (e) {
        console.error("Init Error:", e);
        document.getElementById('auth-screen').style.display = 'flex';
        hideLoading();
    }
    
    // Резервный скрыватель загрузки (на всякий случай)
    setTimeout(hideLoading, 5000);
};

window.handleLogin = async function() {
    const emailInput = document.getElementById('username-input');
    const email = emailInput ? emailInput.value.trim() : "";
    if (!email) return alert("Введите Email");

    const btn = document.getElementById('login-btn');
    btn.innerText = "Синхронизация...";
    btn.disabled = true;

    try {
        window.currentUser = email;
        localStorage.setItem('d_edu_user', email);

        // МИГРАЦИЯ
        const { data: old } = await supabase.from('user_progress').select('data').eq('user_id', email).maybeSingle();
        if (old && old.data) {
            console.log("Found legacy data, migrating...");
            await migrate(email, old.data);
        }

        await window.initializeApp();
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
    } catch (e) { console.error("Migration error:", e); }
}

window.initializeApp = async function() {
    console.log("Initializing App...");
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    
    await loadAllData();
    window.renderUI();
    hideLoading();
};

async function loadAllData() {
    try {
        const uid = window.currentUser;
        const [p, l, s] = await Promise.all([
            supabase.from('user_profiles').select('*').eq('user_id', uid).maybeSingle(),
            supabase.from('user_lessons').select('*').eq('user_id', uid),
            supabase.from('user_schedule').select('*').eq('user_id', uid)
        ]);
        if (p.data) window.state.profile = p.data;
        if (l.data) {
            window.state.lessons = {};
            l.data.forEach(x => window.state.lessons[x.lesson_id] = x);
        }
        if (s.data) window.state.schedule = s.data;
    } catch (e) { console.error("Data Load Error:", e); }
}

window.renderUI = function() {
    window.renderDaySelector();
    window.renderLessons();
    
    const prof = window.state.profile;
    const level = Math.floor((prof.xp || 0) / 100) + 1;
    const subtitle = document.getElementById('view-subtitle');
    if (subtitle) {
        subtitle.innerText = `Уровень ${level} • ${prof.xp || 0} XP • ${prof.coins || 0} Монет`;
    }
};

window.renderDaySelector = function() {
    const cont = document.getElementById('day-selector');
    if (!cont) return;
    cont.innerHTML = '';
    const today = new Date();
    const names = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        const startOfWeek = today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1);
        d.setDate(startOfWeek + i);
        
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
                <button class="btn-start" onclick="alert('Урок запускается...')">Начать обучение</button>
            </div>
        `;
        cont.appendChild(card);
    });
};

window.switchView = function(v) {
    const title = document.getElementById('view-title');
    if (title) title.innerText = v === 'home' ? 'Главная' : v.toUpperCase();
    
    const selector = document.getElementById('day-selector');
    const list = document.getElementById('lessons-list');
    
    if (v !== 'home') {
        if(selector) selector.style.display = 'none';
        if(list) list.innerHTML = `<p style="padding:2rem; color:var(--text-dim);">Раздел ${v} скоро будет готов.</p>`;
    } else {
        if(selector) selector.style.display = 'flex';
        window.renderUI();
    }
};
