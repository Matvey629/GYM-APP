import { Link, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton, AppCard, AppColors, AppScreen, ChoiceChips, PageHeading } from '@/components/ui/app-screen';
import { useAppData } from '@/features/app-data/app-data-context';
import { EXERCISES } from '@/features/exercises/catalog';
import { createId } from '@/lib/ids';

const groups = ['Все', ...Array.from(new Set(EXERCISES.map((exercise) => exercise.muscleGroup)))];

export default function LibraryScreen() {
  const { select } = useLocalSearchParams<{ select?: string }>();
  const { data, updateData } = useAppData();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('Все');
  const selecting = select === '1';
  const exercises = useMemo(() => EXERCISES.filter((exercise) =>
    (group === 'Все' || exercise.muscleGroup === group) &&
    `${exercise.name} ${exercise.muscleGroup} ${exercise.equipment}`.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru')),
  ), [group, query]);

  const addExercise = (exerciseId: string) => {
    if (!data.activeWorkout) return;
    updateData((current) => {
      if (!current.activeWorkout || current.activeWorkout.exercises.some((item) => item.exerciseId === exerciseId)) return current;
      const fromProgram = current.programs.flatMap((program) => program.days).flatMap((day) => day.exercises).find((item) => item.exerciseId === exerciseId);
      const setCount = fromProgram?.sets ?? 3;
      const nextExercise = {
        id: createId(),
        exerciseId,
        sets: Array.from({ length: setCount }, () => ({ id: createId(), reps: fromProgram ? Math.round((fromProgram.repsMin + fromProgram.repsMax) / 2) : 10, weightKg: 0, restSeconds: fromProgram?.restSeconds ?? 90, completed: false, completedAt: null })),
      };
      return { ...current, activeWorkout: { ...current.activeWorkout, exercises: [...current.activeWorkout.exercises, nextExercise] } };
    });
    router.back();
  };

  return (
    <AppScreen>
      <PageHeading eyebrow={selecting ? 'Тренировка' : 'Каталог'} title={selecting ? 'Добавить упражнение' : 'Библиотека'} subtitle={`${EXERCISES.length} упражнений с инструкциями и альтернативами`} />
      <TextInput value={query} onChangeText={setQuery} placeholder="Найти упражнение или мышцу" placeholderTextColor="#929B93" style={styles.search} returnKeyType="search" />
      <ChoiceChips options={groups.map((value) => ({ value, label: value }))} selected={group} onToggle={setGroup} />
      {exercises.map((exercise) => (
        <AppCard key={exercise.id} style={styles.exerciseCard}>
          <Link href={{ pathname: '/exercise/[id]', params: { id: exercise.id } }} asChild>
            <Pressable style={styles.exerciseInfo} accessibilityRole="button">
              <View style={styles.exerciseIcon}><Text style={styles.exerciseIconText}>{exercise.muscleGroup.slice(0, 1)}</Text></View>
              <View style={styles.exerciseCopy}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>{exercise.muscleGroup} · {exercise.equipment}</Text>
                <Text style={styles.exerciseMeta}>{exercise.difficulty === 'beginner' ? 'Начальный' : exercise.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'} · {exercise.movement}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </Link>
          {selecting ? <AppButton title="Добавить в тренировку" compact onPress={() => addExercise(exercise.id)} disabled={data.activeWorkout?.exercises.some((item) => item.exerciseId === exercise.id)} /> : null}
        </AppCard>
      ))}
      {exercises.length === 0 ? <AppCard><Text style={styles.empty}>По этому запросу ничего не найдено. Измени запрос или выбери другую группу мышц.</Text></AppCard> : null}
      {!selecting && data.activeWorkout ? <AppButton title="Вернуться к тренировке" secondary onPress={() => router.push('/workout')} /> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  search: { minHeight: 48, backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.line, borderRadius: 14, paddingHorizontal: 14, color: AppColors.text, fontSize: 14 },
  exerciseCard: { padding: 12, gap: 10 },
  exerciseInfo: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  exerciseIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#EDF3E7', alignItems: 'center', justifyContent: 'center' },
  exerciseIconText: { color: '#688C43', fontWeight: '800', fontSize: 17 },
  exerciseCopy: { flex: 1, gap: 3 },
  exerciseName: { color: AppColors.text, fontSize: 13, fontWeight: '800' },
  exerciseMeta: { color: AppColors.muted, fontSize: 10 },
  chevron: { color: AppColors.muted, fontSize: 22, paddingHorizontal: 3 },
  empty: { color: AppColors.muted, fontSize: 13, lineHeight: 19 },
});
