import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';

const COLORS = {
  background: '#F4F5F0',
  card: '#FFFFFF',
  ink: '#17211B',
  muted: '#7D877F',
  line: '#E7EAE4',
  green: '#C7F36B',
  darkGreen: '#23372A',
};

const week = [
  { day: 'ПН', value: 0.45, active: false },
  { day: 'ВТ', value: 0.82, active: true },
  { day: 'СР', value: 0.28, active: false },
  { day: 'ЧТ', value: 0.68, active: true },
  { day: 'ПТ', value: 0.36, active: false },
  { day: 'СБ', value: 0.9, active: false },
  { day: 'ВС', value: 0.18, active: false },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

export default function HomeScreen() {
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date()),
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.date}>{dateLabel.toUpperCase()}</ThemedText>
            <ThemedText style={styles.greeting}>{getGreeting()} 👋</ThemedText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Профиль" style={styles.avatar}>
            <ThemedText style={styles.avatarText}>Я</ThemedText>
          </Pressable>
        </View>

        <View style={styles.sectionHeading}>
          <ThemedText style={styles.sectionEyebrow}>ТВОЙ ПЛАН</ThemedText>
          <ThemedText style={styles.sectionTitle}>Сегодня</ThemedText>
        </View>

        <View style={styles.workoutCard}>
          <View style={styles.workoutTopline}>
            <View style={styles.workoutTag}>
              <View style={styles.tagDot} />
              <ThemedText style={styles.workoutTagText}>ТРЕНИРОВКА ДНЯ</ThemedText>
            </View>
            <ThemedText style={styles.cardMore}>•••</ThemedText>
          </View>

          <ThemedText style={styles.workoutTitle}>Верх тела</ThemedText>
          <ThemedText style={styles.workoutDescription}>
            Сила и контроль · 6 упражнений
          </ThemedText>

          <View style={styles.workoutFooter}>
            <View style={styles.duration}>
              <ThemedText style={styles.durationIcon}>◷</ThemedText>
              <ThemedText style={styles.durationText}>50 МИН</ThemedText>
            </View>
            <Link href="/explore" asChild>
              <Pressable style={styles.startButton} accessibilityRole="button">
                <ThemedText style={styles.startButtonText}>Начать</ThemedText>
                <ThemedText style={styles.startArrow}>↗</ThemedText>
              </Pressable>
            </Link>
          </View>
          <View style={styles.cardDecoration} />
        </View>

        <View style={styles.sectionHeadingRow}>
          <View>
            <ThemedText style={styles.sectionEyebrow}>ТВОЙ РИТМ</ThemedText>
            <ThemedText style={styles.sectionTitle}>Эта неделя</ThemedText>
          </View>
          <View style={styles.weekCount}>
            <ThemedText style={styles.weekCountValue}>2</ThemedText>
            <ThemedText style={styles.weekCountLabel}>/ 4</ThemedText>
          </View>
        </View>

        <View style={styles.weekCard}>
          <View style={styles.weekChart}>
            {week.map((item) => (
              <View key={item.day} style={styles.dayColumn}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${Math.round(item.value * 100)}%` },
                      item.active && styles.barFillActive,
                    ]}
                  />
                </View>
                <ThemedText style={[styles.dayLabel, item.active && styles.dayLabelActive]}>
                  {item.day}
                </ThemedText>
              </View>
            ))}
          </View>
          <View style={styles.weekDivider} />
          <View style={styles.weekSummary}>
            <View style={styles.streakIcon}>
              <ThemedText style={styles.streakIconText}>↗</ThemedText>
            </View>
            <ThemedText style={styles.weekSummaryText}>
              Ещё <ThemedText style={styles.weekSummaryStrong}>2 тренировки</ThemedText> до цели
            </ThemedText>
            <ThemedText style={styles.weekSummaryArrow}>→</ThemedText>
          </View>
        </View>

        <View style={styles.sectionHeadingRow}>
          <View>
            <ThemedText style={styles.sectionEyebrow}>НЕ ОСТАНАВЛИВАЙСЯ</ThemedText>
            <ThemedText style={styles.sectionTitle}>Твой прогресс</ThemedText>
          </View>
          <Pressable accessibilityRole="button" style={styles.moreButton}>
            <ThemedText style={styles.moreButtonText}>Подробнее ↗</ThemedText>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardDark]}>
            <ThemedText style={styles.statLabelLight}>ТРЕНИРОВОК</ThemedText>
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValueLight}>12</ThemedText>
              <ThemedText style={styles.statTrend}>+3</ThemedText>
            </View>
            <ThemedText style={styles.statCaptionLight}>за этот месяц</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>ОБЩЕЕ ВРЕМЯ</ThemedText>
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>8.5</ThemedText>
              <ThemedText style={styles.statUnit}>ч</ThemedText>
            </View>
            <ThemedText style={styles.statCaption}>в зале в этом месяце</ThemedText>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  date: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.35,
  },
  greeting: {
    color: COLORS.ink,
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginTop: 5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHeading: {
    marginBottom: 14,
  },
  sectionEyebrow: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.55,
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 3,
  },
  workoutCard: {
    minHeight: 218,
    borderRadius: 23,
    padding: 20,
    backgroundColor: COLORS.darkGreen,
    overflow: 'hidden',
    marginBottom: 28,
  },
  workoutTopline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  workoutTagText: {
    color: '#E9F3E8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardMore: {
    color: '#CFD8CF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2,
  },
  workoutTitle: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '700',
    letterSpacing: -1,
    marginTop: 20,
  },
  workoutDescription: {
    color: '#B8C7BA',
    fontSize: 13,
    marginTop: 4,
  },
  workoutFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 19,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  durationIcon: {
    color: COLORS.green,
    fontSize: 18,
  },
  durationText: {
    color: '#DCE5DB',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  startButton: {
    height: 42,
    minWidth: 112,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: COLORS.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  startButtonText: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  startArrow: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  cardDecoration: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(220,245,208,0.08)',
    right: -85,
    top: 53,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  weekCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingBottom: 3,
  },
  weekCountValue: {
    color: COLORS.ink,
    fontSize: 21,
    fontWeight: '800',
  },
  weekCountLabel: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  weekCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 17,
    paddingTop: 17,
    paddingBottom: 13,
    marginBottom: 28,
  },
  weekChart: {
    height: 98,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 14,
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#F0F2EC',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#CFD6CA',
    borderRadius: 8,
  },
  barFillActive: {
    backgroundColor: '#9BD545',
  },
  dayLabel: {
    color: '#9AA29B',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 7,
  },
  dayLabelActive: {
    color: COLORS.ink,
  },
  weekDivider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginTop: 13,
  },
  weekSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    gap: 9,
  },
  streakIcon: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#F0F6E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakIconText: {
    color: '#669B25',
    fontSize: 15,
    fontWeight: '800',
  },
  weekSummaryText: {
    color: COLORS.muted,
    fontSize: 11,
    flex: 1,
  },
  weekSummaryStrong: {
    color: COLORS.ink,
    fontWeight: '800',
  },
  weekSummaryArrow: {
    color: COLORS.muted,
    fontSize: 17,
  },
  moreButton: {
    paddingBottom: 5,
  },
  moreButtonText: {
    color: '#607C45',
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minHeight: 125,
    backgroundColor: COLORS.card,
    borderRadius: 19,
    padding: 15,
    justifyContent: 'space-between',
  },
  statCardDark: {
    backgroundColor: COLORS.darkGreen,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statLabelLight: {
    color: '#B7C6B8',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
    marginTop: 7,
  },
  statValue: {
    color: COLORS.ink,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -1,
  },
  statValueLight: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -1,
  },
  statTrend: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '800',
  },
  statUnit: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: '700',
  },
  statCaption: {
    color: COLORS.muted,
    fontSize: 10,
  },
  statCaptionLight: {
    color: '#B7C6B8',
    fontSize: 10,
  },
  bottomSpace: {
    height: 24,
  },
});
