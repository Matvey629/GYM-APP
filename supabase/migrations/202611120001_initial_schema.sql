-- Initial Gym App schema. User-owned rows are protected by Row Level Security.

create extension if not exists pgcrypto with schema extensions;

create table public.muscle_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age smallint check (age between 14 and 100),
  height_cm numeric(5, 2) check (height_cm between 100 and 240),
  weight_kg numeric(6, 2) check (weight_kg between 30 and 300),
  sex text not null default 'unspecified' check (sex in ('female', 'male', 'unspecified')),
  goal text not null check (goal in ('muscle', 'strength', 'weight-loss', 'fitness')),
  experience text not null check (experience in ('beginner', 'intermediate', 'advanced')),
  workouts_per_week smallint not null check (workouts_per_week between 1 and 7),
  limitations text not null default '',
  preferences text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  primary_muscle_group_id uuid not null references public.muscle_groups(id),
  equipment_id uuid references public.equipment(id),
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  movement_type text not null,
  image_url text,
  video_url text,
  instructions text[] not null default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercises_primary_muscle_group_idx on public.exercises(primary_muscle_group_id);
create index exercises_equipment_idx on public.exercises(equipment_id);
create index exercises_published_name_idx on public.exercises(is_published, name);

create table public.exercise_muscle_groups (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  muscle_group_id uuid not null references public.muscle_groups(id),
  role text not null check (role in ('primary', 'secondary')),
  primary key (exercise_id, muscle_group_id)
);

create unique index exercise_one_primary_muscle_idx on public.exercise_muscle_groups(exercise_id)
  where role = 'primary';

create table public.exercise_alternatives (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  alternative_exercise_id uuid not null references public.exercises(id) on delete cascade,
  primary key (exercise_id, alternative_exercise_id),
  check (exercise_id <> alternative_exercise_id)
);

create table public.profile_equipment (
  user_id uuid not null references auth.users(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id),
  primary key (user_id, equipment_id)
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  days_per_week smallint not null check (days_per_week between 1 and 7),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_public or user_id is not null)
);

create index programs_user_created_idx on public.programs(user_id, created_at desc);

create table public.program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  day_order smallint not null check (day_order between 1 and 7),
  weekday smallint check (weekday between 0 and 6),
  title text not null,
  unique (program_id, day_order)
);

create table public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references public.program_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  position smallint not null check (position > 0),
  target_sets smallint not null check (target_sets between 1 and 20),
  reps_min smallint not null check (reps_min between 1 and 100),
  reps_max smallint not null check (reps_max between reps_min and 100),
  rest_seconds smallint not null check (rest_seconds between 0 and 900),
  unique (program_day_id, position)
);

create index program_exercises_day_idx on public.program_exercises(program_day_id, position);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  title text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  check (finished_at is null or finished_at >= started_at)
);

create index workouts_user_started_idx on public.workouts(user_id, started_at desc);
create index workouts_user_status_idx on public.workouts(user_id, status);
create unique index workouts_one_open_per_user_idx on public.workouts(user_id)
  where status in ('active', 'paused');

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  position smallint not null check (position > 0),
  unique (workout_id, position)
);

create index workout_exercises_workout_idx on public.workout_exercises(workout_id, position);

create table public.sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number smallint not null check (set_number > 0),
  reps smallint not null check (reps between 0 and 1000),
  weight_kg numeric(7, 2) not null default 0 check (weight_kg >= 0),
  rest_seconds smallint not null default 90 check (rest_seconds between 0 and 3600),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workout_exercise_id, set_number)
);

create index sets_workout_exercise_idx on public.sets(workout_exercise_id, set_number);

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(6, 2) not null check (weight_kg between 30 and 300),
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index body_measurements_user_date_idx on public.body_measurements(user_id, measured_at desc);

create table public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_type text not null check (goal_type in ('muscle', 'strength', 'weight-loss', 'fitness')),
  target_value numeric(8, 2),
  unit text,
  starts_at date not null default current_date,
  ends_at date,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create index user_goals_user_date_idx on public.user_goals(user_id, starts_at desc);

create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  weight_kg numeric(7, 2) not null check (weight_kg >= 0),
  reps smallint not null check (reps > 0),
  achieved_at timestamptz not null default now(),
  workout_id uuid references public.workouts(id) on delete set null,
  unique (user_id, exercise_id, weight_kg, reps, achieved_at)
);

create index personal_records_user_exercise_date_idx on public.personal_records(user_id, exercise_id, achieved_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger programs_set_updated_at before update on public.programs
  for each row execute function public.set_updated_at();
create trigger exercises_set_updated_at before update on public.exercises
  for each row execute function public.set_updated_at();

alter table public.muscle_groups enable row level security;
alter table public.equipment enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_muscle_groups enable row level security;
alter table public.exercise_alternatives enable row level security;
alter table public.profile_equipment enable row level security;
alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.program_days enable row level security;
alter table public.program_exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.sets enable row level security;
alter table public.body_measurements enable row level security;
alter table public.user_goals enable row level security;
alter table public.personal_records enable row level security;

create policy "Published muscle groups are readable" on public.muscle_groups
  for select using (true);
create policy "Equipment catalog is readable" on public.equipment
  for select using (true);
create policy "Published exercises are readable" on public.exercises
  for select using (is_published);
create policy "Exercise muscle groups are readable" on public.exercise_muscle_groups
  for select using (exists (select 1 from public.exercises e where e.id = exercise_id and e.is_published));
create policy "Exercise alternatives are readable" on public.exercise_alternatives
  for select using (exists (select 1 from public.exercises e where e.id = exercise_id and e.is_published));
create policy "Users access own equipment preferences" on public.profile_equipment
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users read own profile" on public.profiles
  for select using ((select auth.uid()) = user_id);
create policy "Users create own profile" on public.profiles
  for insert with check ((select auth.uid()) = user_id);
create policy "Users update own profile" on public.profiles
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own profile" on public.profiles
  for delete using ((select auth.uid()) = user_id);

create policy "Users read own or public programs" on public.programs
  for select using (is_public or (select auth.uid()) = user_id);
create policy "Users create own programs" on public.programs
  for insert with check ((select auth.uid()) = user_id and not is_public);
create policy "Users update own programs" on public.programs
  for update using ((select auth.uid()) = user_id and not is_public)
  with check ((select auth.uid()) = user_id and not is_public);
create policy "Users delete own programs" on public.programs
  for delete using ((select auth.uid()) = user_id and not is_public);

create policy "Users read days of own or public programs" on public.program_days
  for select using (exists (
    select 1 from public.programs p
    where p.id = program_id and (p.is_public or p.user_id = (select auth.uid()))
  ));
create policy "Users add days to own programs" on public.program_days
  for insert with check (exists (
    select 1 from public.programs p
    where p.id = program_id and p.user_id = (select auth.uid()) and not p.is_public
  ));
create policy "Users update days of own programs" on public.program_days
  for update using (exists (
    select 1 from public.programs p
    where p.id = program_id and p.user_id = (select auth.uid()) and not p.is_public
  )) with check (exists (
    select 1 from public.programs p
    where p.id = program_id and p.user_id = (select auth.uid()) and not p.is_public
  ));
create policy "Users delete days of own programs" on public.program_days
  for delete using (exists (
    select 1 from public.programs p
    where p.id = program_id and p.user_id = (select auth.uid()) and not p.is_public
  ));

create policy "Users read exercises of own or public program days" on public.program_exercises
  for select using (exists (
    select 1 from public.program_days d join public.programs p on p.id = d.program_id
    where d.id = program_day_id and (p.is_public or p.user_id = (select auth.uid()))
  ));
create policy "Users add exercises to own program days" on public.program_exercises
  for insert with check (exists (
    select 1 from public.program_days d join public.programs p on p.id = d.program_id
    where d.id = program_day_id and p.user_id = (select auth.uid()) and not p.is_public
  ) and exists (select 1 from public.exercises e where e.id = exercise_id and e.is_published));
create policy "Users update exercises in own program days" on public.program_exercises
  for update using (exists (
    select 1 from public.program_days d join public.programs p on p.id = d.program_id
    where d.id = program_day_id and p.user_id = (select auth.uid()) and not p.is_public
  ) and exists (select 1 from public.exercises e where e.id = exercise_id and e.is_published)) with check (exists (
    select 1 from public.program_days d join public.programs p on p.id = d.program_id
    where d.id = program_day_id and p.user_id = (select auth.uid()) and not p.is_public
  ) and exists (select 1 from public.exercises e where e.id = exercise_id and e.is_published));
create policy "Users delete exercises in own program days" on public.program_exercises
  for delete using (exists (
    select 1 from public.program_days d join public.programs p on p.id = d.program_id
    where d.id = program_day_id and p.user_id = (select auth.uid()) and not p.is_public
  ));

create policy "Users access own workouts" on public.workouts
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (
    program_id is null or exists (
      select 1 from public.programs p
      where p.id = program_id and (p.is_public or p.user_id = (select auth.uid()))
    )
  ));
create policy "Users access exercises in own workouts" on public.workout_exercises
  for all using (exists (
    select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid())
  )) with check (exists (
    select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid())
  ) and exists (select 1 from public.exercises e where e.id = exercise_id and e.is_published));
create policy "Users access sets in own workouts" on public.sets
  for all using (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = (select auth.uid())
  )) with check (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = (select auth.uid())
  ));

create policy "Users access own body measurements" on public.body_measurements
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users access own goals" on public.user_goals
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users access own personal records" on public.personal_records
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and exists (
    select 1 from public.exercises e where e.id = exercise_id and e.is_published
  ) and (workout_id is null or exists (
    select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid())
  )));
