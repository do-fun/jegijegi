interface KeyboardConfirmEvent {
  key: string;
  repeat: boolean;
  isComposing: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

const NAMED_CONFIRM_KEYS = new Set(['Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

export function isConfirmKey(event: KeyboardConfirmEvent): boolean {
  if (
    event.repeat
    || event.isComposing
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
    || event.metaKey
  ) return false;

  // 문자, 숫자, 문장 부호와 Space는 key 값이 한 글자다.
  return event.key.length === 1 || NAMED_CONFIRM_KEYS.has(event.key);
}
