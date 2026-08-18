import { describe, expect, it } from 'vitest';
import { applySuccessfulKick, clampStage, resolveStageTimeout } from './rules';

describe('applySuccessfulKick', () => {
  const initial = { score: 0, combo: 0, consecutivePerfects: 0, maxCombo: 0 };

  it('awards Good and resets only the perfect streak', () => {
    const result = applySuccessfulKick({ ...initial, consecutivePerfects: 3 }, 'good');

    expect(result).toEqual({
      score: 50,
      combo: 1,
      consecutivePerfects: 0,
      maxCombo: 1,
      gained: 50,
    });
  });

  it('awards a fixed bonus from the second consecutive Perfect', () => {
    const first = applySuccessfulKick(initial, 'perfect');
    const second = applySuccessfulKick(first, 'perfect');

    expect(first.gained).toBe(100);
    expect(second.gained).toBe(200);
    expect(second.score).toBe(300);
  });

  it('caps an insect bonus at 150', () => {
    expect(applySuccessfulKick(initial, 'good', 500).gained).toBe(200);
  });
});

describe('resolveStageTimeout', () => {
  it('clears only when the target and remaining-life conditions are met', () => {
    expect(resolveStageTimeout(5, 5, 1)).toBe('clear');
    expect(resolveStageTimeout(4, 5, 2)).toBe('retry');
    expect(resolveStageTimeout(4, 5, 1)).toBe('game-over');
  });
});

describe('clampStage', () => {
  it('keeps a stage within the ten-stage range', () => {
    expect(clampStage(-2)).toBe(1);
    expect(clampStage(12)).toBe(10);
  });
});

