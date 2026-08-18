import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './dimensions';

export function drawNaturalBackdrop(scene: Phaser.Scene, groundY = 760): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();
  const left = -1200;
  const backdropWidth = GAME_WIDTH + 2400;

  // 맑은 낮 하늘을 여러 색 띠로 쌓아 부드러운 깊이를 만든다.
  graphics.fillStyle(0xaedbe8, 1).fillRect(left, -600, backdropWidth, GAME_HEIGHT + 1200);
  graphics.fillStyle(0xc8e8ec, 1).fillRect(left, 185, backdropWidth, 220);
  graphics.fillStyle(0xe7efd8, 1).fillRect(left, 405, backdropWidth, 175);

  graphics.fillStyle(0xffdf87, 0.88).fillCircle(1180, 150, 58);
  graphics.fillStyle(0xffedb4, 0.3).fillCircle(1180, 150, 85);

  const cloud = (x: number, y: number, scale: number): void => {
    graphics.fillStyle(0xffffff, 0.62);
    graphics.fillEllipse(x, y, 154 * scale, 42 * scale);
    graphics.fillCircle(x - 38 * scale, y - 10 * scale, 28 * scale);
    graphics.fillCircle(x + 18 * scale, y - 18 * scale, 36 * scale);
    graphics.fillCircle(x + 52 * scale, y - 7 * scale, 24 * scale);
  };
  cloud(260, 155, 0.9);
  cloud(780, 235, 0.65);

  graphics.fillStyle(0x779b83, 1).fillPoints([
    new Phaser.Math.Vector2(left, 515),
    new Phaser.Math.Vector2(-450, 350),
    new Phaser.Math.Vector2(0, 515),
    new Phaser.Math.Vector2(190, 330),
    new Phaser.Math.Vector2(350, 490),
    new Phaser.Math.Vector2(555, 300),
    new Phaser.Math.Vector2(760, 492),
    new Phaser.Math.Vector2(995, 325),
    new Phaser.Math.Vector2(1210, 500),
    new Phaser.Math.Vector2(GAME_WIDTH, 360),
    new Phaser.Math.Vector2(GAME_WIDTH + 520, 500),
    new Phaser.Math.Vector2(GAME_WIDTH - left, 340),
    new Phaser.Math.Vector2(GAME_WIDTH - left, 610),
    new Phaser.Math.Vector2(left, 610),
  ], true);
  graphics.fillStyle(0x4f7661, 1).fillPoints([
    new Phaser.Math.Vector2(left, 555),
    new Phaser.Math.Vector2(-380, 420),
    new Phaser.Math.Vector2(0, 555),
    new Phaser.Math.Vector2(255, 420),
    new Phaser.Math.Vector2(455, 550),
    new Phaser.Math.Vector2(700, 400),
    new Phaser.Math.Vector2(930, 550),
    new Phaser.Math.Vector2(1190, 425),
    new Phaser.Math.Vector2(GAME_WIDTH, 535),
    new Phaser.Math.Vector2(GAME_WIDTH + 430, 410),
    new Phaser.Math.Vector2(GAME_WIDTH - left, 550),
    new Phaser.Math.Vector2(GAME_WIDTH - left, 650),
    new Phaser.Math.Vector2(left, 650),
  ], true);

  graphics.fillStyle(0x6f9a64, 1).fillRect(left, 560, backdropWidth, Math.max(0, groundY - 560));
  graphics.fillStyle(0xd8bd87, 1).fillRect(left, 625, backdropWidth, Math.max(0, groundY - 625));
  graphics.fillStyle(0xe6cda0, 0.72).fillEllipse(GAME_WIDTH / 2, 675, 970, 150);

  const tree = (x: number, y: number, scale: number): void => {
    graphics.fillStyle(0x765234, 1).fillRoundedRect(x - 10 * scale, y, 20 * scale, 92 * scale, 7);
    graphics.fillStyle(0x315d43, 1).fillCircle(x, y - 14 * scale, 52 * scale);
    graphics.fillStyle(0x477a50, 1).fillCircle(x - 34 * scale, y + 4 * scale, 38 * scale);
    graphics.fillStyle(0x5c8b59, 1).fillCircle(x + 35 * scale, y + 3 * scale, 40 * scale);
  };
  tree(-180, 565, 1.18);
  tree(GAME_WIDTH + 180, 575, 1.08);

  graphics.fillStyle(0xb58b55, 1).fillRect(left, groundY, backdropWidth, GAME_HEIGHT + 600 - groundY);
  graphics.lineStyle(4, 0x6e5134, 0.7).lineBetween(left, groundY, GAME_WIDTH - left, groundY);

  return graphics;
}
