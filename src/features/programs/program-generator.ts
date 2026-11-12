import { EXERCISES } from '@/features/exercises/catalog';
import { createId } from '@/lib/ids';
import type { ProgramDay, ProgramExercise, UserProfile, WorkoutProgram } from '@/types/gym';

const SPLITS = [
  ['Всё тело A', 'Всё тело B'],
  ['Всё тело A', 'Всё тело B', 'Всё тело C'],
  ['Верх тела', 'Низ тела', 'Верх тела', 'Низ тела'],
];
function scheduleForFrequency(frequency: number) {
  const schedules: Record<number, number[]> = {
    1: [2],
    2: [1, 4],
    3: [0, 2, 4],
    4: [0, 1, 3, 5],
    5: [0, 1, 3, 4, 6],
    6: [0, 1, 2, 4, 5, 6],
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  return schedules[frequency] ?? schedules[3] ?? [];
}

function availableForProfile(equipment: string[]) {
  if (equipment.includes('Зал полностью')) return EXERCISES;
  return EXERCISES.filter((exercise) => {
    const requirement = exercise.equipment.toLowerCase();
    return (
      (equipment.includes('Гантели') && requirement.includes('гантел')) ||
      (equipment.includes('Штанга и скамья') && requirement.includes('штанг')) ||
      (equipment.includes('Тренажёры') && requirement.includes('тренажёр')) ||
      (equipment.includes('Собственный вес') && requirement.includes('собственный вес')) ||
      (equipment.includes('Резинки') && requirement.includes('резин'))
    );
  });
}

function goalReps(goal: UserProfile['goal']) {
  if (goal === 'strength') return [4, 6] as const;
  if (goal === 'muscle') return [8, 12] as const;
  if (goal === 'weight-loss') return [10, 15] as const;
  return [8, 12] as const;
}

function makeDay(title: string, weekday: number, profile: UserProfile, rotation: number, pool = availableForProfile(profile.equipment)): ProgramDay {
  const targetCount = Math.min(5, pool.length);
  const [repsMin, repsMax] = goalReps(profile.goal);
  const exercises: ProgramExercise[] = [];

  for (let index = 0; index < targetCount; index += 1) {
    const exercise = pool[(rotation * 3 + index) % pool.length];
    if (!exercise || exercises.some((item) => item.exerciseId === exercise.id)) continue;
    exercises.push({
      exerciseId: exercise.id,
      sets: profile.experience === 'beginner' ? 3 : 4,
      repsMin,
      repsMax,
      restSeconds: profile.goal === 'strength' ? 150 : 90,
    });
  }

  return { title, weekday, exercises };
}

export function createStarterProgram(profile: UserProfile): WorkoutProgram {
  const pool = availableForProfile(profile.equipment);
  const usefulPool = pool.length > 0 ? pool : EXERCISES.filter((exercise) => exercise.equipment === 'Собственный вес');
  const split = profile.workoutsPerWeek <= 2 ? SPLITS[0] : profile.workoutsPerWeek === 3 ? SPLITS[1] : SPLITS[2];
  const schedule = scheduleForFrequency(profile.workoutsPerWeek);
  const days = Array.from({ length: profile.workoutsPerWeek }, (_, index) =>
    makeDay(split[index % split.length], schedule[index] ?? index % 7, profile, index, usefulPool),
  );
  const goalNames = {
    muscle: 'Набор мышечной массы',
    strength: 'Сила и базовые движения',
    'weight-loss': 'Активный ритм',
    fitness: 'Общая физическая форма',
  };

  return {
    id: createId(),
    name: `Старт: ${goalNames[profile.goal]}`,
    description: `${profile.workoutsPerWeek} тренировки в неделю · ${profile.experience === 'beginner' ? 'начальный уровень' : 'с учётом твоего опыта'}`,
    daysPerWeek: profile.workoutsPerWeek,
    createdAt: new Date().toISOString(),
    days,
  };
}
