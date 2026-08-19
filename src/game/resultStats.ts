import type { HitGrade } from './rules';

export interface StagePerformance {
  goodCount: number;
  perfectCount: number;
  maxConsecutivePerfects: number;
}

export interface PerformanceTotals {
  goodCount: number;
  perfectCount: number;
  totalSuccesses: number;
}

export function createStagePerformances(stageCount: number): StagePerformance[] {
  return Array.from({ length: stageCount }, () => ({
    goodCount: 0,
    perfectCount: 0,
    maxConsecutivePerfects: 0,
  }));
}

export function recordStageHit(
  current: StagePerformance,
  grade: HitGrade,
  consecutivePerfects: number,
): StagePerformance {
  return {
    goodCount: current.goodCount + (grade === 'good' ? 1 : 0),
    perfectCount: current.perfectCount + (grade === 'perfect' ? 1 : 0),
    maxConsecutivePerfects: Math.max(current.maxConsecutivePerfects, consecutivePerfects),
  };
}

export function summarizePerformances(performances: readonly StagePerformance[]): PerformanceTotals {
  return performances.reduce<PerformanceTotals>((total, stage) => ({
    goodCount: total.goodCount + stage.goodCount,
    perfectCount: total.perfectCount + stage.perfectCount,
    totalSuccesses: total.totalSuccesses + stage.goodCount + stage.perfectCount,
  }), { goodCount: 0, perfectCount: 0, totalSuccesses: 0 });
}
