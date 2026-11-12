import type { BodyMeasurement, WorkoutSession } from '@/types/gym';
import { getExercise } from '@/features/exercises/catalog';

export type AnalyticsRange = '4w' | '12w' | 'all';
export type WeightPoint = { workoutId: string; date: string; weightKg: number; reps: number };
export type PersonalRecord = { exerciseId: string; weightKg: number; reps: number; date: string };
export type MuscleLoad = { muscleGroup: string; volumeKg: number; completedSets: number };
export type WeeklyLoad = { weekStart: Date; volumeKg: number; workouts: number };

export function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

export function getRangeStart(range: AnalyticsRange, now: Date, workouts: WorkoutSession[]) {
  if (range === 'all') {
    const first = workouts.reduce<Date | null>((earliest, workout) => {
      const date = new Date(workout.startedAt);
      return !earliest || date < earliest ? date : earliest;
    }, null);
    return first ? startOfWeek(first) : startOfWeek(now);
  }

  const weeks = range === '4w' ? 4 : 12;
  const start = startOfWeek(now);
  start.setDate(start.getDate() - (weeks - 1) * 7);
  return start;
}

export function buildAnalytics(workouts: WorkoutSession[], range: AnalyticsRange, now = new Date()) {
  const completed = workouts.filter((workout) => workout.status === 'completed');
  const rangeStart = getRangeStart(range, now, completed);
  const recent = completed.filter((workout) => new Date(workout.startedAt) >= rangeStart && new Date(workout.startedAt) <= now);
  const weeksInRange = range === '4w'
    ? 4
    : range === '12w'
      ? 12
      : Math.max(1, Math.ceil((now.getTime() - rangeStart.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const chartWeeks = Math.min(12, weeksInRange);
  const currentWeek = startOfWeek(now);
  const weeklyLoad: WeeklyLoad[] = Array.from({ length: chartWeeks }, (_, index) => {
    const weekStart = new Date(currentWeek);
    weekStart.setDate(weekStart.getDate() - (chartWeeks - index - 1) * 7);
    return { weekStart, volumeKg: 0, workouts: 0 };
  });

  const personalRecords = new Map<string, PersonalRecord>();
  const loadByMuscle = new Map<string, MuscleLoad>();
  const weightPoints = new Map<string, WeightPoint[]>();
  let totalVolumeKg = 0;
  let completedSets = 0;
  let totalReps = 0;

  for (const workout of completed) {
    const workoutDate = new Date(workout.startedAt);
    const inRange = workoutDate >= rangeStart && workoutDate <= now;
    const weekIndex = Math.floor((startOfWeek(workoutDate).getTime() - weeklyLoad[0]!.weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (inRange && weeklyLoad[weekIndex]) weeklyLoad[weekIndex]!.workouts += 1;

    for (const exercise of workout.exercises) {
      const points = exercise.sets.filter((set) => set.completed);
      if (points.length === 0) continue;
      const maxSet = points.reduce((best, set) => set.weightKg > best.weightKg || (set.weightKg === best.weightKg && set.reps > best.reps) ? set : best);
      const previousRecord = personalRecords.get(exercise.exerciseId);
      if (!previousRecord || maxSet.weightKg > previousRecord.weightKg || (maxSet.weightKg === previousRecord.weightKg && maxSet.reps > previousRecord.reps)) {
        personalRecords.set(exercise.exerciseId, { exerciseId: exercise.exerciseId, weightKg: maxSet.weightKg, reps: maxSet.reps, date: workout.finishedAt ?? workout.startedAt });
      }

      if (inRange) {
        if (maxSet.weightKg > 0) {
          const currentPoints = weightPoints.get(exercise.exerciseId) ?? [];
          currentPoints.push({ workoutId: workout.id, date: workout.finishedAt ?? workout.startedAt, weightKg: maxSet.weightKg, reps: maxSet.reps });
          weightPoints.set(exercise.exerciseId, currentPoints);
        }
      }

      if (!inRange) continue;
      if (weeklyLoad[weekIndex]) {
        const weeklyVolume = points.reduce((sum, set) => sum + set.weightKg * set.reps, 0);
        weeklyLoad[weekIndex]!.volumeKg += weeklyVolume;
      }
      const muscleGroup = getExercise(exercise.exerciseId)?.muscleGroup ?? 'Другое';
      const muscle = loadByMuscle.get(muscleGroup) ?? { muscleGroup, volumeKg: 0, completedSets: 0 };
      for (const set of points) {
        completedSets += 1;
        totalReps += set.reps;
        const volume = set.weightKg * set.reps;
        totalVolumeKg += volume;
        muscle.volumeKg += volume;
        muscle.completedSets += 1;
      }
      loadByMuscle.set(muscleGroup, muscle);
    }
  }

  return {
    rangeStart,
    recent,
    completedCount: recent.length,
    weeksInRange,
    averageWorkoutsPerWeek: recent.length / weeksInRange,
    completedSets,
    totalReps,
    totalVolumeKg,
    weeklyLoad,
    personalRecords: Array.from(personalRecords.values()).sort((a, b) => b.weightKg - a.weightKg || b.reps - a.reps),
    muscleLoad: Array.from(loadByMuscle.values()).sort((a, b) => b.volumeKg - a.volumeKg || b.completedSets - a.completedSets),
    workingWeights: Array.from(weightPoints.entries())
      .map(([exerciseId, points]) => ({ exerciseId, points: points.sort((a, b) => a.date.localeCompare(b.date)) }))
      .sort((a, b) => b.points.length - a.points.length),
  };
}

export function filterMeasurements(measurements: BodyMeasurement[], rangeStart: Date, now = new Date()) {
  return measurements
    .filter((measurement) => {
      const date = new Date(measurement.measuredAt);
      return date >= rangeStart && date <= now;
    })
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
}
