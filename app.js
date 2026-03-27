/* D-Education Platform Logic */

// State Management
let currentView = 'dashboard';
let userProgress = JSON.parse(localStorage.getItem('d_edu_v2_progress')) || {
  skills: {}, // { skill_id: { level: 1, xp: 0 } }
  lessons: {}, // { lesson_id: { nextReview: date, state: 'new'|'learning'|'review' } }
  actions: [] // { lesson_id: date, result: '' }
};

let currentLessonState = {
  lessonId: null,
  step: 0, 
  cards: []
};

function saveProgress() {
  localStorage.setItem('d_edu_v2_progress', JSON.stringify(userProgress));
  renderDashboard();
}

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
                <ion-icon name="arrow-back-outline"></ion-icon> Назад к блокам
            </a>
            <h1>${sub.title}</h1>
            <p style="color: var(--text-secondary);">Выберите навык для прокачки.</p>
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
                <ion-icon name="arrow-back-outline"></ion-icon> Назад к навыкам
            </a>
            <h1>${skill.title}</h1>
            <p style="color: var(--text-secondary);">Микроуроки для изучения.</p>
        </header>
        <div class="grid fade-in">
            ${skill.lessons.map(lessonId => {
                const lesson = KNOWLEDGE_BASE.lessons[lessonId];
                if (!lesson) return '';
                const isLearned = userProgress.lessons[lessonId];
                return `
                    <div class="micro-lesson-card" onclick="startLesson('${lessonId}')">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <span class="badge-srs ${isLearned ? 'badge-learned' : 'badge-new'}">${isLearned ? 'Пройдено' : 'Новое'}</span>
                            ${isLearned ? '<ion-icon name="checkmark-circle" style="color: var(--secondary); font-size: 1.5rem;"></ion-icon>' : ''}
                        </div>
                        <h3>${lesson.title}</h3>
                    </div>
                `;
            }).join('')}
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
    const levelPercent = (progress.level / 5) * 100;
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
          { type: 'check', title: 'Проверка', check: lesson.content.check }
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

function finishLesson() {
    const lessonId = currentLessonState.lessonId;
    const lesson = KNOWLEDGE_BASE.lessons[lessonId];
    
    // Spaced Repetition Logic (1, 3, 7, 30)
    const intervals = [1, 3, 7, 30];
    const prevData = userProgress.lessons[lessonId];
    const prevLevel = prevData?.level || 0;
    const nextLevel = Math.min(prevLevel + 1, intervals.length);
    const days = intervals[nextLevel - 1];

    userProgress.lessons[lessonId] = {
        nextReview: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        level: nextLevel,
        state: 'learning'
    };

    // Update Skill Mastery (Basic logic for MVP)
    if (!userProgress.skills[lesson.skillId]) {
        userProgress.skills[lesson.skillId] = { level: 1, xp: 0 };
    }
    
    // Simple level up: if all lessons in skill are level 1+, skill level = 2, etc.
    const skill = KNOWLEDGE_BASE.skills[lesson.skillId];
    const skillLessons = skill.lessons.map(id => userProgress.lessons[id]);
    const minLevel = Math.min(...skillLessons.filter(l => l).map(l => l.level), 0);
    
    if (minLevel > 0) {
        userProgress.skills[skill.id].level = Math.min(minLevel + 1, 5);
    }

    saveProgress();
    alert("Урок завершен! Навык прокачан. 🔥");
    renderDashboard();
}

// Initial Render
window.onload = () => {
  renderDashboard();
};
