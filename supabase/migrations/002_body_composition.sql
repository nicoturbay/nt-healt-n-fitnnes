-- Body Composition Logs
-- Tracks smart scale KPIs over time
-- One row per weigh-in (sent manually via Discord or pulled via API)

create table if not exists body_composition_logs (
  id            bigint primary key,            -- Date.now() ms timestamp
  date          date not null,
  time          time,
  weight_lb     numeric(5,1),
  bmi           numeric(4,1),
  body_fat_pct  numeric(4,1),                  -- % body fat
  fat_free_lb   numeric(5,1),                  -- fat-free body weight lbs
  subcut_fat_pct numeric(4,1),                 -- subcutaneous fat %
  body_water_pct numeric(4,1),                 -- body water %
  skeletal_muscle_pct numeric(4,1),            -- skeletal muscle %
  muscle_mass_lb numeric(5,1),                 -- muscle mass lbs
  bone_mass_lb  numeric(4,1),                  -- bone mass lbs
  bmr_kcal      integer,                       -- basal metabolic rate kcal
  visceral_fat  integer,                       -- visceral fat rating (1–59)
  protein_pct   numeric(4,1),                  -- protein %
  metabolic_age integer,                       -- metabolic age (years)
  source        text default 'smart-scale',
  created_at    timestamptz default now()
);

-- Enable RLS
alter table body_composition_logs enable row level security;

-- Allow all reads and writes (same pattern as other tables)
create policy "Allow all" on body_composition_logs for all using (true) with check (true);

-- Index for date-based queries
create index if not exists idx_body_comp_date on body_composition_logs(date desc);
