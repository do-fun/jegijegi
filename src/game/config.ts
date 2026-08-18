import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './dimensions';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import { TitleScene } from './scenes/TitleScene';
import { TutorialScene } from './scenes/TutorialScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#071b2f',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
  input: {
    activePointers: 3,
  },
  scene: [TitleScene, TutorialScene, GameScene, ResultScene],
};
