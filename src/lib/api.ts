// Cliente REST centralizado do Olympus Protocol.
// Injeta Bearer token, intercepta 401 e tipa endpoints.

export const API_BASE_URL = "https://olympusprotocol.onrender.com";
export const TOKEN_KEY = "olympus_token";

// ---------- Types ----------
export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
export type Goal = "HYPERTROPHY" | "FAT_LOSS" | "STRENGTH" | "ENDURANCE";
export type MuscleGroup =
  | "CHEST" | "BACK" | "SHOULDERS" | "BICEPS" | "TRICEPS" | "FOREARMS"
  | "QUADRICEPS" | "HAMSTRINGS" | "GLUTES" | "CALVES" | "ABS";

export type AuthResponse = { token: string; name: string; email: string; role: string };

export type UserMe = {
  name: string; email: string; role: string;
  avatarUrl?: string | null;
  experienceLevel: ExperienceLevel;
  bodyWeight?: number | null;
  height?: number | null;
  createdAt: string;
};

export type UserSummary = { id: string; name: string; avatarUrl?: string | null; experienceLevel: ExperienceLevel };

export type WorkoutExercise = {
  id: string; exerciseId: string; exerciseName: string;
  exerciseOrder: number; sets: number; reps: number; restTime: number;
};
export type WorkoutDay = {
  id: string; name: string; dayOrder: number; exercises: WorkoutExercise[];
};
export type WorkoutPlanResponse = {
  id: string; name: string; goal: Goal; active: boolean; isPublic: boolean; createdAt: string;
  days: WorkoutDay[]; warnings: string[];
};

export type ExerciseMuscle = {
  id: string; muscleGroup: MuscleGroup; muscleRegion?: string; muscleHead?: string;
  muscleRole?: string; activationPercent?: number;
};
export type ExerciseResponse = {
  id: string; name: string; description?: string;
  minExperienceLevel: ExperienceLevel;
  safetyRating?: number; efficiencyRating?: number;
  gifUrl?: string | null; usesBodyWeight: boolean; active: boolean;
  muscles: ExerciseMuscle[];
  tips?: { id: string; targetLevel: ExperienceLevel; tipType: string; content: string }[];
  contraindications?: { id: string; condition: string; explanation: string }[];
};

export type SessionSet = {
  id: string; sessionExerciseId: string; setOrder: number;
  reps: number; weight?: number | null; restTime?: number | null; rpe?: number | null;
  musclesVolumes?: { muscleGroup: MuscleGroup; totalVolume: number }[];
};
export type SessionExercise = {
  id: string; exerciseId: string; exerciseName: string; exerciseOrder: number;
  exerciseVolume: number;
  sets: SessionSet[];
  totalMuscleVolume?: { muscleGroup: MuscleGroup; totalVolume: number }[];
};
export type WorkoutSessionResponse = {
  id: string; workoutDayId?: string | null; workoutDayName?: string | null;
  notes?: string | null; startedAt: string; finishedAt: string | null;
  totalVolume: number; durationMinutes: number; totalExercises: number;
  sessionExercises: SessionExercise[];
  warnings: string[];
};
export type MuscleVolumeChange = {
  muscleGroup: MuscleGroup; currentVolume: number; previousVolume: number; percentageChange: number;
};
export type SessionSummaryResponse = {
  sessionId: string; workoutDayName?: string | null;
  durationMinutes: number; totalVolume: number;
  exercises: SessionExercise[];
  totalMuscleVolumes: { muscleGroup: MuscleGroup; totalVolume: number }[];
  muscleVolumeChanges?: MuscleVolumeChange[];
};

export type UserStats = {
  totalSessions: number; totalSets: number;
  totalVolumeAllTime: number; totalMinutesTrained: number;
};
export type WeeklyVolume = { volumes: { day: string; volume: number }[] };
export type MonthlyFrequency = {
  totalSessions: number; totalDays: number; avgSessionsPerWeek: number;
  sessionsPerWeek: { date: string; value: number }[];
};
export type ExerciseStats = {
  exerciseId: string; exerciseName: string;
  totalSets: number; maxWeight: number; repsIfMaxWeight: number;
  dayOfSetWithMaxWeight: string;
  progression: { date: string; value: number }[];
};

// ---------- Pagination (Spring Data) ----------
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements?: number;
  empty?: boolean;
};
export type PageParams = { page?: number; size?: number; sort?: string };
export const DEFAULT_PAGE_SIZE = 20;

export const emptyPage = <T>(): Page<T> => ({
  content: [], totalElements: 0, totalPages: 0,
  number: 0, size: DEFAULT_PAGE_SIZE, first: true, last: true,
});

export function appendPageParams(q: URLSearchParams, p?: PageParams) {
  q.set("page", String(p?.page ?? 0));
  q.set("size", String(p?.size ?? DEFAULT_PAGE_SIZE));
  if (p?.sort) q.set("sort", p.sort);
}

// ---------- Client ----------
export class ApiError extends Error {
  constructor(public status: number, public payload: unknown, msg: string) { super(msg); }
}

export const getToken = () =>
  typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (typeof window === "undefined") return;
  if (t) window.localStorage.setItem(TOKEN_KEY, t);
  else window.localStorage.removeItem(TOKEN_KEY);
};

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...opts, headers });

  if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/api/auth/")) {
    setToken(null);
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new ApiError(401, null, "Unauthorized");
  }

  const raw = await res.text();
  let data: unknown = null;
  if (raw) { try { data = JSON.parse(raw); } catch { data = raw; } }

  if (!res.ok) {
    const msg = (data && typeof data === "object" && "message" in (data as Record<string, unknown>))
      ? String((data as Record<string, unknown>).message)
      : res.statusText || "Erro na requisição";
    throw new ApiError(res.status, data, msg);
  }
  return data as T;
}

export const api = {
  get:  <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put:  <T>(p: string, body?: unknown) =>
    request<T>(p, { method: "PUT",  body: body === undefined ? undefined : JSON.stringify(body) }),
  patch:<T>(p: string, body?: unknown) =>
    request<T>(p, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  del:  <T = void>(p: string) => request<T>(p, { method: "DELETE" }),
};

// ---------- Endpoints ----------
export const AuthAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/api/auth/login", { email, password }),
  register: (data: {
    name: string; email: string; password: string;
    experienceLevel: ExperienceLevel; bodyWeight?: number; height?: number;
  }) => api.post<AuthResponse>("/api/auth/register", data),
};

export const UsersAPI = {
  me: () => api.get<UserMe>("/api/users/me"),
  updateMe: (d: { name?: string; avatarUrl?: string }) => api.patch<void>("/api/users/me", d),
  updateBodyWeight: (bodyWeight: number) => api.put<void>("/api/users/me/body-weight", { bodyWeight }),
  updateHeight: (height: number) => api.put<void>("/api/users/me/height", { height }),
  delete: () => api.del("/api/users/me"),
  get: (userId: string) => api.get<UserSummary>(`/api/users/${userId}`),
  search: (name: string, page?: PageParams) => {
    const q = new URLSearchParams({ name });
    appendPageParams(q, page);
    return api.get<Page<UserSummary>>(`/api/users/search?${q.toString()}`);
  },
};

export const PlansAPI = {
  list: () => api.get<WorkoutPlanResponse[]>("/api/workout-plans"),
  get: (id: string) => api.get<WorkoutPlanResponse>(`/api/workout-plans/${id}`),
  create: (d: { name: string; goal: Goal }) => api.post<WorkoutPlanResponse>("/api/workout-plans", d),
  copy: (originalPlanId: string, d: { name: string; goal: Goal }) =>
    api.post<WorkoutPlanResponse>(`/api/workout-plans/copy/${originalPlanId}`, d),
  toggleVisibility: (planId: string) => api.patch<void>(`/api/workout-plans/${planId}`),
  deactivate: (planId: string) => api.patch<void>(`/api/workout-plans/${planId}/deactivate`),
  reactivate: (planId: string) => api.patch<void>(`/api/workout-plans/${planId}/reactivate`),
  addDay: (planId: string, d: { name: string; dayOrder: number }) =>
    api.post<WorkoutPlanResponse>(`/api/workout-plans/${planId}/days`, d),
  updateDay: (planId: string, dayId: string, d: { name: string; dayOrder: number }) =>
    api.put<void>(`/api/workout-plans/${planId}/days/${dayId}`, d),
  deleteDay: (planId: string, dayId: string) =>
    api.del(`/api/workout-plans/${planId}/days/${dayId}`),
  addExercise: (planId: string, dayId: string,
    d: { exerciseId: string; exerciseOrder: number; sets: number; reps: number; restTime: number }) =>
    api.post<WorkoutPlanResponse>(`/api/workout-plans/${planId}/days/${dayId}/exercises`, d),
  updateExercise: (planId: string, dayId: string, exerciseId: string,
    d: { exerciseId: string; exerciseOrder: number; sets: number; reps: number; restTime: number }) =>
    api.put<void>(`/api/workout-plans/${planId}/days/${dayId}/exercises/${exerciseId}`, d),
  deleteExercise: (planId: string, dayId: string, exerciseId: string) =>
    api.del(`/api/workout-plans/${planId}/days/${dayId}/exercises/${exerciseId}`),
  reorderDays: (planId: string, orders: { dayId: string; order: number }[]) =>
    api.patch<void>(`/api/workout-plans/${planId}/days/reorder`, { orders }),
  reorderExercises: (planId: string, dayId: string, orders: { exerciseId: string; order: number }[]) =>
    api.patch<void>(`/api/workout-plans/${planId}/days/${dayId}/exercises/reorder`, { orders }),
};

export const ExercisesAPI = {
  list: (params: {
    name?: string; muscleGroups?: MuscleGroup[];
    safetyRatings?: number[]; efficiencyRatings?: number[];
    levels?: ExperienceLevel[]; muscleHeads?: string[];
  } = {}) => {
    const q = new URLSearchParams();
    if (params.name) q.set("name", params.name);
    params.muscleGroups?.forEach(v => q.append("muscleGroups", v));
    params.safetyRatings?.forEach(v => q.append("safetyRatings", String(v)));
    params.efficiencyRatings?.forEach(v => q.append("efficiencyRatings", String(v)));
    params.levels?.forEach(v => q.append("levels", v));
    params.muscleHeads?.forEach(v => q.append("muscleHeads", v));
    const s = q.toString();
    return api.get<ExerciseResponse[]>(`/api/exercises${s ? `?${s}` : ""}`);
  },
  get: (id: string) => api.get<ExerciseResponse>(`/api/exercises/${id}`),
};

export const SessionsAPI = {
  createFree: () => api.post<WorkoutSessionResponse>("/api/sessions/free"),
  createFromPlan: (workoutDayId: string) =>
    api.post<WorkoutSessionResponse>(`/api/sessions/from-plan/${workoutDayId}`),
  list: () => api.get<WorkoutSessionResponse[]>("/api/sessions"),
  get: (sessionId: string) => api.get<WorkoutSessionResponse>(`/api/sessions/${sessionId}`),
  summary: (sessionId: string) => api.get<SessionSummaryResponse>(`/api/sessions/${sessionId}/summary`),
  addExercise: (sessionId: string, d: { exerciseId: string; exerciseOrder: number }) =>
    api.post<WorkoutSessionResponse>(`/api/sessions/${sessionId}/exercises`, d),
  removeExercise: (sessionId: string, sessionExerciseId: string) =>
    api.del(`/api/sessions/${sessionId}/exercises/${sessionExerciseId}`),
  swapExercise: (sessionId: string, sessionExerciseId: string,
    d: { newExerciseId: string; exerciseOrder: number }) =>
    api.put<WorkoutSessionResponse>(`/api/sessions/${sessionId}/exercises/${sessionExerciseId}`, d),
  addSet: (sessionId: string, sessionExerciseId: string,
    d: { setOrder: number; reps: number; weight?: number; restTime: number; rpe?: number }) =>
    api.post<WorkoutSessionResponse>(`/api/sessions/${sessionId}/exercises/${sessionExerciseId}/sets`, d),
  updateSet: (sessionId: string, sessionExerciseId: string, setId: string,
    d: { setOrder: number; reps: number; weight: number; restTime: number; rpe: number }) =>
    api.put<WorkoutSessionResponse>(`/api/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`, d),
  removeSet: (sessionId: string, sessionExerciseId: string, setId: string) =>
    api.del(`/api/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`),
  reorderSets: (sessionId: string, sessionExerciseId: string, orders: { setId: string; order: number }[]) =>
    api.patch<void>(`/api/sessions/${sessionId}/exercises/${sessionExerciseId}/sets/reorder`, { orders }),
  reorderExercises: (sessionId: string, orders: { exerciseId: string; order: number }[]) =>
    api.patch<void>(`/api/sessions/${sessionId}/exercises/reorder`, { orders }),
  finish: (sessionId: string, notes?: string) =>
    api.patch<SessionSummaryResponse>(`/api/sessions/${sessionId}/finish`, { notes }),
};

export const StatsAPI = {
  me: () => api.get<UserStats>("/api/stats/user/me"),
  weeklyVolume: () => api.get<WeeklyVolume>("/api/stats/volume/weekly"),
  muscleVolume: (m: MuscleGroup) => api.get<{ muscleGroup: MuscleGroup; totalVolume: number }>(`/api/stats/volume/muscle/${m}`),
  monthlyFrequency: () => api.get<MonthlyFrequency>("/api/stats/frequency/monthly"),
  exercise: (exerciseId: string) => api.get<ExerciseStats>(`/api/stats/exercise/${exerciseId}`),
  lastSessionChange: () =>
    api.get<MuscleVolumeChange[]>("/api/stats/volume/change/last-session"),
};
