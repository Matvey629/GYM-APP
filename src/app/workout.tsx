import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton, AppCard, AppColors, AppScreen, PageHeading } from '@/components/ui/app-screen';
import { useAppData } from '@/features/app-data/app-data-context';
import { getExercise } from '@/features/exercises/catalog';
import { finishWorkoutData } from '@/features/workouts/workout-logic';
import type { WorkoutExercise, WorkoutSession, WorkoutSet } from '@/types/gym';
import { createId } from '@/lib/ids';

function patchWorkoutExercise(workout: WorkoutSession, exerciseId: string, updater: (exercise: WorkoutExercise) => WorkoutExercise): WorkoutSession {
  return { ...workout, exercises: workout.exercises.map((exercise) => exercise.id === exerciseId ? updater(exercise) : exercise) };
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export default function WorkoutScreen() {
  const { data, saveError, updateData } = useAppData();
  const workout = data.activeWorkout;
  const [now, setNow] = useState(0);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (!workout?.restEndsAt || workout.status !== 'active') return;
    const firstTick = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => {
      clearTimeout(firstTick);
      clearInterval(interval);
    };
  }, [workout?.restEndsAt, workout?.status]);

  useEffect(() => {
    if (workout?.restEndsAt && workout.restEndsAt <= now) {
      updateData((current) => current.activeWorkout?.restEndsAt && current.activeWorkout.restEndsAt <= now
        ? { ...current, activeWorkout: { ...current.activeWorkout, restEndsAt: null } }
        : current);
    }
  }, [now, updateData, workout?.restEndsAt]);

  const remaining = workout?.restEndsAt ? Math.max(0, Math.ceil((workout.restEndsAt - now) / 1000)) : 0;
  const incompleteSets = useMemo(() => workout?.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => !set.completed).length, 0) ?? 0, [workout]);

  const changeWorkout = (updater: (current: WorkoutSession) => WorkoutSession) => {
    updateData((current) => current.activeWorkout ? { ...current, activeWorkout: updater(current.activeWorkout) } : current);
  };

  const updateSet = (exerciseId: string, setId: string, updater: (set: WorkoutSet) => WorkoutSet) => {
    changeWorkout((current) => patchWorkoutExercise(current, exerciseId, (exercise) => ({ ...exercise, sets: exercise.sets.map((set) => set.id === setId ? updater(set) : set) })));
  };

  const toggleComplete = (exerciseId: string, setId: string) => {
    const set = workout?.exercises.find((exercise) => exercise.id === exerciseId)?.sets.find((item) => item.id === setId);
    if (!set) return;
    const completing = !set.completed;
    updateSet(exerciseId, setId, (current) => ({ ...current, completed: completing, completedAt: completing ? new Date().toISOString() : null }));
    changeWorkout((current) => ({ ...current, restEndsAt: completing ? Date.now() + set.restSeconds * 1000 : null }));
    setNow(Date.now());
  };

  const addExercise = () => router.push({ pathname: '/library', params: { select: '1' } });

  const finish = () => {
    updateData((current) => finishWorkoutData(current));
    router.replace('/');
  };

  if (!workout) {
    return <AppScreen><PageHeading title="Нет активной тренировки" subtitle="Начни занятие с главного экрана, и оно появится здесь." /><AppButton title="На главную" onPress={() => router.replace('/')} /></AppScreen>;
  }

  return (
    <AppScreen>
      <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={styles.back}>← Свернуть тренировку</Text></Pressable>
      <PageHeading eyebrow={workout.status === 'paused' ? 'На паузе · данные сохранены' : 'Тренировка идёт · сохраняется автоматически'} title={workout.title} subtitle={`Начата в ${new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(workout.startedAt))}`} />
      {saveError ? <AppCard style={styles.confirmCard}><Text style={styles.muted}>{saveError}</Text></AppCard> : null}

      {remaining > 0 && workout.status === 'active' ? <AppCard style={styles.timerCard}><Text style={styles.timerLabel}>ОТДЫХ</Text><Text style={styles.timerValue}>{formatTime(remaining)}</Text><Text style={styles.muted}>Следующий подход, когда будешь готов</Text><AppButton title="Пропустить отдых" compact secondary onPress={() => changeWorkout((current) => ({ ...current, restEndsAt: null }))} /></AppCard> : null}

      {workout.exercises.map((item, index) => {
        const exercise = getExercise(item.exerciseId);
        const previousSession = data.workouts.find((session) => session.status === 'completed' && session.exercises.some((past) => past.exerciseId === item.exerciseId));
        const previous = previousSession?.exercises.find((past) => past.exerciseId === item.exerciseId);
        return (
          <AppCard key={item.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Pressable style={styles.exerciseTitleArea} onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: item.exerciseId } })}>
                <Text style={styles.exerciseIndex}>{String(index + 1).padStart(2, '0')}</Text>
                <View style={{ flex: 1 }}><Text style={styles.exerciseTitle}>{exercise?.name ?? 'Упражнение'}</Text><Text style={styles.muted}>{exercise?.muscleGroup ?? ''} · {item.sets.length} подхода</Text></View>
              </Pressable>
              <Pressable onPress={() => changeWorkout((current) => ({ ...current, exercises: current.exercises.filter((exerciseItem) => exerciseItem.id !== item.id) }))} accessibilityRole="button" accessibilityLabel="Удалить упражнение"><Text style={styles.remove}>×</Text></Pressable>
            </View>
            <View style={styles.tableHeader}><Text style={[styles.col, styles.colSet]}>СЕТ</Text><Text style={styles.col}>ПОВТ.</Text><Text style={styles.col}>ВЕС, КГ</Text><Text style={[styles.col, styles.colDone]}>ГОТОВО</Text></View>
            {item.sets.map((set, setIndex) => (
              <View key={set.id} style={[styles.setRow, set.completed && styles.setRowDone]}>
                <Text style={[styles.setNumber, styles.colSet]}>{setIndex + 1}</Text>
                <View style={styles.valueControl}><Pressable onPress={() => updateSet(item.id, set.id, (current) => ({ ...current, reps: Math.max(1, current.reps - 1) }))}><Text style={styles.stepper}>−</Text></Pressable><TextInput accessibilityLabel={`Повторения, подход ${setIndex + 1}`} keyboardType="number-pad" value={String(set.reps)} onChangeText={(value) => updateSet(item.id, set.id, (current) => ({ ...current, reps: Math.max(0, Number(value) || 0) }))} style={styles.valueInput} /><Pressable onPress={() => updateSet(item.id, set.id, (current) => ({ ...current, reps: current.reps + 1 }))}><Text style={styles.stepper}>+</Text></Pressable></View>
                <View style={styles.valueControl}><Pressable onPress={() => updateSet(item.id, set.id, (current) => ({ ...current, weightKg: Math.max(0, Math.round((current.weightKg - 2.5) * 10) / 10) }))}><Text style={styles.stepper}>−</Text></Pressable><TextInput accessibilityLabel={`Вес, подход ${setIndex + 1}`} keyboardType="decimal-pad" value={String(set.weightKg)} onChangeText={(value) => updateSet(item.id, set.id, (current) => ({ ...current, weightKg: Math.max(0, Number(value.replace(',', '.')) || 0) }))} style={styles.valueInput} /><Pressable onPress={() => updateSet(item.id, set.id, (current) => ({ ...current, weightKg: Math.round((current.weightKg + 2.5) * 10) / 10 }))}><Text style={styles.stepper}>+</Text></Pressable></View>
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: set.completed }} onPress={() => toggleComplete(item.id, set.id)} style={[styles.doneButton, set.completed && styles.doneButtonActive]}><Text style={[styles.doneText, set.completed && styles.doneTextActive]}>{set.completed ? '✓' : '○'}</Text></Pressable>
              </View>
            ))}
            <View style={styles.exerciseActions}>
              <Pressable onPress={() => {
                const last = item.sets[item.sets.length - 1];
                if (!last) return;
                changeWorkout((current) => patchWorkoutExercise(current, item.id, (exerciseItem) => ({ ...exerciseItem, sets: [...exerciseItem.sets, { ...last, id: createId(), completed: false, completedAt: null }] })));
              }}><Text style={styles.actionLink}>＋ Добавить подход</Text></Pressable>
              <Pressable disabled={!previous} style={!previous && styles.disabledAction} onPress={() => {
                if (!previous) return;
                changeWorkout((current) => patchWorkoutExercise(current, item.id, (exerciseItem) => ({ ...exerciseItem, sets: exerciseItem.sets.map((set, setIndex) => ({ ...set, reps: previous.sets[setIndex]?.reps ?? previous.sets[0]?.reps ?? set.reps, weightKg: previous.sets[setIndex]?.weightKg ?? previous.sets[0]?.weightKg ?? set.weightKg, completed: false, completedAt: null })) })));
              }}><Text style={styles.actionLink}>{previous ? 'Повторить прошлый результат' : 'Прошлых результатов пока нет'}</Text></Pressable>
            </View>
          </AppCard>
        );
      })}

      <AppButton title="＋  Добавить упражнение" secondary onPress={addExercise} />
      {confirmFinish ? <AppCard style={styles.confirmCard}><Text style={styles.confirmTitle}>Завершить тренировку?</Text><Text style={styles.muted}>{incompleteSets > 0 ? `Осталось ${incompleteSets} незаписанных подходов. Они останутся в истории незавершёнными.` : 'Все подходы отмечены. Тренировка попадёт в историю.'}</Text><View style={styles.confirmActions}><AppButton title="Продолжить" secondary compact onPress={() => setConfirmFinish(false)} /><AppButton title="Завершить" compact onPress={finish} /></View></AppCard> : null}
      {confirmCancel ? <AppCard style={styles.confirmCard}><Text style={styles.confirmTitle}>Отменить тренировку?</Text><Text style={styles.muted}>Она будет удалена с устройства вместе с незавершёнными данными.</Text><View style={styles.confirmActions}><AppButton title="Оставить" secondary compact onPress={() => setConfirmCancel(false)} /><AppButton title="Удалить" compact onPress={() => { updateData((current) => ({ ...current, activeWorkout: null })); router.replace('/'); }} /></View></AppCard> : null}
      {!confirmFinish && !confirmCancel ? <View style={styles.bottomActions}><AppButton title={workout.status === 'paused' ? 'Возобновить тренировку' : 'Приостановить'} secondary onPress={() => changeWorkout((current) => ({ ...current, status: current.status === 'paused' ? 'active' : 'paused' }))} /><AppButton title="Завершить тренировку" onPress={() => setConfirmFinish(true)} /><Pressable onPress={() => setConfirmCancel(true)}><Text style={styles.cancel}>Отменить тренировку</Text></Pressable></View> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  back: { color: '#688C43', fontWeight: '800', fontSize: 12, paddingVertical: 4 },
  timerCard: { alignItems: 'center', backgroundColor: '#EAF2DF' },
  timerLabel: { color: '#688C43', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  timerValue: { color: AppColors.text, fontSize: 35, fontWeight: '800', fontVariant: ['tabular-nums'] },
  muted: { color: AppColors.muted, fontSize: 11, lineHeight: 16 },
  exerciseCard: { padding: 13, gap: 10 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exerciseTitleArea: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 },
  exerciseIndex: { color: '#7C9B5A', fontSize: 10, fontWeight: '800' },
  exerciseTitle: { color: AppColors.text, fontSize: 13, fontWeight: '800' },
  remove: { color: AppColors.muted, fontSize: 23, paddingHorizontal: 5 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3, paddingTop: 5 },
  col: { flex: 1, textAlign: 'center', color: '#9AA39B', fontSize: 7, fontWeight: '800', letterSpacing: 0.5 },
  colSet: { flex: 0.45, textAlign: 'left' },
  colDone: { flex: 0.55, textAlign: 'right' },
  setRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EFF1ED' },
  setRowDone: { backgroundColor: '#F3F8EC' },
  setNumber: { color: AppColors.text, fontSize: 11, fontWeight: '800', paddingLeft: 3 },
  valueControl: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1 },
  stepper: { color: '#779A4C', fontSize: 17, fontWeight: '700', paddingHorizontal: 5, paddingVertical: 4 },
  valueInput: { width: 42, minHeight: 32, padding: 0, borderRadius: 8, backgroundColor: '#F3F5F1', color: AppColors.text, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  doneButton: { flex: 0.55, alignItems: 'flex-end', paddingRight: 6 },
  doneButtonActive: {},
  doneText: { color: '#9BA49B', fontSize: 19, fontWeight: '800' },
  doneTextActive: { color: '#6F9E37' },
  exerciseActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: '#EFF1ED', paddingTop: 10 },
  actionLink: { color: '#668545', fontSize: 10, fontWeight: '800' },
  disabledAction: { opacity: 0.45 },
  confirmCard: { borderWidth: 1, borderColor: AppColors.line },
  confirmTitle: { color: AppColors.text, fontSize: 15, fontWeight: '800' },
  confirmActions: { flexDirection: 'row', gap: 8 },
  bottomActions: { gap: 9 },
  cancel: { color: AppColors.danger, textAlign: 'center', fontSize: 12, fontWeight: '800', paddingVertical: 9 },
});
