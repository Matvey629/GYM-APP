import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { AppColors } from '@/components/ui/app-screen';
import { useAppData } from '@/features/app-data/app-data-context';

export default function TabLayout() {
  const { data, ready } = useAppData();

  useEffect(() => {
    if (ready && !data.profile) router.replace('/onboarding');
  }, [data.profile, ready]);

  if (!ready || !data.profile) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.background }}><ActivityIndicator color="#789C4C" /></View>;
  }

  return <AppTabs />;
}
