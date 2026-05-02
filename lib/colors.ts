export const USER_COLORS = [
  '#EF4444', // אדום
  '#F97316', // כתום
  '#EAB308', // צהוב
  '#22C55E', // ירוק
  '#06B6D4', // תכלת
  '#3B82F6', // כחול
  '#8B5CF6', // סגול
  '#EC4899', // ורוד
  '#14B8A6', // טורקיז
];

export const COLOR_NAMES: Record<string, string> = {
  '#EF4444': 'אדום',
  '#F97316': 'כתום',
  '#EAB308': 'צהוב',
  '#22C55E': 'ירוק',
  '#06B6D4': 'תכלת',
  '#3B82F6': 'כחול',
  '#8B5CF6': 'סגול',
  '#EC4899': 'ורוד',
  '#14B8A6': 'טורקיז',
};

export const PROFILE_EMOJIS = [
  '😀', '😎', '🤩', '🥳', '😊', '🤗',
  '👦', '👧', '👨', '👩', '🧑', '👶',
  '🦊', '🐼', '🐨', '🦁', '🐯', '🦋',
  '🚗', '🏎️', '🚙', '⭐', '🌟', '💫',
];

export function lightenColor(hex: string, amount = 0.85): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `rgb(${lr}, ${lg}, ${lb})`;
}
