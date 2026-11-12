import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!supabaseUrl || !supabasePublishableKey) {
  const missingVariables = [
    !supabaseUrl && 'EXPO_PUBLIC_SUPABASE_URL',
    !supabasePublishableKey && 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  ].filter((variable): variable is string => Boolean(variable));
  throw new Error(
    `Supabase configuration is missing ${missingVariables.join(', ')}. Add these values to .env.local and restart Expo.`,
  );
}

try {
  const parsedUrl = new URL(supabaseUrl);
  if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') {
    throw new Error();
  }
} catch {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL must be a valid HTTPS Supabase URL (HTTP is allowed for localhost).');
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
