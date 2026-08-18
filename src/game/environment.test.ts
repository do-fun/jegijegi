import { describe, expect, it } from 'vitest';
import { createStageEnvironment, getFlyCount, hasRain, hasWind } from './environment';

describe('stage environment', () => {
  it('uses the designed fly-count ranges', () => {
    expect([1, 2, 3, 5, 6, 8, 9, 10].map(getFlyCount)).toEqual([0, 0, 3, 3, 5, 5, 7, 7]);
  });

  it('keeps the first two stages weather-free', () => {
    expect(createStageEnvironment(1, () => 0.9)).toEqual({ flyCount: 0, weather: 'none', windDirection: 0 });
  });

  it('allows combined weather from stage seven', () => {
    const environment = createStageEnvironment(7, () => 0.99);
    expect(environment.weather).toBe('rain-wind');
    expect(hasRain(environment.weather)).toBe(true);
    expect(hasWind(environment.weather)).toBe(true);
  });

  it('uses only normal rain and wind in the final stages', () => {
    expect(createStageEnvironment(9, () => 0).weather).toBe('rain');
    expect(createStageEnvironment(9, () => 0.4).weather).toBe('wind');
    expect(createStageEnvironment(10, () => 0.99).weather).toBe('rain-wind');
  });
});
