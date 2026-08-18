export const STAGE_TARGETS = [5, 5, 6, 6, 7, 7, 8, 8, 9, 10] as const;

export type HitGrade = 'good' | 'perfect';

export interface ScoreState {
  score: number;
  combo: number;
  consecutivePerfects: number;
  maxCombo: number;
}

export interface ScoreResult extends ScoreState {
  gained: number;
}

export function applySuccessfulKick(
  state: ScoreState,
  grade: HitGrade,
  insectBonus = 0,
): ScoreResult {
  const nextPerfects = grade === 'perfect' ? state.consecutivePerfects + 1 : 0;
  const base = grade === 'perfect' ? 100 : 50;
  const perfectBonus = grade === 'perfect' && nextPerfects >= 2 ? 100 : 0;
  const gained = base + perfectBonus + Math.min(Math.max(insectBonus, 0), 150);
  const combo = state.combo + 1;

  return {
    score: state.score + gained,
    combo,
    consecutivePerfects: nextPerfects,
    maxCombo: Math.max(state.maxCombo, combo),
    gained,
  };
}

export type StageTimeoutResult = 'clear' | 'retry' | 'game-over';

export function resolveStageTimeout(
  successes: number,
  target: number,
  lives: number,
): StageTimeoutResult {
  if (successes >= target && lives > 0) {
    return 'clear';
  }

  return lives - 1 > 0 ? 'retry' : 'game-over';
}

export function clampStage(stage: number): number {
  return Math.min(Math.max(Math.trunc(stage), 1), STAGE_TARGETS.length);
}

