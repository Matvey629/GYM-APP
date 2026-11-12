import { Platform } from 'react-native';

import type { GymAppData } from '@/types/gym';

const STORAGE_KEY = 'gym-app-data-v1';

export async function loadAppData(): Promise<GymAppData | null> {
  try {
    let value: string | null;
    if (Platform.OS === 'web') {
      value = globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
    } else {
      const { File, Paths } = await import('expo-file-system');
      const file = new File(Paths.document, STORAGE_KEY);
      value = file.exists ? await file.text() : null;
    }
    if (!value) return null;

    const parsed = JSON.parse(value) as GymAppData;
    return parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

let writeQueue = Promise.resolve();

export function saveAppData(data: GymAppData): Promise<void> {
  const value = JSON.stringify(data);
  writeQueue = writeQueue.catch(() => undefined).then(async () => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(STORAGE_KEY, value);
      return;
    }
    const { File, Paths } = await import('expo-file-system');
    const file = new File(Paths.document, STORAGE_KEY);
    if (!file.exists) file.create();
    await file.write(value);
  });
  return writeQueue;
}
