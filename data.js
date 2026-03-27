/* D-Education Data Architecture v2 */

const KNOWLEDGE_BASE = {
  areas: [
    {
      id: "finance",
      title: "Финансы",
      icon: "cash-outline",
      subsystems: ["fin_income", "fin_invest", "fin_taxes", "fin_psychology"]
    },
    {
      id: "psychology",
      title: "Психология",
      icon: "brain-outline",
      subsystems: []
    },
    {
      id: "health",
      title: "Здоровье",
      icon: "heart-outline",
      subsystems: []
    }
  ],
  subsystems: {
    "fin_psychology": {
      id: "fin_psychology",
      areaId: "finance",
      title: "Психология денег",
      skills: ["skill_money_mindset", "skill_spending_control"]
    },
    "fin_invest": {
      id: "fin_invest",
      areaId: "finance",
      title: "Инвестирование",
      skills: ["skill_etf_basics"]
    }
  },
  skills: {
    "skill_money_mindset": {
      id: "skill_money_mindset",
      title: "Денежное мышление",
      description: "Умение выявлять и менять ограничивающие установки.",
      lessons: ["ml_family_scripts", "ml_fear_of_money"]
    },
    "skill_etf_basics": {
      id: "skill_etf_basics",
      title: "Инвестиции в ETF",
      description: "Умение выбирать и покупать биржевые фонды.",
      lessons: ["ml_what_is_etf", "ml_buy_first_etf"]
    }
  },
  lessons: {
    "ml_family_scripts": {
      id: "ml_family_scripts",
      skillId: "skill_money_mindset",
      title: "Семейные сценарии",
      type: "micro",
      content: {
        context: "Ваши текущие финансовые результаты на 80% зависят от того, что вы слышали о деньгах до 7 лет.",
        essence: "Семейный сценарий — это бессознательная копия поведения родителей. Мы либо повторяем их (сценарий), либо делаем все наоборот (антисценарий), но все равно остаемся несвободными.",
        example: "Если отец копил и во всем себе отказывал, вы можете либо стать 'скупердяем', либо тратить все до копейки, 'мстя' за бедное детство.",
        action: "Напишите 3 фразы о деньгах, которые чаще всего говорили ваши родители. Определите, как каждая из них влияет на ваш кошелек сегодня.",
        check: {
          type: "explanation",
          question: "Объясните своими словами: чем 'антисценарий' опасен для капитала?",
          hint: "Подумайте о том, кто на самом деле принимает решения — вы или ваша обида."
        }
      }
    },
    "ml_buy_first_etf": {
      id: "ml_buy_first_etf",
      skillId: "skill_etf_basics",
      title: "Покупка первого ETF",
      type: "micro",
      content: {
        context: "Инвестирование начинается не с анализа графиков, а с технического действия.",
        essence: "ETF — это корзина из сотен акций. Покупая один пай, вы становитесь совладельцем сразу всех компаний в индексе (например, S&P 500).",
        example: "Вместо того чтобы выбирать между Apple и Tesla, вы покупаете фонд VOO и владеете обоими + еще 498 компаниями.",
        action: "Откройте ваше брокерское приложение, найдите тикер любого индексного фонда (например, IVV или VOO) и добавьте его в 'Избранное'. Если счет открыт — купите 1 лот.",
        check: {
          type: "case",
          question: "У вас есть $1000. Рынок упал на 5%. Ваше действие с ETF?",
          scenario: "Рыночная паника, новости кричат о крахе.",
          hint: "Вспомните про стратегию усреднения (Cost Averaging)."
        }
      }
    }
  }
};
