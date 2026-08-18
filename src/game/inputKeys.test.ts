import { describe, expect, it } from 'vitest';
import { isConfirmKey } from './inputKeys';

function keyEvent(key: string, overrides: Partial<Parameters<typeof isConfirmKey>[0]> = {}) {
  return {
    key,
    repeat: false,
    isComposing: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ...overrides,
  };
}

describe('isConfirmKey', () => {
  it('accepts ordinary play keys', () => {
    expect(isConfirmKey(keyEvent('a'))).toBe(true);
    expect(isConfirmKey(keyEvent(' '))).toBe(true);
    expect(isConfirmKey(keyEvent('Enter'))).toBe(true);
    expect(isConfirmKey(keyEvent('ArrowLeft'))).toBe(true);
  });

  it('rejects function, modifier, system, repeated, and modified keys', () => {
    expect(isConfirmKey(keyEvent('F1'))).toBe(false);
    expect(isConfirmKey(keyEvent('Control', { ctrlKey: true }))).toBe(false);
    expect(isConfirmKey(keyEvent('Shift', { shiftKey: true }))).toBe(false);
    expect(isConfirmKey(keyEvent('Alt', { altKey: true }))).toBe(false);
    expect(isConfirmKey(keyEvent('Tab'))).toBe(false);
    expect(isConfirmKey(keyEvent('a', { ctrlKey: true }))).toBe(false);
    expect(isConfirmKey(keyEvent('a', { repeat: true }))).toBe(false);
  });
});
