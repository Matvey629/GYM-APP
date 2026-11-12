import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, AppColors, AppScreen, ChoiceChips, Field, PageHeading } from '@/components/ui/app-screen';
import { useAppData } from '@/features/app-data/app-data-context';
import { EXERCISES } from '@/features/exercises/catalog';
import { startWorkoutData } from '@/features/workouts/workout-logic';
import { createId } from '@/lib/ids';
import type { ProgramExercise, WorkoutProgram } from '@/types/gym';

const WEEKDAY_OPTIONS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((label, value) => ({ value: String(value), label }));

function getDefaultSchedule(count: number) {
  const presets: Record<number, number[]> = { 2: [1, 4], 3: [0, 2, 4], 4: [0, 1, 3, 5], 5: [0, 1, 3, 4, 6], 6: [0, 1, 2, 4, 5, 6] };
  return presets[count] ?? presets[3] ?? [];
}

function SettingStepper({ label, value, onChange, step = 1, min = 1, max = 30 }: { label: string; value: number; onChange: (value: number) => void; step?: number; min?: number; max?: number }) {
  return <View style={styles.setting}><Text style={styles.settingLabel}>{label}</Text><View style={styles.settingControl}><Pressable accessibilityRole="button" onPress={() => onChange(Math.max(min, value - step))}><Text style={styles.settingArrow}>−</Text></Pressable><Text style={styles.settingValue}>{value}</Text><Pressable accessibilityRole="button" onPress={() => onChange(Math.min(max, value + step))}><Text style={styles.settingArrow}>+</Text></Pressable></View></View>;
}

export default function ProgramsScreen() {
  const { data, updateData } = useAppData();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState(data.profile?.workoutsPerWeek ?? 3);
  const [schedule, setSchedule] = useState(() => getDefaultSchedule(data.profile?.workoutsPerWeek ?? 3));
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [exerciseSettings, setExerciseSettings] = useState<Record<string, ProgramExercise>>({});
  const [error, setError] = useState('');
  const goal = data.profile?.goal ?? 'fitness';
  const reps = goal === 'strength' ? [5, 6] : goal === 'weight-loss' ? [10, 15] : [8, 12];

  const createProgram = () => {
    if (!name.trim() || selectedExercises.length === 0 || schedule.length !== daysPerWeek) {
      setError(schedule.length !== daysPerWeek ? `Выбери ${daysPerWeek} дней недели для расписания.` : 'Добавь название и выбери хотя бы одно упражнение.');
      return;
    }
    const selected = selectedExercises.map((exerciseId) => exerciseSettings[exerciseId] ?? ({ exerciseId, sets: 3, repsMin: reps[0], repsMax: reps[1], restSeconds: goal === 'strength' ? 150 : 90 }));
    const program: WorkoutProgram = {
      id: createId(),
      name: name.trim(),
      description: `${daysPerWeek} тренировки в неделю · пользовательская программа`,
      daysPerWeek,
      createdAt: new Date().toISOString(),
      days: Array.from({ length: daysPerWeek }, (_, index) => ({ weekday: schedule[index] ?? index, title: `Тренировка ${String.fromCharCode(65 + (index % 3))}`, exercises: selected })),
    };
    updateData((current) => ({ ...current, programs: [...current.programs, program] }));
    setName('');
    setSelectedExercises([]);
    setError('');
    setCreating(false);
  };

  const startProgram = (programId: string) => {
    updateData((current) => startWorkoutData(current, programId));
    router.push('/workout');
  };

  return (
    <AppScreen>
      <PageHeading eyebrow="Планирование" title="Мои программы" subtitle="Выбирай готовый план или собери собственный из упражнений." />
      {!creating ? <AppButton title="＋  Создать программу" onPress={() => setCreating(true)} /> : null}
      {!creating && data.profile?.limitations ? <AppCard style={styles.notice}><Text style={styles.noticeText}>Проверь список упражнений программы с учётом ограничения: {data.profile.limitations}</Text></AppCard> : null}

      {creating ? <AppCard>
        <Text style={styles.formTitle}>Новая программа</Text>
        <Field label="Название" value={name} onChangeText={setName} placeholder="Например, Сильная спина" />
        <Text style={styles.label}>Тренировок в неделю</Text>
        <ChoiceChips options={[2, 3, 4, 5, 6].map((value) => ({ value: String(value), label: `${value}` }))} selected={String(daysPerWeek)} onToggle={(value) => { const count = Number(value); setDaysPerWeek(count); setSchedule(getDefaultSchedule(count)); }} />
        <Text style={styles.label}>Расписание · выбрано {schedule.length} из {daysPerWeek}</Text>
        <ChoiceChips options={WEEKDAY_OPTIONS} selected={schedule.map(String)} multiple onToggle={(value) => setSchedule((current) => current.includes(Number(value)) ? current.filter((day) => day !== Number(value)) : current.length < daysPerWeek ? [...current, Number(value)].sort((a, b) => a - b) : current)} />
        <Text style={styles.label}>Упражнения · выбрано {selectedExercises.length}</Text>
        {selectedExercises.map((exerciseId) => {
          const exercise = EXERCISES.find((item) => item.id === exerciseId);
          const settings = exerciseSettings[exerciseId];
          if (!exercise || !settings) return null;
          const setSetting = (key: keyof ProgramExercise, value: number) => setExerciseSettings((current) => ({ ...current, [exerciseId]: { ...current[exerciseId], [key]: value } }));
          return <AppCard key={exerciseId} style={styles.selectedExercise}>
            <Text style={styles.optionText}>{exercise.name}</Text>
            <View style={styles.settingRow}>
              <SettingStepper label="Подходы" value={settings.sets} min={1} max={8} onChange={(value) => setSetting('sets', value)} />
              <SettingStepper label="Повторы от" value={settings.repsMin} min={1} max={settings.repsMax} onChange={(value) => { setSetting('repsMin', value); if (value > settings.repsMax) setSetting('repsMax', value); }} />
              <SettingStepper label="до" value={settings.repsMax} min={settings.repsMin} max={30} onChange={(value) => setSetting('repsMax', value)} />
              <SettingStepper label="Отдых, сек" value={settings.restSeconds} min={0} max={300} step={15} onChange={(value) => setSetting('restSeconds', value)} />
            </View>
          </AppCard>;
        })}
        <View style={styles.exerciseOptions}>{EXERCISES.map((exercise) => {
          const selected = selectedExercises.includes(exercise.id);
          return <Pressable key={exercise.id} onPress={() => {
            setSelectedExercises((current) => selected ? current.filter((id) => id !== exercise.id) : [...current, exercise.id]);
            setExerciseSettings((current) => {
              if (selected) { const next = { ...current }; delete next[exercise.id]; return next; }
              return { ...current, [exercise.id]: { exerciseId: exercise.id, sets: 3, repsMin: reps[0], repsMax: reps[1], restSeconds: goal === 'strength' ? 150 : 90 } };
            });
          }} style={[styles.exerciseOption, selected && styles.exerciseOptionSelected]}><Text style={[styles.optionText, selected && styles.optionTextSelected]}>{selected ? '✓  ' : '+  '}{exercise.name}</Text><Text style={[styles.optionMeta, selected && styles.optionTextSelected]}>{exercise.muscleGroup}</Text></Pressable>;
        })}</View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.formActions}><View style={{ flex: 1 }}><AppButton title="Назад" secondary onPress={() => { setCreating(false); setError(''); }} /></View><View style={{ flex: 2 }}><AppButton title="Сохранить программу" onPress={createProgram} /></View></View>
      </AppCard> : null}

      {data.programs.map((program) => (
        <AppCard key={program.id} style={styles.programCard}>
          <View style={styles.programTop}><View style={styles.programMark}><Text style={styles.programMarkText}>↗</Text></View><View style={{ flex: 1 }}><Text style={styles.programName}>{program.name}</Text><Text style={styles.programDescription}>{program.description}</Text></View></View>
          {program.days.map((day, index) => <View key={`${program.id}-${index}`} style={styles.dayRow}><Text style={styles.dayName}>{WEEKDAY_OPTIONS[day.weekday]?.label ?? ''} · {day.title}</Text><Text style={styles.dayMeta}>{day.exercises.map((item) => `${EXERCISES.find((exercise) => exercise.id === item.exerciseId)?.name ?? 'Упражнение'} · ${item.sets}×${item.repsMin}–${item.repsMax} · отдых ${item.restSeconds} сек`).join('\n')}</Text></View>)}
          <AppButton title="Начать следующую тренировку" compact onPress={() => startProgram(program.id)} />
        </AppCard>
      ))}
      {data.programs.length === 0 && !creating ? <AppCard><Text style={styles.empty}>После анкеты здесь появится подходящий стартовый план.</Text></AppCard> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  formTitle: { color: AppColors.text, fontSize: 17, fontWeight: '800' },
  label: { color: AppColors.muted, fontSize: 11, fontWeight: '700' },
  exerciseOptions: { gap: 6 },
  selectedExercise: { gap: 9, borderWidth: 1, borderColor: AppColors.line, padding: 11 },
  settingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  setting: { minWidth: 88, flexGrow: 1, gap: 4 },
  settingLabel: { color: AppColors.muted, fontSize: 8, fontWeight: '700' },
  settingControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 30, backgroundColor: '#F4F6F1', borderRadius: 9, paddingHorizontal: 5 },
  settingArrow: { color: '#688C43', fontSize: 16, fontWeight: '800', paddingHorizontal: 5 },
  settingValue: { color: AppColors.text, fontSize: 10, fontWeight: '800' },
  exerciseOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderWidth: 1, borderColor: AppColors.line, borderRadius: 11 },
  exerciseOptionSelected: { backgroundColor: AppColors.dark, borderColor: AppColors.dark },
  optionText: { color: AppColors.text, fontSize: 11, fontWeight: '700' },
  optionMeta: { color: AppColors.muted, fontSize: 9 },
  optionTextSelected: { color: '#FFFFFF' },
  error: { color: AppColors.danger, fontSize: 11 },
  formActions: { flexDirection: 'row', gap: 8 },
  programCard: { gap: 13 },
  programTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  programMark: { width: 42, height: 42, backgroundColor: '#EEF5E5', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  programMarkText: { color: '#678D42', fontSize: 20, fontWeight: '800' },
  programName: { color: AppColors.text, fontSize: 14, fontWeight: '800' },
  programDescription: { color: AppColors.muted, fontSize: 10, marginTop: 3 },
  dayRow: { paddingVertical: 7, borderTopWidth: 1, borderTopColor: '#EEF0EC', gap: 4 },
  dayName: { color: AppColors.text, fontSize: 11, fontWeight: '800' },
  dayMeta: { color: AppColors.muted, fontSize: 10, lineHeight: 15 },
  empty: { color: AppColors.muted, fontSize: 12, lineHeight: 18 },
  notice: { backgroundColor: '#FFF4E9', borderWidth: 1, borderColor: '#E9C5A4' },
  noticeText: { color: AppColors.text, fontSize: 11, lineHeight: 17 },
});
