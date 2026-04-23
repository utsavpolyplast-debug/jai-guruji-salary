-- ============================================================
-- JAI GURU JI SALARY APP — SUPABASE SQL
-- Supabase Dashboard → SQL Editor mein yeh paste karke Run karo
-- ============================================================

-- 1. Employees table
create table if not exists employees (
  id          text primary key,
  name        text not null,
  desig       text,
  machine     text default 'Normal',
  saltype     text default 'fixed',
  fixed       numeric default 0,
  daily       numeric default 0,
  created_at  timestamptz default now()
);

-- 2. Salary data table
create table if not exists salary_data (
  id          bigserial primary key,
  emp_id      text references employees(id) on delete cascade,
  year        int not null,
  month       int not null,
  days        numeric default 0,
  sat         numeric default 0,
  ot          numeric default 0,
  advance     numeric default 0,
  other_dedn  numeric default 0,
  updated_at  timestamptz default now(),
  unique(emp_id, year, month)
);

-- 3. Enable Row Level Security (open for now — production mein auth add karna)
alter table employees enable row level security;
alter table salary_data enable row level security;

create policy "Allow all" on employees for all using (true) with check (true);
create policy "Allow all" on salary_data for all using (true) with check (true);
