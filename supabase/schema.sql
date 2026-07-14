-- NT Fitness — Supabase Schema
-- Run this once in the Supabase SQL editor

create table if not exists meal_logs (
  id bigint primary key,
  date date not null,
  name text not null,
  note text,
  calories integer default 0,
  protein numeric(5,1) default 0,
  carbs numeric(5,1) default 0,
  fat numeric(5,1) default 0,
  source text default 'manual',
  created_at timestamptz default now()
);

create table if not exists weight_log (
  id bigint primary key,
  date date not null,
  weight numeric(5,1) not null,
  created_at timestamptz default now()
);

create table if not exists workout_logs (
  id bigint primary key,
  date date not null,
  workout_key text,
  workout_name text,
  exercises jsonb,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists progress_entries (
  id bigint primary key,
  date date not null,
  weight numeric(5,1),
  note text,
  photos jsonb default '[]',
  source text default 'manual',
  created_at timestamptz default now()
);

create table if not exists nutrition_goals (
  id integer primary key default 1,
  calories integer default 2500,
  protein integer default 180,
  carbs integer default 280,
  fat integer default 80,
  updated_at timestamptz default now()
);

create table if not exists user_profile (
  id integer primary key default 1,
  name text default 'Nicolas Turbay',
  sex text default 'male',
  age integer default 42,
  height_in numeric(4,1) default 71,
  weight_lbs numeric(5,1) default 164,
  goal text,
  experience text,
  notes text,
  updated_at timestamptz default now()
);

-- Enable RLS on all tables
alter table meal_logs enable row level security;
alter table weight_log enable row level security;
alter table workout_logs enable row level security;
alter table progress_entries enable row level security;
alter table nutrition_goals enable row level security;
alter table user_profile enable row level security;

-- Permissive policies — personal app, anon key is the access layer
create policy "allow all" on meal_logs for all using (true) with check (true);
create policy "allow all" on weight_log for all using (true) with check (true);
create policy "allow all" on workout_logs for all using (true) with check (true);
create policy "allow all" on progress_entries for all using (true) with check (true);
create policy "allow all" on nutrition_goals for all using (true) with check (true);
create policy "allow all" on user_profile for all using (true) with check (true);

-- Seed initial data
insert into meal_logs (id, date, name, note, calories, protein, carbs, fat, source)
values (1752515040000, '2026-07-14', 'Raw fish bowl', 'Salmon, tuna, avocado, pickled cucumbers, red onion, light ponzu', 375, 40, 14, 18, 'nutrition-channel')
on conflict (id) do nothing;

insert into user_profile (id, name, sex, age, height_in, weight_lbs)
values (1, 'Nicolas Turbay', 'male', 42, 71, 164)
on conflict (id) do update set age = 42, height_in = 71, weight_lbs = 164, updated_at = now();

insert into nutrition_goals (id, calories, protein, carbs, fat)
values (1, 2500, 180, 280, 80)
on conflict (id) do nothing;
