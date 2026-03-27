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
    "ml_reward_spending": {
      id: "ml_reward_spending",
      skillId: "skill_emotional_spending",
      title: "1.6. Траты-награды",
      content: {
        context: "Если вы только копите и никогда не празднуете, мозг саботирует процесс.",
        essence: "Награда должна быть запланированной и соразмерной достижению.",
        example: "Поход в ресторан после закрытия кредита.",
        action: "Запланируйте небольшую награду за выполнение следующей финансовой цели.",
        check: { type: "explanation", question: "Почему 'неограниченные' траты на радость ведут к выгоранию?" }
      }
    },

    // 11.1 - 11.2
    "ml_scarcity_mindset": {
      id: "ml_scarcity_mindset",
      skillId: "skill_abundance_vs_scarcity",
      title: "1.4. Психология дефицита",
      content: {
        context: "Когда кажется, что ресурсов мало, мозг 'глупеет' и принимает плохие решения.",
        essence: "Дефицит — это туннельное зрение. Вы видите только проблему, но не решение.",
        example: "Покупка дешевых некачественных вещей, которые ломаются через неделю.",
        action: "Вспомните покупку, которую вы совершили из страха 'завтра не будет'.",
        check: { type: "explanation", question: "Как страх дефицита мешает инвестировать в долгую?" }
      }
    },
    "ml_gratitude_practice": {
      id: "ml_gratitude_practice",
      skillId: "skill_abundance_vs_scarcity",
      title: "1.5. Практика изобилия",
      content: {
        context: "Фокус на том, что есть, открывает новые возможности.",
        essence: "Изобилие — это не количество денег, а состояние 'мне достаточно'.",
        example: "Замечать бесплатные ресурсы (связи, знания), которые уже у вас есть.",
        action: "Напишите 3 актива (не деньги), которые помогают вам зарабатывать.",
        check: { type: "explanation", question: "Почему благодарность — это финансовый инструмент?" }
      }
    },
    "ml_shame_neutralization": {
      id: "ml_shame_neutralization",
      skillId: "skill_money_emotions",
      title: "1.6. Нейтрализация стыда",
      content: {
        context: "Стыд парализует действия. Нужно разделить свою ценность и цифру на счету.",
        essence: "Деньги — это просто инструмент, а не мерило вашей доброты или ума.",
        example: "Чувство вины за покупку дорогого кофе при наличии кредитов.",
        action: "Скажите вслух: 'Мои ошибки в прошлом не определяют моё будущее'.",
        check: { type: "explanation", question: "Почему сокрытие долгов от близких только увеличивает финансовую яму?" }
      }
    },
    "ml_anxiety_management": {
      id: "ml_anxiety_management",
      skillId: "skill_money_emotions",
      title: "1.7. Управление тревогой",
      content: {
        context: "Тревога толкает на хаотичные продажи активов на дне.",
        essence: "Тревога лечится фактами. Заменяйте 'а вдруг всё рухнет' на 'у меня есть план X'.",
        example: "Проверка курса валют каждые 5 минут.",
        action: "Запишите свой худший финансовый сценарий и 3 шага, что вы будете делать.",
        check: { type: "explanation", question: "Как наличие 'подушки безопасности' меняет физиологию принятия решений?" }
      }
    },
    "ml_diversification_income": {
      id: "ml_diversification_income",
      skillId: "skill_income_resilience",
      title: "2.3. Диверсификация дохода",
      content: {
        context: "Один источник дохода — это прогулка по канату без страховки.",
        essence: "Ваша цель: создать 3+ независимых потока (работа, хобби, капитал).",
        example: "ЗП + сдача квартиры + фриланс по выходным.",
        action: "Придумайте, как вы можете заработать $10 в дополнение к основной работе.",
        check: { type: "explanation", question: "Почему даже маленькие доп. потоки критически важны в кризис?" }
      }
    },
    "ml_emergency_skills": {
      id: "ml_emergency_skills",
      skillId: "skill_income_resilience",
      title: "2.4. Навыки выживания",
      content: {
        context: "Ваши знания — это то, что нельзя отобрать.",
        essence: "Emergency Skill — это навык, который быстро даст деньги, если вас уволят завтра.",
        example: "Умение водить авто, знание Excel, умение быстро настраивать рекламу.",
        action: "Запишите 2 навыка, за которые вам платили или могли бы заплатить прямо сейчас.",
        check: { type: "explanation", question: "Чем отличается 'профессия' от 'навыка монетизации'?" }
      }
    },
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
    "ml_leaks_audit": {
      id: "ml_leaks_audit",
      skillId: "skill_expense_optimization",
      title: "3.6. Денежные дыры",
      content: {
        context: "Дыры — это траты, которые не дают радости, но происходят на автомате.",
        essence: "Обычно это комиссии, штрафы и ненужные доп. услуги.",
        example: "Платное СМС-информирование, которым вы не пользуетесь.",
        action: "Проверьте выписку на наличие мелких регулярных комиссий.",
        check: { type: "explanation", question: "Как $1 в день превращается в упущенную выгоду через 10 лет?" }
      }
    },
    "ml_monetize_skills": {
      id: "ml_monetize_skills",
      skillId: "skill_side_hustles",
      title: "2.5. Монетизация навыков",
      content: {
        context: "Ваше хобби может стать фундаментом для второго дохода.",
        essence: "Первые деньги вне работы ломают барьер 'я только наемник'.",
        example: "Продажа первой консультации или изделия.",
        action: "Назовите один свой навык, за который люди готовы платить.",
        check: { type: "explanation", question: "В чем риск превращения хобби в работу?" }
      }
    },
    "ml_micro_tasks": {
      id: "ml_micro_tasks",
      skillId: "skill_side_hustles",
      title: "2.6. Микро-задачи",
      content: {
        context: "Миллион начинается с рубля, заработанного в свободную минуту.",
        essence: "Используйте телефон не для скроллинга, а для выполнения простых заданий.",
        example: "Тестирование приложений или опросы.",
        action: "Зарегистрируйтесь на любой платформе микро-задач.",
        check: { type: "explanation", question: "Почему нельзя застревать на микро-задачах долго?" }
      }
    },
    "ml_cashflow_tracking": {
      id: "ml_cashflow_tracking",
      skillId: "skill_cashflow_basics",
      title: "3.2. Трекинг потока",
      content: {
        context: "Нельзя управлять тем, что не считаешь.",
        essence: "Фиксируйте траты в момент покупки, чтобы мозг чувствовал расход.",
        example: "Использование приложения для учета финансов.",
        action: "Запишите свою последнюю трату прямо сейчас.",
        check: { type: "explanation", question: "Как учет снижает тревожность?" }
      }
    },
    "ml_risk_profile": {
      id: "ml_risk_profile",
      skillId: "skill_portfolio_basics",
      title: "11.2. Риск-профиль",
      content: {
        context: "Инвестиции — это не про доход, а про крепкий сон.",
        essence: "Ваш портфель должен соответствовать вашей готовности к потерям.",
        example: "Консерватор держит больше облигаций, агрессор — акций.",
        action: "Решите, сколько % падения счета вы выдержите без паники?",
        check: { type: "explanation", question: "Почему нельзя копировать чужие портфели?" }
      }
    }
    // and more...
  }
};
