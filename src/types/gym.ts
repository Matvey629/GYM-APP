export type FitnessGoal = 'muscle' | 'strength' | 'weight-loss' | 'fitness';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type UserSex = 'female' | 'male' | 'unspecified';

export type UserProfile = {
  id: string;
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  sex: UserSex;
  goal: FitnessGoal;
  experience: ExperienceLevel;
  workoutsPerWeek: number;
  equipment: string[];
  limitations: string;
  preferences: string;
  completedAt: string;
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: ExperienceLevel;
  movement: string;
  instructions: string[];
  alternatives: string[];
};

export type ProgramExercise = {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
};

export type ProgramDay = {
  title: string;
  weekday: number;
  exercises: ProgramExercise[];
};

export type WorkoutProgram = {
  id: string;
  name: string;
  description: string;
  daysPerWeek: number;
  createdAt: string;
  days: ProgramDay[];
};

export type WorkoutSet = {
  id: string;
  reps: number;
  weightKg: number;
  restSeconds: number;
  completed: boolean;
  completedAt: string | null;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  programId: string | null;
  title: string;
  startedAt: string;
  finishedAt: string | null;
  status: 'active' | 'paused' | 'completed';
  restEndsAt: number | null;
  exercises: WorkoutExercise[];
};

export type BodyMeasurement = {
  id: string;
  weightKg: number;
  measuredAt: string;
};

export type GymAppData = {
  version: 1;
  profile: UserProfile | null;
  programs: WorkoutProgram[];
  workouts: WorkoutSession[];
  activeWorkout: WorkoutSession | null;
  measurements: BodyMeasurement[];
};
