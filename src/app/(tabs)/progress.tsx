import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard, AppColors, AppScreen, ChoiceChips, PageHeading } from '@/components/ui/app-screen';
import { buildAnalytics, filterMeasurements, type AnalyticsRange, type WeeklyLoad } from '@/features/analytics/analytics';
import { useAppData } from '@/features/app-data/app-data-context';
import { getExercise } from '@/features/exercises/catalog';

const RANGE_OPTIONS = [
  { value: '4w', label: '4 недели' },
  { value: '12w', label: '12 недель' },
  { value: 'all', label: 'Всё время' },
];

function formatLoad(value: number) {
  if (value >= 1000) return `${(value / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} т`;
  return `${Math.round(value).toLocaleString('ru-RU')} кг`;
}

function WeeklyVolumeChart({ values }: { values: WeeklyLoad[] }) {
  const maxValue = Math.max(1, ...values.map((item) => item.volumeKg));
  if (values.length === 0 || values.every((item) => item.workouts === 0)) {
    return <Text style={styles.empty}>За выбранный период нет завершённых тренировок.</Text>;
  }

  return (
    <View accessibilityLabel="Тоннаж и количество тренировок по неделям" style={styles.chart}>
      {values.map((week) => {
        const percent = week.volumeKg > 0 ? Math.max(5, (week.volumeKg / maxValue) * 100) : 0;
        return (
          <View key={week.weekStart.toISOString()} style={styles.chartColumn}>
            <Text style={styles.chartValue}>{week.volumeKg > 0 ? formatLoad(week.volumeKg) : '0 кг'}</Text>
            <View style={styles.chartTrack}>
              {percent > 0 ? <View style={[styles.chartBar, { height: `${percent}%` }]} /> : <View style={styles.emptyBar} />}
            </View>
            <Text style={styles.chartLabel}>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(week.weekStart)}{'\n'}{week.workouts} тр.</Text>
          </View>
        );
      })}
    </View>
  );
}

function WeightProgressChart({ points }: { points: { date: string; weightKg: number; reps: number }[] }) {
  if (points.length === 0) return <Text style={styles.empty}>Отмечай вес в силовых упражнениях — здесь появится динамика по тренировкам.</Text>;
  const minValue = Math.min(...points.map((point) => point.weightKg));
  const maxValue = Math.max(...points.map((point) => point.weightKg));
  const spread = maxValue - minValue || 1;
  return (
    <View accessibilityLabel="Рабочий вес по последним тренировкам" style={styles.chart}>
      {points.slice(-8).map((point, index) => {
        const percent = 24 + ((point.weightKg - minValue) / spread) * 76;
        return (
          <View key={`${point.date}-${index}`} style={styles.chartColumn}>
            <Text style={styles.chartValue}>{point.weightKg} кг</Text>
            <View style={styles.chartTrack}><View style={[styles.chartBar, { height: `${percent}%` }]} /></View>
            <Text style={styles.chartLabel}>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(point.date))}</Text>
          </View>
        );
      })}
    </View>
  );
}

function BodyWeightChart({ values }: { values: { id: string; weightKg: number; measuredAt: string }[] }) {
  if (values.length === 0) return <Text style={styles.empty}>Запиши замер в профиле, чтобы отслеживать вес тела.</Text>;
  const minValue = Math.min(...values.map((item) => item.weightKg));
  const maxValue = Math.max(...values.map((item) => item.weightKg));
  const spread = maxValue - minValue || 1;
  return (
    <>
      <Text style={styles.bodyCurrent}>{values[values.length - 1]?.weightKg} кг <Text style={styles.bodyCaption}>последний замер</Text></Text>
      {values.length > 1 ? (
        <View accessibilityLabel="Динамика веса тела по замерам" style={styles.chart}>
          {values.slice(-8).map((item, index) => {
            const percent = 24 + ((item.weightKg - minValue) / spread) * 76;
            return (
              <View key={item.id} style={styles.chartColumn}>
                <Text style={styles.chartValue}>{item.weightKg}</Text>
                <View style={styles.chartTrack}><View style={[styles.bodyBar, { height: `${percent}%` }]} /></View>
                <Text style={styles.chartLabel}>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(item.measuredAt))}</Text>
              </View>
            );
          })}
        </View>
      ) : <Text style={styles.empty}>Добавь ещё замеры, чтобы увидеть динамику.</Text>}
    </>
  );
}

export default function ProgressScreen() {
  const { data } = useAppData();
  const [range, setRange] = useState<AnalyticsRange>('4w');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const now = new Date();
  const analytics = buildAnalytics(data.workouts, range, now);
  const weightOptions = analytics.workingWeights.map(({ exerciseId }) => ({ value: exerciseId, label: getExercise(exerciseId)?.name ?? 'Упражнение' }));
  const selectedExercise = weightOptions.some((item) => item.value === selectedExerciseId)
    ? selectedExerciseId
    : weightOptions[0]?.value ?? '';
  const selectedWeightPoints = analytics.workingWeights.find((item) => item.exerciseId === selectedExercise)?.points ?? [];
  const measurementStart = range === 'all' ? new Date(0) : analytics.rangeStart;
  const bodyWeightValues = filterMeasurements(data.measurements, measurementStart, now);
  const previousWeek = analytics.weeklyLoad[analytics.weeklyLoad.length - 3];
  const latestWeek = analytics.weeklyLoad[analytics.weeklyLoad.length - 2];
  const volumeDelta = previousWeek && previousWeek.volumeKg > 0
    ? Math.round(((latestWeek!.volumeKg - previousWeek.volumeKg) / previousWeek.volumeKg) * 100)
    : null;
  const maxMuscleLoad = Math.max(1, ...analytics.muscleLoad.map((item) => item.volumeKg));

  return (
    <AppScreen>
      <PageHeading eyebrow="Сила и регулярность" title="Прогресс" subtitle="Смотри, как меняются рабочие веса, объём и частота тренировок." />
      <ChoiceChips options={RANGE_OPTIONS} selected={range} onToggle={(value) => setRange(value as AnalyticsRange)} />

      <View style={styles.summaryRow}>
        <AppCard style={styles.summaryCard}>
          <Text style={styles.metricLabel}>ТРЕНИРОВКИ</Text>
          <Text style={styles.metricValue}>{analytics.completedCount}</Text>
          <Text style={styles.metricCaption}>за период</Text>
        </AppCard>
        <AppCard style={styles.summaryCard}>
          <Text style={styles.metricLabel}>СРЕДНЕЕ</Text>
          <Text style={styles.metricValue}>{analytics.averageWorkoutsPerWeek.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}</Text>
          <Text style={styles.metricCaption}>тренировок в неделю</Text>
        </AppCard>
        <AppCard style={styles.summaryCard}>
          <Text style={styles.metricLabel}>ОБЪЁМ</Text>
          <Text style={styles.metricValueSmall}>{formatLoad(analytics.totalVolumeKg)}</Text>
          <Text style={styles.metricCaption}>вес × повторения</Text>
        </AppCard>
      </View>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Объём тренировок</Text>
          {volumeDelta !== null ? <Text style={[styles.delta, volumeDelta >= 0 ? styles.deltaUp : styles.deltaDown]}>{volumeDelta >= 0 ? '+' : ''}{volumeDelta}% к прошлой полной неделе</Text> : null}
        </View>
        <Text style={styles.cardSubtitle}>{range === 'all' ? 'Тоннаж за последние 12 недель' : 'Тоннаж и число занятий по неделям'}</Text>
        <WeeklyVolumeChart values={analytics.weeklyLoad} />
        <Text style={styles.chartNote}>Тоннаж — сумма веса снаряда × повторения в завершённых подходах. Упражнения с собственным весом сюда не входят.</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Рост рабочих весов</Text>
        <Text style={styles.cardSubtitle}>Максимальный рабочий вес в каждом завершённом занятии</Text>
        {weightOptions.length > 1 ? <View style={styles.exerciseSelector}><ChoiceChips options={weightOptions} selected={selectedExercise} onToggle={setSelectedExerciseId} /></View> : null}
        {selectedExercise ? <Text style={styles.selectedExerciseName}>{getExercise(selectedExercise)?.name}</Text> : null}
        <WeightProgressChart points={selectedWeightPoints} />
        {selectedWeightPoints.length > 1 ? <Text style={styles.trendText}>{selectedWeightPoints[0]?.weightKg} кг → {selectedWeightPoints[selectedWeightPoints.length - 1]?.weightKg} кг</Text> : null}
      </AppCard>

      <AppCard>
        <View style={styles.cardHeader}><Text style={styles.cardTitle}>Персональные рекорды</Text><Text style={styles.badge}>{analytics.personalRecords.length}</Text></View>
        {analytics.personalRecords.length ? analytics.personalRecords.slice(0, 8).map((record) => (
          <View key={record.exerciseId} style={styles.recordRow}>
            <View style={styles.recordCopy}>
              <Text style={styles.recordName}>{getExercise(record.exerciseId)?.name ?? 'Упражнение'}</Text>
              <Text style={styles.muted}>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(record.date))}</Text>
            </View>
            <Text style={styles.recordValue}>{record.weightKg > 0 ? `${record.weightKg} кг × ${record.reps}` : `${record.reps} повт.`}</Text>
          </View>
        )) : <Text style={styles.empty}>Рекорды появятся, когда ты отметишь подходы и завершишь тренировку.</Text>}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Объём по мышечным группам</Text>
        <Text style={styles.cardSubtitle}>Тоннаж и число выполненных подходов за период</Text>
        {analytics.muscleLoad.length ? analytics.muscleLoad.map((item) => (
          <View key={item.muscleGroup} style={styles.muscleRow}>
            <View style={styles.muscleLabels}><Text style={styles.recordName}>{item.muscleGroup}</Text><Text style={styles.muscleValue}>{formatLoad(item.volumeKg)} · {item.completedSets} подх.</Text></View>
            <View style={styles.muscleTrack}><View style={[styles.muscleFill, { width: `${item.volumeKg > 0 ? Math.max(4, (item.volumeKg / maxMuscleLoad) * 100) : 4}%` }]} /></View>
          </View>
        )) : <Text style={styles.empty}>После завершения тренировок здесь появится распределение нагрузки.</Text>}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Динамика веса тела</Text>
        <Text style={styles.cardSubtitle}>Замеры из профиля</Text>
        <BodyWeightChart values={bodyWeightValues} />
      </AppCard>

      <AppCard>
        <View style={styles.cardHeader}><Text style={styles.cardTitle}>История тренировок</Text><Text style={styles.badge}>{analytics.completedCount}</Text></View>
        {analytics.recent.length ? analytics.recent.slice(0, 12).map((workout) => {
          const sets = workout.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed).length;
          return <View key={workout.id} style={styles.historyRow}>
            <View style={styles.recordCopy}><Text style={styles.recordName}>{workout.title}</Text><Text style={styles.muted}>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(workout.finishedAt ?? workout.startedAt))}</Text></View>
            <Text style={styles.muscleValue}>{workout.exercises.length} упр. · {sets} подх.</Text>
          </View>;
        }) : <Text style={styles.empty}>За этот период завершённых занятий пока нет. Незавершённая тренировка сохраняется на главном экране.</Text>}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', gap: 7 },
  summaryCard: { flex: 1, minHeight: 96, justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 12, gap: 4 },
  metricLabel: { color: AppColors.muted, fontSize: 7, fontWeight: '800', letterSpacing: 0.6 },
  metricValue: { color: AppColors.text, fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  metricValueSmall: { color: AppColors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.4 },
  metricCaption: { color: AppColors.muted, fontSize: 8, lineHeight: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { color: AppColors.text, fontSize: 14, fontWeight: '800' },
  cardSubtitle: { color: AppColors.muted, fontSize: 10, lineHeight: 15 },
  delta: { fontSize: 9, fontWeight: '800' },
  deltaUp: { color: '#628C39' },
  deltaDown: { color: '#B65B51' },
  chart: { height: 142, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-between', gap: 4, marginTop: 8 },
  chartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 5, minWidth: 0 },
  chartValue: { color: AppColors.text, fontSize: 8, fontWeight: '700', minHeight: 12 },
  chartTrack: { flex: 1, width: '68%', maxWidth: 22, justifyContent: 'flex-end', alignItems: 'stretch', backgroundColor: '#F0F3EC', borderRadius: 8, overflow: 'hidden' },
  chartBar: { width: '100%', backgroundColor: '#92C84A', borderRadius: 8 },
  bodyBar: { width: '100%', backgroundColor: '#7295D0', borderRadius: 8 },
  emptyBar: { height: 3, backgroundColor: '#DDE4D7', borderRadius: 4 },
  chartLabel: { color: AppColors.muted, fontSize: 7, textAlign: 'center', minHeight: 18 },
  chartNote: { color: AppColors.muted, fontSize: 9, lineHeight: 14, marginTop: 8 },
  exerciseSelector: { marginVertical: 5 },
  selectedExerciseName: { color: AppColors.text, fontSize: 11, fontWeight: '800', marginTop: 6 },
  trendText: { color: '#628C39', fontSize: 10, fontWeight: '800', textAlign: 'right', marginTop: 5 },
  recordRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#EEF0EC', paddingVertical: 9 },
  historyRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: '#EEF0EC', paddingVertical: 9 },
  recordCopy: { flex: 1, gap: 3 },
  recordName: { color: AppColors.text, fontSize: 11, fontWeight: '700' },
  muted: { color: AppColors.muted, fontSize: 9 },
  recordValue: { color: AppColors.text, fontSize: 12, fontWeight: '800' },
  recordReps: { color: AppColors.muted, fontSize: 9, fontWeight: '600' },
  badge: { color: '#5B7C38', backgroundColor: '#EDF4E3', fontSize: 10, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  empty: { color: AppColors.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  muscleRow: { gap: 6, paddingTop: 12 },
  muscleLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  muscleValue: { color: AppColors.muted, fontSize: 9 },
  muscleTrack: { height: 7, backgroundColor: '#EFF2EB', borderRadius: 5, overflow: 'hidden' },
  muscleFill: { height: 7, backgroundColor: '#97C951', borderRadius: 5 },
  bodyCurrent: { color: AppColors.text, fontSize: 20, fontWeight: '800', marginTop: 5 },
  bodyCaption: { color: AppColors.muted, fontSize: 9, fontWeight: '500' },
});
