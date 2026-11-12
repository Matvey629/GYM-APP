import { createId } from '@/lib/ids';
import type { ProgramDay, WorkoutProgram } from '@/types/gym';

type PlannedExercise = readonly [id: string, sets: number, min: number, max: number, rest: number, restLabel: string, rir: string];

const days: { title: string; weekday: number; exercises: PlannedExercise[] }[] = [
  { title: 'PUSH', weekday: 1, exercises: [
    ['barbell-bench-press', 3, 6, 8, 150, '2–3 мин', '2'], ['incline-dumbbell-press', 3, 8, 12, 120, '2 мин', '2'],
    ['chest-press-machine', 2, 10, 12, 105, '90–120 сек', '1–2'], ['cable-lateral-raise', 3, 12, 20, 75, '60–90 сек', '1–2'],
    ['rope-triceps-pushdown', 3, 10, 15, 75, '60–90 сек', '1–2'], ['overhead-cable-triceps-extension', 2, 10, 15, 75, '60–90 сек', '1–2'],
  ] },
  { title: 'PULL', weekday: 2, exercises: [
    ['weighted-pull-up-or-pulldown', 3, 6, 10, 150, '2–3 мин', '2'], ['chest-supported-row', 3, 8, 12, 120, '2 мин', '1–2'],
    ['seated-cable-row', 2, 10, 15, 105, '90–120 сек', '1–2'], ['cable-pullover', 2, 12, 15, 75, '60–90 сек', '1–2'],
    ['reverse-fly-machine', 3, 12, 20, 75, '60–90 сек', '1–2'], ['preacher-curl-or-cable', 3, 8, 12, 75, '60–90 сек', '1–2'],
    ['hammer-curl', 2, 10, 15, 75, '60–90 сек', '1–2'],
  ] },
  { title: 'Плечи + ноги', weekday: 4, exercises: [
    ['cable-lateral-raise', 4, 12, 20, 75, '60–90 сек', '1–2'], ['machine-lateral-raise', 3, 12, 20, 75, '60–90 сек', '1–2'],
    ['reverse-fly-machine', 3, 12, 20, 75, '60–90 сек', '1–2'], ['machine-shoulder-press', 2, 8, 12, 120, '2 мин', '2'],
    ['barbell-squat-or-leg-press', 3, 6, 10, 150, '2–3 мин', '2–3'], ['romanian-deadlift', 3, 6, 10, 150, '2–3 мин', '2–3'],
    ['seated-leg-curl', 2, 10, 15, 90, '90 сек', '1–2'], ['standing-calf-raise', 2, 10, 15, 75, '60–90 сек', '1–2'],
  ] },
  { title: 'UPPER', weekday: 6, exercises: [
    ['dumbbell-bench-press', 3, 8, 12, 120, '2 мин', '1–2'], ['weighted-pull-up-or-pulldown', 3, 8, 12, 120, '2 мин', '1–2'],
    ['cable-crossover', 2, 12, 15, 75, '60–90 сек', '1–2'], ['horizontal-row-machine', 3, 8, 12, 105, '90–120 сек', '1–2'],
    ['cable-or-machine-lateral-raise', 2, 15, 20, 75, '60–90 сек', '2'], ['cable-curl', 2, 10, 15, 75, '60–90 сек', '1–2'],
    ['cable-triceps-extension', 2, 10, 15, 75, '60–90 сек', '1–2'],
  ] },
];

const workbookDays: ProgramDay[] = days.map((day) => ({
  title: day.title,
  weekday: day.weekday,
  exercises: day.exercises.map(([exerciseId, sets, repsMin, repsMax, restSeconds, restLabel, rir]) => ({
    exerciseId, sets, repsMin, repsMax, restSeconds, restLabel, rir,
  })),
}));

export function createWorkbookProgram(): WorkoutProgram {
  return {
    id: createId(),
    name: 'Моя программа · черновик из таблицы',
    description: '4 тренировки в неделю · веса и фактические повторы пока не заполнены. Прогрессия: сначала верх диапазона во всех подходах с заданным RIR и чистой техникой, затем прибавить 2–5% в базовых упражнениях. При накопленной усталости — разгрузочная неделя: на 30–50% меньше подходов и RIR 3–4. Если восстановление ухудшится, убрать 2 подхода разведений в воскресной тренировке. В таблице также отмечены разминка перед первым тяжёлым упражнением, приоритет средней дельты, поддерживающий объём ног и регулярный учёт веса, повторов и RIR.',
    daysPerWeek: workbookDays.length,
    createdAt: new Date().toISOString(),
    days: workbookDays,
  };
}
