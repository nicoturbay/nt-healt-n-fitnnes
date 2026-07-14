export const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Legs', 'Cardio', 'Full Body']

export const PRESET_EXERCISES = [
  { name: 'Bench Press', muscle: 'Chest' },
  { name: 'Incline Dumbbell Press', muscle: 'Chest' },
  { name: 'Cable Fly', muscle: 'Chest' },
  { name: 'Pull-Up', muscle: 'Back' },
  { name: 'Barbell Row', muscle: 'Back' },
  { name: 'Lat Pulldown', muscle: 'Back' },
  { name: 'Seated Cable Row', muscle: 'Back' },
  { name: 'Overhead Press', muscle: 'Shoulders' },
  { name: 'Lateral Raise', muscle: 'Shoulders' },
  { name: 'Face Pull', muscle: 'Shoulders' },
  { name: 'Bicep Curl', muscle: 'Arms' },
  { name: 'Hammer Curl', muscle: 'Arms' },
  { name: 'Tricep Pushdown', muscle: 'Arms' },
  { name: 'Skull Crusher', muscle: 'Arms' },
  { name: 'Plank', muscle: 'Core' },
  { name: 'Ab Wheel', muscle: 'Core' },
  { name: 'Cable Crunch', muscle: 'Core' },
  { name: 'Squat', muscle: 'Legs' },
  { name: 'Romanian Deadlift', muscle: 'Legs' },
  { name: 'Leg Press', muscle: 'Legs' },
  { name: 'Leg Curl', muscle: 'Legs' },
  { name: 'Calf Raise', muscle: 'Legs' },
  { name: 'Deadlift', muscle: 'Full Body' },
  { name: 'Running', muscle: 'Cardio' },
  { name: 'Cycling', muscle: 'Cardio' },
  { name: 'Jump Rope', muscle: 'Cardio' },
]

export const WORKOUT_TEMPLATES = [
  {
    name: 'Push Day',
    exercises: ['Bench Press', 'Incline Dumbbell Press', 'Overhead Press', 'Lateral Raise', 'Tricep Pushdown'],
  },
  {
    name: 'Pull Day',
    exercises: ['Pull-Up', 'Barbell Row', 'Lat Pulldown', 'Seated Cable Row', 'Bicep Curl'],
  },
  {
    name: 'Leg Day',
    exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'],
  },
  {
    name: 'Upper Body',
    exercises: ['Bench Press', 'Pull-Up', 'Overhead Press', 'Bicep Curl', 'Tricep Pushdown'],
  },
  {
    name: 'Full Body',
    exercises: ['Deadlift', 'Squat', 'Bench Press', 'Barbell Row', 'Plank'],
  },
]
