import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard, AppColors, AppScreen, PageHeading } from '@/components/ui/app-screen';
import { useAppData } from '@/features/app-data/app-data-context';
import { getExercise } from '@/features/exercises/catalog';

export default function ProgressScreen() {
  const { data } = useAppData();
  const completed = data.workouts.filter((workout) => workout.status === 'completed');
  const totalSets = completed.flatMap((workout) => workout.exercises).flatMap((exercise) => exercise.sets).filter((set) => set.completed).length;
  const totalVolume = completed.flatMap((workout) => workout.exercises).flatMap((exercise) => exercise.sets).filter((set) => set.completed).reduce((sum, set) => sum + set.reps * set.weightKg, 0);
  const personalRecords = useMemo(() => {
    const records = new Map<string, { weightKg: number; reps: number; date: string }>();
    for (const workout of [...completed].reverse()) {
      for (const exercise of workout.exercises) {
        for (const set of exercise.sets) {
          const previous = records.get(exercise.exerciseId);
          if (set.completed && (!previous || set.weightKg > previous.weightKg)) {
            records.set(exercise.exerciseId, { weightKg: set.weightKg, reps: set.reps, date: workout.finishedAt ?? workout.startedAt });
          }
        }
      }
    }
    return Array.from(records.entries()).sort((a, b) => b[1].weightKg - a[1].weightKg);
  }, [completed]);
  const muscleVolume = useMemo(() => {
    const groups = new Map<string, number>();
    for (const workout of completed) for (const exercise of workout.exercises) {
      const group = getExercise(exercise.exerciseId)?.muscleGroup ?? 'Другое';
      groups.set(group, (groups.get(group) ?? 0) + exercise.sets.filter((set) => set.completed).length);
    }
    return Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
  }, [completed]);
  const workingWeightTrends = useMemo(() => {
    const trends = new Map<string, number[]>();
    for (const workout of [...completed].reverse()) for (const exercise of workout.exercises) {
      const maxSet = exercise.sets.filter((set) => set.completed).reduce<number | null>((best, set) => best === null || set.weightKg > best ? set.weightKg : best, null);
      if (maxSet !== null && maxSet > 0) trends.set(exercise.exerciseId, [...(trends.get(exercise.exerciseId) ?? []), maxSet]);
    }
    return Array.from(trends.entries()).sort((a, b) => b[1].length - a[1].length).slice(0, 6);
  }, [completed]);
  const weeklyCounts = useMemo(() => Array.from({ length: 4 }, (_, index) => {
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7) - (3 - index) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return { label: index === 3 ? 'Эта' : `${3 - index} нед.`, count: completed.filter((workout) => {
      const date = new Date(workout.startedAt);
      return date >= weekStart && date < weekEnd;
    }).length };
  }), [completed]);
  const maxWeekCount = Math.max(1, ...weeklyCounts.map((week) => week.count));
  const weightTrend = data.measurements.slice(0, 6).reverse();
  const maxWeight = Math.max(...weightTrend.map((item) => item.weightKg), 1);

  return (
    <AppScreen>
      <PageHeading eyebrow="Твоя динамика" title="Прогресс" subtitle="Результаты считаются по завершённым тренировкам и сохранённым замерам." />
      <View style={styles.metrics}>
        <AppCard style={styles.metric}><Text style={styles.metricLabel}>ТРЕНИРОВКИ</Text><Text style={styles.metricValue}>{completed.length}</Text><Text style={styles.metricCaption}>завершено</Text></AppCard>
        <AppCard style={styles.metric}><Text style={styles.metricLabel}>ПОДХОДЫ</Text><Text style={styles.metricValue}>{totalSets}</Text><Text style={styles.metricCaption}>выполнено</Text></AppCard>
        <AppCard style={styles.metric}><Text style={styles.metricLabel}>ОБЪЁМ</Text><Text style={styles.metricValue}>{Math.round(totalVolume / 100) / 10}</Text><Text style={styles.metricCaption}>тонн всего</Text></AppCard>
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Частота тренировок</Text>
        <View style={styles.weeklyChart}>{weeklyCounts.map((week) => <View key={week.label} style={styles.weekColumn}><Text style={styles.weightValue}>{week.count}</Text><View style={styles.weightTrack}><View style={[styles.weekBar, { height: `${Math.max(8, (week.count / maxWeekCount) * 100)}%` }]} /></View><Text style={styles.recordDate}>{week.label}</Text></View>)}</View>
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Рабочие веса</Text>
        {workingWeightTrends.length ? workingWeightTrends.map(([id, values]) => <View key={id} style={styles.recordRow}><View style={{ flex: 1 }}><Text style={styles.recordName}>{getExercise(id)?.name ?? 'Упражнение'}</Text><Text style={styles.recordDate}>{values.length > 1 ? `${values.slice(-4).join(' → ')} кг` : 'Запиши ещё занятия для сравнения'}</Text></View><Text style={styles.recordValue}>{values[values.length - 1]} кг</Text></View>) : <Text style={styles.empty}>После нескольких тренировок здесь появится динамика рабочих весов.</Text>}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Рабочие веса · личные рекорды</Text>
        {personalRecords.length ? personalRecords.slice(0, 8).map(([id, record]) => <View key={id} style={styles.recordRow}><View style={{ flex: 1 }}><Text style={styles.recordName}>{getExercise(id)?.name ?? 'Упражнение'}</Text><Text style={styles.recordDate}>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(record.date))}</Text></View><Text style={styles.recordValue}>{record.weightKg} кг<Text style={styles.recordReps}> × {record.reps}</Text></Text></View>) : <Text style={styles.empty}>Отметь подходы и заверши тренировку, чтобы увидеть рекорды.</Text>}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Объём по группам мышц</Text>
        {muscleVolume.length ? muscleVolume.map(([group, sets]) => <View key={group} style={styles.muscleRow}><View style={styles.muscleTop}><Text style={styles.recordName}>{group}</Text><Text style={styles.recordDate}>{sets} подходов</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${Math.max(8, (sets / Math.max(...muscleVolume.map((item) => item[1]))) * 100)}%` }]} /></View></View>) : <Text style={styles.empty}>После занятий здесь появится распределение нагрузки.</Text>}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Динамика веса тела</Text>
        {weightTrend.length > 1 ? <View style={styles.weightChart}>{weightTrend.map((measurement) => <View key={measurement.id} style={styles.weightColumn}><Text style={styles.weightValue}>{measurement.weightKg}</Text><View style={styles.weightTrack}><View style={[styles.weightBar, { height: `${Math.max(12, (measurement.weightKg / maxWeight) * 100)}%` }]} /></View><Text style={styles.recordDate}>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(measurement.measuredAt))}</Text></View>)}</View> : <Text style={styles.empty}>Записывай вес в профиле, чтобы отслеживать изменения. Сейчас сохранено {weightTrend.length} {weightTrend.length === 1 ? 'измерение' : 'измерения'}.</Text>}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>История тренировок</Text>
        {completed.length ? completed.slice(0, 12).map((workout) => <View key={workout.id} style={styles.recordRow}><View style={{ flex: 1 }}><Text style={styles.recordName}>{workout.title}</Text><Text style={styles.recordDate}>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(workout.finishedAt ?? workout.startedAt))}</Text></View><Text style={styles.recordValue}>{workout.exercises.length} упр.</Text></View>) : <Text style={styles.empty}>Завершённые тренировки появятся здесь. Незавершённая сессия остаётся доступна на главном экране.</Text>}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, padding: 12, gap: 5, minHeight: 100 },
  metricLabel: { color: AppColors.muted, fontSize: 7, fontWeight: '800', letterSpacing: 0.7 },
  metricValue: { color: AppColors.text, fontSize: 23, fontWeight: '800' },
  metricCaption: { color: AppColors.muted, fontSize: 8 },
  cardTitle: { color: AppColors.text, fontSize: 14, fontWeight: '800', marginBottom: 3 },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#EEF0EC', paddingVertical: 10 },
  recordName: { color: AppColors.text, fontSize: 11, fontWeight: '700' },
  recordDate: { color: AppColors.muted, fontSize: 9, marginTop: 3 },
  recordValue: { color: AppColors.text, fontSize: 14, fontWeight: '800' },
  recordReps: { color: AppColors.muted, fontSize: 10, fontWeight: '600' },
  empty: { color: AppColors.muted, fontSize: 11, lineHeight: 17 },
  muscleRow: { gap: 6, paddingTop: 10 },
  muscleTop: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 7, backgroundColor: '#EFF2EB', borderRadius: 5, overflow: 'hidden' },
  fill: { height: 7, backgroundColor: '#97C951', borderRadius: 5 },
  weightChart: { height: 146, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-around', marginTop: 8 },
  weeklyChart: { height: 104, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-around', marginTop: 8 },
  weekColumn: { alignItems: 'center', flex: 1, gap: 4 },
  weightColumn: { alignItems: 'center', flex: 1, gap: 4 },
  weightValue: { color: AppColors.text, fontSize: 9, fontWeight: '700' },
  weightTrack: { width: 17, flex: 1, backgroundColor: '#F1F3EF', borderRadius: 9, justifyContent: 'flex-end', overflow: 'hidden' },
  weightBar: { width: 17, borderRadius: 9, backgroundColor: '#9BCB60' },
  weekBar: { width: 17, borderRadius: 9, backgroundColor: '#9BCB60' },
});
