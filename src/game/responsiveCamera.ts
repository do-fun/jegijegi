import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './dimensions';

export function configureResponsiveCamera(scene: Phaser.Scene): void {
  const resize = (gameSize: Phaser.Structs.Size): void => {
    const zoom = Math.min(gameSize.width / GAME_WIDTH, gameSize.height / GAME_HEIGHT);
    scene.cameras.main.setZoom(zoom).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  };

  resize(scene.scale.gameSize);
  scene.scale.on(Phaser.Scale.Events.RESIZE, resize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, resize);
  });
}
