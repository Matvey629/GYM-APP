import { createId } from '@/lib/ids';
import type { ProgramDay, WorkoutExercise, WorkoutProgram, WorkoutSession, GymAppData } from '@/types/gym';

export function createWorkoutFromDay(program: WorkoutProgram | null, day: ProgramDay | null, history: WorkoutSession[]): WorkoutSession {
  const exercises: WorkoutExercise[] = (day?.exercises ?? []).map((planned) => {
    const previous = history
      .filter((session) => session.status === 'completed')
      .flatMap((session) => session.exercises)
      .find((item) => item.exerciseId === planned.exerciseId);
    const previousSet = previous?.sets.find((set) => set.completed) ?? previous?.sets[0];
    const reps = Math.round((planned.repsMin + planned.repsMax) / 2);
    return {
      id: createId(),
      exerciseId: planned.exerciseId,
      sets: Array.from({ length: planned.sets }, () => ({
        id: createId(),
        reps: previousSet?.reps ?? reps,
        weightKg: previousSet?.weightKg ?? 0,
        restSeconds: planned.restSeconds,
        completed: false,
        completedAt: null,
      })),
    };
  });

  return {
    id: createId(),
    programId: program?.id ?? null,
    title: day?.title ?? program?.name ?? 'Свободная тренировка',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    status: 'active',
    restEndsAt: null,
    exercises,
  };
}

export function startWorkoutData(data: GymAppData, programId?: string): GymAppData {
  if (data.activeWorkout && (!programId || data.activeWorkout.programId === programId)) return data;
  const program = programId
    ? data.programs.find((item) => item.id === programId) ?? null
    : data.programs[0] ?? null;
  if (programId && !program) return data;
  const pausedWorkout = program
    ? data.workouts.find((item) => item.programId === program.id && item.status === 'paused')
    : undefined;
  if (pausedWorkout) {
    return {
      ...data,
      workouts: [
        ...data.workouts.filter((item) => item.id !== pausedWorkout.id),
        ...(data.activeWorkout ? [{ ...data.activeWorkout, status: 'paused' as const }] : []),
      ],
      activeWorkout: { ...pausedWorkout, status: 'active' },
    };
  }
  let day = null;
  if (program) {
    const completedInProgram = data.workouts.filter((item) => item.programId === program.id && item.status === 'completed').length;
    day = program.days[completedInProgram % Math.max(program.days.length, 1)] ?? program.days[0] ?? null;
  }
  const workouts = data.activeWorkout
    ? [...data.workouts, { ...data.activeWorkout, status: 'paused' as const }]
    : data.workouts;
  return { ...data, workouts, activeWorkout: createWorkoutFromDay(program, day, data.workouts) };
}

export function finishWorkoutData(data: GymAppData): GymAppData {
  if (!data.activeWorkout) return data;
  const completed: WorkoutSession = {
    ...data.activeWorkout,
    status: 'completed',
    finishedAt: new Date().toISOString(),
    restEndsAt: null,
  };
  return {
    ...data,
    activeWorkout: null,
    workouts: [completed, ...data.workouts],
  };
}
