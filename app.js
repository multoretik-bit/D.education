/* D-Education Platform Logic 3.0 (With Auto-Migration) */

const supabaseUrl = 'https://jjjkypymutcvrlngyhtt.supabase.co';
const supabaseKey = 'sb_publishable_L1a5vhq7PjjSh7QTIrPGRg_RO-bH6FN';
let supabase;

// --- INITIALIZATION ---
function init() {
    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log("Supabase Ready");
    }

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.onclick = handleLogin;

    let savedUser = localStorage.getItem('d_edu_user');
    if (savedUser) {
        currentUser = savedUser;
        initializeApp();
    }
}

window.onload = init;

// --- STATE ---
let currentUser = null;
let selectedDate = new Date();
let state = {
    profile: { xp: 0, coins: 0, streak: 0 },
    lessons: {},
    schedule: []
};

// --- LOGIN & MIGRATION ---
async function handleLogin() {
    const email = document.getElementById('username-input').value.trim();
    if (!email || !email.includes('@')) return alert('Введите корректный Email');

    const loginBtn = document.getElementById('login-btn');
    loginBtn.innerText = 'Синхронизация...';
    loginBtn.disabled = true;

    try {
        currentUser = email;
        localStorage.setItem('d_edu_user', currentUser);
        
        // Пытаемся найти старые данные для миграции
        const { data: oldData } = await supabase
            .from('user_progress')
            .select('data')
            .eq('user_id', currentUser)
            .maybeSingle();

        if (oldData && oldData.data) {
            console.log("Found legacy data, migrating...");
            await migrateLegacyData(oldData.data);
        }

        await initializeApp();
    } catch (err) {
        console.error(err);
        alert("Ошибка входа. Проверьте интернет или SQL таблицы.");
        loginBtn.innerText = 'Войти и синхронизировать';
        loginBtn.disabled = false;
    }
}

async function migrateLegacyData(legacy) {
    // 1. Профиль
    if (legacy.stats) {
        await supabase.from('user_profiles').upsert({
            user_id: currentUser,
            xp: legacy.stats.totalXp || 0,
            coins: legacy.stats.coins || 0,
            streak: legacy.stats.streak || 0
        });
    }

    // 2. Уроки
    if (legacy.lessons) {
        const lessonEntries = Object.entries(legacy.lessons).map(([id, data]) => ({
            user_id: currentUser,
            lesson_id: id,
            status: data.status || 'completed',
            progress: data.progress || 100
        }));
        if (lessonEntries.length > 0) {
            await supabase.from('user_lessons').upsert(lessonEntries, { onConflict: 'user_id, lesson_id' });
        }
    }

    // 3. Расписание
    if (legacy.schedule) {
        const scheduleEntries = [];
        Object.entries(legacy.schedule).forEach(([date, tasks]) => {
            if (Array.isArray(tasks)) {
                tasks.forEach(t => {
                    scheduleEntries.push({
                        user_id: currentUser,
                        task_date: date,
                        task_id: typeof t === 'string' ? t : t.id,
                        task_type: t.type || 'lesson',
                        start_time: t.startTime || '19:00',
                        duration: t.duration || 60,
                        is_recurring: t.recurring || false
                    });
                });
            }
        });
        if (scheduleEntries.length > 0) {
            await supabase.from('user_schedule').insert(scheduleEntries);
        }
    }
    
    console.log("Migration complete!");
}

async function initializeApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    
    await loadData();
    renderDaySelector();
    renderLessons();
}

async function loadData() {
    const [profileRes, lessonsRes, scheduleRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', currentUser).maybeSingle(),
        supabase.from('user_lessons').select('*').eq('user_id', currentUser),
        supabase.from('user_schedule').select('*').eq('user_id', currentUser)
    ]);

    if (profileRes.data) state.profile = profileRes.data;
    if (lessonsRes.data) {
        lessonsRes.data.forEach(l => state.lessons[l.lesson_id] = l);
    }
    if (scheduleRes.data) state.schedule = scheduleRes.data;
}

// --- UI ---
function renderDaySelector() {
    const container = document.getElementById('day-selector');
    container.innerHTML = '';
    const today = new Date();
    const dayNames = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1) + i);
        const isSelected = date.toDateString() === selectedDate.toDateString();
        
        const card = document.createElement('div');
        card.className = `day-card ${isSelected ? 'active' : ''}`;
        card.innerHTML = `<span class="day-name">${dayNames[i]}</span><span class="day-date">${date.getDate()}</span>`;
        card.onclick = () => {
            selectedDate = date;
            renderDaySelector();
            renderLessons();
        };
        container.appendChild(card);
    }
}

function renderLessons() {
    const container = document.getElementById('lessons-list');
    container.innerHTML = '';
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    const dayTasks = state.schedule.filter(s => s.task_date === dateStr || (s.is_recurring && new Date(s.task_date).getDay() === selectedDate.getDay()));
    
    if (dayTasks.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-dim); padding:2rem;">Нет уроков на этот день.</p>';
        return;
    }

    dayTasks.forEach((task, i) => {
        const color = i % 2 === 0 ? 'purple' : 'blue';
        const lesson = (typeof KNOWLEDGE_BASE !== 'undefined') ? KNOWLEDGE_BASE.lessons[task.task_id] : null;
        const title = lesson ? lesson.title : "Урок";
        const progress = state.lessons[task.task_id]?.progress || 0;

        const card = document.createElement('div');
        card.className = `lesson-card ${color}`;
        card.innerHTML = `
            <div class="lesson-header"><span class="lesson-title">${title}</span><span>${task.start_time}</span></div>
            <div class="lesson-progress-container"><div class="lesson-progress-fill" style="width:${progress}%"></div></div>
            <div class="lesson-footer"><button class="btn-start">Начать урок</button></div>
        `;
        container.appendChild(card);
    });
}

function switchView(view) {
    document.getElementById('view-title').innerText = view === 'home' ? 'Главная' : view;
}

function openAddLessonModal() {
    alert("Для добавления урока используйте кнопку + (в разработке)");
}
