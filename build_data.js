(function() {
    console.log("Building KNOWLEDGE_BASE client-side...");
    
    // Ensure prerequisites exist
    if (!window.CURRICULUM) {
        console.error("CURRICULUM is missing!");
        return;
    }
    window.CONTENT = window.CONTENT || {};

    const KNOWLEDGE_BASE = {
        blocks: [],
        skills: {},
        lessons: {}
    };

    let globalLessonIdCounter = 1;

    for (let blockIndex = 0; blockIndex < 26; blockIndex++) {
        const blockData = window.CURRICULUM[blockIndex];
        if (!blockData) continue; 

        const blockId = `b_${blockIndex}`;
        
        KNOWLEDGE_BASE.blocks.push({
            id: blockId,
            title: blockData.title.startsWith("Блок ") ? blockData.title : `Блок ${blockIndex}. ${blockData.title}`,
            skills: []
        });

        // Group lessons into skills (max 4 lessons per skill logically)
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
            let lessonContent = window.CONTENT[rawContentId];
            
            if (!lessonContent) {
                lessonContent = {
                    context: `(В разработке) Контекст для урока: ${lessonTitle}. Здесь будет описана проблематика и жизненная ситуация.`,
                    essence: `(В разработке) Суть для урока: ${lessonTitle}. Здесь будет выжимка главного финансового принципа.`,
                    example: `(В разработке) Пример: разбор типичной ошибки на цифрах для темы - ${lessonTitle}.`,
                    action: `(В разработке) Практическое действие: что конкретно нужно сделать сегодня.`,
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

    // Expose generated data to global scope for app.js
    window.KNOWLEDGE_BASE = KNOWLEDGE_BASE;
    console.log("KNOWLEDGE_BASE generated successfully. Total lessons:", Object.keys(KNOWLEDGE_BASE.lessons).length);
})();
