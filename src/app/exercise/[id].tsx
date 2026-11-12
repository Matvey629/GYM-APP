import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, AppColors, AppScreen, PageHeading } from '@/components/ui/app-screen';
import { useAppData } from '@/features/app-data/app-data-context';
import { getExercise } from '@/features/exercises/catalog';
import { createId } from '@/lib/ids';

export default function ExerciseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, updateData } = useAppData();
  const exercise = getExercise(id);

  if (!exercise) {
    return <AppScreen><PageHeading title="Упражнение не найдено" subtitle="Открой библиотеку и выбери упражнение из каталога." /><AppButton title="К библиотеке" onPress={() => router.replace('/library')} /></AppScreen>;
  }

  const addToWorkout = () => {
    updateData((current) => {
      if (!current.activeWorkout || current.activeWorkout.exercises.some((item) => item.exerciseId === exercise.id)) return current;
      return { ...current, activeWorkout: { ...current.activeWorkout, exercises: [...current.activeWorkout.exercises, { id: createId(), exerciseId: exercise.id, sets: Array.from({ length: 3 }, () => ({ id: createId(), reps: 10, weightKg: 0, restSeconds: 90, completed: false, completedAt: null })) }] } };
    });
    router.push('/workout');
  };

  return (
    <AppScreen>
      <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={styles.back}>← Назад</Text></Pressable>
      <PageHeading eyebrow={exercise.muscleGroup} title={exercise.name} subtitle={`${exercise.equipment} · ${exercise.movement}`} />
      <AppCard style={styles.hero}><Text style={styles.heroMark}>{exercise.muscleGroup.slice(0, 1)}</Text><Text style={styles.heroCaption}>ДЕМОНСТРАЦИОННОЕ ИЗОБРАЖЕНИЕ БУДЕТ ДОБАВЛЕНО В КАТАЛОГ</Text></AppCard>
      <AppCard><Text style={styles.heading}>Как выполнять</Text>{exercise.instructions.map((instruction, index) => <View key={instruction} style={styles.instruction}><Text style={styles.step}>{index + 1}</Text><Text style={styles.body}>{instruction}</Text></View>)}</AppCard>
      <AppCard><Text style={styles.heading}>Работающие мышцы</Text><Text style={styles.body}>Основная: {exercise.muscleGroup}</Text><Text style={styles.body}>Дополнительно: {exercise.secondaryMuscles.join(', ')}</Text><Text style={styles.body}>Уровень: {exercise.difficulty === 'beginner' ? 'начальный' : exercise.difficulty === 'intermediate' ? 'средний' : 'продвинутый'}</Text></AppCard>
      <AppCard><Text style={styles.heading}>Альтернативы</Text>{exercise.alternatives.map((alternative) => <Text key={alternative} style={styles.body}>•  {alternative}</Text>)}</AppCard>
      {data.activeWorkout ? <AppButton title="Добавить в текущую тренировку" onPress={addToWorkout} disabled={data.activeWorkout.exercises.some((item) => item.exerciseId === exercise.id)} /> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  back: { color: '#688C43', fontSize: 13, fontWeight: '800', paddingVertical: 5 },
  hero: { minHeight: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9F0E2' },
  heroMark: { color: '#688C43', fontSize: 54, fontWeight: '800' },
  heroCaption: { color: AppColors.muted, fontSize: 8, letterSpacing: 0.8, textAlign: 'center' },
  heading: { color: AppColors.text, fontSize: 15, fontWeight: '800', marginBottom: 5 },
  instruction: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  step: { color: '#688C43', fontSize: 12, fontWeight: '800', width: 18 },
  body: { color: AppColors.muted, fontSize: 12, lineHeight: 19, flex: 1 },
});
