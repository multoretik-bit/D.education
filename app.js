/* D-Education Platform Logic 2.0 */

// --- DEBUG ERRORS ---
window.onerror = function(msg, url, lineNo, columnNo, error) {
    alert("Ошибка скрипта: " + msg + "\nСтрока: " + lineNo);
    return false;
};

// --- SUPABASE CONFIG ---
const supabaseUrl = 'https://jjjkypymutcvrlngyhtt.supabase.co';
const supabaseKey = 'sb_publishable_L1a5vhq7PjjSh7QTIrPGRg_RO-bH6FN';
let supabase;

function initSupabase() {
    try {
        if (window.supabase) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            console.log("Supabase initialized");
        } else {
            alert("Критическая ошибка: Библиотека Supabase не загружена. Проверьте интернет.");
        }
    } catch (e) {
        alert("Ошибка инициализации Supabase: " + e.message);
    }
}

// --- STATE MANAGEMENT ---
let currentUser = localStorage.getItem('d_edu_user');
let currentView = 'home';
let selectedDate = new Date();

let state = {
    profile: { xp: 0, coins: 0, streak: 0 },
    lessons: {},
    cards: {},
    schedule: [],
    customContent: {}
};

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    initSupabase();
    
    // Bind buttons manually to ensure they work
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.onclick = handleLogin;
    }

    if (!currentUser) {
        showAuthScreen();
    } else {
        initializeApp();
    }
});

async function handleLogin() {
    console.log("Handle Login Called");
    const emailInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('login-btn');
    
    if (!emailInput || !passwordInput) {
        alert("Ошибка: Поля ввода не найдены в HTML!");
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !email.includes('@')) return alert('Введите корректный Email');
    if (password.length < 4) return alert('Пароль должен быть не менее 4 символов');

    loginBtn.innerText = 'Вход...';
    loginBtn.disabled = true;
    
    try {
        if (!supabase) {
            initSupabase();
            if (!supabase) throw new Error("Supabase не инициализирован");
        }

        // 1. Check if user exists
        const { data: authData, error: authError } = await supabase
            .from('user_auth')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (authError) throw authError;

        if (!authData) {
            // Register new user
            const { error: regError } = await supabase
                .from('user_auth')
                .insert({ email, password });
            
            if (regError) throw regError;
            alert('Аккаунт создан! Добро пожаловать.');
        } else {
            // Check password
            if (authData.password !== password) {
                alert('Неверный пароль!');
                loginBtn.innerText = 'Войти в систему';
                loginBtn.disabled = false;
                return;
            }
        }

        currentUser = email;
        localStorage.setItem('d_edu_user', currentUser);
        initializeApp();
    } catch (err) {
        console.error("Login error:", err);
        alert('Ошибка при входе: ' + (err.message || JSON.stringify(err)));
        loginBtn.innerText = 'Войти в систему';
        loginBtn.disabled = false;
    }
}

function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
}

async function initializeApp() {
    console.log("Initializing app for:", currentUser);
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    
    try {
        await loadDataFromCloud();
        renderDaySelector();
        renderLessonsForDay(selectedDate);
    } catch (err) {
        console.error("Initialization failed:", err);
        alert("Ошибка при загрузке данных: " + err.message);
    }
}

// --- CLOUD SYNC ---
async function loadDataFromCloud() {
    if (!currentUser || !supabase) return;

    try {
        const [profileRes, lessonsRes, scheduleRes, contentRes] = await Promise.all([
            supabase.from('user_profiles').select('*').eq('user_id', currentUser).maybeSingle(),
            supabase.from('user_lessons').select('*').eq('user_id', currentUser),
            supabase.from('user_schedule').select('*').eq('user_id', currentUser),
            supabase.from('user_custom_content').select('*').eq('user_id', currentUser)
        ]);

        if (profileRes.data) state.profile = profileRes.data;
        
        if (lessonsRes.data) {
            lessonsRes.data.forEach(l => {
                state.lessons[l.lesson_id] = { status: l.status, progress: l.progress };
            });
        }

        if (scheduleRes.data) state.schedule = scheduleRes.data;

        if (contentRes.data) {
            contentRes.data.forEach(c => {
                state.customContent[c.id] = c.data;
            });
        }
    } catch (err) {
        console.error("Cloud load error:", err);
    }
}

async function saveLessonProgress(lessonId, progress, status = 'in_progress') {
    state.lessons[lessonId] = { progress, status };
    if (!supabase) return;
    try {
        await supabase.from('user_lessons').upsert({
            user_id: currentUser,
            lesson_id: lessonId,
            progress: progress,
            status: status,
            last_updated: new Date().toISOString()
        }, { onConflict: 'user_id, lesson_id' });
    } catch (err) { console.error(err); }
}

async function saveScheduleItem(task) {
    if (!supabase) return;
    try {
        const { data, error } = await supabase.from('user_schedule').insert({
            user_id: currentUser,
            task_id: task.id,
            task_type: task.type,
            start_time: task.startTime,
            duration: task.duration,
            task_date: task.date,
            is_recurring: task.isRecurring || false
        }).select();
        if (error) throw error;
        state.schedule.push(data[0]);
        renderLessonsForDay(selectedDate);
    } catch (err) { console.error(err); }
}

async function deleteScheduleItem(id) {
    if (!supabase) return;
    try {
        await supabase.from('user_schedule').delete().eq('id', id);
        state.schedule = state.schedule.filter(s => s.id !== id);
        renderLessonsForDay(selectedDate);
    } catch (err) { console.error(err); }
}

// --- UI RENDERING ---

function getMonthShort(m) {
    return ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"][m];
}

function calculateEndTime(startTime, duration) {
    const [h, m] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + duration);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function renderDaySelector() {
    const container = document.getElementById('day-selector');
    if (!container) return;
    container.innerHTML = '';
    
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    
    const dayNames = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const isSelected = selectedDate.toISOString().split('T')[0] === dateStr;
        
        const card = document.createElement('div');
        card.className = `day-card ${isSelected ? 'active' : ''}`;
        card.onclick = () => {
            selectedDate = date;
            renderDaySelector();
            renderLessonsForDay(date);
        };
        card.innerHTML = `<span class="day-name">${dayNames[i]}</span><span class="day-date">${date.getDate()} ${getMonthShort(date.getMonth())}</span>`;
        container.appendChild(card);
    }
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById('view-subtitle').innerText = `Уроки на ${selectedDate.toLocaleDateString('ru-RU', options)}`;
}

function renderLessonsForDay(date) {
    const container = document.getElementById('lessons-list');
    if (!container) return;
    container.innerHTML = '';
    
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;
    
    const dayTasks = state.schedule.filter(s => {
        if (s.task_date === dateStr) return true;
        if (s.is_recurring && s.day_of_week === dayOfWeek) return true;
        return false;
    });
    
    if (dayTasks.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--text-dim);"><p>На сегодня ничего не запланировано.</p></div>`;
        return;
    }
    
    dayTasks.sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    dayTasks.forEach((task, index) => {
        const colorClass = index % 2 === 0 ? 'purple' : 'blue';
        let title = "Урок";
        let subtitle = "Загрузка...";
        let progress = 0;
        
        if (task.task_type === 'lesson') {
            const lesson = (typeof KNOWLEDGE_BASE !== 'undefined') ? KNOWLEDGE_BASE.lessons[task.task_id] : null;
            title = lesson ? lesson.title : "Урок";
            subtitle = "Индивидуальное занятие";
            progress = state.lessons[task.task_id]?.progress || 0;
        } else {
            const area = (typeof KNOWLEDGE_BASE !== 'undefined') ? KNOWLEDGE_BASE.areas.find(a => a.id === task.task_id) : null;
            title = area ? area.title : "Курс";
            subtitle = "Полноценный курс";
        }
        
        const card = document.createElement('div');
        card.className = `lesson-card ${colorClass} fade-in-up`;
        card.innerHTML = `
            <div class="lesson-header"><span class="lesson-title">${title}</span><span class="lesson-time">${task.start_time.substring(0,5)}</span></div>
            <div class="lesson-subtitle">${subtitle}</div>
            <div class="lesson-progress-container"><div class="lesson-progress-fill" style="width: ${progress}%"></div></div>
            <div class="lesson-footer">
                <button class="btn-icon" onclick="event.stopPropagation(); deleteScheduleItem('${task.id}')">🗑️</button>
                <button class="btn-start" onclick="startLesson('${task.task_id}')">Начать</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navEl = document.getElementById(`nav-${view === 'home' ? 'home' : view}`);
    if (navEl) navEl.classList.add('active');
    
    if (view === 'home') {
        document.getElementById('day-selector').style.display = 'flex';
        renderDaySelector();
        renderLessonsForDay(selectedDate);
    } else {
        document.getElementById('day-selector').style.display = 'none';
        document.getElementById('lessons-list').innerHTML = `<p style="padding: 2rem; color: var(--text-dim);">Раздел в разработке...</p>`;
    }
}

function openAddLessonModal() {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    overlay.classList.add('active');
    
    const lessonsOptions = (typeof KNOWLEDGE_BASE !== 'undefined') ? Object.values(KNOWLEDGE_BASE.lessons).slice(0, 10).map(l => `<option value="${l.id}">${l.title}</option>`).join('') : "";
    
    content.innerHTML = `
        <h2>Добавить урок</h2>
        <div class="form-group"><select id="modal-task-id">${lessonsOptions}</select></div>
        <div class="form-group"><input type="time" id="modal-start-time" value="19:00"></div>
        <div class="form-group"><input type="number" id="modal-duration" value="60"></div>
        <div style="display: flex; gap: 1rem;"><button onclick="closeModal()">Отмена</button><button onclick="handleAddLesson()">ОК</button></div>
    `;
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); }

async function handleAddLesson() {
    const taskId = document.getElementById('modal-task-id').value;
    const startTime = document.getElementById('modal-start-time').value;
    const duration = parseInt(document.getElementById('modal-duration').value);
    await saveScheduleItem({ id: taskId, type: 'lesson', startTime, duration, date: selectedDate.toISOString().split('T')[0] });
    closeModal();
}

function startLesson(id) { alert("Начинаем: " + id); }
