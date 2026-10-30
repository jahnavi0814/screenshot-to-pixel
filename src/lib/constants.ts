export const CATEGORIES = [
  "personal_growth",
  "career_education",
  "relationships",
  "experiences",
  "creative_ideas",
  "health_wellbeing",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  personal_growth: "Personal growth",
  career_education: "Career and education",
  relationships: "Relationships",
  experiences: "Experiences",
  creative_ideas: "Creative ideas",
  health_wellbeing: "Health and wellbeing",
  other: "Other",
};

export const STATUSES = [
  "still_thinking",
  "ready_to_explore",
  "taking_small_step",
  "completed",
  "no_longer_relevant",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  still_thinking: "Still thinking",
  ready_to_explore: "Ready to explore",
  taking_small_step: "Taking a small step",
  completed: "Completed",
  no_longer_relevant: "No longer relevant",
};

export const REFLECTION_PROMPTS = [
  "What have you been thinking about lately?",
  "Is there something you've postponed repeatedly?",
  "Has your perspective on an intention changed?",
  "What would make starting feel easier?",
  "Is this something you genuinely want, or something you feel expected to do?",
  "What have you realised about yourself recently?",
];

export function timeGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
