(function() {
    console.log("Building KNOWLEDGE_BASE client-side with new Navigation Architecture...");
    
    // Ensure prerequisites exist
    if (!window.CURRICULUM) {
        console.error("CURRICULUM is missing!");
        return;
    }
    window.CONTENT = window.CONTENT || {};

    const KNOWLEDGE_BASE = {
        areas: [
            {
                id: 'finance_course',
                title: 'Финансы (26 Глав)',
                icon: 'wallet-outline',
                subsystems: []
            }
        ],
        subsystems: {},
        skills: {},
        lessons: {}
    };

    let globalLessonIdCounter = 1;

    for (let blockIndex = 0; blockIndex < 26; blockIndex++) {
        const blockData = window.CURRICULUM[blockIndex];
        if (!blockData) continue; 

        const subsystemId = `b_${blockIndex}`;
        
        // Add to root course
        KNOWLEDGE_BASE.areas[0].subsystems.push(subsystemId);

        // Define Chapter (Subsystem)
        KNOWLEDGE_BASE.subsystems[subsystemId] = {
            id: subsystemId,
            areaId: 'finance_course',
            title: blockData.title.startsWith("Глава ") || blockData.title.startsWith("Блок ") 
                ? blockData.title 
                : `Глава ${blockIndex}. ${blockData.title}`,
            skills: []
        };

        // Group lessons into skills (max 4-5 lessons per skill logically)
        const LESSONS_PER_SKILL = 4;
        let currentSkillId = null;
        let skillCounter = 1;
        
        for (let lessonIndex = 0; lessonIndex < blockData.lessons.length; lessonIndex++) {
            if (lessonIndex % LESSONS_PER_SKILL === 0) {
                currentSkillId = `s_${blockIndex}_${skillCounter}`;
                const endRange = Math.min(lessonIndex + LESSONS_PER_SKILL, blockData.lessons.length);
                KNOWLEDGE_BASE.skills[currentSkillId] = {
                    title: `Уроки ${lessonIndex + 1}-${endRange}`,
                    subsystemId: subsystemId,
                    lessons: []
                };
                KNOWLEDGE_BASE.subsystems[subsystemId].skills.push(currentSkillId);
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

            // Auto-generate rich titles from context for Blocks 7-25 if they are just generic numbered placeholders
            if (lessonTitle.startsWith("Урок ") && lessonContent.context && !lessonContent.context.includes("(В разработке)")) {
                let firstSentence = lessonContent.context.split('.')[0].split('!')[0].split('?')[0];
                if (firstSentence.length > 70) firstSentence = firstSentence.substring(0, 67) + "...";
                lessonTitle = firstSentence.trim();
            }

            // Map check format accurately
            const checkObj = lessonContent.check || {
                type: "explanation",
                question: "Нет вопроса",
                hint: "Нет подсказки"
            };

            KNOWLEDGE_BASE.lessons[finalLessonId] = {
                title: lessonTitle,
                skillId: currentSkillId,
                content: {
                    context: lessonContent.context || 'Нет данных',
                    essence: lessonContent.essence || 'Нет данных',
                    example: lessonContent.example || 'Нет данных',
                    action: lessonContent.action || 'Нет данных'
                },
                check: checkObj
            };
        }
    }

    // Expose generated data to global scope for app.js
    window.KNOWLEDGE_BASE = KNOWLEDGE_BASE;
    console.log("KNOWLEDGE_BASE generated successfully. Total lessons mapped:", Object.keys(KNOWLEDGE_BASE.lessons).length);
})();
