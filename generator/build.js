const fs = require('fs');
const path = require('path');

// 1. Import Curriculum Definition
const curriculumPath = path.join(__dirname, 'curriculum.js');
let curriculum = {};
if (fs.existsSync(curriculumPath)) {
    curriculum = require(curriculumPath);
}

// 2. Import Content Blocks
const contents = {};
for (let i = 0; i <= 5; i++) {
    const blockPath = path.join(__dirname, `content_b${i}.js`);
    if (fs.existsSync(blockPath)) {
        Object.assign(contents, require(blockPath));
    }
}

// 3. Build KNOWLEDGE_BASE Structure
const KNOWLEDGE_BASE = {
    blocks: [],
    skills: {},
    lessons: {}
};

let globalLessonIdCounter = 1;

for (let blockIndex = 0; blockIndex < 26; blockIndex++) {
    const blockData = curriculum[blockIndex];
    if (!blockData) continue; // Safety check

    const blockId = `b_${blockIndex}`;
    
    // Create Block
    KNOWLEDGE_BASE.blocks.push({
        id: blockId,
        title: `Блок ${blockIndex}. ${blockData.title}`,
        skills: []
    });

    // Group lessons into skills (max 4 lessons per skill)
    const LESSONS_PER_SKILL = 4;
    let currentSkillId = null;
    let skillCounter = 1;
    
    for (let lessonIndex = 0; lessonIndex < blockData.lessons.length; lessonIndex++) {
        if (lessonIndex % LESSONS_PER_SKILL === 0) {
            currentSkillId = `s_${blockIndex}_${skillCounter}`;
            KNOWLEDGE_BASE.skills[currentSkillId] = {
                title: `Навык ${blockIndex}.${skillCounter} курса`,
                blockId: blockId,
                lessons: []
            };
            KNOWLEDGE_BASE.blocks.find(b => b.id === blockId).skills.push(currentSkillId);
            skillCounter++;
        }

        const lessonTitle = blockData.lessons[lessonIndex];
        const rawContentId = `ml_${blockIndex}_${lessonIndex}`;
        const finalLessonId = `ml_${globalLessonIdCounter}`;
        globalLessonIdCounter++;

        KNOWLEDGE_BASE.skills[currentSkillId].lessons.push(finalLessonId);

        // Fetch real content if exists, else use smart placeholder
        let lessonContent = contents[rawContentId];
        
        if (!lessonContent) {
            lessonContent = {
                context: `(В разработке) Контекст для урока: ${lessonTitle}. Здесь будет описана проблематика и жизненная ситуация.`,
                essence: `(В разработке) Суть для урока: ${lessonTitle}. Здесь будет выжимка главного финансового принципа.`,
                example: `(В разработке) Пример для: ${lessonTitle}. Разбор типичной ошибки на цифрах.`,
                action: `(В разработке) Практическое действие для: ${lessonTitle}. Что конкретно нужно сделать сегодня.`,
                check: {
                    type: "explanation",
                    question: `Вопрос для проверки по теме: ${lessonTitle}`,
                    hint: "Логическая подсказка для ответа."
                }
            };
        }

        KNOWLEDGE_BASE.lessons[finalLessonId] = {
            title: lessonTitle,
            skillId: currentSkillId,
            content: {
                context: lessonContent.context,
                essence: lessonContent.essence,
                example: lessonContent.example,
                action: lessonContent.action
            },
            check: lessonContent.check
        };
    }
}

// 4. Generate Output File Content
// To ensure app.js can use it globally, we assign it to window.KNOWLEDGE_BASE
const outputData = `window.KNOWLEDGE_BASE = ${JSON.stringify(KNOWLEDGE_BASE, null, 2)};`;

// Write to data_v5.js in parent directoy (the main app dir)
const outputPath = path.join(__dirname, '..', 'data_v5.js');
fs.writeFileSync(outputPath, outputData, 'utf8');

console.log('Success! data_v5.js has been generated with real content for Blocks 0-5.');
