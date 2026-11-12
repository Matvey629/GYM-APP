import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { AppButton, AppCard, AppColors, AppScreen, ChoiceChips, Field, PageHeading } from '@/components/ui/app-screen';
import { useAppData } from '@/features/app-data/app-data-context';
import { createStarterProgram } from '@/features/programs/program-generator';
import { createId } from '@/lib/ids';
import type { ExperienceLevel, FitnessGoal, UserProfile, UserSex } from '@/types/gym';

const goalOptions = [
  { value: 'muscle', label: 'Мышечная масса' },
  { value: 'strength', label: 'Сила' },
  { value: 'weight-loss', label: 'Снижение веса' },
  { value: 'fitness', label: 'Форма и здоровье' },
];
const experienceOptions = [
  { value: 'beginner', label: 'Начинающий' },
  { value: 'intermediate', label: 'Есть опыт' },
  { value: 'advanced', label: 'Опытный' },
];
const equipmentOptions = [
  { value: 'Зал полностью', label: 'Полный зал' },
  { value: 'Гантели', label: 'Гантели' },
  { value: 'Штанга и скамья', label: 'Штанга и скамья' },
  { value: 'Тренажёры', label: 'Тренажёры' },
  { value: 'Собственный вес', label: 'Свой вес' },
  { value: 'Резинки', label: 'Резинки' },
];

export default function OnboardingScreen() {
  const { data, ready, updateData } = useAppData();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [sex, setSex] = useState<UserSex>('unspecified');
  const [goal, setGoal] = useState<FitnessGoal>('fitness');
  const [experience, setExperience] = useState<ExperienceLevel>('beginner');
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(3);
  const [equipment, setEquipment] = useState<string[]>(['Зал полностью']);
  const [limitations, setLimitations] = useState('');
  const [preferences, setPreferences] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (ready && data.profile) router.replace('/');
  }, [data.profile, ready]);

  const finishSetup = () => {
    const profile: UserProfile = {
      id: createId(),
      name: name.trim(),
      age: Number(age),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      sex,
      goal,
      experience,
      workoutsPerWeek,
      equipment,
      limitations: limitations.trim(),
      preferences: preferences.trim(),
      completedAt: new Date().toISOString(),
    };
    const program = createStarterProgram(profile);
    updateData((current) => ({ ...current, profile, programs: [...current.programs, program], measurements: [{ id: createId(), weightKg: profile.weightKg, measuredAt: new Date().toISOString() }, ...current.measurements] }));
    router.replace('/');
  };

  const continueStep = () => {
    if (step === 0) {
      const ageNumber = Number(age);
      const heightNumber = Number(heightCm);
      const weightNumber = Number(weightKg);
      if (!name.trim() || ageNumber < 14 || ageNumber > 100 || heightNumber < 100 || heightNumber > 240 || weightNumber < 30 || weightNumber > 300) {
        setFormError('Заполни имя и проверь возраст, рост и вес.');
        return;
      }
    }
    if (step === 1 && !goal) {
      setFormError('Выбери цель тренировок.');
      return;
    }
    setFormError('');
    if (step < 2) setStep((current) => current + 1);
    else finishSetup();
  };

  if (!ready || (ready && data.profile)) {
    return <AppScreen><Text style={{ color: AppColors.muted }}>Подготавливаем приложение…</Text></AppScreen>;
  }

  return (
    <AppScreen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ gap: 16 }}>
          <PageHeading eyebrow={`Настройка · шаг ${step + 1} из 3`} title={step === 0 ? 'Знакомство' : step === 1 ? 'Твоя цель' : 'Твои условия'} subtitle="Подберём комфортный стартовый план. Данные сохраняются на устройстве." />

          {step === 0 ? (
            <AppCard>
              <Field label="Как тебя зовут?" value={name} onChangeText={setName} placeholder="Имя" autoCapitalize="words" returnKeyType="next" />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Field label="Возраст" value={age} onChangeText={setAge} placeholder="лет" keyboardType="number-pad" inputStyle={{ flex: 1 }} />
                <Field label="Рост" value={heightCm} onChangeText={setHeightCm} placeholder="см" keyboardType="number-pad" inputStyle={{ flex: 1 }} />
                <Field label="Вес" value={weightKg} onChangeText={setWeightKg} placeholder="кг" keyboardType="decimal-pad" inputStyle={{ flex: 1 }} />
              </View>
              <Text style={{ color: AppColors.muted, fontSize: 11, fontWeight: '700' }}>Пол (необязательно для базового плана)</Text>
              <ChoiceChips options={[{ value: 'female', label: 'Женский' }, { value: 'male', label: 'Мужской' }, { value: 'unspecified', label: 'Не указывать' }]} selected={sex} onToggle={(value) => setSex(value as UserSex)} />
            </AppCard>
          ) : null}

          {step === 1 ? (
            <AppCard>
              <Text style={{ color: AppColors.muted, fontSize: 11, fontWeight: '700' }}>Цель</Text>
              <ChoiceChips options={goalOptions} selected={goal} onToggle={(value) => setGoal(value as FitnessGoal)} />
              <Text style={{ color: AppColors.muted, fontSize: 11, fontWeight: '700', marginTop: 8 }}>Опыт тренировок</Text>
              <ChoiceChips options={experienceOptions} selected={experience} onToggle={(value) => setExperience(value as ExperienceLevel)} />
              <Text style={{ color: AppColors.muted, fontSize: 11, fontWeight: '700', marginTop: 8 }}>Сколько раз в неделю удобно заниматься?</Text>
              <ChoiceChips options={[2, 3, 4, 5, 6].map((value) => ({ value: String(value), label: `${value} раза` }))} selected={String(workoutsPerWeek)} onToggle={(value) => setWorkoutsPerWeek(Number(value))} />
            </AppCard>
          ) : null}

          {step === 2 ? (
            <AppCard>
              <Text style={{ color: AppColors.muted, fontSize: 11, fontWeight: '700' }}>Доступное оборудование</Text>
              <ChoiceChips options={equipmentOptions} selected={equipment} multiple onToggle={(value) => setEquipment((current) => {
                if (value === 'Зал полностью') return current.includes(value) ? [] : [value];
                const withoutFullGym = current.filter((item) => item !== 'Зал полностью');
                return withoutFullGym.includes(value) ? withoutFullGym.filter((item) => item !== value) : [...withoutFullGym, value];
              })} />
              <Field label="Ограничения по упражнениям" value={limitations} onChangeText={setLimitations} placeholder="Например, не нагружать колено" multiline inputStyle={{ minHeight: 78, paddingTop: 12 }} />
              <Field label="Предпочтения" value={preferences} onChangeText={setPreferences} placeholder="Что нравится или не нравится?" multiline inputStyle={{ minHeight: 78, paddingTop: 12 }} />
              <Text style={{ color: AppColors.muted, fontSize: 11, lineHeight: 17 }}>План подберётся по цели, опыту и оборудованию. Проверь упражнения с учётом своих ограничений; их можно заменить перед занятием. При медицинских ограничениях согласуй нагрузку со специалистом.</Text>
            </AppCard>
          ) : null}

          {formError ? <Text accessibilityRole="alert" style={{ color: AppColors.danger, fontSize: 12, fontWeight: '700' }}>{formError}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {step > 0 ? <View style={{ flex: 1 }}><AppButton title="Назад" secondary onPress={() => { setFormError(''); setStep((current) => current - 1); }} /></View> : null}
            <View style={{ flex: 2 }}><AppButton title={step === 2 ? 'Создать мой план' : 'Продолжить'} onPress={continueStep} disabled={step === 2 && equipment.length === 0} /></View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
