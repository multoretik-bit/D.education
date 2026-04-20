---
Как настроить Базу Данных (Версия 2.0 - Надежная)
---

**ОТКРОЙТЕ ССЫЛКУ:** 
Перейдите в SQL редактор Supabase: 
[https://supabase.com/dashboard/project/jjjkypymutcvrlngyhtt/sql/new](https://supabase.com/dashboard/project/jjjkypymutcvrlngyhtt/sql/new)

**ВСТАВЬТЕ И ЗАПУСТИТЕ ЭТОТ КОД:**
(Этот код создаст отдельные таблицы для каждого типа данных, чтобы ничего не терялось)

```sql
-- 1. Удаляем старую политику если есть (для обновления)
drop policy if exists "Allow public access" on user_progress;

-- 2. Таблица профиля (XP, монеты, стрик)
create table if not exists user_profiles (
  user_id text primary key,
  xp integer default 0,
  coins integer default 0,
  streak integer default 0,
  last_activity date,
  last_updated timestamp with time zone default now()
);

-- 3. Таблица прогресса уроков
create table if not exists user_lessons (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  lesson_id text not null,
  status text default 'new', -- 'new', 'in_progress', 'completed'
  progress integer default 0,
  last_updated timestamp with time zone default now(),
  unique(user_id, lesson_id)
);

-- 4. Таблица карточек (Anki)
create table if not exists user_cards (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  card_id text not null,
  interval integer default 0,
  ease_factor float default 2.5,
  next_review timestamp with time zone,
  know_count integer default 0,
  last_updated timestamp with time zone default now(),
  unique(user_id, card_id)
);

-- 5. Таблица расписания
create table if not exists user_schedule (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  day_of_week integer, -- 0-6
  task_date date, -- для конкретных дат
  task_id text not null,
  task_type text default 'lesson', -- 'lesson', 'course'
  start_time time not null,
  duration integer default 60,
  is_recurring boolean default false,
  is_completed boolean default false,
  last_updated timestamp with time zone default now()
);

-- 6. Таблица кастомного контента (ваши курсы и уроки)
create table if not exists user_custom_content (
  id text primary key,
  user_id text not null,
  content_type text not null, -- 'area', 'subsystem', 'skill', 'lesson'
  parent_id text,
  data jsonb,
  last_updated timestamp with time zone default now()
);

-- Включаем доступ (RLS)
alter table user_profiles enable row level security;
alter table user_lessons enable row level security;
alter table user_cards enable row level security;
alter table user_schedule enable row level security;
alter table user_custom_content enable row level security;

create policy "Public Profile Access" on user_profiles for all using (true) with check (true);
create policy "Public Lessons Access" on user_lessons for all using (true) with check (true);
create policy "Public Cards Access" on user_cards for all using (true) with check (true);
create policy "Public Schedule Access" on user_schedule for all using (true) with check (true);
create policy "Public Content Access" on user_custom_content for all using (true) with check (true);
```
