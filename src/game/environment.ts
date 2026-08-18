import { clampStage } from './rules';

export type Weather = 'none' | 'rain' | 'wind' | 'rain-wind';

export interface StageEnvironment {
  flyCount: number;
  weather: Weather;
  windDirection: -1 | 0 | 1;
}

export function getFlyCount(stage: number): number {
  const safeStage = clampStage(stage);
  if (safeStage <= 2) return 0;
  if (safeStage <= 5) return 3;
  if (safeStage <= 8) return 5;
  return 7;
}

export function createStageEnvironment(stage: number, random = Math.random): StageEnvironment {
  const safeStage = clampStage(stage);
  let options: readonly Weather[];

  if (safeStage <= 2) options = ['none'];
  else if (safeStage <= 5) options = ['none', 'rain', 'wind'];
  else if (safeStage === 6) options = ['rain', 'wind'];
  else if (safeStage <= 8) options = ['rain', 'wind', 'rain-wind'];
  else options = ['rain', 'wind', 'rain-wind'];

  const index = Math.min(Math.floor(random() * options.length), options.length - 1);
  const weather = options[Math.max(0, index)];
  const windDirection = weather.includes('wind') ? (random() < 0.5 ? -1 : 1) : 0;

  return { flyCount: getFlyCount(safeStage), weather, windDirection };
}

export function hasRain(weather: Weather): boolean {
  return weather.includes('rain');
}

export function hasWind(weather: Weather): boolean {
  return weather.includes('wind');
}
