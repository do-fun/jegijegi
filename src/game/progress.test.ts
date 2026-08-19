import { describe, expect, it } from 'vitest';
import { clearStoredRecords, RECORD_STORAGE_KEYS, shouldShowTutorial } from './progress';

describe('tutorial progress', () => {
  it('shows the tutorial only before it has been seen', () => {
    expect(shouldShowTutorial(null)).toBe(true);
    expect(shouldShowTutorial('false')).toBe(true);
    expect(shouldShowTutorial('true')).toBe(false);
  });
});

describe('clearStoredRecords', () => {
  it('removes score, combo and every stage record', () => {
    const removed: string[] = [];

    clearStoredRecords({ removeItem: (key) => removed.push(key) });

    expect(removed).toEqual(RECORD_STORAGE_KEYS);
  });
});
