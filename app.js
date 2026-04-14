/* D-Education Platform Logic */

// --- SUPABASE CONFIG ---
const supabaseUrl = 'https://jjjkypymutcvrlngyhtt.supabase.co';
const supabaseKey = 'sb_publishable_L1a5vhq7PjjSh7QTIrPGRg_RO-bH6FN';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// State Management
let currentView = 'dashboard';
let currentUser = localStorage.getItem('d_edu_user');
let userProgress = {
    lessons: {},
    skills: {},
    stats: { totalXp: 0, coins: 0, masteredSkills: 0, streak: 0 },
    schedule: {},
    customLessons: {},
    customAreas: {},
    customSubsystems: {},
    customSkills: {},
    ankiCards: {},
    ankiFolders: {}
};

let currentLessonState = {
    lessonId: null,
    step: 0,
    cards: []
};

let ankiTrainState = {
    areaId: null,
    cards: [],
    currentIndex: 0
};

// --- CLOUD SYNC ---
async function loadProgressFromCloud() {
    const main = document.getElementById('main-content');
    main.innerHTML = `<p style="text-align:center; margin-top: 5rem; color: var(--text-secondary);">Синхронизация с облаком...</p>`;

    try {
        const { data, error } = await supabaseClient
            .from('user_progress')
            .select('data')
            .eq('user_id', currentUser)
            .maybeSingle(); // Better than single() which errors on empty

        if (data && data.data) {
            // Merge with local state to avoid losing new fields
            userProgress = { ...userProgress, ...data.data };
        } else {
            // No data in cloud, check local
            const local = JSON.parse(localStorage.getItem('d_edu_v2_progress'));
            if (local) {
                userProgress = { ...userProgress, ...local };
                await saveProgressToCloud(); // Save local migration to cloud
            }
        }
    } catch (e) {
        console.warn("Cloud sync error, using local fallback:", e);
        const local = JSON.parse(localStorage.getItem('d_edu_v2_progress'));
        if (local) userProgress = { ...userProgress, ...local };
    }

    try {
        // Ensure all required fields exist
        if (!userProgress.schedule) userProgress.schedule = {};
        
        // [CLEANUP] Remove all existing lessons from schedule as requested
        Object.keys(userProgress.schedule).forEach(date => {
            if (Array.isArray(userProgress.schedule[date])) {
                userProgress.schedule[date] = userProgress.schedule[date].filter(task => {
                    if (typeof task === 'string') return false; // Legacy string ID
                    return task.type !== 'lesson';
                });
            } else {
                // Legacy non-array format (was a string lesson ID)
                userProgress.schedule[date] = [];
            }
            if (userProgress.schedule[date].length === 0) delete userProgress.schedule[date];
        });

        if (!userProgress.customLessons) userProgress.customLessons = {};
        if (!userProgress.customAreas) userProgress.customAreas = {};
        if (!userProgress.customSubsystems) userProgress.customSubsystems = {};
        if (!userProgress.customSkills) userProgress.customSkills = {};
        if (!userProgress.completions) userProgress.completions = {};
        if (!userProgress.ankiCards) userProgress.ankiCards = {};
        if (!userProgress.ankiFolders) userProgress.ankiFolders = {};
        
        injectCustomCourse();
    } catch (err) {
        console.error("Critical error during data migration:", err);
    }
}

function injectCustomCourse() {
    // 1. Maintain the legacy/default custom area
    if (!userProgress.customAreas['area_custom']) {
        userProgress.customAreas['area_custom'] = {
            id: 'area_custom',
            title: 'Свои уроки',
            icon: 'create-outline',
            subsystems: ['sub_custom']
        };
    }
    if (!userProgress.customSubsystems['sub_custom']) {
        userProgress.customSubsystems['sub_custom'] = {
            id: 'sub_custom',
            areaId: 'area_custom',
            title: 'Личные материалы',
            skills: ['skill_custom']
        };
    }
    if (!userProgress.customSkills['skill_custom']) {
        userProgress.customSkills['skill_custom'] = {
            id: 'skill_custom',
            subsystemId: 'sub_custom',
            title: 'Мои карточки (Собственные знания)',
            lessons: []
        };
    }

    // 2. Inject Areas
    Object.values(userProgress.customAreas).forEach(area => {
        const existingIndex = KNOWLEDGE_BASE.areas.findIndex(a => a.id === area.id);
        const areaData = { ...area };
        if (existingIndex === -1) {
            KNOWLEDGE_BASE.areas.push(areaData);
        } else {
            KNOWLEDGE_BASE.areas[existingIndex] = areaData;
        }
    });

    // 3. Inject Subsystems
    Object.values(userProgress.customSubsystems).forEach(sub => {
        KNOWLEDGE_BASE.subsystems[sub.id] = { ...sub };
    });

    // 4. Inject Skills (Groups)
    Object.values(userProgress.customSkills).forEach(skill => {
        KNOWLEDGE_BASE.skills[skill.id] = { ...skill, lessons: [] }; // Reset lessons to re-fill
    });

    // 5. Inject Lessons
    const allLessonIds = Object.keys(userProgress.customLessons);
    allLessonIds.forEach(id => {
        const customData = userProgress.customLessons[id];
        const targetSkillId = customData.skillId || 'skill_custom';
        
        // Ensure skill exists
        if (KNOWLEDGE_BASE.skills[targetSkillId]) {
            KNOWLEDGE_BASE.skills[targetSkillId].lessons.push(id);
        }

        KNOWLEDGE_BASE.lessons[id] = {
            id: id,
            skillId: targetSkillId,
            title: customData.title,
            content: {
                notes: customData.notes
            }
        };
    });
}

async function saveProgressToCloud() {
    localStorage.setItem('d_edu_v2_progress', JSON.stringify(userProgress));
    if (!currentUser) return;

    try {
        const { error } = await supabaseClient
            .from('user_progress')
            .upsert(
                { user_id: currentUser, data: userProgress, last_updated: new Date().toISOString() },
                { onConflict: 'user_id' }
            );
        
        if (error) throw error;
        console.log("Cloud sync success");
    } catch (e) {
        console.error("Cloud save failed:", e);
    }
}

// --- CUSTOM USER LESSONS ---

// --- COURSE BUILDER ---

function openCreateCourseModal() {
    const modal = document.getElementById('create-course-modal');
    modal.classList.remove('hidden');
    document.getElementById('course-title-input').value = '';
    document.getElementById('course-photo-input').value = '';
    document.getElementById('course-icon-input').value = 'school-outline';
    document.getElementById('edit-course-id').value = '';
    document.querySelector('#create-course-modal h3').innerHTML = '<ion-icon name="add-circle-outline"></ion-icon> Новый курс';
    document.getElementById('save-course-btn').innerText = 'Создать курс';
    document.getElementById('course-title-input').focus();
}

function closeCreateCourseModal() {
    document.getElementById('create-course-modal').classList.add('hidden');
}

async function saveCustomCourse() {
    const title = document.getElementById('course-title-input').value.trim();
    const photo = document.getElementById('course-photo-input').value.trim();
    const icon = document.getElementById('course-icon-input').value.trim() || 'school-outline';
    const editId = document.getElementById('edit-course-id').value;
    
    if (!title) return alert('Введите название курса');

    if (editId) {
        // Edit Mode
        const area = userProgress.customAreas[editId];
        if (area) {
            area.title = title;
            area.imageUrl = photo;
            area.icon = icon;
        }
    } else {
        // Create Mode
        const id = 'user_area_' + Date.now();
        userProgress.customAreas[id] = {
            id: id,
            title: title,
            icon: icon,
            imageUrl: photo,
            subsystems: []
        };
    }

    injectCustomCourse();
    await saveProgressToCloud();
    closeCreateCourseModal();
    renderAreas();
}

function openEditCourseModal(areaId) {
    const area = userProgress.customAreas[areaId];
    if (!area) return;

    const modal = document.getElementById('create-course-modal');
    modal.classList.remove('hidden');
    
    document.getElementById('edit-course-id').value = areaId;
    document.getElementById('course-title-input').value = area.title;
    document.getElementById('course-photo-input').value = area.imageUrl || '';
    document.getElementById('course-icon-input').value = area.icon || 'school-outline';
    document.querySelector('#create-course-modal h3').innerHTML = '<ion-icon name="create-outline"></ion-icon> Редактировать курс';
    document.getElementById('save-course-btn').innerText = 'Сохранить изменения';
}

function openCreateChapterModal(areaId) {
    const modal = document.getElementById('create-chapter-modal');
    modal.classList.remove('hidden');
    document.getElementById('chapter-target-area').value = areaId;
    document.getElementById('chapter-title-input').value = '';
    document.getElementById('chapter-title-input').focus();
}

function closeCreateChapterModal() {
    document.getElementById('create-chapter-modal').classList.add('hidden');
}

async function saveCustomChapter() {
    const title = document.getElementById('chapter-title-input').value.trim();
    const areaId = document.getElementById('chapter-target-area').value;
    if (!title) return alert('Введите название раздела');

    const subId = 'user_sub_' + Date.now();
    const skillId = 'user_skill_' + Date.now();

    userProgress.customSubsystems[subId] = {
        id: subId,
        areaId: areaId,
        title: title,
        skills: [skillId]
    };

    userProgress.customSkills[skillId] = {
        id: skillId,
        subsystemId: subId,
        title: 'Уроки раздела',
        lessons: []
    };

    userProgress.customAreas[areaId].subsystems.push(subId);

    injectCustomCourse();
    await saveProgressToCloud();
    closeCreateChapterModal();
    renderSubsystems(areaId);
}

function openCustomLessonModal(skillId) {
    const modal = document.getElementById('custom-lesson-modal');
    modal.classList.remove('hidden');
    document.getElementById('custom-lesson-target-skill').value = skillId || 'skill_custom';
    document.getElementById('custom-lesson-title').value = '';
    document.getElementById('custom-lesson-notes').value = '';
    document.getElementById('custom-lesson-title').focus();
}

function closeCustomLessonModal() {
    document.getElementById('custom-lesson-modal').classList.add('hidden');
}

async function saveCustomLesson() {
    const title = document.getElementById('custom-lesson-title').value.trim();
    const notes = document.getElementById('custom-lesson-notes').value.trim();
    const skillId = document.getElementById('custom-lesson-target-skill').value;

    if (!title) return alert('Введите название урока');
    if (!notes) return alert('Введите описание или заметки к уроку');

    const id = 'custom_' + Date.now();
    userProgress.customLessons[id] = {
        title: title,
        notes: notes,
        skillId: skillId,
        createdAt: Date.now()
    };

    injectCustomCourse();
    await saveProgressToCloud();
    closeCustomLessonModal();
    renderLessonsList(skillId);
    alert('Урок сохранен!');
}

async function deleteCustomLesson(id, skillId) {
    if (!confirm('Удалить этот урок навсегда?')) return;
    delete userProgress.customLessons[id];
    injectCustomCourse();
    await saveProgressToCloud();
    renderLessonsList(skillId);
}

async function deleteCustomArea(areaId) {
    if (!confirm('Вы уверены, что хотите удалить весь курс? Это действие нельзя отменить.')) return;
    
    // Cleanup subsystems and skills associated with this area
    const area = userProgress.customAreas[areaId];
    if (area) {
        area.subsystems.forEach(subId => {
            const sub = userProgress.customSubsystems[subId];
            if (sub) {
                sub.skills.forEach(skillId => {
                    // We could also delete lessons, but for safety let's just detach them?
                    // Actually, the user asked to "delete courses", so let's clean up lessons too.
                    Object.keys(userProgress.customLessons).forEach(lId => {
                        if (userProgress.customLessons[lId].skillId === skillId) {
                            delete userProgress.customLessons[lId];
                        }
                    });
                    delete userProgress.customSkills[skillId];
                });
                delete userProgress.customSubsystems[subId];
            }
        });
        delete userProgress.customAreas[areaId];
    }
    
    injectCustomCourse();
    await saveProgressToCloud();
    renderAreas();
}

function renderLoginAuth() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div style="text-align: center; margin-top: 5rem;" class="fade-in">
            <ion-icon name="cloud-done-outline" style="font-size: 5rem; color: var(--primary); margin-bottom: 2rem;"></ion-icon>
            <h2>Добро пожаловать в D-SYSTEM</h2>
            <p style="color: var(--text-secondary); margin: 1rem 0 2rem 0;">Мы включили сохранение в Облако Supabase. Введите вашу Почту (Email), чтобы синхронизировать прогресс между компьютером и телефоном.</p>
            <input type="email" id="username-input" class="check-input" placeholder="Введите ваш Email (Например: john@gmail.com)" style="max-width: 300px; margin: 0 auto; display: block;">
            <button class="btn btn-primary" style="margin-top: 1rem; width: 100%; max-width: 300px;" onclick="handleLogin()">Войти в Систему</button>
        </div>
    `;
}

async function handleLogin() {
    const name = document.getElementById('username-input').value.trim();
    if (name.length < 3) return alert('Логин должен быть больше 3 символов');
    currentUser = name;
    localStorage.setItem('d_edu_user', currentUser);
    await loadProgressFromCloud();
    renderDashboard();
}

// Initial Render OVERRIDE
window.onload = async () => {
    if (!currentUser) {
        renderLoginAuth();
    } else {
        await loadProgressFromCloud();
        renderDashboard();
    }
    
    // Auto-refresh Dashboard every minute for LIVE progress
    setInterval(() => {
        if (currentView === 'dashboard') {
            const todayCol = document.querySelector('.current-day .day-tasks');
            if (todayCol) {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                const todayStr = `${y}-${m}-${d}`;
                todayCol.innerHTML = renderScheduledTasks(todayStr);
            }
        }
    }, 60000);
};

// --- NAVIGATION & RENDERING ---

function getMonthName(m) {
    return ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"][m];
}

function updateNavActive(id) {
    document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function renderDashboard() {
    updateNavActive('nav-dashboard');
    const main = document.getElementById('main-content');

    // Calculate this week's dates (Monday to Sunday)
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    const distance = currentDay === 0 ? 6 : currentDay - 1; // days since Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() - distance);

    const daysOfWeek = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];
    let calendarHtml = '<div class="calendar-grid fade-in">';

    for (let i = 0; i < 7; i++) {
        const dateIter = new Date(monday);
        dateIter.setDate(monday.getDate() + i);
        // Need stable local YYYY-MM-DD format regardless of timezone
        const y = dateIter.getFullYear();
        const m = String(dateIter.getMonth() + 1).padStart(2, '0');
        const d = String(dateIter.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const ty = today.getFullYear();
        const tm = String(today.getMonth() + 1).padStart(2, '0');
        const td = String(today.getDate()).padStart(2, '0');
        const todayStr = `${ty}-${tm}-${td}`;
        const isToday = dateStr === todayStr;

        calendarHtml += `
       <div class="calendar-day ${isToday ? 'current-day' : ''}">
           <div class="day-header">
               <span class="day-name">${daysOfWeek[i]}</span>
               <span class="day-date">${dateIter.getDate()} ${getMonthName(dateIter.getMonth())}</span>
           </div>
           
           <div class="study-block-container">
               <div class="study-block-header">
                    <span><ion-icon name="time-outline"></ion-icon> 19:00 - 22:00</span>
               </div>
               <div class="day-tasks">
                   ${renderScheduledTasks(dateStr)}
               </div>
           </div>

           <button class="add-task-btn" style="margin-top: auto;" onclick="openScheduleModal('${dateStr}', '${daysOfWeek[i]}, ${dateIter.getDate()} ${getMonthName(dateIter.getMonth())}')">
                <ion-icon name="add-outline"></ion-icon> Добавить в план
           </button>
       </div>
     `;
    }
    calendarHtml += `</div>
     <!-- Modal Template -->
     <div id="schedule-modal" class="modal-overlay hidden">
         <div class="modal-content" style="max-height: 90vh; display: flex; flex-direction: column; width: 600px;">
             <header style="display: flex; justify-content: space-between; align-items:center; margin-bottom:1rem; flex-shrink: 0;">
                <h3 style="color:var(--primary); font-size: 1.2rem;"><ion-icon name="calendar-outline"></ion-icon> План: <span id="modal-date-display" style="color: var(--text-main);">...</span></h3>
                <ion-icon name="close" onclick="closeScheduleModal()" style="font-size:1.5rem; cursor:pointer;"></ion-icon>
             </header>
             
             <!-- SETTINGS FOR THE NEW TASK -->
             <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.05);">
                <div class="modal-row" style="margin-bottom: 10px;">
                    <div>
                        <label class="modal-label">Начало (19:00 - 22:00)</label>
                        <input type="time" id="modal-task-time" class="time-input" value="19:00">
                    </div>
                    <div>
                        <label class="modal-label">Длительность (мин)</label>
                        <input type="number" id="modal-task-duration" class="number-input" value="60" min="5" max="180">
                    </div>
                </div>
                <div style="display: flex; gap: 20px; align-items: center;">
                    <label class="checkbox-group">
                        <input type="checkbox" id="modal-task-recurring"> Повторять каждую неделю
                    </label>
                </div>
             </div>

             <p style="color:var(--text-secondary); margin-bottom: 1rem; font-size:0.9rem; flex-shrink: 0;">Выберите Курс или Урок для добавления:</p>
             
             <!-- TABS -->
             <div style="display: flex; gap: 10px; margin-bottom: 1rem; flex-shrink: 0;">
                <button class="btn btn-primary" id="btn-tab-browse" onclick="switchModalTab('browse')" style="flex:1; padding: 0.5rem; font-size: 0.9rem; border-radius: 8px;">📚 Каталог</button>
                <button class="btn" id="btn-tab-search" onclick="switchModalTab('search')" style="flex:1; padding: 0.5rem; font-size: 0.9rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color: var(--text-main); border-radius: 8px;">🔍 Поиск</button>
             </div>

             <!-- CONTENT AREAS -->
             <div id="modal-tab-browse" style="overflow-y:auto; flex-grow: 1; border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: var(--radius);">
                 <!-- Hierarchy injected here via JS -->
             </div>

             <div id="modal-tab-search" class="hidden" style="flex-grow: 1; display:flex; flex-direction:column;">
                 <input type="text" id="modal-search" class="check-input" style="margin-top:0; flex-shrink: 0; padding: 0.75rem;" placeholder="Название урока или курса..." onkeyup="handleModalSearch(this.value)">
                 <div id="modal-search-results" style="margin-top: 1rem; overflow-y:auto; flex-grow: 1;"></div>
             </div>
             
             <input type="hidden" id="modal-active-date" value="">
         </div>
     </div>
  `;

    main.innerHTML = `
    <header style="margin-bottom: 2rem;" class="fade-in">
        <h1>Ваша учебная неделя</h1>
        <p style="color: var(--text-secondary);">Распределяйте уроки осознанно. Выстраивайте дисциплину.</p>
    </header>
    ${calendarHtml}
  `;
}

function getTasksForDate(dateStr) {
    const requestedDate = new Date(dateStr);
    const dayOfWeek = requestedDate.getDay(); 
    let allTasks = [];

    // 1. Get explicit tasks for this date
    const directTasks = userProgress.schedule[dateStr] || [];
    allTasks = [...directTasks.map(t => {
        if (typeof t === 'string') return { id: t, type: 'lesson', startTime: '19:00', duration: 60, recurring: false };
        return t;
    })];

    // 2. Get recurring tasks from OTHER dates
    Object.keys(userProgress.schedule).forEach(pastDateStr => {
        if (pastDateStr === dateStr) return; // Already handled
        
        const pastDate = new Date(pastDateStr);
        if (pastDate > requestedDate) return; // Future tasks don't recur backwards

        // Same day of week check
        if (pastDate.getDay() === dayOfWeek) {
            const tasks = userProgress.schedule[pastDateStr];
            tasks.forEach(t => {
                const taskObj = typeof t === 'string' ? { id: t, type: 'lesson', startTime: '19:00', duration: 60, recurring: false } : t;
                if (taskObj.recurring) {
                    // Check if we already have this lesson/course at this time (to avoid duplicates)
                    const isDuplicate = allTasks.some(existing => 
                        existing.id === taskObj.id && existing.startTime === taskObj.startTime
                    );
                    if (!isDuplicate) {
                        allTasks.push({ ...taskObj, originalDate: pastDateStr }); // Save original date for deletion
                    }
                }
            });
        }
    });

    // Sort by startTime
    return allTasks.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function getLiveStatus(task, dateStr) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (dateStr !== todayStr) return null;

    const [h, m] = task.startTime.split(':').map(Number);
    const start = new Date(now);
    start.setHours(h, m, 0, 0);
    
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + task.duration);

    if (now >= start && now < end) {
        const elapsed = (now - start) / 1000 / 60;
        const progress = (elapsed / task.duration) * 100;
        const minutesLeft = Math.ceil((end - now) / 1000 / 60);
        return { progress, minutesLeft };
    }
    return null;
}

function renderScheduledTasks(dateStr) {
    const list = getTasksForDate(dateStr).filter(task => task.type !== 'lesson');
    if (list.length === 0) return `<div style="text-align:center; color:rgba(255,255,255,0.1); margin-top:20px; font-size:0.8rem;">Дисциплина — это свобода.<br>Запланируй свой блок.</div>`;
    
    return list.map(task => {
        let title = "Урок";
        let icon = "book";
        let action = `startLesson('${task.id}')`;

        if (task.type === 'course') {
            const area = KNOWLEDGE_BASE.areas.find(a => a.id === task.id);
            title = area ? area.title : "Курс";
            icon = area ? area.icon : "school";
            action = `renderSubsystems('${task.id}')`;
        } else {
            const lesson = KNOWLEDGE_BASE.lessons[task.id];
            if (lesson) title = lesson.title;
        }

        const live = getLiveStatus(task, dateStr);
        const liveClass = live ? 'is-live' : '';
        const taskKey = `${task.id}-${task.startTime}`;
        const isCompleted = userProgress.completions[dateStr] && userProgress.completions[dateStr][taskKey];
        const completeClass = isCompleted ? 'is-completed' : '';

        return `
         <div class="structured-task ${task.type === 'course' ? 'is-course' : ''} ${task.recurring ? 'recurring-badge' : ''} ${liveClass} ${completeClass}" onclick="${action}">
             <div class="task-meta">
                <span><ion-icon name="time-outline"></ion-icon> ${task.startTime} (${task.duration} мин)</span>
                <div style="display:flex; gap: 8px; align-items:center;">
                    <ion-icon name="${isCompleted ? 'checkbox' : 'square-outline'}" class="complete-task-btn ${isCompleted ? 'active' : ''}" onclick="event.stopPropagation(); toggleTaskCompletion('${dateStr}', '${task.id}', '${task.startTime}')" title="${isCompleted ? 'Выполнено' : 'Отметить выполнение'}"></ion-icon>
                    <ion-icon name="trash-outline" class="delete-task-icon" onclick="event.stopPropagation(); deleteTaskFromSchedule('${task.originalDate || dateStr}', '${task.id}', '${task.startTime}')" title="Удалить из плана"></ion-icon>
                </div>
             </div>
             <span class="task-name">${title}</span>
             ${live ? `
                <div class="live-progress-container">
                    <div class="live-progress-fill" style="width: ${live.progress}%"></div>
                </div>
                <span class="live-time-left">Осталось ${live.minutesLeft} мин</span>
             ` : ''}
         </div>
       `;
    }).join('');
}

async function deleteTaskFromSchedule(dateStr, taskId, startTime) {
    if (!confirm('Вы уверены, что хотите удалить этот урок из плана?')) return;
    
    if (userProgress.schedule[dateStr]) {
        userProgress.schedule[dateStr] = userProgress.schedule[dateStr].filter(t => {
            if (typeof t === 'string') return t !== taskId;
            return !(t.id === taskId && t.startTime === startTime);
        });
        
        if (userProgress.schedule[dateStr].length === 0) {
            delete userProgress.schedule[dateStr];
        }
        
        // Also cleanup completion for this task
        const taskKey = `${taskId}-${startTime}`;
        if (userProgress.completions[dateStr]) {
            delete userProgress.completions[dateStr][taskKey];
        }

        await saveProgressToCloud();
        renderDashboard();
    }
}

async function toggleTaskCompletion(dateStr, taskId, startTime) {
    const taskKey = `${taskId}-${startTime}`;
    
    if (!userProgress.completions[dateStr]) {
        userProgress.completions[dateStr] = {};
    }
    
    if (userProgress.completions[dateStr][taskKey]) {
        delete userProgress.completions[dateStr][taskKey];
    } else {
        userProgress.completions[dateStr][taskKey] = true;
    }
    
    await saveProgressToCloud();
    renderDashboard();
}

// Modal functions
function switchModalTab(tab) {
    const browseRaw = document.getElementById('modal-tab-browse');
    const searchRaw = document.getElementById('modal-tab-search');
    const btnBrowse = document.getElementById('btn-tab-browse');
    const btnSearch = document.getElementById('btn-tab-search');

    if (tab === 'browse') {
        browseRaw.classList.remove('hidden');
        searchRaw.classList.add('hidden');
        btnBrowse.className = 'btn btn-primary';
        btnBrowse.style.background = '';
        btnBrowse.style.border = 'none';

        btnSearch.className = 'btn';
        btnSearch.style.background = 'rgba(255,255,255,0.05)';
        btnSearch.style.border = '1px solid rgba(255,255,255,0.1)';
        btnSearch.style.color = 'var(--text-main)';
    } else {
        searchRaw.classList.remove('hidden');
        browseRaw.classList.add('hidden');
        btnSearch.className = 'btn btn-primary';
        btnSearch.style.background = '';
        btnSearch.style.border = 'none';

        btnBrowse.className = 'btn';
        btnBrowse.style.background = 'rgba(255,255,255,0.05)';
        btnBrowse.style.border = '1px solid rgba(255,255,255,0.1)';
        btnBrowse.style.color = 'var(--text-main)';

        document.getElementById('modal-search').focus();
    }
}

function renderModalBrowserTree() {
    const container = document.getElementById('modal-tab-browse');
    let html = '';

    KNOWLEDGE_BASE.areas.forEach((area, aIndex) => {
        html += `<div style="font-weight: bold; font-size: 1.1rem; color: white; margin-top: ${aIndex > 0 ? '20px' : '0'}; margin-bottom: 15px; display:flex; align-items:center; gap:8px;"><ion-icon name="${area.icon}" style="color:var(--primary);"></ion-icon> ${area.title}</div>`;

        area.subsystems.forEach(subId => {
            const sub = KNOWLEDGE_BASE.subsystems[subId];
            if (!sub) return;

            html += `
            <div class="tree-node fade-in" style="margin-bottom: 6px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                <div onclick="toggleTreeNode('node-${subId}')" style="cursor: pointer; padding: 12px; display: flex; align-items: center; justify-content: space-between; transition: 0.2s;">
                    <span style="font-weight: 500; font-size: 0.95rem;">${sub.title}</span>
                    <ion-icon name="chevron-down-outline" id="icon-node-${subId}" style="transition:0.3s; color: var(--text-secondary);"></ion-icon>
                </div>
                <div id="node-${subId}" class="tree-children hidden" style="padding: 0 10px 10px 10px;">
            `;

            sub.skills.forEach(skillId => {
                const skill = KNOWLEDGE_BASE.skills[skillId];
                if (!skill) return;
                skill.lessons.forEach(lId => {
                    const lesson = KNOWLEDGE_BASE.lessons[lId];
                    if (!lesson) return;
                    html += `
                    <div class="search-result-item" style="padding: 8px 10px; margin-bottom: 4px; font-size: 0.85rem; border-radius: 6px; background: rgba(0,0,0,0.2);">
                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width: 65%;">${lesson.title}</span>
                    </div>
                    `;
                });
            });

            html += `</div></div>`;
        });
        
        // ADD OPTION TO ADD THE WHOLE AREA
        html += `
        <div class="search-result-item" style="background: rgba(0, 229, 255, 0.05); border: 1px dashed var(--secondary); margin-top: -10px; margin-bottom: 20px;">
            <span style="color: var(--secondary); font-weight: bold;">Весь курс: ${area.title}</span>
            <button class="btn" onclick="addCourseToSchedule('${area.id}')" style="padding: 4px 10px; background: var(--secondary); color: black; border: none; display:flex; align-items:center; gap:4px; font-size:0.8rem; border-radius: 4px;">
                <ion-icon name="calendar"></ion-icon> В план
            </button>
        </div>
        `;
    });

    container.innerHTML = html;
}

function toggleTreeNode(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById('icon-' + id);
    if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
    } else {
        el.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
    }
}

function openScheduleModal(dateStr, formattedDate) {
    const modal = document.getElementById('schedule-modal');
    modal.classList.remove('hidden');
    document.getElementById('modal-active-date').value = dateStr;
    document.getElementById('modal-date-display').innerText = formattedDate || dateStr;
    document.getElementById('modal-search').value = '';
    document.getElementById('modal-search-results').innerHTML = '';

    // Default to the new browse mode
    switchModalTab('browse');
    renderModalBrowserTree();
}

function closeScheduleModal() {
    document.getElementById('schedule-modal').classList.add('hidden');
}

function handleModalSearch(query) {
    query = query.toLowerCase().trim();
    const resultsContainer = document.getElementById('modal-search-results');
    if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }

    // Search Lessons
    const lessons = Object.entries(KNOWLEDGE_BASE.lessons).filter(([id, l]) =>
        l.title.toLowerCase().includes(query)
    ).slice(0, 10);

    // Search Courses (Areas)
    const areas = KNOWLEDGE_BASE.areas.filter(a => 
        a.title.toLowerCase().includes(query)
    );

    if (lessons.length === 0 && areas.length === 0) {
        resultsContainer.innerHTML = '<p style="color:var(--text-secondary);">Ничего не найдено</p>';
        return;
    }

    let html = '';
    
    areas.forEach(a => {
        html += `
            <div class="search-result-item" style="background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.2);">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-weight:bold; color:var(--secondary);">Курс: ${a.title}</span>
                    <span style="font-size:0.7rem; color:var(--text-secondary);">Весь блок обучения</span>
                </div>
                <button class="btn" onclick="addCourseToSchedule('${a.id}')" style="padding: 4px 10px; background: var(--secondary); color: black; border: none; font-size:0.8rem; border-radius: 4px;">
                    <ion-icon name="add"></ion-icon> План
                </button>
            </div>
        `;
    });

    lessons.forEach(([id, l]) => {
        html += `
            <div class="search-result-item">
                <span>${l.title}</span>
            </div>
        `;
    });

    resultsContainer.innerHTML = html;
}

// Global Day Picker UI for Catalog Scheduling
function openDayPickerModal(lessonId) {
    // Create it dynamically if doesn't exist
    let pModal = document.getElementById('day-picker-modal');
    if (!pModal) {
        const div = document.createElement('div');
        div.id = 'day-picker-modal';
        div.className = 'modal-overlay hidden';
        div.innerHTML = `
            <div class="modal-content" style="max-width:350px;">
                <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3>Выберите день (План)</h3>
                    <ion-icon name="close" onclick="document.getElementById('day-picker-modal').classList.add('hidden')" style="font-size:1.5rem; cursor:pointer;"></ion-icon>
                </header>
                <input type="hidden" id="day-picker-lesson" value="">
                <div id="day-picker-buttons" style="display:flex; flex-direction:column; gap:5px;"></div>
            </div>
        `;
        document.body.appendChild(div);
        pModal = div;
    }

    // Generate dates mapping
    const today = new Date();
    const currentDay = today.getDay();
    const distance = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distance);
    const daysOfWeek = ["ПОНЕДЕЛЬНИК", "ВТОРНИК", "СРЕДА", "ЧЕТВЕРГ", "ПЯТНИЦА", "СУББОТА", "ВОСКРЕСЕНЬЕ"];

    let html = '';
    for (let i = 0; i < 7; i++) {
        const dDate = new Date(monday);
        dDate.setDate(monday.getDate() + i);
        const y = dDate.getFullYear();
        const m = String(dDate.getMonth() + 1).padStart(2, '0');
        const d = String(dDate.getDate()).padStart(2, '0');
        const dStr = `${y}-${m}-${d}`;

        let label = daysOfWeek[i];
        if (dStr === today.toISOString().split('T')[0]) label += ' (Сегодня)';

        html += `<button class="btn" style="background:rgba(255,255,255,0.05); text-align:left; border:1px solid rgba(255,255,255,0.1);" onclick="scheduleFromPicker('${lessonId}', '${dStr}')">${label}</button>`;
    }

    document.getElementById('day-picker-buttons').innerHTML = html;
    pModal.classList.remove('hidden');
}

async function scheduleFromPicker(lessonId, dateStr) {
    document.getElementById('day-picker-modal').classList.add('hidden');
    if (!userProgress.schedule[dateStr]) userProgress.schedule[dateStr] = [];
    if (!userProgress.schedule[dateStr].includes(lessonId)) {
        userProgress.schedule[dateStr].push(lessonId);
        await saveProgressToCloud();
        alert('✅ Урок успешно добавлен в календарь на этот день!');
    } else {
        alert('Этот урок уже есть в плане на этот день.');
    }
}

async function addLessonToSchedule(lessonId) {
    const dateStr = document.getElementById('modal-active-date').value;
    const startTime = document.getElementById('modal-task-time').value || '19:00';
    const duration = parseInt(document.getElementById('modal-task-duration').value) || 60;
    const recurring = document.getElementById('modal-task-recurring').checked;

    if (!userProgress.schedule[dateStr]) userProgress.schedule[dateStr] = [];

    const taskObj = {
        id: lessonId,
        type: 'lesson',
        startTime: startTime,
        duration: duration,
        recurring: recurring
    };

    userProgress.schedule[dateStr].push(taskObj);
    await saveProgressToCloud();
    renderDashboard();
    closeScheduleModal();
}

async function addCourseToSchedule(courseId) {
    const dateStr = document.getElementById('modal-active-date').value;
    const startTime = document.getElementById('modal-task-time').value || '19:00';
    const duration = parseInt(document.getElementById('modal-task-duration').value) || 60;
    const recurring = document.getElementById('modal-task-recurring').checked;

    if (!userProgress.schedule[dateStr]) userProgress.schedule[dateStr] = [];

    const taskObj = {
        id: courseId,
        type: 'course',
        startTime: startTime,
        duration: duration,
        recurring: recurring
    };

    userProgress.schedule[dateStr].push(taskObj);
    await saveProgressToCloud();
    renderDashboard();
    closeScheduleModal();
}

function renderAreas() {
    updateNavActive('nav-catalog');
    const main = document.getElementById('main-content');

    // Calculate progress for each area
    const areasWithProgress = KNOWLEDGE_BASE.areas.map(area => {
        let total = 0;
        let passed = 0;

        area.subsystems.forEach(subId => {
            const sub = KNOWLEDGE_BASE.subsystems[subId];
            if (!sub) return;
            sub.skills.forEach(skillId => {
                const skill = KNOWLEDGE_BASE.skills[skillId];
                if (!skill) return;
                total += skill.lessons.length;
                skill.lessons.forEach(lId => {
                    if (userProgress.lessons[lId] && userProgress.lessons[lId].masteryLevel >= 1) {
                        passed++;
                    }
                });
            });
        });

        const percent = total > 0 ? Math.round((passed / total) * 100) : 0;
        return { area, total, passed, percent };
    });

    // Sort: In Progress (passed > 0 and not 100%) first, then 0%, then 100%
    areasWithProgress.sort((a, b) => {
        if (a.area.id === 'area_custom' && b.area.id !== 'area_custom') return 1; // Custom always last or we can put it first?
        if (a.passed > 0 && b.passed === 0) return -1;
        if (a.passed === 0 && b.passed > 0) return 1;
        return b.percent - a.percent;
    });

    main.innerHTML = `
        <header style="margin-bottom: 3rem;" class="fade-in">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h1>Каталог знаний</h1>
                <button class="btn btn-primary" onclick="openCreateCourseModal()" style="padding: 0.5rem 1rem; font-size: 0.8rem; text-transform:none;">➕ Создать курс</button>
            </div>
            <p style="color: var(--text-secondary);">Выберите область для изучения.</p>
        </header>
        <div class="grid fade-in">
            ${areasWithProgress.map(data => {
                const isCustom = userProgress.customAreas[data.area.id] !== undefined;
                const areaClass = isCustom ? 'is-custom' : 'is-default';
                const avatar = data.area.imageUrl ? 
                    `<img src="${data.area.imageUrl}" class="course-avatar" onerror="this.src='https://via.placeholder.com/60?text=Course'">` : 
                    `<ion-icon name="${data.area.icon}" style="font-size: 3rem; margin-bottom: 1rem;"></ion-icon>`;

                return `
                <div class="area-card ${areaClass}" onclick="renderSubsystems('${data.area.id}')" style="position: relative;">
                    ${isCustom ? `<ion-icon name="create-outline" class="edit-course-btn" onclick="event.stopPropagation(); openEditCourseModal('${data.area.id}')"></ion-icon>` : ''}
                    ${data.passed > 0 ? `<div style="position: absolute; top: 10px; right: ${isCustom ? '40px' : '10px'}; background: rgba(255, 64, 129, 0.15); color: var(--primary); padding: 4px 8px; border-radius: 8px; font-size: 0.8rem; font-weight: bold; border: 1px solid rgba(255, 64, 129, 0.3);">🔥 Процесс</div>` : ''}
                    ${avatar}
                    <h2>${data.area.title}</h2>
                    ${(() => {
                        const minM = getGroupMinMastery(data.area.subsystems.flatMap(sId => KNOWLEDGE_BASE.subsystems[sId] ? KNOWLEDGE_BASE.subsystems[sId].skills.flatMap(skId => KNOWLEDGE_BASE.skills[skId] ? KNOWLEDGE_BASE.skills[skId].lessons : []) : []));
                        return minM > 0 ? `<div style="color: var(--secondary); font-weight: 800; font-size: 0.9rem; margin-bottom: 0.5rem;">(Пройдено ${minM}/4)</div>` : '';
                    })()}
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">${data.area.subsystems.length} разделов</p>
                    
                    ${data.passed > 0 ? `
                        <div style="margin-top: 1rem;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">
                                <span>Пройдено: ${data.passed} / ${data.total}</span>
                                <span style="color: var(--primary);">${data.percent}%</span>
                            </div>
                            <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                                <div style="width: ${data.percent}%; height: 100%;" class="progress-bar-fill"></div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;}).join('')}
        </div>
    `;
}

function renderSubsystems(areaId) {
    const area = KNOWLEDGE_BASE.areas.find(a => a.id === areaId);
    const main = document.getElementById('main-content');
    const isCustom = userProgress.customAreas[areaId] !== undefined;

    main.innerHTML = `
        <header style="margin-bottom: 3rem;" class="fade-in">
            <a href="#" onclick="renderAreas()" style="color: var(--text-secondary); text-decoration: none; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <ion-icon name="arrow-back-outline"></ion-icon> Назад к областям
            </a>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h1>${area.title}</h1>
                <div style="display:flex; gap: 10px;">
                    ${isCustom && areaId !== 'area_custom' ? `
                        <button class="btn" onclick="openCreateChapterModal('${areaId}')" style="padding: 0.5rem 1rem; font-size: 0.8rem; text-transform:none; background: rgba(0,229,255,0.1); color: var(--secondary); border: 1px solid var(--secondary);">➕ Добавить главу</button>
                        <button class="btn" onclick="deleteCustomArea('${areaId}')" style="padding: 0.5rem 1rem; font-size: 0.8rem; text-transform:none; background: rgba(255,64,129,0.1); color: var(--primary); border: 1px solid var(--primary);">🗑 Удалить курс</button>
                    ` : ''}
                </div>
            </div>
            ${renderAnkiControls(areaId)}
            
            <div id="anki-folders-section" style="margin-bottom: 3rem;">
                <h2 style="color: var(--secondary); font-size: 1.5rem; margin-bottom: 1.5rem; display:flex; align-items:center; gap:10px;">
                    <ion-icon name="folder-open-outline"></ion-icon> Папки Анки
                </h2>
                <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));">
                    ${renderAnkiFoldersGrid(areaId)}
                </div>
            </div>

            <h2 style="color: var(--text-main); font-size: 1.5rem; margin-bottom: 1.5rem; display:flex; align-items:center; gap:10px;">
                <ion-icon name="layers-outline"></ion-icon> Основные главы
            </h2>
            <div class="grid fade-in" style="grid-template-columns: 1fr;">
                ${area.subsystems.map(subId => {
        const sub = KNOWLEDGE_BASE.subsystems[subId];
        if (!sub) return '';
        return `
                    <div class="subsystem-card" onclick="renderSkills('${sub.id}')">
                        <div>
                            <h3 style="font-size: 1.25rem;">
                                ${sub.title} 
                                ${(() => {
                                    const minM = getGroupMinMastery(sub.skills.flatMap(skId => KNOWLEDGE_BASE.skills[skId] ? KNOWLEDGE_BASE.skills[skId].lessons : []));
                                    return minM > 0 ? `<span style="color: var(--secondary); font-size: 0.9rem; margin-left: 8px;">(Пройдено ${minM}/4)</span>` : '';
                                })()}
                            </h3>
                            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">${sub.skills.length} навыков</p>
                        </div>
                        <ion-icon name="chevron-forward-outline" style="font-size: 1.5rem; color: var(--text-secondary);"></ion-icon>
                    </div>
                `;
    }).join('') || '<p style="color: var(--text-secondary);">Разделы скоро появятся.</p>'}
        </div>
    `;
}

function renderSkills(subsystemId) {
    const sub = KNOWLEDGE_BASE.subsystems[subsystemId];
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <header style="margin-bottom: 3rem;" class="fade-in">
            <a href="#" onclick="renderSubsystems('${sub.areaId}')" style="color: var(--text-secondary); text-decoration: none; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <ion-icon name="arrow-back-outline"></ion-icon> К списку глав курса
            </a>
            <h1>${sub.title}</h1>
            <p style="color: var(--text-secondary);">Выберите группу уроков.</p>
        </header>
        <div class="grid fade-in">
            ${sub.skills.map(skillId => {
        const skill = KNOWLEDGE_BASE.skills[skillId];
        const progress = userProgress.skills[skillId] || { level: 1 };
        return `
                    <div class="micro-lesson-card" onclick="renderLessonsList('${skillId}')">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                            <span class="badge-srs" style="background: var(--lvl-${progress.level}); color: white;">Уровень ${progress.level}</span>
                            <ion-icon name="ribbon-outline" style="color: var(--lvl-${progress.level}); font-size: 1.2rem;"></ion-icon>
                        </div>
                        <h3>${skill.title}</h3>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem; font-size: 0.9rem;">${skill.lessons.length} уроков</p>
                    </div>
                `;
    }).join('') || '<p style="color: var(--text-secondary);">Навыки скоро появятся.</p>'}
        </div>
    `;
}

function renderLessonsList(skillId) {
    const skill = KNOWLEDGE_BASE.skills[skillId];
    if (!skill) return;
    const sub = KNOWLEDGE_BASE.subsystems[skill.subsystemId];
    const main = document.getElementById('main-content');
    const isCustomSkill = userProgress.customSkills[skillId] !== undefined || skillId === 'skill_custom';

    main.innerHTML = `
        <header style="margin-bottom: 3rem;" class="fade-in">
            <a href="#" onclick="renderSkills('${skill.subsystemId}')" style="color: var(--text-secondary); text-decoration: none; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <ion-icon name="arrow-back-outline"></ion-icon> Назад к группам уроков
            </a>
            <h1>${skill.title}</h1>
            <p style="color: var(--text-secondary);">Выберите урок для изучения.</p>
        </header>
        <div class="grid fade-in">
            ${isCustomSkill ? `
                <div class="micro-lesson-card" onclick="openCustomLessonModal('${skillId}')" style="border: 2px dashed rgba(255, 64, 129, 0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; background: rgba(255, 64, 129, 0.05); cursor: pointer; transition: 0.3s; padding: 2rem; text-align: center;">
                    <ion-icon name="add-circle-outline" style="font-size: 3.5rem; color: var(--primary); margin-bottom: 1rem;"></ion-icon>
                    <h3 style="color: var(--primary); font-family: 'Outfit'; font-size: 1.4rem;">Добавить свой материал</h3>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">Создайте персональную карточку в эту главу</p>
                </div>
            ` : ''}
            ${skill.lessons.map(lessonId => {
                const lesson = KNOWLEDGE_BASE.lessons[lessonId];
                if (!lesson) return '';

                const progress = userProgress.lessons[lessonId] || { masteryLevel: 0 };
                const mastery = progress.masteryLevel;
                const isUserLesson = userProgress.customLessons[lessonId] !== undefined;

                return `
                    <div class="micro-lesson-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <span class="badge-srs" style="background: var(--lvl-${mastery || 1});">Ур. ${mastery}/4</span>
                            <div style="display:flex; align-items:center; gap: 8px;">
                                ${isUserLesson ? `
                                    <button onclick="deleteCustomLesson('${lessonId}', '${skillId}')" class="btn" style="padding: 4px; font-size: 1.2rem; background: transparent; color: var(--text-secondary); display:flex; align-items:center;" title="Удалить">
                                        <ion-icon name="trash-outline"></ion-icon>
                                    </button>
                                ` : ''}
                                ${mastery >= 4 ? `
                                    <ion-icon name="checkmark-done-circle" style="color: var(--lvl-4); font-size: 1.5rem;"></ion-icon>
                                ` : ''}
                            </div>
                        </div>
                        <div onclick="startLesson('${lessonId}')" style="margin-top: 10px;">
                            <h3>${lesson.title}</h3>
                            <div class="progress-bar-container">
                                <div class="progress-bar-fill" style="width: ${mastery * 25}%; background: var(--lvl-${mastery || 1});"></div>
                            </div>
                        </div>
                    </div>
                `;
    }).join('') || '<p style="color: var(--text-secondary);">Уроки в разработке.</p>'}
        </div>
    `;
}

function renderProfile() {
    updateNavActive('nav-profile');
    const main = document.getElementById('main-content');

    // Stats
    const totalLessons = Object.keys(KNOWLEDGE_BASE.lessons).length;
    const passedLessonsEntries = Object.entries(userProgress.lessons).filter(([_, data]) => data.masteryLevel >= 1);
    const completedCount = passedLessonsEntries.length;
    const percent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

    // Build "Hot Bars" rendering for passed lessons
    let completedLessonsHtml = '';

    if (completedCount === 0) {
        completedLessonsHtml = `<p style="color: var(--text-secondary);">Вы пока не прошли ни одного урока. Самое время начать!</p>`;
    } else {
        completedLessonsHtml = `<div class="grid" style="grid-template-columns: 1fr; gap: 1rem;">`;
        passedLessonsEntries.sort((a, b) => b[1].lastPassed - a[1].lastPassed).forEach(([lId, data]) => {
            const lessonObj = KNOWLEDGE_BASE.lessons[lId];
            if (!lessonObj) return;
            const lvl = data.masteryLevel;

            completedLessonsHtml += `
                <div style="background: var(--bg-card); padding: 1rem; border-radius: var(--radius); border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h4 style="font-size: 0.95rem; margin-right: 1rem;">${lessonObj.title}</h4>
                        <span style="font-size: 0.8rem; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 10px; color: var(--text-secondary); white-space: nowrap;">
                            ${lvl === 4 ? 'Освоено' : 'В повторе'}
                        </span>
                    </div>
                    <!-- Hot bar 4 segments -->
                    <div style="display: flex; gap: 4px; height: 6px; width: 100%; margin-top: 4px;">
                        <div style="flex: 1; border-radius: 3px; background: ${lvl >= 1 ? 'var(--lvl-1)' : '#333'};"></div>
                        <div style="flex: 1; border-radius: 3px; background: ${lvl >= 2 ? 'var(--lvl-2)' : '#333'};"></div>
                        <div style="flex: 1; border-radius: 3px; background: ${lvl >= 3 ? 'var(--lvl-3)' : '#333'};"></div>
                        <div style="flex: 1; border-radius: 3px; background: ${lvl >= 4 ? 'var(--lvl-4)' : '#333'};"></div>
                    </div>
                </div>
            `;
        });
        completedLessonsHtml += `</div>`;
    }

    main.innerHTML = `
        <header style="margin-bottom: 2rem;" class="fade-in">
            <h1>Профиль: <span style="color:var(--primary)">${currentUser}</span></h1>
            <button class="btn" style="padding: 0.4rem 1rem; margin-top: 1rem; font-size: 0.8rem;" onclick="logout()">Сменить пользователя</button>
        </header>

        <section class="fade-in" style="background: var(--bg-card); border-radius: var(--radius); padding: 2rem; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 3rem;">
            <h2 style="color: var(--primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <ion-icon name="podium"></ion-icon> Курс «Финансы (26 Глав)»
            </h2>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Полная образовательная программа.</p>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-weight: 600;">Прогресс: ${completedCount} из ${totalLessons} уроков</span>
                <span style="color: var(--primary); font-weight: bold;">${percent}%</span>
            </div>
            <div style="width: 100%; height: 8px; background: #222; border-radius: 4px; overflow: hidden; margin-bottom: 2rem;">
                <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, var(--lvl-1), var(--lvl-4)); border-radius: 4px;"></div>
            </div>

            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));">
                <div class="profile-stat-card">
                    <h3 style="color: var(--lvl-4); font-size: 2rem;">${userProgress.stats.masteredSkills || 0}</h3>
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">Навыков освоено</p>
                </div>
            </div>
        </section>
        
        <h3 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <ion-icon name="flame" style="color: var(--lvl-2);"></ion-icon> Дневник повторений
        </h3>
        <p style="color: var(--text-secondary); margin-bottom: 1rem; font-size: 0.9rem;">
            Каждый пройденный урок нужно повторить еще 3 раза до полного зеленого "Освоения".
        </p>
        <div class="fade-in">
            ${completedLessonsHtml}
        </div>
    `;
}

function logout() {
    currentUser = null;
    localStorage.removeItem('d_edu_user');
    window.location.reload();
}

// --- SEARCH ENGINE ---

function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    if (query.length < 2) {
        if (query.length === 0 && currentView === 'search') renderDashboard();
        return;
    }
    renderSearchResults(query);
}

function renderSearchResults(query) {
    currentView = 'search';
    updateNavActive(null);
    const main = document.getElementById('main-content');
    const results = Object.values(KNOWLEDGE_BASE.lessons).filter(l =>
        l.title.toLowerCase().includes(query) ||
        l.content.essence.toLowerCase().includes(query)
    ).slice(0, 20); // Limit to 20 results for performance

    main.innerHTML = `
    <header style="margin-bottom: 3rem;" class="fade-in">
        <h1>Результаты поиска</h1>
        <p style="color: var(--text-secondary);">Найдено ${results.length} уроков по запросу "${query}"</p>
    </header>
    <div class="grid fade-in">
        ${results.map(lesson => {
        const progress = userProgress.lessons[lesson.id] || { masteryLevel: 0 };
        return `
                <div class="micro-lesson-card" onclick="startLesson('${lesson.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <span class="badge-srs" style="background: var(--lvl-${progress.masteryLevel || 1});">
                            Ур. ${progress.masteryLevel}/4
                        </span>
                    </div>
                    <h3>${lesson.title}</h3>
                </div>
            `;
    }).join('') || '<p style="color: var(--text-secondary);">Ничего не найдено.</p>'}
    </div>
  `;
}


function renderTodayLessons() {
    const lessons = Object.values(KNOWLEDGE_BASE.lessons);
    // Simple logic for MVP: show all lessons if not studied, or those due for review
    const today = lessons.filter(l => !userProgress.lessons[l.id] || isDue(l.id));

    if (today.length === 0) return `<p style="color: var(--text-secondary);">Все задачи на сегодня выполнены! 🔥</p>`;

    return today.map(l => `
    <div class="micro-lesson-card" onclick="startLesson('${l.id}')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
            <span class="badge-srs ${userProgress.lessons[l.id] ? 'badge-repeat' : 'badge-new'}">
                ${userProgress.lessons[l.id] ? 'Повтор' : 'Новое'}
            </span>
            <ion-icon name="chevron-forward-outline"></ion-icon>
        </div>
        <h4 style="font-size: 1.1rem;">${l.title}</h4>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
            Навык: ${KNOWLEDGE_BASE.skills[l.skillId].title}
        </p>
    </div>
  `).join('');
}

function renderSkillCards() {
    return Object.values(KNOWLEDGE_BASE.skills).map(skill => {
        const progress = userProgress.skills[skill.id] || { level: 1, xp: 0 };
        const levelPercent = (progress.level / 4) * 100;
        return `
      <div class="skill-card" style="flex-direction: column; align-items: flex-start;">
        <div style="display: flex; align-items: center; gap: 1rem; width: 100%;">
            <div class="skill-level-indicator" style="background: var(--lvl-${progress.level});"></div>
            <div class="skill-info">
                <h4>${skill.title}</h4>
                <p>Уровень ${progress.level} · ${skill.lessons.length} уроков</p>
            </div>
            <div style="font-size: 1.2rem; color: var(--lvl-${progress.level});">
                <ion-icon name="ribbon-outline"></ion-icon>
            </div>
        </div>
        <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; margin-top: 10px; overflow: hidden;">
            <div style="width: ${levelPercent}%; height: 100%; background: var(--lvl-${progress.level}); transition: width 0.5s;"></div>
        </div>
      </div>
    `;
    }).join('');
}

function isDue(lessonId) {
    const data = userProgress.lessons[lessonId];
    if (!data) return false;
    return new Date(data.nextReview) <= new Date();
}

function startLesson(lessonId) {
    const lesson = KNOWLEDGE_BASE.lessons[lessonId];
    if (lessonId.startsWith('custom_')) {
        currentLessonState = {
            lessonId: lessonId,
            step: 0,
            cards: [
                { type: 'context', title: 'Мои заметки', text: lesson.content.notes },
                { type: 'check', title: 'Проверка', check: { question: "Вы освежили в памяти этот материал?" } }
            ]
        };
    } else {
        currentLessonState = {
            lessonId: lessonId,
            step: 0,
            cards: [
                { type: 'context', title: 'Контекст', text: lesson.content.context },
                { type: 'essence', title: 'Суть', text: lesson.content.essence },
                { type: 'example', title: 'Пример', text: lesson.content.example },
                { type: 'action', title: 'Применение', text: lesson.content.action },
                { type: 'check', title: 'Проверка', check: lesson.check }
            ]
        };
    }
    renderLessonStep();
}

function renderLessonStep() {
    const main = document.getElementById('main-content');
    const card = currentLessonState.cards[currentLessonState.step];

    if (card.type === 'check') {
        renderCheckScreen(card.check);
        return;
    }

    main.innerHTML = `
    <div class="lesson-screen fade-in">
        <div class="card-stack">
            <div class="content-card">
                <h3>${card.title}</h3>
                <p>${card.text}</p>
            </div>
        </div>
        <div style="margin-top: 3rem; text-align: center;">
            <button class="btn btn-primary" onclick="nextStep()" style="width: 100%; max-width: 300px;">
                Дальше <ion-icon name="arrow-forward-outline"></ion-icon>
            </button>
            <div style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.8rem;">
                Шаг ${currentLessonState.step + 1} из ${currentLessonState.cards.length}
            </div>
        </div>
    </div>
  `;
}

function nextStep() {
    currentLessonState.step++;
    renderLessonStep();
}

function renderCheckScreen(check) {
    const main = document.getElementById('main-content');
    const isCustom = currentLessonState.lessonId.startsWith('custom_');

    main.innerHTML = `
      <div class="lesson-screen fade-in">
          <header style="text-align: center; margin-bottom: 2rem;">
              <h3 style="color: var(--primary); letter-spacing: 2px;">ПРОВЕРКА</h3>
              <h2 style="margin-top: 1rem;">${check.question}</h2>
              ${check.scenario ? `<p style="margin-top: 1rem; color: var(--text-secondary); font-style: italic;">"${check.scenario}"</p>` : ''}
          </header>
          
          ${isCustom ? `
            <div style="background: rgba(255, 64, 129, 0.05); padding: 1.5rem; border-radius: var(--radius); border: 1px dashed var(--primary); text-align: center; margin-bottom: 2rem;">
                <p style="color: var(--text-main);">Поскольку это ваш личный урок, просто подтвердите, что вы повторили информацию и готовы двигаться дальше в системе интервальных повторений.</p>
            </div>
          ` : `
            <textarea class="check-input" id="check-response" placeholder="Твой ответ здесь..."></textarea>
          `}
          
          <div style="margin-top: 2rem;">
              <button class="btn btn-primary" onclick="finishLesson()" style="width: 100%;">
                  ${isCustom ? 'Завершить повторение' : 'Завершить и апнуть навык'} <ion-icon name="flash-outline"></ion-icon>
              </button>
              ${!isCustom ? `
                <button class="btn" onclick="alert('${check.hint}')" style="margin-top: 1rem; color: var(--text-secondary); width: 100%;">
                    Мне нужна подсказка
                </button>
              ` : ''}
          </div>
      </div>
    `;
}

function getGroupMinMastery(lessonIds) {
    if (!lessonIds || lessonIds.length === 0) return 0;
    const masteries = lessonIds.map(id => {
        const progress = userProgress.lessons[id];
        return progress ? progress.masteryLevel : 0;
    });
    return Math.min(...masteries);
}

async function finishLesson() {
    const { lessonId } = currentLessonState;
    const lesson = KNOWLEDGE_BASE.lessons[lessonId];
    const skill = KNOWLEDGE_BASE.skills[lesson.skillId];

    // Update progress
    if (!userProgress.lessons[lessonId]) {
        userProgress.lessons[lessonId] = {
            masteryLevel: 0,
            lastPassed: 0,
            nextReview: 0
        };
    }

    const lessonProgress = userProgress.lessons[lessonId];
    lessonProgress.masteryLevel = Math.min(lessonProgress.masteryLevel + 1, 4);
    lessonProgress.lastPassed = Date.now();

    // Calculate next interval based on user request: 3, 7, 30 days
    const intervals = [0, 3, 7, 30, 0]; // Index 1: Level 1 -> 2 (3 days)
    const currentIntervalDays = intervals[lessonProgress.masteryLevel] || 0;

    if (currentIntervalDays > 0) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + currentIntervalDays);
        lessonProgress.nextReview = nextDate.getTime();

        // [AUTO-SCHEDULE REMOVED BY USER REQUEST]
        // Only manual scheduling is allowed now.
    } else {
        lessonProgress.nextReview = 0; // Won't lock if level 4+ (mastered or last review)
    }

    // Update skill mastery based on average of lessons
    const lessonsInSkill = skill.lessons.map(id => userProgress.lessons[id] || { masteryLevel: 0 });
    const minLevel = Math.min(...lessonsInSkill.map(l => l.masteryLevel));

    if (!userProgress.skills[skill.id]) {
        userProgress.skills[skill.id] = { level: 1, xp: 0 };
    }
    userProgress.skills[skill.id].level = minLevel;
    if (minLevel >= 4) userProgress.stats.masteredSkills++;

    // NOW SAVE CLOUD
    await saveProgressToCloud();
    renderDashboard(); // Render earlier so UI looks instantly loaded

    const nextMsg = lessonProgress.nextReview > 0
        ? `Прогресс сохранен. Не забудьте вручную добавить урок в план для повторения.`
        : "Урок полностью освоен! 🔥";

    setTimeout(() => {
        alert(`Урок завершен! Успех: ${lessonProgress.masteryLevel} из 4.\n\n${nextMsg}`);
    }, 100);
}
// --- ANKI SYSTEM LOGIC ---

function renderAnkiControls(areaId) {
    const cards = Object.values(userProgress.ankiCards).filter(c => c.areaId === areaId);
    const dueCount = cards.filter(c => !c.nextReview || c.nextReview <= Date.now()).length;

    return `
        <div class="anki-toolbar fade-in">
            <div class="anki-tool-btn at-add" onclick="openAnkiCardModal('${areaId}')">
                <ion-icon name="add-circle-outline"></ion-icon> Добавить карточку
            </div>
            <div class="anki-tool-btn at-folder" onclick="openAnkiFoldersModal('${areaId}')">
                <ion-icon name="folder-outline"></ion-icon> Папки
            </div>
            <div class="anki-tool-btn at-train" onclick="startAnkiTraining('${areaId}')">
                <ion-icon name="flash-outline"></ion-icon> Тренировать (${dueCount})
            </div>
            <div style="margin-left:auto; display:flex; align-items:center; gap:10px; font-size:0.8rem; color:var(--text-secondary);">
                <span>Всего: ${cards.length}</span>
            </div>
        </div>
    `;
}

function openAnkiCardModal(areaId) {
    const modal = document.getElementById('anki-card-modal');
    modal.classList.remove('hidden');
    document.getElementById('anki-target-area').value = areaId;
    document.getElementById('anki-front-input').value = '';
    document.getElementById('anki-back-input').value = '';
    document.getElementById('anki-image-input').value = '';
    
    // Fill folders select
    const select = document.getElementById('anki-folder-select');
    select.innerHTML = '<option value="">Без папки</option>';
    Object.values(userProgress.ankiFolders)
        .filter(f => f.areaId === areaId)
        .forEach(f => {
            select.innerHTML += `<option value="${f.id}">${f.name}</option>`;
        });
    
    document.getElementById('anki-front-input').focus();
}

function closeAnkiCardModal() {
    document.getElementById('anki-card-modal').classList.add('hidden');
}

async function saveAnkiCard() {
    const areaId = document.getElementById('anki-target-area').value;
    const front = document.getElementById('anki-front-input').value.trim();
    const back = document.getElementById('anki-back-input').value.trim();
    const image = document.getElementById('anki-image-input').value.trim();
    const folderId = document.getElementById('anki-folder-select').value;

    if (!front || !back) return alert('Заполните обе стороны карточки');

    const id = 'anki_' + Date.now();
    userProgress.ankiCards[id] = {
        id, areaId, folderId, front, back, image,
        interval: 0,
        nextReview: 0,
        quality: 0
    };

    await saveProgressToCloud();
    closeAnkiCardModal();
    renderSubsystems(areaId);
}

function openAnkiFoldersModal(areaId) {
    const modal = document.getElementById('anki-folders-modal');
    modal.classList.remove('hidden');
    document.getElementById('anki-target-area').value = areaId; // reuse target area input or global
    renderAnkiFoldersList(areaId);
}

function closeAnkiFoldersModal() {
    document.getElementById('anki-folders-modal').classList.add('hidden');
}

function renderAnkiFoldersList(areaId) {
    const list = document.getElementById('anki-folders-list');
    const folders = Object.values(userProgress.ankiFolders).filter(f => f.areaId === areaId);
    
    if (folders.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding: 1rem;">Папок пока нет</p>';
        return;
    }

    list.innerHTML = folders.map(f => `
        <div class="anki-folder-item">
            <span><ion-icon name="folder-outline"></ion-icon> ${f.name}</span>
            <ion-icon name="trash-outline" style="cursor:pointer; color:var(--primary);" onclick="deleteAnkiFolder('${f.id}', '${areaId}')"></ion-icon>
        </div>
    `).join('');
}

async function createAnkiFolder() {
    const titleInput = document.getElementById('anki-new-folder-title');
    const areaId = document.getElementById('anki-target-area').value; // from modal context
    const name = titleInput.value.trim();

    if (!name) return;

    const id = 'folder_' + Date.now();
    userProgress.ankiFolders[id] = { id, areaId, name };
    
    titleInput.value = '';
    await saveProgressToCloud();
    renderAnkiFoldersList(areaId);
}

async function deleteAnkiFolder(id, areaId) {
    if (!confirm('Удалить папку? Карточки в ней останутся, но будут без папки.')) return;
    
    // Detach cards
    Object.values(userProgress.ankiCards).forEach(c => {
        if (c.folderId === id) c.folderId = '';
    });
    
    delete userProgress.ankiFolders[id];
    await saveProgressToCloud();
    
    // Refresh both list and the main view
    renderAnkiFoldersList(areaId);
    renderSubsystems(areaId);
}

function renderAnkiFoldersGrid(areaId) {
    const folders = Object.values(userProgress.ankiFolders).filter(f => f.areaId === areaId);
    const unfiledCards = Object.values(userProgress.ankiCards).filter(c => c.areaId === areaId && !c.folderId);
    
    let html = '';
    
    // "General" Folder for cards without folder
    if (unfiledCards.length > 0) {
        html += `
            <div class="anki-folder-card" onclick="renderAnkiFolderContents('', '${areaId}')">
                <div>
                    <h3 style="font-size: 1.1rem; color: var(--secondary);">Общие карточки</h3>
                    <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 4px;">${unfiledCards.length} карточек</p>
                </div>
                <ion-icon name="folder-outline" style="font-size: 1.8rem; color: var(--secondary);"></ion-icon>
            </div>
        `;
    }

    folders.forEach(f => {
        const folderCards = Object.values(userProgress.ankiCards).filter(c => c.folderId === f.id);
        html += `
            <div class="anki-folder-card" onclick="renderAnkiFolderContents('${f.id}', '${areaId}')">
                <div>
                    <h3 style="font-size: 1.1rem;">${f.name}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 4px;">${folderCards.length} карточек</p>
                </div>
                <ion-icon name="folder-outline" style="font-size: 1.8rem; color: var(--text-secondary);"></ion-icon>
            </div>
        `;
    });

    return html || '<p style="color: var(--text-secondary); font-size: 0.9rem;">Папок еще нет. Создайте первую!</p>';
}

function getAnkiCardLevel(card) {
    const interval = card.interval || 0;
    if (interval <= 0) return { lvl: 1, color: 'var(--lvl-1)', label: 'Новая' };
    if (interval < 1) return { lvl: 1, color: 'var(--lvl-1)', label: 'Учу' };
    if (interval < 4) return { lvl: 2, color: 'var(--lvl-2)', label: 'Знакома' };
    if (interval < 10) return { lvl: 3, color: 'var(--lvl-3)', label: 'Твердо' };
    return { lvl: 4, color: 'var(--lvl-4)', label: 'Освоена' };
}

function renderAnkiFolderContents(folderId, areaId) {
    const main = document.getElementById('main-content');
    const folder = folderId ? userProgress.ankiFolders[folderId] : { name: 'Общие карточки' };
    const cards = Object.values(userProgress.ankiCards).filter(c => c.areaId === areaId && c.folderId === folderId);

    main.innerHTML = `
        <header style="margin-bottom: 3rem;" class="fade-in">
            <a href="#" onclick="renderSubsystems('${areaId}')" style="color: var(--text-secondary); text-decoration: none; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <ion-icon name="arrow-back-outline"></ion-icon> Назад к курсу
            </a>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h1>Папка: ${folder.name}</h1>
                <button class="btn btn-primary" onclick="openAnkiCardModal('${areaId}')" style="padding: 0.5rem 1rem; font-size: 0.8rem; text-transform:none;">➕ Новая карточка</button>
            </div>
            <p style="color: var(--text-secondary);">Всего карточек в папке: ${cards.length}</p>
        </header>

        <div class="grid fade-in" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
            ${cards.map(c => {
                const level = getAnkiCardLevel(c);
                return `
                    <div class="anki-mini-card">
                        <div class="anki-card-actions">
                            <ion-icon name="trash-outline" class="anki-action-icon" style="color:var(--primary);" onclick="event.stopPropagation(); deleteAnkiCard('${c.id}', '${folderId}', '${areaId}')"></ion-icon>
                        </div>
                        <span class="anki-level-badge" style="background: ${level.color};">${level.label}</span>
                        <div style="font-weight: 500; font-size: 1.1rem; color: var(--text-main); margin-top: 5px;">${c.front}</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary); font-style: italic;">${c.back.substring(0, 50)}${c.back.length > 50 ? '...' : ''}</div>
                    </div>
                `;
            }).join('') || '<p style="color: var(--text-secondary);">В этой папке пока нет карточек.</p>'}
        </div>
    `;
}

async function deleteAnkiCard(cardId, folderId, areaId) {
    if (!confirm('Удалить эту карточку навсегда?')) return;
    
    delete userProgress.ankiCards[cardId];
    await saveProgressToCloud();
    renderAnkiFolderContents(folderId, areaId);
}

// --- ANKI TRAINING ---

function startAnkiTraining(areaId) {
    const cards = Object.values(userProgress.ankiCards)
        .filter(c => c.areaId === areaId && (!c.nextReview || c.nextReview <= Date.now()));
    
    if (cards.length === 0) return alert('На сегодня нет карточек для повторения! 🔥');

    ankiTrainState = {
        areaId: areaId,
        cards: cards.sort(() => Math.random() - 0.5),
        currentIndex: 0
    };

    renderAnkiTrainingScreen();
}

function renderAnkiTrainingScreen() {
    const main = document.getElementById('main-content');
    const card = ankiTrainState.cards[ankiTrainState.currentIndex];
    const folder = card.folderId ? userProgress.ankiFolders[card.folderId] : null;

    main.innerHTML = `
        <div class="lesson-screen fade-in">
            <header style="margin-bottom: 2rem; display:flex; justify-content:space-between; align-items:center;">
                <a href="#" onclick="renderSubsystems('${ankiTrainState.areaId}')" style="color: var(--text-secondary); text-decoration: none; display: flex; align-items: center; gap: 0.5rem;">
                    <ion-icon name="close-outline" style="font-size:1.5rem;"></ion-icon> Выйти из тренировки
                </a>
                <span style="color:var(--text-secondary); font-size:0.9rem;">Карточка ${ankiTrainState.currentIndex + 1} из ${ankiTrainState.cards.length}</span>
            </header>

            <div class="anki-card-container" id="anki-card-container" onclick="flipAnkiCard()">
                <div class="anki-card-inner">
                    <div class="anki-card-front">
                        ${folder ? `<span class="anki-folder-badge">${folder.name}</span>` : ''}
                        ${card.image ? `<img src="${card.image}" class="anki-card-image">` : ''}
                        <h2 style="font-size: 2rem;">${card.front}</h2>
                        <p style="margin-top: 2rem; color: var(--text-secondary); font-size: 0.8rem;">Нажмите, чтобы увидеть ответ</p>
                    </div>
                    <div class="anki-card-back">
                        <h3 style="color:var(--secondary); margin-bottom: 1.5rem;">Ответ:</h3>
                        <p style="font-size: 1.5rem;">${card.back}</p>
                    </div>
                </div>
            </div>

            <div id="anki-controls" class="hidden">
                <p style="text-align:center; color:var(--text-secondary); margin-bottom: 1rem;">Как хорошо вы это знали?</p>
                <div class="anki-feedback-group">
                    <button class="anki-fb-btn fb-poor" onclick="submitAnkiFeedback(1)">ПЛОХО</button>
                    <button class="anki-fb-btn fb-debatable" onclick="submitAnkiFeedback(3)">СПОРНО</button>
                    <button class="anki-fb-btn fb-know" onclick="submitAnkiFeedback(5)">ЗНАЮ</button>
                </div>
            </div>
        </div>
    `;
}

function flipAnkiCard() {
    const container = document.getElementById('anki-card-container');
    if (container.classList.contains('is-flipped')) return;
    
    container.classList.add('is-flipped');
    document.getElementById('anki-controls').classList.remove('hidden');
}

async function submitAnkiFeedback(quality) {
    const card = ankiTrainState.cards[ankiTrainState.currentIndex];
    
    // SRS Logic
    // quality: 1 = Poor, 3 = Debatable, 5 = Know
    if (quality === 5) {
        // Know: Increase interval
        if (card.interval === 0) card.interval = 1;
        else card.interval *= 2;
    } else if (quality === 3) {
        // Debatable: Keep same interval (min 1 day if new)
        if (card.interval === 0) card.interval = 1;
    } else {
        // Poor: Reset interval to 0.5 day (show tomorrow)
        card.interval = 0.5;
    }

    const nextDate = new Date();
    nextDate.setHours(nextDate.getHours() + (card.interval * 24));
    card.nextReview = nextDate.getTime();

    await saveProgressToCloud();

    ankiTrainState.currentIndex++;
    if (ankiTrainState.currentIndex < ankiTrainState.cards.length) {
        renderAnkiTrainingScreen();
    } else {
        alert('Тренировка завершена! Отличная работа. 🔥');
        renderSubsystems(ankiTrainState.areaId);
    }
}
