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
    customLessons: {}
};

let currentLessonState = {
    lessonId: null,
    step: 0,
    cards: []
};

// --- CLOUD SYNC ---
async function loadProgressFromCloud() {
    const main = document.getElementById('main-content');
    main.innerHTML = `<p style="text-align:center; margin-top: 5rem; color: var(--text-secondary);">Синхронизация с облаком...</p>`;

    try {
        const { data, error } = await supabaseClient.from('user_progress').select('data').eq('user_id', currentUser).single();
        if (data && data.data) {
            userProgress = data.data;
            if (!userProgress.schedule) userProgress.schedule = {};
            if (!userProgress.customLessons) userProgress.customLessons = {};
        } else {
            // Migrate offline to online if possible
            const local = JSON.parse(localStorage.getItem('d_edu_v2_progress'));
            if (local) {
                userProgress = local;
                if (!userProgress.schedule) userProgress.schedule = {};
                if (!userProgress.customLessons) userProgress.customLessons = {};
            }
            await saveProgressToCloud();
        }
    } catch (e) {
        console.warn("Could not fetch progress online, relying on local", e);
        const local = JSON.parse(localStorage.getItem('d_edu_v2_progress'));
        if (local) userProgress = local;
    }

    if (!userProgress.schedule) userProgress.schedule = {};
    if (!userProgress.customLessons) userProgress.customLessons = {};
    injectCustomCourse();
}

function injectCustomCourse() {
    const customAreaIndex = KNOWLEDGE_BASE.areas.findIndex(a => a.id === 'area_custom');
    if (customAreaIndex === -1) {
        KNOWLEDGE_BASE.areas.push({
            id: 'area_custom',
            title: 'Свои уроки',
            icon: 'create-outline',
            subsystems: ['sub_custom']
        });
    }

    if (!KNOWLEDGE_BASE.subsystems['sub_custom']) {
        KNOWLEDGE_BASE.subsystems['sub_custom'] = {
            id: 'sub_custom',
            areaId: 'area_custom',
            title: 'Личные материалы',
            skills: ['skill_custom']
        };
    }

    const customLessonIds = Object.keys(userProgress.customLessons);
    KNOWLEDGE_BASE.skills['skill_custom'] = {
        id: 'skill_custom',
        subsystemId: 'sub_custom',
        title: 'Мои карточки (Собственные знания)',
        lessons: customLessonIds
    };

    customLessonIds.forEach(id => {
        const customData = userProgress.customLessons[id];
        KNOWLEDGE_BASE.lessons[id] = {
            id: id,
            skillId: 'skill_custom',
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
        await supabaseClient.from('user_progress').upsert({
            user_id: currentUser,
            data: userProgress
        });
    } catch (e) {
        console.error("Cloud save failed", e);
    }
}

// --- CUSTOM USER LESSONS ---

function openCustomLessonModal() {
    const modal = document.getElementById('custom-lesson-modal');
    modal.classList.remove('hidden');
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

    if (!title) return alert('Введите название урока');
    if (!notes) return alert('Введите описание или заметки к уроку');

    const id = 'custom_' + Date.now();
    userProgress.customLessons[id] = {
        title: title,
        notes: notes,
        createdAt: Date.now()
    };

    // Re-inject and re-render
    injectCustomCourse();
    await saveProgressToCloud();
    closeCustomLessonModal();
    renderLessonsList('skill_custom');
    alert('Урок успешно создан!');
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
           <div class="day-tasks">
               ${renderScheduledTasks(dateStr)}
           </div>
           <button class="add-task-btn" onclick="openScheduleModal('${dateStr}', '${daysOfWeek[i]}, ${dateIter.getDate()} ${getMonthName(dateIter.getMonth())}')"><ion-icon name="add-outline"></ion-icon> План</button>
       </div>
     `;
    }
    calendarHtml += `</div>
     <!-- Modal Template -->
     <div id="schedule-modal" class="modal-overlay hidden">
         <div class="modal-content" style="max-height: 90vh; display: flex; flex-direction: column;">
             <header style="display: flex; justify-content: space-between; align-items:center; margin-bottom:1rem; flex-shrink: 0;">
                <h3 style="color:var(--primary); font-size: 1.2rem;"><ion-icon name="calendar-outline"></ion-icon> План: <span id="modal-date-display" style="color: var(--text-main);">...</span></h3>
                <ion-icon name="close" onclick="closeScheduleModal()" style="font-size:1.5rem; cursor:pointer;"></ion-icon>
             </header>
             <p style="color:var(--text-secondary); margin-bottom: 1rem; font-size:0.9rem; flex-shrink: 0;">Выберите уроки для добавления в ваш учебный день:</p>
             
             <!-- TABS -->
             <div style="display: flex; gap: 10px; margin-bottom: 1rem; flex-shrink: 0;">
                <button class="btn btn-primary" id="btn-tab-browse" onclick="switchModalTab('browse')" style="flex:1; padding: 0.5rem; font-size: 0.9rem; border-radius: 8px;">📚 Из Каталога Глав</button>
                <button class="btn" id="btn-tab-search" onclick="switchModalTab('search')" style="flex:1; padding: 0.5rem; font-size: 0.9rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color: var(--text-main); border-radius: 8px;">🔍 Поиск текстом</button>
             </div>

             <!-- CONTENT AREAS -->
             <div id="modal-tab-browse" style="overflow-y:auto; flex-grow: 1; border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: var(--radius);">
                 <!-- Hierarchy injected here via JS -->
             </div>

             <div id="modal-tab-search" class="hidden" style="flex-grow: 1; display:flex; flex-direction:column;">
                 <input type="text" id="modal-search" class="check-input" style="margin-top:0; flex-shrink: 0; padding: 0.75rem;" placeholder="Поиск (например: крипта, кредит, риск...)" onkeyup="handleModalSearch(this.value)">
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

function renderScheduledTasks(dateStr) {
    const list = userProgress.schedule[dateStr] || [];
    if (list.length === 0) return '';
    return list.map(id => {
        const lesson = KNOWLEDGE_BASE.lessons[id];
        if (!lesson) return '';

        const p = userProgress.lessons[id];
        let isPassedOnThisDate = false;
        if (p && p.lastPassed) {
            const passedDateStr = new Date(p.lastPassed).toISOString().split('T')[0];
            if (passedDateStr >= dateStr) isPassedOnThisDate = true;
        }

        return `
         <div class="task-pill ${isPassedOnThisDate ? 'task-done' : 'task-pending'}" onclick="startLesson('${id}')">
             <span class="task-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${lesson.title}</span>
             <span class="task-icon">${isPassedOnThisDate ? '✅' : '⏳'}</span>
         </div>
       `;
    }).join('');
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
                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width: 80%;">${lesson.title}</span>
                        <button class="btn" title="Добавить на этот день" onclick="addLessonToSchedule('${lId}')" style="padding: 4px 10px; background: transparent; color: var(--primary); border: 1px dashed var(--primary); display:flex; align-items:center; gap:4px; font-size:0.8rem; border-radius: 4px;">
                            <ion-icon name="add"></ion-icon> План
                        </button>
                    </div>
                    `;
                });
            });

            html += `</div></div>`;
        });
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

    const results = Object.values(KNOWLEDGE_BASE.lessons).filter(l =>
        l.title.toLowerCase().includes(query) ||
        Math.random() > 0.99 // Fallback
    ).slice(0, 10);

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p style="color:var(--text-secondary);">Ничего не найдено</p>';
        return;
    }

    resultsContainer.innerHTML = results.map(l => `
        <div class="search-result-item" onclick="addLessonToSchedule('${l.id}')">
            <span>${l.title}</span>
            <ion-icon name="add-circle" style="color:var(--primary); font-size:1.2rem;"></ion-icon>
        </div>
    `).join('');
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
    if (!userProgress.schedule[dateStr]) userProgress.schedule[dateStr] = [];

    if (!userProgress.schedule[dateStr].includes(lessonId)) {
        userProgress.schedule[dateStr].push(lessonId);
        await saveProgressToCloud();
        renderDashboard();
    }
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
            <h1>Каталог знаний</h1>
            <p style="color: var(--text-secondary);">Выберите область для изучения.</p>
        </header>
        <div class="grid fade-in">
            ${areasWithProgress.map(data => `
                <div class="area-card" onclick="renderSubsystems('${data.area.id}')" style="position: relative;">
                    ${data.passed > 0 ? `<div style="position: absolute; top: 10px; right: 10px; background: rgba(255, 64, 129, 0.15); color: var(--primary); padding: 4px 8px; border-radius: 8px; font-size: 0.8rem; font-weight: bold; border: 1px solid rgba(255, 64, 129, 0.3);">🔥 В процессе</div>` : ''}
                    <ion-icon name="${data.area.icon}" style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem;"></ion-icon>
                    <h2>${data.area.title}</h2>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">${data.area.subsystems.length} разделов</p>
                    
                    ${data.passed > 0 ? `
                        <div style="margin-top: 1rem;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">
                                <span>Пройдено: ${data.passed} / ${data.total}</span>
                                <span style="color: var(--primary);">${data.percent}%</span>
                            </div>
                            <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                                <div style="width: ${data.percent}%; height: 100%; background: var(--primary);"></div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function renderSubsystems(areaId) {
    const area = KNOWLEDGE_BASE.areas.find(a => a.id === areaId);
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <header style="margin-bottom: 3rem;" class="fade-in">
            <a href="#" onclick="renderAreas()" style="color: var(--text-secondary); text-decoration: none; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <ion-icon name="arrow-back-outline"></ion-icon> Назад к областям
            </a>
            <h1>${area.title}</h1>
            <p style="color: var(--text-secondary);">Выберите блок обучения.</p>
        </header>
        <div class="grid fade-in" style="grid-template-columns: 1fr;">
            ${area.subsystems.map(subId => {
        const sub = KNOWLEDGE_BASE.subsystems[subId];
        if (!sub) return '';
        return `
                    <div class="subsystem-card" onclick="renderSkills('${sub.id}')">
                        <div>
                            <h3 style="font-size: 1.25rem;">${sub.title}</h3>
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
    const sub = KNOWLEDGE_BASE.subsystems[skill.subsystemId];
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <header style="margin-bottom: 3rem;" class="fade-in">
            <a href="#" onclick="renderSkills('${skill.subsystemId}')" style="color: var(--text-secondary); text-decoration: none; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <ion-icon name="arrow-back-outline"></ion-icon> Назад к группам уроков
            </a>
            <h1>${skill.title}</h1>
            <p style="color: var(--text-secondary);">Выберите урок для изучения.</p>
        </header>
        <div class="grid fade-in">
            ${skillId === 'skill_custom' ? `
                <div class="micro-lesson-card" onclick="openCustomLessonModal()" style="border: 2px dashed rgba(255, 64, 129, 0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; background: rgba(255, 64, 129, 0.05); cursor: pointer; transition: 0.3s; padding: 2rem; text-align: center;">
                    <ion-icon name="add-circle-outline" style="font-size: 3.5rem; color: var(--primary); margin-bottom: 1rem;"></ion-icon>
                    <h3 style="color: var(--primary); font-family: 'Outfit'; font-size: 1.4rem;">Добавить свой материал</h3>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">Создайте персональную карточку для обучения</p>
                </div>
            ` : ''}
            ${skill.lessons.map(lessonId => {
        const lesson = KNOWLEDGE_BASE.lessons[lessonId];
        if (!lesson) return '';

        const progress = userProgress.lessons[lessonId] || { masteryLevel: 0, nextReview: 0 };
        const isLocked = progress.nextReview > Date.now();
        const mastery = progress.masteryLevel;

        let lockMsg = "";
        if (isLocked) {
            const hoursLeft = Math.ceil((progress.nextReview - Date.now()) / (1000 * 60 * 60));
            lockMsg = hoursLeft > 24 ? `${Math.ceil(hoursLeft / 24)}д` : `${hoursLeft}ч`;
        }

        return `
                    <div class="micro-lesson-card ${isLocked ? 'lesson-locked' : ''}">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <span class="badge-srs" style="background: var(--lvl-${mastery || 1});">Ур. ${mastery}/4</span>
                            <div style="display:flex; align-items:center; gap: 8px;">
                                ${mastery < 4 && !isLocked ? `
                                    <button onclick="openDayPickerModal('${lessonId}')" class="btn" style="padding: 2px 8px; font-size: 0.8rem; border: 1px solid var(--primary); color: var(--text-main); background: rgba(255, 64, 129, 0.2); display:flex; align-items:center; gap: 4px;" title="Запланировать">
                                        <ion-icon name="calendar-outline"></ion-icon> В План
                                    </button>
                                ` : ''}
                                ${isLocked ? `
                                    <div class="lock-overlay" style="position:static; padding: 4px 8px; transform:none;"><ion-icon name="lock-closed"></ion-icon> ${lockMsg}</div>
                                ` : mastery >= 4 ? `
                                    <ion-icon name="checkmark-done-circle" style="color: var(--lvl-4); font-size: 1.5rem;"></ion-icon>
                                ` : ''}
                            </div>
                        </div>
                        <div onclick="${isLocked ? '' : `startLesson('${lessonId}')`}" style="margin-top: 10px;">
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
        const progress = userProgress.lessons[lesson.id] || { masteryLevel: 0, nextReview: 0 };
        const isLocked = progress.nextReview > Date.now();
        return `
                <div class="micro-lesson-card ${isLocked ? 'lesson-locked' : ''}" 
                     onclick="${isLocked ? '' : `startLesson('${lesson.id}')`}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <span class="badge-srs" style="background: var(--lvl-${progress.masteryLevel || 1});">
                            Ур. ${progress.masteryLevel}/4
                        </span>
                        ${isLocked ? '<ion-icon name="lock-closed"></ion-icon>' : ''}
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

        // Auto-schedule it in the calendar for the future date
        const y = nextDate.getFullYear();
        const m = String(nextDate.getMonth() + 1).padStart(2, '0');
        const d = String(nextDate.getDate()).padStart(2, '0');
        const reviewDateStr = `${y}-${m}-${d}`;

        if (!userProgress.schedule[reviewDateStr]) userProgress.schedule[reviewDateStr] = [];
        if (!userProgress.schedule[reviewDateStr].includes(lessonId)) {
            userProgress.schedule[reviewDateStr].push(lessonId);
        }
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
        ? `Урок закинут в расписание через ${currentIntervalDays} дн. на повторение.`
        : "Урок полностью освоен! 🔥";

    setTimeout(() => {
        alert(`Урок завершен! Успех: ${lessonProgress.masteryLevel} из 4.\n\n${nextMsg}`);
    }, 100);
}
