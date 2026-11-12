# Gym App

Кроссплатформенное мобильное приложение для планирования тренировок и отслеживания прогресса на Expo, React Native и TypeScript.

## Начало работы

```bash
npm install
npx expo start
```

Команды проекта: `npm run lint`, `npx tsc --noEmit`. Маршруты Expo Router находятся в `src/app/`.

## Структура

- `src/app/` — экраны и навигация: группы `(auth)` и `(tabs)`, динамический экран `exercise/[id]`.
- `src/components/` — общие UI-компоненты, компоненты тренировок, графиков и упражнений.
- `src/features/` — доменные функции: auth, workouts, programs, exercises, analytics, recovery и ai-coach.
- `src/lib/` — клиенты сервисов и общие утилиты; здесь появятся `supabase.ts` и `api.ts` при интеграции backend.
- `src/hooks/`, `src/constants/`, `src/types/` — общие hooks, настройки/токены и TypeScript-типы.
- `supabase/` — миграции схемы, Edge Functions и начальные данные.
- `assets/` — изображения, иконки и шрифты.
- `docs/` — описание продукта, архитектуры, базы данных, визуальной системы и плана развития.

Подробные границы модулей и правила размещения кода: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Статус

Репозиторий содержит начальный Expo-шаблон и подготовленный каркас Gym App. Доменные экраны, backend и бизнес-логика ещё не реализованы.
