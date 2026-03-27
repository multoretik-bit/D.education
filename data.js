/* D-Education Data Architecture v2.3 */

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
    "sub_psy": { 
      id: "sub_psy", 
      areaId: "finance", 
      title: "Блок 1. Психология денег", 
      skills: ["skill_money_mindset", "skill_emotional_spending", "skill_abundance_vs_scarcity", "skill_money_emotions"] 
    },
    "sub_income": { 
      id: "sub_income", 
      areaId: "finance", 
      title: "Блок 2. Доход: как человек зарабатывает", 
      skills: ["skill_income_types", "skill_capital_income", "skill_market_value", "skill_income_resilience"] 
    },
    "sub_flow": { 
      id: "sub_flow", 
      areaId: "finance", 
      title: "Блок 3. Учет и контроль денежного потока", 
      skills: ["skill_cashflow_basics", "skill_expense_optimization", "skill_financial_leaks"] 
    },
    "sub_budget": { id: "sub_budget", areaId: "finance", title: "Блок 4. Бюджетирование", skills: [] },
    "sub_cushion": { id: "sub_cushion", areaId: "finance", title: "Блок 5. Финансовая подушка и резервы", skills: [] },
    // blocks 6-10 ...
    "sub_invest_basics": { id: "sub_invest_basics", areaId: "finance", title: "Блок 11. Основы инвестирования", skills: ["skill_etf_basics"] }
  },
  skills: {
    // BLOCK 1: Psychology
    "skill_money_mindset": { id: "skill_money_mindset", subsystemId: "sub_psy", title: "Денежное мышление", lessons: ["ml_family_scripts", "ml_fear_of_money"] },
    "skill_emotional_spending": { id: "skill_emotional_spending", subsystemId: "sub_psy", title: "Эмоции и траты", lessons: ["ml_impulsive_spends"] },
    "skill_abundance_vs_scarcity": { id: "skill_abundance_vs_scarcity", subsystemId: "sub_psy", title: "Изобилие против Дефицита", lessons: [] },
    "skill_money_emotions": { id: "skill_money_emotions", subsystemId: "sub_psy", title: "Стыд, вина и тревога", lessons: [] },
    
    // BLOCK 2: Income
    "skill_income_types": { id: "skill_income_types", subsystemId: "sub_income", title: "Виды дохода", lessons: [] },
    "skill_capital_income": { id: "skill_capital_income", subsystemId: "sub_income", title: "Доход от капитала", lessons: [] },
    "skill_market_value": { id: "skill_market_value", subsystemId: "sub_income", title: "Стоимость на рынке труда", lessons: [] },
    "skill_income_resilience": { id: "skill_income_resilience", subsystemId: "sub_income", title: "Устойчивость дохода", lessons: [] },
    
    // BLOCK 3: Flow
    "skill_cashflow_basics": { id: "skill_cashflow_basics", subsystemId: "sub_flow", title: "Cash Flow и учет", lessons: ["ml_balance_sheet_basics"] },
    "skill_expense_optimization": { id: "skill_expense_optimization", subsystemId: "sub_flow", title: "Оптимизация расходов", lessons: [] },
    "skill_financial_leaks": { id: "skill_financial_leaks", subsystemId: "sub_flow", title: "Денежные дыры", lessons: [] },
    
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
    "ml_balance_sheet_basics": {
      id: "ml_balance_sheet_basics",
      skillId: "skill_cashflow_basics",
      title: "3.1. Личный баланс",
      content: {
        context: "Нельзя управлять тем, что нельзя измерить.",
        essence: "Активы — это то, что приносит деньги. Пассивы — то, что забирает.",
        example: "Машина, на которой вы работаете — актив. Машина для показухи — пассив.",
        action: "Составьте список из 5 своих главных активов и пассивов.",
        check: { type: "explanation", question: "Может ли квартира быть одновременно и активом, и пассивом? Как?" }
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
  }
};
