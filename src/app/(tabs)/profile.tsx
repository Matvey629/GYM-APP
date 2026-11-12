import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, AppColors, AppScreen, Field, PageHeading } from '@/components/ui/app-screen';
import { useAppData } from '@/features/app-data/app-data-context';
import { createId } from '@/lib/ids';

const goalLabels = { muscle: 'Мышечная масса', strength: 'Сила', 'weight-loss': 'Снижение веса', fitness: 'Общая форма' };
const experienceLabels = { beginner: 'Начинающий', intermediate: 'Есть опыт', advanced: 'Опытный' };

export default function ProfileScreen() {
  const { data, updateData } = useAppData();
  const [newWeight, setNewWeight] = useState('');
  const [message, setMessage] = useState('');
  const profile = data.profile;

  if (!profile) return <AppScreen><PageHeading title="Профиль появится после настройки" /></AppScreen>;

  const saveWeight = () => {
    const value = Number(newWeight.replace(',', '.'));
    if (!Number.isFinite(value) || value < 30 || value > 300) {
      setMessage('Введи вес от 30 до 300 кг.');
      return;
    }
    updateData((current) => current.profile ? ({
      ...current,
      profile: { ...current.profile, weightKg: value },
      measurements: [{ id: createId(), weightKg: value, measuredAt: new Date().toISOString() }, ...current.measurements],
    }) : current);
    setNewWeight('');
    setMessage('Замер сохранён. Он появится в разделе «Прогресс».');
  };

  const rows = [
    ['Возраст', `${profile.age} лет`],
    ['Рост', `${profile.heightCm} см`],
    ['Текущий вес', `${profile.weightKg} кг`],
    ['Цель', goalLabels[profile.goal]],
    ['Опыт', experienceLabels[profile.experience]],
    ['Тренировок в неделю', String(profile.workoutsPerWeek)],
    ['Пол', profile.sex === 'female' ? 'Женский' : profile.sex === 'male' ? 'Мужской' : 'Не указан'],
  ];

  return (
    <AppScreen>
      <PageHeading eyebrow="Твои данные" title={profile.name} subtitle="Профиль хранится на этом устройстве." />
      <AppCard style={styles.profileCard}>
        <Text style={styles.sectionTitle}>Параметры и цель</Text>
        {rows.map(([label, value]) => <View key={label} style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>)}
      </AppCard>
      <AppCard>
        <Text style={styles.sectionTitle}>Оборудование</Text>
        <Text style={styles.detail}>{profile.equipment.length ? profile.equipment.join(' · ') : 'Не выбрано'}</Text>
        <Text style={styles.sectionTitle}>Ограничения</Text>
        <Text style={styles.detail}>{profile.limitations || 'Не указаны'}</Text>
        <Text style={styles.sectionTitle}>Предпочтения</Text>
        <Text style={styles.detail}>{profile.preferences || 'Не указаны'}</Text>
      </AppCard>
      <AppCard>
        <Text style={styles.sectionTitle}>Записать вес</Text>
        <Text style={styles.detail}>Сохрани новый замер, чтобы видеть динамику в аналитике.</Text>
        <Field label="Вес, кг" value={newWeight} onChangeText={setNewWeight} placeholder={`${profile.weightKg}`} keyboardType="decimal-pad" />
        {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
        <AppButton title="Сохранить замер" onPress={saveWeight} />
      </AppCard>
      <View style={styles.links}>
        <AppButton title="Мои программы" secondary onPress={() => router.push('/programs')} />
        <AppButton title="История и аналитика" secondary onPress={() => router.push('/progress')} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  profileCard: { gap: 4 },
  sectionTitle: { color: AppColors.text, fontSize: 13, fontWeight: '800', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F1EE' },
  label: { color: AppColors.muted, fontSize: 11 },
  value: { color: AppColors.text, fontSize: 11, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  detail: { color: AppColors.muted, fontSize: 11, lineHeight: 17 },
  message: { color: '#688C43', fontSize: 10, lineHeight: 15 },
  links: { gap: 8 },
});
