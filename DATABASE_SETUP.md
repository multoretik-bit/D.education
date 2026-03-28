---
Как настроить Базу Данных (Всего 1 Шаг)
---

**ОТКРОЙТЕ ССЫЛКУ:** 
Перейдите по своей ссылке в SQL редактор Supabase: 
[https://supabase.com/dashboard/project/jjjkypymutcvrlngyhtt/sql/new](https://supabase.com/dashboard/project/jjjkypymutcvrlngyhtt/sql/new)

**ВСТАВЬТЕ И ЗАПУСТИТЕ ЭТОТ КОД:**
(Скопируйте всё, что ниже, вставьте в редактор и нажмите зеленую кнопку **RUN**)

```sql
-- Создаем таблицу для сохранения прогресса (логинов)
create table user_progress (
  user_id text primary key,
  data jsonb,
  last_updated timestamp with time zone default timezone('utc'::text, now())
);

-- Включаем публичный доступ (чтобы можно было сохранять без бэкенда)
alter table user_progress enable row level security;
create policy "Allow public access" on user_progress for all using (true);
```

С этой таблицей сайт сможет запоминать ваше прохождение на ВЕКА! 
Остался дело за малым — я сейчас обновляю `app.js`.
