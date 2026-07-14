export const CATEGORY_META = {
  chest:      { label: 'Chest',      color: 'bg-blue-500',    light: 'bg-blue-500/20',    text: 'text-blue-400' },
  back:       { label: 'Back',       color: 'bg-purple-500',  light: 'bg-purple-500/20',  text: 'text-purple-400' },
  shoulders:  { label: 'Shoulders',  color: 'bg-orange-500',  light: 'bg-orange-500/20',  text: 'text-orange-400' },
  biceps:     { label: 'Biceps',     color: 'bg-yellow-500',  light: 'bg-yellow-500/20',  text: 'text-yellow-400' },
  triceps:    { label: 'Triceps',    color: 'bg-amber-500',   light: 'bg-amber-500/20',   text: 'text-amber-400' },
  quads:      { label: 'Quads',      color: 'bg-green-500',   light: 'bg-green-500/20',   text: 'text-green-400' },
  hamstrings: { label: 'Hamstrings', color: 'bg-teal-500',    light: 'bg-teal-500/20',    text: 'text-teal-400' },
  glutes:     { label: 'Glutes',     color: 'bg-emerald-500', light: 'bg-emerald-500/20', text: 'text-emerald-400' },
  core:       { label: 'Core',       color: 'bg-red-500',     light: 'bg-red-500/20',     text: 'text-red-400' },
  cardio:     { label: 'Cardio',     color: 'bg-pink-500',    light: 'bg-pink-500/20',    text: 'text-pink-400' },
  full:       { label: 'Full Body',  color: 'bg-cyan-500',    light: 'bg-cyan-500/20',    text: 'text-cyan-400' },
}

// Nicolas's Plan — Phase 1 (3x Full Body)
// Goal: Lean muscle recomposition (Brad Pitt Fight Club aesthetic)
// Equipment: Dumbbells, kettlebells, adjustable bench, resistance bands, weighted jump rope
// Experience: Moderate/minimal — 3 days to start, scaling to 5

export const DEFAULT_WORKOUT_PLAN = {
  name: 'Full Body 3x — Phase 1',
  note: 'Phase 1: 3 days per week, full body. Focus on form and consistency. Will scale to 4-5 days after 4-6 weeks.',
  // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
  schedule: { 0: null, 1: 'dayA', 2: null, 3: 'dayB', 4: null, 5: 'dayA', 6: null },
  workouts: {
    dayA: {
      name: 'Day A — Full Body',
      focus: 'Squat · Push · Hinge · Pull · Core',
      exercises: [
        {
          id: 'goblet-squat',
          name: 'Goblet Squat',
          category: 'quads',
          description: 'Hold a dumbbell or kettlebell at chest height. Feet shoulder-width apart, squat deep keeping chest tall. Great for quad and glute development with less lower back load.',
          targetSets: 4,
          targetReps: '10–12',
        },
        {
          id: 'db-bench-press',
          name: 'Dumbbell Bench Press',
          category: 'chest',
          description: 'Lie on bench, dumbbells at chest level. Press up and slightly inward. Control the descent for 2–3 seconds. Primary chest and tricep builder.',
          targetSets: 4,
          targetReps: '8–10',
        },
        {
          id: 'db-rdl',
          name: 'Dumbbell Romanian Deadlift',
          category: 'hamstrings',
          description: 'Hip hinge movement. Push hips back, keep back flat, lower dumbbells along legs until you feel hamstring stretch. Drive hips forward to return.',
          targetSets: 3,
          targetReps: '10–12',
        },
        {
          id: 'db-row',
          name: 'Dumbbell Row',
          category: 'back',
          description: 'Brace on the bench with one knee. Pull dumbbell to hip, lead with elbow. Squeeze lat at top. Keep torso parallel to floor.',
          targetSets: 4,
          targetReps: '10–12',
        },
        {
          id: 'db-lateral-raises',
          name: 'Lateral Raises',
          category: 'shoulders',
          description: 'Lead with elbows, not hands. Raise to shoulder height, control the negative over 3 seconds. Key for the wide shoulder look.',
          targetSets: 3,
          targetReps: '12–15',
        },
        {
          id: 'plank',
          name: 'Plank Hold',
          category: 'core',
          description: 'Forearms on mat, body in straight line. Squeeze glutes and abs. Do not let hips sag. Build to 60 seconds.',
          targetSets: 3,
          targetReps: '30–60s',
        },
        {
          id: 'jump-rope-a',
          name: 'Jump Rope Finisher',
          category: 'cardio',
          description: '10 minutes continuous. Alternate between steady pace and 30-second sprints. This is how Pitt trained for Fight Club. Keeps body fat low while preserving muscle.',
          targetSets: 1,
          targetReps: '10 min',
        },
      ],
    },
    dayB: {
      name: 'Day B — Full Body',
      focus: 'Lunge · Push Variation · KB Hinge · Row · Arms',
      exercises: [
        {
          id: 'reverse-lunge',
          name: 'Dumbbell Reverse Lunge',
          category: 'quads',
          description: 'Step back into a lunge, keep front knee over ankle. Alternate legs. More knee-friendly than forward lunge, great for quad and glute balance.',
          targetSets: 3,
          targetReps: '10 each',
        },
        {
          id: 'incline-db-press',
          name: 'Incline Dumbbell Press',
          category: 'chest',
          description: 'Set bench to 30-45 degrees. Targets upper chest — critical for the Fight Club chest look. Control descent, full range of motion.',
          targetSets: 4,
          targetReps: '8–10',
        },
        {
          id: 'kb-swing',
          name: 'Kettlebell Swing',
          category: 'glutes',
          description: 'Explosive hip hinge. Drive hips forward to swing KB to shoulder height — not a squat, not a pull. Posterior chain power and conditioning in one movement.',
          targetSets: 4,
          targetReps: '15–20',
        },
        {
          id: 'db-overhead-press',
          name: 'Dumbbell Overhead Press',
          category: 'shoulders',
          description: 'Seated or standing. Press dumbbells from shoulder height overhead. Brace core throughout. Builds boulder shoulders.',
          targetSets: 3,
          targetReps: '10–12',
        },
        {
          id: 'band-face-pulls',
          name: 'Band Face Pulls',
          category: 'shoulders',
          description: 'Anchor band at head height. Pull toward face with hands wide apart. Rear delt and rotator cuff health — prevents shoulder injuries and improves posture.',
          targetSets: 3,
          targetReps: '15–20',
        },
        {
          id: 'db-curl',
          name: 'Dumbbell Bicep Curl',
          category: 'biceps',
          description: 'Alternate arms, keep elbows pinned at sides. Full range of motion. Control the negative. No swinging.',
          targetSets: 3,
          targetReps: '10–12',
        },
        {
          id: 'db-tricep-ext',
          name: 'Overhead Tricep Extension',
          category: 'triceps',
          description: 'Hold one dumbbell overhead with both hands. Lower behind head, press back up. Stretches the long head of tricep for maximum growth.',
          targetSets: 3,
          targetReps: '10–12',
        },
        {
          id: 'jump-rope-b',
          name: 'Jump Rope Finisher',
          category: 'cardio',
          description: '10 minutes continuous. Alternate steady pace and 30-second sprints. Non-negotiable — this is what keeps the physique lean while building.',
          targetSets: 1,
          targetReps: '10 min',
        },
      ],
    },
  },
}
