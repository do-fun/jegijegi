import { describe, expect, it } from 'vitest';
import {
  applyPerfectBoost,
  getLuckyPouchSpawnDelay,
  getLuckyPouchSpawnBounds,
  isLuckyPouchCollected,
} from './powerup';

describe('lucky pouch power-up', () => {
  it('keeps the randomized spawn delay within six to ten seconds', () => {
    expect(getLuckyPouchSpawnDelay(-1)).toBe(6);
    expect(getLuckyPouchSpawnDelay(0.5)).toBe(8);
    expect(getLuckyPouchSpawnDelay(2)).toBe(10);
  });

  it('spawns within reach of the player without crossing arena bounds', () => {
    expect(getLuckyPouchSpawnBounds(720, 70, 1370)).toEqual({ min: 360, max: 1080 });
    expect(getLuckyPouchSpawnBounds(100, 70, 1370)).toEqual({ min: 70, max: 460 });
    expect(getLuckyPouchSpawnBounds(1320, 70, 1370)).toEqual({ min: 960, max: 1370 });
  });

  it('is collected only when it overlaps the player body', () => {
    expect(isLuckyPouchCollected(500, 600, 500, 770)).toBe(true);
    expect(isLuckyPouchCollected(600, 600, 500, 770)).toBe(false);
    expect(isLuckyPouchCollected(500, 400, 500, 770)).toBe(false);
  });

  it('forces a successful Good hit to Perfect while active', () => {
    expect(applyPerfectBoost('good', 0.1)).toBe('perfect');
    expect(applyPerfectBoost('good', 0)).toBe('good');
    expect(applyPerfectBoost('perfect', 3)).toBe('perfect');
  });
});
