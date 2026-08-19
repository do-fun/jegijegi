export const TUTORIAL_SEEN_KEY = 'jegijegi.tutorialSeen';
export const RECORD_STORAGE_KEYS = [
  'jegijegi.bestScore',
  'jegijegi.maxCombo',
  ...Array.from({ length: 10 }, (_, index) => `jegijegi.stage.${index + 1}.kicks`),
];

interface RecordStorage {
  removeItem(key: string): void;
}

export function shouldShowTutorial(storedValue: string | null): boolean {
  return storedValue !== 'true';
}

export function clearStoredRecords(storage: RecordStorage): void {
  RECORD_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
}
