import type { HitGrade } from './rules';

export const LUCKY_POUCH_START_STAGE = 5;
export const LUCKY_POUCH_MIN_SPAWN_SECONDS = 6;
export const LUCKY_POUCH_MAX_SPAWN_SECONDS = 10;
export const LUCKY_POUCH_FALL_SPEED = 150;
export const PERFECT_BOOST_SECONDS = 5;

export function getLuckyPouchSpawnDelay(randomValue: number): number {
  const normalized = Math.min(1, Math.max(0, randomValue));
  return LUCKY_POUCH_MIN_SPAWN_SECONDS
    + (LUCKY_POUCH_MAX_SPAWN_SECONDS - LUCKY_POUCH_MIN_SPAWN_SECONDS) * normalized;
}

export function getLuckyPouchSpawnBounds(
  playerX: number,
  arenaMinX: number,
  arenaMaxX: number,
  maxDistance = 360,
): { min: number; max: number } {
  return {
    min: Math.max(arenaMinX, playerX - maxDistance),
    max: Math.min(arenaMaxX, playerX + maxDistance),
  };
}

export function isLuckyPouchCollected(
  pouchX: number,
  pouchY: number,
  playerX: number,
  playerY: number,
): boolean {
  const halfPlayerWidth = 68;
  const playerTop = playerY - 285;
  const playerBottom = playerY + 18;
  return Math.abs(pouchX - playerX) <= halfPlayerWidth
    && pouchY >= playerTop
    && pouchY <= playerBottom;
}

export function applyPerfectBoost(grade: HitGrade, remainingSeconds: number): HitGrade {
  return remainingSeconds > 0 ? 'perfect' : grade;
}
