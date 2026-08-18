export const TUTORIAL_SEEN_KEY = 'jegijegi.tutorialSeen';

export function shouldShowTutorial(storedValue: string | null): boolean {
  return storedValue !== 'true';
}
