import Phaser from 'phaser';

const AUDIO_PATH = '/assets/audio';
const MUSIC_KEY = 'audio-bgm';
const EFFECT_MASTER_VOLUME = 0.64;
const AMBIENT_KEYS = ['audio-ambient-fly', 'audio-ambient-rain', 'audio-ambient-wind'] as const;
const MUTE_STORAGE_KEY = 'jegijegi.muted';

export const AUDIO = {
  start: 'audio-start',
  kick: 'audio-kick',
  good: 'audio-good',
  perfect: 'audio-perfect',
  bounce: 'audio-bounce',
  flyHit: 'audio-fly-hit',
  miss: 'audio-miss',
  warning: 'audio-warning',
  clear: 'audio-clear',
  reward: 'audio-reward',
  obstacle: 'audio-obstacle',
  pouch: 'audio-pouch',
  gameOver: 'audio-game-over',
  allClear: 'audio-all-clear',
} as const;

const AUDIO_FILES: ReadonlyArray<readonly [string, string]> = [
  [MUSIC_KEY, 'bgm-jegijegi.wav'],
  [AUDIO.start, 'start.wav'],
  [AUDIO.kick, 'kick.wav'],
  [AUDIO.good, 'good.wav'],
  [AUDIO.perfect, 'perfect.wav'],
  [AUDIO.bounce, 'bounce.wav'],
  [AUDIO.flyHit, 'fly-hit.wav'],
  [AUDIO.miss, 'miss.wav'],
  [AUDIO.warning, 'warning.wav'],
  [AUDIO.clear, 'clear.wav'],
  [AUDIO.reward, 'reward.wav'],
  [AUDIO.obstacle, 'obstacle.wav'],
  [AUDIO.pouch, 'pouch.wav'],
  [AUDIO.gameOver, 'game-over.wav'],
  [AUDIO.allClear, 'all-clear.wav'],
  [AMBIENT_KEYS[0], 'ambient-fly.wav'],
  [AMBIENT_KEYS[1], 'ambient-rain.wav'],
  [AMBIENT_KEYS[2], 'ambient-wind.wav'],
];

export interface AmbienceState {
  flies: boolean;
  rain: boolean;
  wind: boolean;
  flyVolume?: number;
}

function setSoundVolume(sound: Phaser.Sound.BaseSound, volume: number): void {
  const adjustable = sound as Phaser.Sound.BaseSound & { setVolume(value: number): Phaser.Sound.BaseSound };
  adjustable.setVolume(volume);
}

export function preloadAudio(scene: Phaser.Scene): void {
  for (const [key, file] of AUDIO_FILES) {
    if (!scene.cache.audio.exists(key)) scene.load.audio(key, `${AUDIO_PATH}/${file}`);
  }
}

export function initializeAudio(scene: Phaser.Scene): boolean {
  const muted = localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
  scene.sound.setMute(muted);
  scene.sound.pauseOnBlur = true;
  for (const key of Object.values(AUDIO)) {
    if (scene.sound.getAll(key).length === 0) scene.sound.add(key);
  }
  return muted;
}

export function startMusic(scene: Phaser.Scene, volume = 0.25): void {
  const existing = scene.sound.getAll(MUSIC_KEY)[0];
  if (existing) {
    setSoundVolume(existing, volume);
    if (existing.isPaused) existing.resume();
    else if (!existing.isPlaying) existing.play();
    return;
  }
  scene.sound.add(MUSIC_KEY, { loop: true, volume }).play();
}

export function setMusicVolume(scene: Phaser.Scene, volume: number): void {
  scene.sound.getAll(MUSIC_KEY).forEach((sound) => setSoundVolume(sound, volume));
}

export function playAudio(
  scene: Phaser.Scene,
  key: (typeof AUDIO)[keyof typeof AUDIO],
  config?: Phaser.Types.Sound.SoundConfig,
): void {
  const volume = Math.min(1, (config?.volume ?? 1) * EFFECT_MASTER_VOLUME);
  const sound = scene.sound.getAll(key)[0] ?? scene.sound.add(key);
  sound.play({ ...config, volume });
}

export function setMuted(scene: Phaser.Scene, muted: boolean): void {
  localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
  scene.sound.setMute(muted);
}

export function toggleMuted(scene: Phaser.Scene): boolean {
  const muted = !scene.sound.mute;
  setMuted(scene, muted);
  return muted;
}

function syncLoop(scene: Phaser.Scene, key: string, active: boolean, volume: number): void {
  const sound = scene.sound.getAll(key)[0];
  if (!active) {
    sound?.stop();
    return;
  }
  if (sound) {
    setSoundVolume(sound, volume);
    if (sound.isPaused) sound.resume();
    else if (!sound.isPlaying) sound.play();
    return;
  }
  scene.sound.add(key, { loop: true, volume }).play();
}

export function syncAmbience(scene: Phaser.Scene, state: AmbienceState): void {
  const weatherMix = state.rain && state.wind ? 0.62 : 1;
  syncLoop(scene, AMBIENT_KEYS[0], state.flies, state.flyVolume ?? 0.055);
  syncLoop(scene, AMBIENT_KEYS[1], state.rain, 0.075 * weatherMix);
  syncLoop(scene, AMBIENT_KEYS[2], state.wind, 0.07 * weatherMix);
}

export function stopAmbience(scene: Phaser.Scene): void {
  AMBIENT_KEYS.forEach((key) => scene.sound.stopByKey(key));
}
