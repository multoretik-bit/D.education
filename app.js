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
  stats: { totalXp: 0, coins: 0, masteredSkills: 0, streak: 0 }
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
        } else {
            // Migrate offline to online if possible
            const local = JSON.parse(localStorage.getItem('d_edu_v2_progress'));
            if (local) userProgress = local;
            await saveProgressToCloud(); 
        }
    } catch(e) {
        console.warn("Could not fetch progress online, relying on local", e);
        const local = JSON.parse(localStorage.getItem('d_edu_v2_progress'));
        if (local) userProgress = local;
    }
}

async function saveProgressToCloud() {
  localStorage.setItem('d_edu_v2_progress', JSON.stringify(userProgress));
  if (!currentUser) return;
  
  try {
      await supabaseClient.from('user_progress').upsert({ 
          user_id: currentUser, 
          data: userProgress
      });
  } catch(e) {
      console.error("Cloud save failed", e);
  }
}

function renderLoginAuth() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div style="text-align: center; margin-top: 5rem;" class="fade-in">
            <ion-icon name="cloud-done-outline" style="font-size: 5rem; color: var(--primary); margin-bottom: 2rem;"></ion-icon>
            <h2>Добро пожаловать в D-SYSTEM</h2>
            <p style="color: var(--text-secondary); margin: 1rem 0 2rem 0;">Мы включили сохранение в Облако Supabase. Введите ваш Никнейм, чтобы ваши 530+ уроков никогда не удалились.</p>
            <input type="text" id="username-input" class="check-input" placeholder="Введите ваш логин (Например: investor2026)" style="max-width: 300px; margin: 0 auto; display: block;">
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

function renderDashboard() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <header style="margin-bottom: 3rem;" class="fade-in">
        <h1>Твой путь к результату</h1>
        <p style="color: var(--text-secondary);">Фокус на навыках и реальных изменениях.</p>
    </header>
    
    <div class="dashboard-grid fade-in">
        <section class="today-section">
            <h3 style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary);">Сегодняшние задачи</h3>
            ${renderTodayLessons()}
        </section>
        
        <section class="skills-section">
            <h3 style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary);">Карта навыков</h3>
            ${renderSkillCards()}
        </section>
    </div>
  `;
}

function renderAreas() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <header style="margin-bottom: 3rem;" class="fade-in">
            <h1>Каталог знаний</h1>
            <p style="color: var(--text-secondary);">Выберите область для изучения.</p>
        </header>
        <div class="grid fade-in">
            ${KNOWLEDGE_BASE.areas.map(area => `
                <div class="area-card" onclick="renderSubsystems('${area.id}')">
                    <ion-icon name="${area.icon}" style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem;"></ion-icon>
                    <h2>${area.title}</h2>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">${area.subsystems.length} разделов</p>
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
            ${skill.lessons.map(lessonId => {
                const lesson = KNOWLEDGE_BASE.lessons[lessonId];
                if (!lesson) return '';
                
                const progress = userProgress.lessons[lessonId] || { masteryLevel: 0, nextReview: 0 };
                const isLocked = progress.nextReview > Date.now();
                const mastery = progress.masteryLevel;
                
                let lockMsg = "";
                if (isLocked) {
                  const hoursLeft = Math.ceil((progress.nextReview - Date.now()) / (1000 * 60 * 60));
                  lockMsg = hoursLeft > 24 ? `${Math.ceil(hoursLeft/24)}д` : `${hoursLeft}ч`;
                }

                return `
                    <div class="micro-lesson-card ${isLocked ? 'lesson-locked' : ''}" 
                         onclick="${isLocked ? '' : `startLesson('${lessonId}')`}">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <span class="badge-srs" style="background: var(--lvl-${mastery || 1});">Ур. ${mastery}/4</span>
                            ${isLocked ? `
                                <div class="lock-overlay"><ion-icon name="lock-closed"></ion-icon> ${lockMsg}</div>
                            ` : mastery >= 4 ? `
                                <ion-icon name="checkmark-done-circle" style="color: var(--lvl-4); font-size: 1.5rem;"></ion-icon>
                            ` : ''}
                        </div>
                        <h3>${lesson.title}</h3>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${mastery * 25}%; background: var(--lvl-${mastery || 1});"></div>
                        </div>
                    </div>
                `;
            }).join('') || '<p style="color: var(--text-secondary);">Уроки в разработке.</p>'}
        </div>
    `;
}

function renderProfile() {
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
        passedLessonsEntries.sort((a,b) => b[1].lastPassed - a[1].lastPassed).forEach(([lId, data]) => {
            const lessonObj = KNOWLEDGE_BASE.lessons[lId];
            if(!lessonObj) return;
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
                Шаг ${currentLessonState.step + 1} из 5
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
    main.innerHTML = `
      <div class="lesson-screen fade-in">
          <header style="text-align: center; margin-bottom: 2rem;">
              <h3 style="color: var(--primary); letter-spacing: 2px;">ПРОВЕРКА</h3>
              <h2 style="margin-top: 1rem;">${check.question}</h2>
              ${check.scenario ? `<p style="margin-top: 1rem; color: var(--text-secondary); font-style: italic;">"${check.scenario}"</p>` : ''}
          </header>
          
          <textarea class="check-input" id="check-response" placeholder="Твой ответ здесь..."></textarea>
          
          <div style="margin-top: 2rem;">
              <button class="btn btn-primary" onclick="finishLesson()" style="width: 100%;">
                  Завершить и апнуть навык <ion-icon name="flash-outline"></ion-icon>
              </button>
              <button class="btn" onclick="alert('${check.hint}')" style="margin-top: 1rem; color: var(--text-secondary); width: 100%;">
                  Мне нужна подсказка
              </button>
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
      lessonProgress.nextReview = Date.now() + (currentIntervalDays * 24 * 60 * 60 * 1000);
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
      ? `Следующее повторение через ${currentIntervalDays} дн.`
      : "Урок полностью освоен! 🔥";
      
    setTimeout(() => {
        alert(`Урок завершен! Прогресс: ${lessonProgress.masteryLevel} из 4. Данные сохранены в Облаке. ${nextMsg}`);
    }, 100);
}
