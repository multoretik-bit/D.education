/* D-Education Data Architecture v2.5 - Full 26-Block Curriculum */

const KNOWLEDGE_BASE = {
  areas: [
    {
      id: "finance",
      title: "Финансы",
      icon: "cash-outline",
      subsystems: [
        "sub_intro", "sub_psy", "sub_income", "sub_flow", "sub_budget", 
        "sub_cushion", "sub_infra", "sub_debt", "sub_tax", "sub_inflation", 
        "sub_cap", "sub_invest_basics", "sub_tools", "sub_portfolio", 
        "sub_analysis", "sub_fi_retirement", "sub_insurance", "sub_safety", 
        "sub_consumer", "sub_real_estate", "sub_family", "sub_business", 
        "sub_intl", "sub_legal", "sub_risk", "sub_strategy"
      ]
    },
    { id: "psychology", title: "Психология", icon: "brain-outline", subsystems: [] },
    { id: "health", title: "Здоровье", icon: "heart-outline", subsystems: [] }
  ],
  subsystems: {
    "sub_intro": { id: "sub_intro", areaId: "finance", title: "Блок 0. Введение: что такое деньги и зачем изучать финансы", skills: [] },
    "sub_psy": { id: "sub_psy", areaId: "finance", title: "Блок 1. Психология денег", skills: ["skill_money_mindset", "skill_emotional_spending", "skill_abundance_vs_scarcity", "skill_money_emotions"] },
    "sub_income": { id: "sub_income", areaId: "finance", title: "Блок 2. Доход: как человек зарабатывает деньги", skills: ["skill_market_value", "skill_income_resilience", "skill_side_hustles"] },
    "sub_flow": { id: "sub_flow", areaId: "finance", title: "Блок 3. Учет денег и контроль денежного потока", skills: ["skill_cashflow_basics", "skill_expense_optimization"] },
    "sub_budget": { id: "sub_budget", areaId: "finance", title: "Блок 4. Бюджетирование", skills: [] },
    "sub_cushion": { id: "sub_cushion", areaId: "finance", title: "Блок 5. Финансовая подушка и резервные фонды", skills: [] },
    "sub_infra": { id: "sub_infra", areaId: "finance", title: "Блок 6. Банки, счета и повседневная финансовая инфраструктура", skills: [] },
    "sub_debt": { id: "sub_debt", areaId: "finance", title: "Блок 7. Долги, кредиты и кредитное поведение", skills: [] },
    "sub_tax": { id: "sub_tax", areaId: "finance", title: "Блок 8. Налоги для обычного человека", skills: [] },
    "sub_inflation": { id: "sub_inflation", areaId: "finance", title: "Блок 9. Инфляция, покупательная способность и реальная стоимость денег", skills: [] },
    "sub_cap": { id: "sub_cap", areaId: "finance", title: "Блок 10. Сбережения и накопление капитала", skills: [] },
    "sub_invest_basics": { id: "sub_invest_basics", areaId: "finance", title: "Блок 11. Основы инвестирования", skills: ["skill_portfolio_basics", "skill_etf_basics"] },
    "sub_tools": { id: "sub_tools", areaId: "finance", title: "Блок 12. Инвестиционные инструменты", skills: [] },
    "sub_portfolio": { id: "sub_portfolio", areaId: "finance", title: "Блок 13. Построение инвестиционного портфеля", skills: [] },
    "sub_analysis": { id: "sub_analysis", areaId: "finance", title: "Блок 14. Анализ активов для обычного человека", skills: [] },
    "sub_fi_retirement": { id: "sub_fi_retirement", areaId: "finance", title: "Блок 15. Пенсия, долгий горизонт и финансовая независимость", skills: [] },
    "sub_insurance": { id: "sub_insurance", areaId: "finance", title: "Блок 16. Страхование и защита от катастрофических рисков", skills: [] },
    "sub_safety": { id: "sub_safety", areaId: "finance", title: "Блок 17. Финансовая безопасность, мошенничество и цифровая грамотность", skills: [] },
    "sub_consumer": { id: "sub_consumer", areaId: "finance", title: "Блок 18. Потребительские решения и повседневная экономика", skills: [] },
    "sub_real_estate": { id: "sub_real_estate", areaId: "finance", title: "Блок 19. Недвижимость в личных финансах", skills: [] },
    "sub_family": { id: "sub_family", areaId: "finance", title: "Блок 20. Семья, отношения и деньги", skills: [] },
    "sub_business": { id: "sub_business", areaId: "finance", title: "Блок 21. Предпринимательство и деньги для тех, кто работает на себя", skills: [] },
    "sub_intl": { id: "sub_intl", areaId: "finance", title: "Блок 22. Международные финансы для обычного человека", skills: [] },
    "sub_legal": { id: "sub_legal", areaId: "finance", title: "Блок 23. Правовые и документальные основы", skills: [] },
    "sub_risk": { id: "sub_risk", areaId: "finance", title: "Блок 24. Продвинутый бытовой риск-менеджмент", skills: [] },
    "sub_strategy": { id: "sub_strategy", areaId: "finance", title: "Блок 25. Финансовая стратегия жизни", skills: [] }
  },
  skills: {
    // BLOCK 1: Psychology
    "skill_money_mindset": { id: "skill_money_mindset", subsystemId: "sub_psy", title: "Денежное мышление", lessons: ["ml_family_scripts", "ml_fear_of_money", "ml_wealth_triggers"] },
    "skill_emotional_spending": { id: "skill_emotional_spending", subsystemId: "sub_psy", title: "Эмоции и траты", lessons: ["ml_impulsive_spends", "ml_reward_spending"] },
    "skill_abundance_vs_scarcity": { id: "skill_abundance_vs_scarcity", subsystemId: "sub_psy", title: "Изобилие и дефицит", lessons: ["ml_scarcity_mindset", "ml_gratitude_practice"] },
    "skill_money_emotions": { id: "skill_money_emotions", subsystemId: "sub_psy", title: "Стыд и вина", lessons: ["ml_shame_neutralization", "ml_anxiety_management"] },
    
    // BLOCK 2: Income
    "skill_market_value": { id: "skill_market_value", subsystemId: "sub_income", title: "Рыночная стоимость", lessons: ["ml_hourly_rate", "ml_raise_negotiation"] },
    "skill_income_resilience": { id: "skill_income_resilience", subsystemId: "sub_income", title: "Устойчивость дохода", lessons: ["ml_diversification_income", "ml_emergency_skills"] },
    "skill_side_hustles": { id: "skill_side_hustles", subsystemId: "sub_income", title: "Доп. заработок", lessons: ["ml_monetize_skills", "ml_micro_tasks"] },
    
    // BLOCK 3: Flow
    "skill_cashflow_basics": { id: "skill_cashflow_basics", subsystemId: "sub_flow", title: "Cash Flow и баланс", lessons: ["ml_balance_sheet_basics", "ml_cashflow_tracking"] },
    "skill_expense_optimization": { id: "skill_expense_optimization", subsystemId: "sub_flow", title: "Оптимизация", lessons: ["ml_subscription_audit", "ml_leaks_audit"] },
    
    // BLOCK 11: Invest Basics
    "skill_portfolio_basics": { id: "skill_portfolio_basics", subsystemId: "sub_invest_basics", title: "Портфель", lessons: ["ml_asset_allocation", "ml_risk_profile"] },
    "skill_etf_basics": { id: "skill_etf_basics", subsystemId: "sub_invest_basics", title: "Инвестиции в ETF", lessons: ["ml_what_is_etf", "ml_buy_first_etf"] }
  },
  lessons: {
    // Definitive lesson objects for Block 1, 2, 3, 11...
    "ml_family_scripts": {
      id: "ml_family_scripts",
      skillId: "skill_money_mindset",
      title: "1.1. Семейные сценарии",
      content: {
        context: "Вы повторяете финансовые ошибки родителей неосознанно.",
        essence: "Сценарий — это 'прошивка'. Ее можно взломать только осознанием.",
        example: "Если мать говорила 'мы не богаты, зато честны', вы подсознательно избегаете успеха.",
        action: "Назовите одну фразу родителей, которая мешает вам тратить на себя.",
        check: { type: "explanation", question: "Почему 'анти-сценарий' — это тоже отсутствие свободы?" }
      }
    },
    "ml_fear_of_money": {
      id: "ml_fear_of_money",
      skillId: "skill_money_mindset",
      title: "1.2. Страх больших денег",
      content: {
        context: "Психика защищает вас от 'опасности' больших сумм.",
        essence: "Страх денег — это страх ответственности или потери окружения.",
        example: "Отказ от крупного проекта в последний момент из-за тревоги.",
        action: "Представьте, что у вас на счету $1 млн. Какое первое неприятное чувство возникло?",
        check: { type: "explanation", question: "Как страх 'выделиться' мешает переходу в бизнес?" }
      }
    },
    "ml_wealth_triggers": {
      id: "ml_wealth_triggers",
      skillId: "skill_money_mindset",
      title: "1.3. Триггеры богатства",
      content: {
        context: "Мозг должен видеть пользу успеха за пределами выживания.",
        essence: "Создайте связку: 'Больше денег = Больше радости/смысла'.",
        example: "Покупка качественного обучения, которое меняет окружение.",
        action: "Выберите одну вещь, которую вы купите, чтобы почувствовать новый уровень комфорта.",
        check: { type: "case", question: "Почему покупка 'понтов' на последние деньги — это триггер бедности, а не богатства?" }
      }
    },
    "ml_impulsive_spends": {
      id: "ml_impulsive_spends",
      skillId: "skill_emotional_spending",
      title: "1.5. Импульсивные траты",
      content: {
        context: "Мозг ищет быстрого дофамина через покупки.",
        essence: "Импульсивная трата — это попытка закрыть эмоциональную дыру деньгами.",
        example: "Покупка гаджета после тяжелого рабочего дня.",
        action: "Внедрите 'правило 24 часов' для любой покупки дороже $50.",
        check: { type: "explanation", question: "Как пауза в 24 часа помогает дофамину 'остыть'?" }
      }
    },
    // ... all other lessons should remain here (v2.4 list)
    "ml_reward_spending": { id: "ml_reward_spending", skillId: "skill_emotional_spending", title: "1.6. Траты-награды", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "explanation", question: "..." } } },
    "ml_scarcity_mindset": { id: "ml_scarcity_mindset", skillId: "skill_abundance_vs_scarcity", title: "1.4. Психология дефицита", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "explanation", question: "..." } } },
    "ml_gratitude_practice": { id: "ml_gratitude_practice", skillId: "skill_abundance_vs_scarcity", title: "1.5. Практика изобилия", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "explanation", question: "..." } } },
    "ml_shame_neutralization": { id: "ml_shame_neutralization", skillId: "skill_money_emotions", title: "1.6. Нейтрализация стыда", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "explanation", question: "..." } } },
    "ml_anxiety_management": { id: "ml_anxiety_management", skillId: "skill_money_emotions", title: "1.7. Управление тревогой", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "explanation", question: "..." } } },
    "ml_hourly_rate": { id: "ml_hourly_rate", skillId: "skill_market_value", title: "2.1. Стоимость часа", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "explanation", question: "..." } } },
    "ml_raise_negotiation": { id: "ml_raise_negotiation", skillId: "skill_market_value", title: "2.2. Переговоры о ЗП", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "case", question: "..." } } },
    "ml_balance_sheet_basics": { id: "ml_balance_sheet_basics", skillId: "skill_cashflow_basics", title: "3.1. Личный баланс", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "explanation", question: "..." } } },
    "ml_cashflow_tracking": { id: "ml_cashflow_tracking", skillId: "skill_cashflow_basics", title: "3.2. Трекинг потока", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "explanation", question: "..." } } },
    "ml_subscription_audit": { id: "ml_subscription_audit", skillId: "skill_expense_optimization", title: "3.5. Аудит подписок", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "case", question: "..." } } },
    "ml_leaks_audit": { id: "ml_leaks_audit", skillId: "skill_expense_optimization", title: "3.6. Денежные дыры", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "explanation", question: "..." } } },
    "ml_monetize_skills": { id: "ml_monetize_skills", skillId: "skill_side_hustles", title: "2.5. Монетизация навыков", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "explanation", question: "..." } } },
    "ml_micro_tasks": { id: "ml_micro_tasks", skillId: "skill_side_hustles", title: "2.6. Микро-задачи", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "explanation", question: "..." } } },
    "ml_asset_allocation": { id: "ml_asset_allocation", skillId: "skill_portfolio_basics", title: "11.1. Распределение активов", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "explanation", question: "..." } } },
    "ml_risk_profile": { id: "ml_risk_profile", skillId: "skill_portfolio_basics", title: "11.2. Риск-профиль", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "explanation", question: "..." } } },
    "ml_what_is_etf": { id: "ml_what_is_etf", skillId: "skill_etf_basics", title: "11.17. Что такое ETF", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "explanation", question: "..." } } },
    "ml_buy_first_etf": { id: "ml_buy_first_etf", skillId: "skill_etf_basics", title: "11.18. Покупка первого ETF", content: { context: "...", essence: "...", example: "...", action: "...", check: { type: "case", question: "..." } } }
  }
};
