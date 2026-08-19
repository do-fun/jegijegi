import { describe, expect, it } from 'vitest';
import { createStagePerformances, recordStageHit, summarizePerformances } from './resultStats';

describe('stage performance results', () => {
  it('records Good, Perfect and the highest Perfect streak independently', () => {
    const empty = createStagePerformances(1)[0];
    const first = recordStageHit(empty, 'perfect', 1);
    const second = recordStageHit(first, 'perfect', 2);
    const good = recordStageHit(second, 'good', 0);

    expect(good).toEqual({ goodCount: 1, perfectCount: 2, maxConsecutivePerfects: 2 });
  });

  it('creates separate records for every stage', () => {
    const stages = createStagePerformances(2);
    stages[0].goodCount = 3;

    expect(stages[1].goodCount).toBe(0);
  });

  it('makes totals equal the sum of every stage', () => {
    expect(summarizePerformances([
      { goodCount: 2, perfectCount: 3, maxConsecutivePerfects: 2 },
      { goodCount: 4, perfectCount: 1, maxConsecutivePerfects: 1 },
    ])).toEqual({ goodCount: 6, perfectCount: 4, totalSuccesses: 10 });
  });
});
