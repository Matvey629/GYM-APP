import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { saveAppData, loadAppData } from '@/lib/app-storage';
import type { GymAppData } from '@/types/gym';

const EMPTY_DATA: GymAppData = {
  version: 1,
  profile: null,
  programs: [],
  workouts: [],
  activeWorkout: null,
  measurements: [],
};

type AppDataContextValue = {
  data: GymAppData;
  ready: boolean;
  saveError: string | null;
  updateData: (updater: (current: GymAppData) => GymAppData) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(EMPTY_DATA);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dataRef = useRef(data);

  useEffect(() => {
    let mounted = true;
    loadAppData().then((stored) => {
      if (!mounted) return;
      if (stored) {
        const restored = { ...EMPTY_DATA, ...stored, measurements: stored.measurements ?? [] };
        dataRef.current = restored;
        setData(restored);
      }
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const updateData = useCallback((updater: (current: GymAppData) => GymAppData) => {
    const next = updater(dataRef.current);
    dataRef.current = next;
    setData(next);
    void saveAppData(next).then(() => setSaveError(null)).catch(() => setSaveError('Не удалось сохранить данные на устройстве. Проверь свободное место.'));
  }, []);

  const value = useMemo(() => ({ data, ready, saveError, updateData }), [data, ready, saveError, updateData]);
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside AppDataProvider');
  return context;
}

export { EMPTY_DATA };
