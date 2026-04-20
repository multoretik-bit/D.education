/* D-Education Platform Logic 2.0 */

// --- SUPABASE CONFIG ---
const supabaseUrl = 'https://jjjkypymutcvrlngyhtt.supabase.co';
const supabaseKey = 'sb_publishable_L1a5vhq7PjjSh7QTIrPGRg_RO-bH6FN';
let supabase;

try {
    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        console.error("Supabase library not found!");
    }
} catch (e) {
    console.error("Supabase init error:", e);
}

// --- STATE MANAGEMENT ---
let currentUser = localStorage.getItem('d_edu_user');
let currentView = 'home';
let selectedDate = new Date(); // Today by default

let state = {
    profile: { xp: 0, coins: 0, streak: 0 },
    lessons: {}, // lessonId -> { status, progress }
    cards: {},   // cardId -> { interval, ease, etc }
    schedule: [], // list of scheduled tasks
    customContent: {} // user created courses/lessons
};

// --- INITIALIZATION ---
window.onload = async () => {
    if (!currentUser) {
        showAuthScreen();
    } else {
        await initializeApp();
    }
};

async function handleLogin() {
    const email = document.getElementById('username-input').value.trim();
    const password = document.getElementById('password-input').value.trim();
    const loginBtn = document.getElementById('login-btn');
    
    if (!email || !email.includes('@')) return alert('Введите корректный Email');
    if (password.length < 4) return alert('Пароль должен быть не менее 4 символов');

    loginBtn.innerText = 'Вход...';
    loginBtn.disabled = true;
    
    try {
        if (!supabase) {
            throw new Error("Supabase не инициализирован. Проверьте интернет или блокировщики рекламы.");
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
        await initializeApp();
    } catch (err) {
        console.error("Login error:", err);
        alert('Ошибка: ' + (err.message || JSON.stringify(err)));
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
    }
}

// --- CLOUD SYNC (The "New Codes") ---
async function loadDataFromCloud() {
    if (!currentUser) return;

    try {
        // Parallel fetching for performance
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

        console.log("Data loaded from cloud:", state);
    } catch (err) {
        console.error("Cloud load error:", err);
    }
}

async function saveLessonProgress(lessonId, progress, status = 'in_progress') {
    state.lessons[lessonId] = { progress, status };
    
    try {
        const { error } = await supabase
            .from('user_lessons')
            .upsert({
                user_id: currentUser,
                lesson_id: lessonId,
                progress: progress,
                status: status,
                last_updated: new Date().toISOString()
            }, { onConflict: 'user_id, lesson_id' });
            
        if (error) throw error;
    } catch (err) {
        console.error("Failed to save lesson progress:", err);
    }
}

async function saveScheduleItem(task) {
    try {
        const { data, error } = await supabase
            .from('user_schedule')
            .insert({
                user_id: currentUser,
                task_id: task.id,
                task_type: task.type,
                start_time: task.startTime,
                duration: task.duration,
                task_date: task.date, // YYYY-MM-DD
                is_recurring: task.isRecurring || false
            })
            .select();
            
        if (error) throw error;
        state.schedule.push(data[0]);
        renderLessonsForDay(selectedDate);
    } catch (err) {
        console.error("Failed to add schedule item:", err);
    }
}

async function deleteScheduleItem(id) {
    try {
        const { error } = await supabase
            .from('user_schedule')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        state.schedule = state.schedule.filter(s => s.id !== id);
        renderLessonsForDay(selectedDate);
    } catch (err) {
        console.error("Failed to delete schedule item:", err);
    }
}

// --- UI RENDERING ---

function renderDaySelector() {
    const container = document.getElementById('day-selector');
    container.innerHTML = '';
    
    // Get start of week (Monday)
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
        
        card.innerHTML = `
            <span class="day-name">${dayNames[i]}</span>
            <span class="day-date">${date.getDate()} ${getMonthShort(date.getMonth())}</span>
            <ion-icon name="chevron-down-outline"></ion-icon>
        `;
        
        container.appendChild(card);
    }
    
    // Update header subtitle
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById('view-subtitle').innerText = `Уроки на ${selectedDate.toLocaleDateString('ru-RU', options)}`;
}

function renderLessonsForDay(date) {
    const container = document.getElementById('lessons-list');
    container.innerHTML = '';
    
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1; // 0-6 (Mon-Sun)
    
    const dayTasks = state.schedule.filter(s => {
        // Check for specific date or recurring day of week
        if (s.task_date === dateStr) return true;
        if (s.is_recurring && s.day_of_week === dayOfWeek) return true;
        return false;
    });
    
    if (dayTasks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-dim);">
                <ion-icon name="cafe-outline" style="font-size: 3rem; margin-bottom: 1rem;"></ion-icon>
                <p>На сегодня ничего не запланировано. Отдохните или добавьте новый урок!</p>
            </div>
        `;
        return;
    }
    
    // Sort by time
    dayTasks.sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    dayTasks.forEach((task, index) => {
        const colorClass = index % 2 === 0 ? 'purple' : 'blue';
        let title = "Урок";
        let subtitle = "Тема не указана";
        let progress = 0;
        
        if (task.task_type === 'lesson') {
            const lesson = KNOWLEDGE_BASE.lessons[task.task_id];
            if (lesson) {
                title = lesson.title;
                subtitle = "Индивидуальное занятие";
            }
            progress = state.lessons[task.task_id]?.progress || 0;
        } else if (task.task_type === 'course') {
            const area = KNOWLEDGE_BASE.areas.find(a => a.id === task.task_id);
            if (area) {
                title = area.title;
                subtitle = "Полноценный курс";
            }
        }
        
        const card = document.createElement('div');
        card.className = `lesson-card ${colorClass} fade-in-up`;
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="lesson-header">
                <span class="lesson-title">${title}</span>
                <span class="lesson-time"><ion-icon name="time-outline"></ion-icon> ${task.start_time.substring(0,5)} - ${calculateEndTime(task.start_time, task.duration)}</span>
            </div>
            <div class="lesson-subtitle">${subtitle}</div>
            <div class="lesson-progress-container">
                <div class="lesson-progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="lesson-footer">
                <div class="lesson-actions">
                    <div class="btn-icon" onclick="event.stopPropagation(); deleteScheduleItem('${task.id}')" title="Удалить">
                        <ion-icon name="trash-outline"></ion-icon>
                    </div>
                    <div class="tag">Active Study</div>
                </div>
                <button class="btn-start" onclick="startLesson('${task.task_id}')">Начать урок</button>
            </div>
            <div class="lesson-progress-text">${progress}%</div>
        `;
        
        container.appendChild(card);
    });
}

// --- NAVIGATION ---

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`nav-${view === 'home' ? 'home' : view}`).classList.add('active');
    
    const titleMap = {
        'home': 'Главная',
        'schedule': 'План на неделю',
        'catalog': 'Каталог курсов',
        'progress': 'Ваш прогресс',
        'profile': 'Профиль'
    };
    
    document.getElementById('view-title').innerText = titleMap[view] || 'dEducation';
    
    const main = document.getElementById('main-content');
    
    if (view === 'home') {
        document.getElementById('day-selector').style.display = 'flex';
        renderDaySelector();
        renderLessonsForDay(selectedDate);
    } else {
        document.getElementById('day-selector').style.display = 'none';
        document.getElementById('lessons-list').innerHTML = `<p style="padding: 2rem; color: var(--text-dim);">Раздел "${titleMap[view]}" в разработке...</p>`;
    }
}

// --- MODALS ---

function openAddLessonModal() {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    
    overlay.classList.add('active');
    
    content.innerHTML = `
        <h2 style="margin-bottom: 1.5rem;">Запланировать урок</h2>
        <div class="form-group">
            <label>Выберите предмет/курс</label>
            <select id="modal-task-id">
                ${KNOWLEDGE_BASE.areas.map(a => `<option value="${a.id}">[Курс] ${a.title}</option>`).join('')}
                <optgroup label="Уроки">
                    ${Object.values(KNOWLEDGE_BASE.lessons).slice(0, 20).map(l => `<option value="${l.id}">${l.title}</option>`).join('')}
                </optgroup>
            </select>
        </div>
        <div class="form-group" style="display: flex; gap: 1rem;">
            <div style="flex: 1;">
                <label>Время начала</label>
                <input type="time" id="modal-start-time" value="19:00">
            </div>
            <div style="flex: 1;">
                <label>Длительность (мин)</label>
                <input type="number" id="modal-duration" value="60">
            </div>
        </div>
        <div class="form-group">
            <label>Повторять каждую неделю?</label>
            <input type="checkbox" id="modal-recurring" style="width: auto;">
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
            <button class="btn-primary" style="background: var(--bg-card); border: 1px solid rgba(255,255,255,0.1);" onclick="closeModal()">Отмена</button>
            <button class="btn-primary" onclick="handleAddLesson()">Сохранить</button>
        </div>
    `;
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

async function handleAddLesson() {
    const taskId = document.getElementById('modal-task-id').value;
    const startTime = document.getElementById('modal-start-time').value;
    const duration = parseInt(document.getElementById('modal-duration').value);
    const isRecurring = document.getElementById('modal-recurring').checked;
    
    const task = {
        id: taskId,
        type: KNOWLEDGE_BASE.areas.some(a => a.id === taskId) ? 'course' : 'lesson',
        startTime: startTime,
        duration: duration,
        date: selectedDate.toISOString().split('T')[0],
        isRecurring: isRecurring
    };
    
    await saveScheduleItem(task);
    closeModal();
}

// --- HELPERS ---

function getMonthShort(m) {
    return ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"][m];
}

function calculateEndTime(startTime, duration) {
    const [h, m] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + duration);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function startLesson(id) {
    alert(`Начинаем изучение: ${id}. В этом режиме откроется папка со всеми карточками.`);
}
