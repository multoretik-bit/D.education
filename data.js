/* D-Education Data Architecture v2.4 - Mass Content Expansion */

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
      skills: ["skill_market_value", "skill_income_resilience", "skill_side_hustles"] 
    },
    "sub_flow": { 
      id: "sub_flow", 
      areaId: "finance", 
      title: "Блок 3. Учет и контроль денежного потока", 
      skills: ["skill_cashflow_basics", "skill_expense_optimization"] 
    },
    "sub_invest_basics": { 
      id: "sub_invest_basics", 
      areaId: "finance", 
      title: "Блок 11. Основы инвестирования", 
      skills: ["skill_portfolio_basics", "skill_etf_basics"] 
    }
  },
  skills: {
    // BLOCK 1
    "skill_money_mindset": { id: "skill_money_mindset", subsystemId: "sub_psy", title: "Денежное мышление", lessons: ["ml_family_scripts", "ml_fear_of_money", "ml_wealth_triggers"] },
    "skill_emotional_spending": { id: "skill_emotional_spending", subsystemId: "sub_psy", title: "Эмоции и траты", lessons: ["ml_impulsive_spends", "ml_reward_spending"] },
    "skill_abundance_vs_scarcity": { id: "skill_abundance_vs_scarcity", subsystemId: "sub_psy", title: "Изобилие и дефицит", lessons: ["ml_scarcity_mindset", "ml_gratitude_practice"] },
    "skill_money_emotions": { id: "skill_money_emotions", subsystemId: "sub_psy", title: "Стыд и вина", lessons: ["ml_shame_neutralization", "ml_anxiety_management"] },
    
    // BLOCK 2
    "skill_market_value": { id: "skill_market_value", subsystemId: "sub_income", title: "Рыночная стоимость", lessons: ["ml_hourly_rate", "ml_raise_negotiation"] },
    "skill_income_resilience": { id: "skill_income_resilience", subsystemId: "sub_income", title: "Устойчивость дохода", lessons: ["ml_diversification_income", "ml_emergency_skills"] },
    "skill_side_hustles": { id: "skill_side_hustles", subsystemId: "sub_income", title: "Доп. заработок", lessons: ["ml_monetize_skills", "ml_micro_tasks"] },
    
    // BLOCK 3
    "skill_cashflow_basics": { id: "skill_cashflow_basics", subsystemId: "sub_flow", title: "Cash Flow и баланс", lessons: ["ml_balance_sheet_basics", "ml_cashflow_tracking"] },
    "skill_expense_optimization": { id: "skill_expense_optimization", subsystemId: "sub_flow", title: "Оптимизация", lessons: ["ml_subscription_audit", "ml_leaks_audit"] },
    
    // BLOCK 11
    "skill_portfolio_basics": { id: "skill_portfolio_basics", subsystemId: "sub_invest_basics", title: "Портфель", lessons: ["ml_asset_allocation", "ml_risk_profile"] },
    "skill_etf_basics": { id: "skill_etf_basics", subsystemId: "sub_invest_basics", title: "Инвестиции в ETF", lessons: ["ml_what_is_etf", "ml_buy_first_etf"] }
  },
  lessons: {
    // 1.1 - 1.3
    "ml_family_scripts": {
      id: "ml_family_scripts",
      skillId: "skill_money_mindset",
      title: "1.1. Семейные сценарии",
      content: {
        context: "Вы повторяете финансовые ошибки родителей неосознанно.",
        essence: "Сценарий — это 'прошивка'. Ее можно взломать только осознанием.",
        example: "Если мать говорила 'мы не богаты, зато честны', вы подсознательно избегаете успеха.",
        action: "Назовите одну фразу родителей, которая мешает вам тратить на себя.",
        check: { type: "explanation", question: "Почему 'анти-сценарий' (делать всё наоборот) — это тоже отсутствие свободы?" }
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

    // 2.1 - 2.2
    "ml_hourly_rate": {
      id: "ml_hourly_rate",
      skillId: "skill_market_value",
      title: "2.1. Стоимость часа",
      content: {
        context: "Вы не знаете, сколько на самом деле зарабатываете.",
        essence: "Доход / (Рабочие часы + дорога + подготовка) = Реальный час.",
        example: "ЗП $2000, но вы работаете 60 часов в неделю — ваш час стоит меньше кассира.",
        action: "Прямо сейчас посчитайте стоимость своего часа за прошлый месяц.",
        check: { type: "explanation", question: "Как знание цены часа помогает отказываться от бесполезных встреч?" }
      }
    },
    "ml_raise_negotiation": {
      id: "ml_raise_negotiation",
      skillId: "skill_market_value",
      title: "2.2. Переговоры о ЗП",
      content: {
        context: "Просить больше — это предлагать больше ценности.",
        essence: "Говорите не о нуждах, а о прибыли, которую вы приносите.",
        example: "Вместо 'мне дорого жить' скажите 'я оптимизировал процесс, сэкономив компании $10к'.",
        action: "Запишите 3 своих достижения за полгода в цифрах.",
        check: { type: "case", question: "Что делать, если начальник говорит 'денег нет, но мы тебя ценим'?" }
      }
    },

    // 3.1 - 3.2
    "ml_balance_sheet_basics": {
      id: "ml_balance_sheet_basics",
      skillId: "skill_cashflow_basics",
      title: "3.1. Личный баланс",
      content: {
        context: "Деньги улетают сквозь пальцы, потому что нет фундамента.",
        essence: "Ваш капитал = Активы (что дает деньги) минус Пассивы (что берет).",
        example: "Машина — пассив (страховка, бензин), если не приносит доход.",
        action: "Выпишите 3 своих главных пассива, которые можно сократить.",
        check: { type: "explanation", question: "Почему 'свой дом' в ипотеке — это пассив, а не актив для инвестора?" }
      }
    },
    "ml_subscription_audit": {
      id: "ml_subscription_audit",
      skillId: "skill_expense_optimization",
      title: "3.5. Аудит подписок",
      content: {
        context: "Мелкие траты незаметно съедают $200-500 в год.",
        essence: "Подписки эксплуатируют лень. Нужно раз в месяц резать лишнее.",
        example: "Забытая подписка на сервис, которым не пользуешься полгода.",
        action: "Откройте выписку банка и отмените одну ненужную подписку прямо сейчас.",
        check: { type: "case", question: "В чем разница между экономией и оптимизацией образа жизни?" }
      }
    },

    // 11.1 - 11.2
    "ml_asset_allocation": {
      id: "ml_asset_allocation",
      skillId: "skill_portfolio_basics",
      title: "11.1. Распределение активов",
      content: {
        context: "Не кладите все яйца в одну корзину.",
        essence: "Доходность портфеля на 90% зависит от макро-выбора (акции vs облигации).",
        example: "60% акций / 40% облигаций — классический сбалансированный портфель.",
        action: "Решите, какой процент капитала вы готовы потерять временно (просадка) ради роста?",
        check: { type: "explanation", question: "Почему добавление защитных активов (золото, кэш) уменьшает доходность, но спасает сон?" }
      }
    },
    "ml_what_is_etf": {
      id: "ml_what_is_etf",
      skillId: "skill_etf_basics",
      title: "11.17. Что такое ETF",
      content: {
        context: "Выбирать отдельные акции — работа для профи. ETF — решение для людей.",
        essence: "Это 'винегрет' из акций. Вы покупаете одну штуку, а владеете рынком целиком.",
        example: "VOO — это 500 крупнейших компаний США разом.",
        action: "Загуглите 'состав фонда S&P 500'. Какие топ-3 компании там увидели?",
        check: { type: "explanation", question: "Почему ETF надежнее, чем покупка акций одной компании, даже очень крутой (напр. Apple)?" }
      }
    },
    "ml_buy_first_etf": {
      id: "ml_buy_first_etf",
      skillId: "skill_etf_basics",
      title: "11.18. Покупка первого ETF",
      content: {
        context: "Теория мертва без практики.",
        essence: "Покупка на бирже — технический навык. Сделайте его один раз.",
        example: "Купить лот фонда на индекс в торговом приложении.",
        action: "Откройте брокерский счет (если есть) и найдите тикер любого индексного фонда.",
        check: { type: "case", question: "Рынок упал на 10%. Ваши действия с индексным фондом?" }
      }
    }
    // and more...
  }
};
