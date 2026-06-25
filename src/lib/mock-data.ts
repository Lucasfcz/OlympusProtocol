export const weeklyEvolution = [
  { m: "JAN", v: 60 }, { m: "JAN", v: 62 }, { m: "FEV", v: 58 }, { m: "FEV", v: 64 },
  { m: "FEV", v: 66 }, { m: "MAR", v: 65 }, { m: "MAR", v: 68 }, { m: "MAR", v: 70 },
  { m: "ABR", v: 69 }, { m: "ABR", v: 72 }, { m: "ABR", v: 74 }, { m: "MAI", v: 73 },
  { m: "MAI", v: 76 }, { m: "MAI", v: 78 }, { m: "MAI", v: 80 }, { m: "JUN", v: 82 },
  { m: "JUN", v: 81 }, { m: "JUN", v: 83 }, { m: "JUN", v: 85 },
];

export const exercisesToday = [
  { id: "supino-reto", name: "Supino Reto", sets: 4, done: true, muscle: "peito" },
  { id: "supino-inclinado", name: "Supino Inclinado", sets: 4, done: true, muscle: "peito" },
  { id: "crucifixo", name: "Crucifixo", sets: 3, done: true, muscle: "peito" },
  { id: "crossover", name: "Crossover", sets: 3, done: false, muscle: "peito" },
  { id: "triceps-testa", name: "Tríceps Testa", sets: 3, done: false, muscle: "triceps" },
  { id: "triceps-corda", name: "Tríceps Corda", sets: 3, done: false, muscle: "triceps" },
  { id: "mergulho", name: "Mergulho", sets: 2, done: false, muscle: "triceps" },
];

export const setHistory = [
  { n: 1, reps: 20, kg: 60 },
  { n: 2, reps: 12, kg: 70 },
  { n: 3, reps: 10, kg: 80 },
];

export const badges = [
  { id: "primeiro", title: "Primeiro Passo", subtitle: "Conclua seu primeiro treino", unlocked: true, icon: "athlete" },
  { id: "100", title: "100 Treinos", subtitle: "Conclua 100 treinos", unlocked: true, icon: "wreath" },
  { id: "forca", title: "Força Olímpica", subtitle: "Supino acima de 100kg", unlocked: true, icon: "lift" },
  { id: "disciplina", title: "Disciplina", subtitle: "4 semanas consecutivas", unlocked: false, icon: "athlete" },
  { id: "volume", title: "Volume", subtitle: "1.000.000 kg de volume", unlocked: false, icon: "column" },
  { id: "imbativel", title: "Imbatível", subtitle: "12 semanas consecutivas", unlocked: false, icon: "wreath" },
];

export const ranking = [
  { pos: 1, name: "João Vitor", workouts: 18, you: false },
  { pos: 2, name: "Lucas Lima", workouts: 16, you: false },
  { pos: 3, name: "Pedro Henrique", workouts: 15, you: false },
  { pos: 4, name: "Você", workouts: 14, you: true },
  { pos: 5, name: "Rafael Souza", workouts: 12, you: false },
  { pos: 6, name: "Marcos Dias", workouts: 11, you: false },
];
