import { describe, expect, it } from 'vitest';
import { shouldShowTutorial } from './progress';

describe('tutorial progress', () => {
  it('shows the tutorial only before it has been seen', () => {
    expect(shouldShowTutorial(null)).toBe(true);
    expect(shouldShowTutorial('false')).toBe(true);
    expect(shouldShowTutorial('true')).toBe(false);
  });
});
