const CLUB_COLOURS = [
  '#1D9E75', '#3B82F6', '#F59E0B', '#EC4899',
  '#8B5CF6', '#EF4444', '#10B981', '#6366F1',
] as const;

/** Deterministic avatar colour for a club, stable across renders and screens. */
export function clubColour(clubId: string): string {
  let hash = 0;
  for (let i = 0; i < clubId.length; i++) {
    hash = (hash * 31 + clubId.charCodeAt(i)) >>> 0;
  }
  return CLUB_COLOURS[hash % CLUB_COLOURS.length];
}
