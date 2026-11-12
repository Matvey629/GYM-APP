import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, AppColors, AppScreen, PageHeading } from '@/components/ui/app-screen';
import { useAppData } from '@/features/app-data/app-data-context';
import { getExercise } from '@/features/exercises/catalog';
import { startWorkoutData } from '@/features/workouts/workout-logic';

const WEEKDAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function isInCurrentWeek(dateValue: string) {
  const date = new Date(dateValue);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return date >= start && date <= now;
}

export default function HomeScreen() {
  const { data, saveError, updateData } = useAppData();
  const completed = data.workouts.filter((workout) => workout.status === 'completed');
  const thisWeek = completed.filter((workout) => isInCurrentWeek(workout.startedAt)).length;
  const lastWorkout = completed[0];
  let personalRecord: { exerciseId: string; weightKg: number; reps: number } | null = null;
  for (const workout of completed) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (set.completed && (!personalRecord || set.weightKg > personalRecord.weightKg)) {
          personalRecord = { exerciseId: exercise.exerciseId, weightKg: set.weightKg, reps: set.reps };
        }
      }
    }
  }
  const program = data.programs[0];
  const nextDay = program?.days[completed.filter((item) => item.programId === program.id).length % (program.days.length || 1)];
  const start = (programId?: string) => {
    updateData((current) => startWorkoutData(current, programId));
    router.push('/workout');
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>{new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase()}</Text>
          <Text style={styles.greeting}>Привет, {data.profile?.name || 'спортсмен'} 👋</Text>
        </View>
        <Link href="/profile" asChild><Pressable style={styles.avatar} accessibilityRole="button" accessibilityLabel="Профиль"><Text style={styles.avatarText}>{data.profile?.name?.slice(0, 1).toUpperCase() || 'Я'}</Text></Pressable></Link>
      </View>

      {saveError ? <AppCard style={styles.saveWarning}><Text style={styles.coachText}>{saveError}</Text></AppCard> : null}

      <PageHeading eyebrow="Твой план" title="Следующая тренировка" />
      <View style={styles.hero}>
        <View style={styles.heroTag}><View style={styles.dot} /><Text style={styles.heroTagText}>{program ? 'ПЛАН НА НЕДЕЛЮ' : 'СВОБОДНАЯ ТРЕНИРОВКА'}</Text></View>
        <Text style={styles.heroTitle}>{nextDay ? `${WEEKDAY_NAMES[nextDay.weekday] ?? ''} · ${nextDay.title}` : 'Готов к движению?'}</Text>
        <Text style={styles.heroDescription}>{program ? `${program.name} · ${nextDay?.exercises.length ?? 0} упражнений` : 'Начни тренировку и добавь упражнения из библиотеки'}</Text>
        <View style={styles.heroBottom}>
          <Text style={styles.heroMeta}>◷  ОТДЫХ И ПОДХОДЫ БУДУТ СОХРАНЕНЫ</Text>
          <AppButton title={data.activeWorkout ? 'Продолжить' : 'Начать'} compact onPress={() => start(program?.id)} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <PageHeading eyebrow="Твой ритм" title="Эта неделя" />
        <Text style={styles.goalCount}>{thisWeek}<Text style={styles.goalMuted}> / {data.profile?.workoutsPerWeek ?? 0}</Text></Text>
      </View>
      <AppCard style={styles.weekCard}>
        <Text style={styles.statMain}>{thisWeek} {thisWeek === 1 ? 'тренировка' : thisWeek < 5 ? 'тренировки' : 'тренировок'}</Text>
        <Text style={styles.muted}>из цели на неделю</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, (thisWeek / Math.max(data.profile?.workoutsPerWeek ?? 1, 1)) * 100)}%` }]} /></View>
      </AppCard>

      <View style={styles.sectionHeader}><PageHeading eyebrow="Результаты" title="Твой прогресс" /><Link href="/progress" asChild><Pressable><Text style={styles.linkText}>Все данные ↗</Text></Pressable></Link></View>
      <View style={styles.statsRow}>
        <AppCard style={[styles.statCard, styles.darkCard]}><Text style={styles.statLabelLight}>ТРЕНИРОВОК</Text><Text style={styles.statValueLight}>{completed.length}</Text><Text style={styles.statCaptionLight}>всего завершено</Text></AppCard>
        <AppCard style={styles.statCard}><Text style={styles.statLabel}>ЛИЧНЫЙ РЕКОРД</Text><Text style={styles.statValue}>{personalRecord ? `${personalRecord.weightKg} кг` : '—'}</Text><Text style={styles.statCaption}>{personalRecord ? `${getExercise(personalRecord.exerciseId)?.name ?? 'Упражнение'} · ${personalRecord.reps} повт.` : 'Появится после тренировки'}</Text></AppCard>
      </View>

      <View style={styles.sectionHeader}><PageHeading eyebrow="Недавняя активность" title="Последняя тренировка" /></View>
      {lastWorkout ? (
        <AppCard style={styles.lastWorkout}>
          <View style={styles.lastWorkoutTop}><Text style={styles.lastTitle}>{lastWorkout.title}</Text><Text style={styles.lastDate}>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(lastWorkout.finishedAt ?? lastWorkout.startedAt))}</Text></View>
          <Text style={styles.muted}>{lastWorkout.exercises.length} упражнений · {lastWorkout.exercises.reduce((sum, item) => sum + item.sets.filter((set) => set.completed).length, 0)} выполненных подходов</Text>
        </AppCard>
      ) : <AppCard><Text style={styles.muted}>Здесь появится история после первой завершённой тренировки.</Text></AppCard>}

      <AppCard style={styles.coachCard}><Text style={styles.coachEyebrow}>ТРЕНЕРСКАЯ ПОДСКАЗКА</Text><Text style={styles.coachText}>Тренируйся в комфортном темпе и записывай каждый подход — так прогресс будет виден от занятия к занятию.</Text><Text style={styles.coachSoon}>Персональные рекомендации появятся в будущей версии.</Text></AppCard>

      <View style={styles.quickLinks}>
        <Link href="/library" asChild><Pressable style={styles.quickLink}><Text style={styles.quickLinkIcon}>＋</Text><Text style={styles.quickLinkText}>Упражнения</Text></Pressable></Link>
        <Link href="/programs" asChild><Pressable style={styles.quickLink}><Text style={styles.quickLinkIcon}>▤</Text><Text style={styles.quickLinkText}>Программы</Text></Pressable></Link>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  date: { color: AppColors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  greeting: { color: AppColors.text, fontSize: 23, fontWeight: '800', marginTop: 5, letterSpacing: -0.5 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: AppColors.green, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: AppColors.text, fontWeight: '800', fontSize: 16 },
  hero: { backgroundColor: AppColors.dark, borderRadius: 23, padding: 19, gap: 11, overflow: 'hidden' },
  heroTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 },
  dot: { width: 6, height: 6, backgroundColor: AppColors.green, borderRadius: 4 },
  heroTagText: { color: '#E8F0E7', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 28, letterSpacing: -0.6, marginTop: 5 },
  heroDescription: { color: '#C5D0C6', fontSize: 12 },
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7, gap: 8 },
  heroMeta: { flex: 1, color: '#C5D0C6', fontSize: 8, fontWeight: '700', letterSpacing: 0.4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 7 },
  goalCount: { color: AppColors.text, fontWeight: '800', fontSize: 20, paddingBottom: 7 },
  goalMuted: { color: AppColors.muted, fontSize: 13 },
  weekCard: { gap: 5 },
  statMain: { color: AppColors.text, fontSize: 18, fontWeight: '800' },
  muted: { color: AppColors.muted, fontSize: 12, lineHeight: 17 },
  progressTrack: { height: 8, backgroundColor: '#EFF2EB', borderRadius: 6, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: 8, backgroundColor: '#9BD545', borderRadius: 6 },
  linkText: { color: '#607C45', fontSize: 11, fontWeight: '800', paddingBottom: 6 },
  statsRow: { flexDirection: 'row', gap: 11 },
  statCard: { flex: 1, minHeight: 130, justifyContent: 'space-between', gap: 5, padding: 14 },
  darkCard: { backgroundColor: AppColors.dark },
  statLabel: { color: AppColors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  statLabelLight: { color: '#B9C8BA', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  statValue: { color: AppColors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.7 },
  statValueLight: { color: '#FFFFFF', fontSize: 34, fontWeight: '800' },
  statCaption: { color: AppColors.muted, fontSize: 9 },
  statCaptionLight: { color: '#B9C8BA', fontSize: 10 },
  lastWorkout: { gap: 7 },
  lastWorkoutTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastTitle: { color: AppColors.text, fontSize: 15, fontWeight: '800' },
  lastDate: { color: AppColors.muted, fontSize: 11, fontWeight: '700' },
  coachCard: { backgroundColor: '#EDF3E7', gap: 8 },
  saveWarning: { borderWidth: 1, borderColor: '#E9C5A4', backgroundColor: '#FFF4E9' },
  coachEyebrow: { color: '#668545', fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  coachText: { color: AppColors.text, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  coachSoon: { color: AppColors.muted, fontSize: 10 },
  quickLinks: { flexDirection: 'row', gap: 11 },
  quickLink: { flex: 1, minHeight: 76, backgroundColor: AppColors.surface, borderRadius: 16, paddingHorizontal: 14, justifyContent: 'center', gap: 7 },
  quickLinkIcon: { color: '#759C43', fontSize: 20, fontWeight: '700' },
  quickLinkText: { color: AppColors.text, fontSize: 12, fontWeight: '800' },
});
