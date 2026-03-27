/* D-Education Data Architecture v2.2 */

const KNOWLEDGE_BASE = {
  areas: [
    {
      id: "finance",
      title: "Финансы",
      icon: "cash-outline",
      subsystems: [
        "sub_psy", "sub_income", "sub_flow", "sub_budget", "sub_cushion", 
        "sub_infra", "sub_debt", "sub_tax", "sub_inflation", "sub_cap", 
        "sub_invest_basics", "sub_tools", "sub_portfolio", "sub_analysis", 
        "sub_fi_retirement", "sub_insurance", "sub_safety", "sub_consumer", 
        "sub_real_estate", "sub_family", "sub_business", "sub_intl", 
        "sub_legal", "sub_risk", "sub_strategy"
      ]
    },
    { id: "psychology", title: "Психология", icon: "brain-outline", subsystems: [] },
    { id: "health", title: "Здоровье", icon: "heart-outline", subsystems: [] }
  ],
  subsystems: {
    "sub_psy": { id: "sub_psy", areaId: "finance", title: "Блок 1. Психология денег", skills: ["skill_money_mindset", "skill_emotional_spending"] },
    "sub_income": { id: "sub_income", areaId: "finance", title: "Блок 2. Доход: как человек зарабатывает", skills: ["skill_income_types", "skill_capital_income"] },
    "sub_flow": { id: "sub_flow", areaId: "finance", title: "Блок 3. Учет и контроль денежного потока", skills: ["skill_cashflow_basics"] },
    "sub_budget": { id: "sub_budget", areaId: "finance", title: "Блок 4. Бюджетирование", skills: [] },
    "sub_cushion": { id: "sub_cushion", areaId: "finance", title: "Блок 5. Финансовая подушка и резервы", skills: [] },
    "sub_infra": { id: "sub_infra", areaId: "finance", title: "Блок 6. Банки, счета и инфраструктура", skills: [] },
    "sub_debt": { id: "sub_debt", areaId: "finance", title: "Блок 7. Долги, кредиты и поведение", skills: [] },
    "sub_tax": { id: "sub_tax", areaId: "finance", title: "Блок 8. Налоги для обычного человека", skills: [] },
    "sub_inflation": { id: "sub_inflation", areaId: "finance", title: "Блок 9. Инфляция и реальная стоимость", skills: [] },
    "sub_cap": { id: "sub_cap", areaId: "finance", title: "Блок 10. Сбережения и накопление", skills: [] },
    "sub_invest_basics": { id: "sub_invest_basics", areaId: "finance", title: "Блок 11. Основы инвестирования", skills: ["skill_etf_basics"] },
    "sub_tools": { id: "sub_tools", areaId: "finance", title: "Блок 12. Инвестиционные инструменты", skills: [] },
    "sub_portfolio": { id: "sub_portfolio", areaId: "finance", title: "Блок 13. Построение портфеля", skills: [] },
    "sub_analysis": { id: "sub_analysis", areaId: "finance", title: "Блок 14. Анализ активов", skills: [] },
    "sub_fi_retirement": { id: "sub_fi_retirement", areaId: "finance", title: "Блок 15. Пенсия и финансовая независимость", skills: [] },
    "sub_insurance": { id: "sub_insurance", areaId: "finance", title: "Блок 16. Страхование и защита", skills: [] },
    "sub_safety": { id: "sub_safety", areaId: "finance", title: "Блок 17. Фин. безопасность и мошенничество", skills: [] },
    "sub_consumer": { id: "sub_consumer", areaId: "finance", title: "Блок 18. Потребительские решения", skills: [] },
    "sub_real_estate": { id: "sub_real_estate", areaId: "finance", title: "Блок 19. Недвижимость", skills: [] },
    "sub_family": { id: "sub_family", areaId: "finance", title: "Блок 20. Семья, отношения и деньги", skills: [] },
    "sub_business": { id: "sub_business", areaId: "finance", title: "Блок 21. Предпринимательство", skills: [] },
    "sub_intl": { id: "sub_intl", areaId: "finance", title: "Блок 22. Международные финансы", skills: [] },
    "sub_legal": { id: "sub_legal", areaId: "finance", title: "Блок 23. Правовые и документальные основы", skills: [] },
    "sub_risk": { id: "sub_risk", areaId: "finance", title: "Блок 24. Продвинутый риск-менеджмент", skills: [] },
    "sub_strategy": { id: "sub_strategy", areaId: "finance", title: "Блок 25. Финансовая стратегия жизни", skills: [] }
  },
  skills: {
    "skill_money_mindset": { id: "skill_money_mindset", subsystemId: "sub_psy", title: "Денежное мышление", lessons: ["ml_family_scripts", "ml_fear_of_money"] },
    "skill_emotional_spending": { id: "skill_emotional_spending", subsystemId: "sub_psy", title: "Эмоции и траты", lessons: ["ml_impulsive_spends"] },
    "skill_income_types": { id: "skill_income_types", subsystemId: "sub_income", title: "Виды дохода", lessons: [] },
    "skill_capital_income": { id: "skill_capital_income", subsystemId: "sub_income", title: "Доход от капитала", lessons: [] },
    "skill_cashflow_basics": { id: "skill_cashflow_basics", subsystemId: "sub_flow", title: "Cash Flow и учет", lessons: [] },
    "skill_etf_basics": { id: "skill_etf_basics", subsystemId: "sub_invest_basics", title: "Инвестиции в ETF", lessons: ["ml_what_is_etf", "ml_buy_first_etf"] }
  },
  lessons: {
    "ml_family_scripts": {
      id: "ml_family_scripts",
      skillId: "skill_money_mindset",
      title: "1.1. Семейные сценарии",
      content: {
        context: "Ваши текущие финансовые результаты на 80% зависят от того, что вы слышали о деньгах до 7 лет.",
        essence: "Семейный сценарий — это бессознательная копия поведения родителей.",
        example: "Если отец копил и во всем себе отказывал, вы можете стать либо скупердяем, либо тратить все до копейки.",
        action: "Напишите 3 фразы о деньгах от родителей и как они мешают сегодня.",
        check: { type: "explanation", question: "Объясните как ребёнку: чем 'антисценарий' опасен для капитала?" }
      }
    },
    "ml_buy_first_etf": {
      id: "ml_buy_first_etf",
      skillId: "skill_etf_basics",
      title: "11.18. Покупка первого ETF",
      content: {
        context: "Инвестирование начинается не с анализа графиков, а с технического действия.",
        essence: "ETF — это корзина из акций. Покупая один пай, вы владеете долями сотен компаний.",
        example: "Фонд VOO (S&P 500) включает Apple, Microsoft и еще 498 гигантов.",
        action: "Найдите тикер VOO в вашем терминале и добавьте его в 'Избранное'.",
        check: { type: "case", question: "У вас есть $1000. Рынок упал на 5%. Ваше действие с ETF?", scenario: "Рынок в панике, все продают." }
      }
    }
    // placeholders can be added for all 500 lessons later
  }
};
