(function() {
    console.log("Building KNOWLEDGE_BASE client-side with Multi-Course Architecture...");
    
    if (!window.CURRICULUM) {
        console.error("CURRICULUM is missing!");
        return;
    }
    window.CONTENT = window.CONTENT || {};

    const KNOWLEDGE_BASE = {
        areas: [
            {
                id: 'finance_course',
                title: 'Финансовая Грамотность (26 Глав)',
                icon: 'wallet-outline',
                subsystems: []
            },
            {
                id: 'meta_skills',
                title: 'Мета-Навыки (23 Главы)',
                icon: 'flask-outline',
                subsystems: []
            }
        ],
        subsystems: {},
        skills: {},
        lessons: {}
    };

    let globalLessonIdCounter = 1;

    const courses = [
        { areaIndex: 0, prefix: 'b', prefixMl: 'ml', data: window.CURRICULUM, maxBlocks: 26 },
        { areaIndex: 1, prefix: 'mb', prefixMl: 'meta', data: typeof window.CURRICULUM_META !== 'undefined' ? window.CURRICULUM_META : {}, maxBlocks: 23 }
    ];

    courses.forEach(course => {
        for (let blockIndex = 0; blockIndex < course.maxBlocks; blockIndex++) {
            const blockData = course.data[blockIndex];
            if (!blockData) continue; 
            
            const subsystemId = `${course.prefix}_${blockIndex}`;
            
            KNOWLEDGE_BASE.areas[course.areaIndex].subsystems.push(subsystemId);

            KNOWLEDGE_BASE.subsystems[subsystemId] = {
                id: subsystemId,
                areaId: KNOWLEDGE_BASE.areas[course.areaIndex].id,
                title: blockData.title.startsWith("Глава ") || blockData.title.startsWith("Блок ") 
                    ? blockData.title 
                    : `Глава ${blockIndex}. ${blockData.title}`,
                skills: []
            };

            const LESSONS_PER_SKILL = 4;
            let currentSkillId = null;
            let skillCounter = 1;
            
            for (let lessonIndex = 0; lessonIndex < blockData.lessons.length; lessonIndex++) {
                if (lessonIndex % LESSONS_PER_SKILL === 0) {
                    currentSkillId = `s_${course.prefix}_${blockIndex}_${skillCounter}`;
                    const endRange = Math.min(lessonIndex + LESSONS_PER_SKILL, blockData.lessons.length);
                    KNOWLEDGE_BASE.skills[currentSkillId] = {
                        title: `Уроки ${lessonIndex + 1}-${endRange}`,
                        subsystemId: subsystemId,
                        lessons: []
                    };
                    KNOWLEDGE_BASE.subsystems[subsystemId].skills.push(currentSkillId);
                    skillCounter++;
                }

                let lessonTitle = blockData.lessons[lessonIndex];
                const rawContentId = `${course.prefixMl}_${blockIndex}_${lessonIndex}`;
                const finalLessonId = `lesson_${globalLessonIdCounter}`;
                globalLessonIdCounter++;

                KNOWLEDGE_BASE.skills[currentSkillId].lessons.push(finalLessonId);

                let lessonContent = window.CONTENT[rawContentId];
                
                if (!lessonContent) {
                    lessonContent = {
                        context: `(В разработке) Контекст для урока: ${lessonTitle}. Здесь будет описана проблематика и жизненная ситуация.`,
                        essence: `(В разработке) Суть для урока: ${lessonTitle}. Здесь будет выжимка главного принципа.`,
                        example: `(В разработке) Пример: разбор типичной ошибки на цифрах для темы - ${lessonTitle}.`,
                        action: `(В разработке) Практическое действие: что конкретно нужно сделать сегодня.`,
                        check: {
                            type: "explanation",
                            question: `Вопрос для проверки по теме: ${lessonTitle}`,
                            hint: "Логическая подсказка для ответа."
                        }
                    };
                }

                if (lessonTitle.startsWith("Урок ") && lessonContent.context && !lessonContent.context.includes("(В разработке)")) {
                    let firstSentence = lessonContent.context.split('.')[0].split('!')[0].split('?')[0];
                    if (firstSentence.length > 70) firstSentence = firstSentence.substring(0, 67) + "...";
                    lessonTitle = firstSentence.trim();
                }

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
    });

    window.KNOWLEDGE_BASE = KNOWLEDGE_BASE;
})();
