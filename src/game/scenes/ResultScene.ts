import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../dimensions';
import { drawNaturalBackdrop } from '../naturalBackdrop';
import { configureResponsiveCamera } from '../responsiveCamera';

const FONT = 'Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif';

export interface AllClearResult {
  score: number;
  bestScore: number;
  totalSuccesses: number;
  goodCount: number;
  perfectCount: number;
  maxCombo: number;
}

export class ResultScene extends Phaser.Scene {
  private result: AllClearResult = {
    score: 0,
    bestScore: 0,
    totalSuccesses: 0,
    goodCount: 0,
    perfectCount: 0,
    maxCombo: 0,
  };

  constructor() {
    super('ResultScene');
  }

  init(data: AllClearResult): void {
    this.result = data;
  }

  preload(): void {
    if (!this.textures.exists('jegi-real')) {
      this.load.image('jegi-real', '/assets/items/jegi-real.png');
    }
  }

  create(): void {
    configureResponsiveCamera(this);
    this.cameras.main.setBackgroundColor(0xaedbe8);
    drawNaturalBackdrop(this, GAME_HEIGHT - 62);
    this.drawCelebration();
    this.input.keyboard?.on('keydown-ESC', this.returnToTitle, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC', this.returnToTitle, this);
    });
  }

  private drawCelebration(): void {
    const panel = this.add.graphics();
    panel.fillStyle(0xfff4d6, 0.96).fillRoundedRect(280, 82, 880, 722, 32);
    panel.lineStyle(6, 0xf1bd4a, 0.95).strokeRoundedRect(280, 82, 880, 722, 32);

    const colors = [0xef5b4c, 0x5bbbc8, 0xf1bd4a, 0x416f5b];
    for (let index = 0; index < 54; index += 1) {
      const x = 65 + ((index * 137) % (GAME_WIDTH - 130));
      const y = 36 + ((index * 83) % 760);
      panel.fillStyle(colors[index % colors.length], 0.82)
        .fillRect(x, y, index % 2 === 0 ? 8 : 13, index % 3 === 0 ? 20 : 12);
    }

    this.add.text(GAME_WIDTH / 2, 150, '10 STAGE ALL CLEAR!', {
      fontFamily: FONT,
      fontSize: '60px',
      fontStyle: 'bold',
      color: '#244f46',
      stroke: '#f1bd4a',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 222, '축하합니다! 모든 스테이지를 완주했습니다', {
      fontFamily: FONT,
      fontSize: '25px',
      fontStyle: 'bold',
      color: '#397064',
    }).setOrigin(0.5);

    const jegi = this.add.image(GAME_WIDTH / 2, 402, 'jegi-real')
      .setOrigin(0.5, 0.86)
      .setDisplaySize(90, 135);
    this.tweens.add({
      targets: jegi,
      y: 382,
      angle: 8,
      duration: 820,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    const stats = [
      { label: '최종 점수', value: this.result.score.toString(), color: '#d99a20' },
      { label: '총 성공', value: `${this.result.totalSuccesses}회`, color: '#397064' },
      { label: 'PERFECT', value: `${this.result.perfectCount}회`, color: '#168692' },
      { label: 'GOOD', value: `${this.result.goodCount}회`, color: '#a76d00' },
      { label: '최대 콤보', value: `${this.result.maxCombo}`, color: '#c94a40' },
      { label: '최고 점수', value: this.result.bestScore.toString(), color: '#6a63a8' },
    ];

    stats.forEach((stat, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = 410 + column * 310;
      const y = 478 + row * 116;
      panel.fillStyle(0xe9e2c7, 0.72).fillRoundedRect(x - 125, y - 40, 250, 92, 16);
      this.add.text(x, y - 24, stat.label, {
        fontFamily: FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#6a766b',
      }).setOrigin(0.5);
      this.add.text(x, y + 17, stat.value, {
        fontFamily: FONT,
        fontSize: '30px',
        fontStyle: 'bold',
        color: stat.color,
      }).setOrigin(0.5);
    });

    const prompt = this.add.text(GAME_WIDTH / 2, 755, 'ESC  첫 페이지로', {
      fontFamily: FONT,
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#fff3d1',
      backgroundColor: '#315d43',
      padding: { x: 28, y: 13 },
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.52, duration: 760, yoyo: true, repeat: -1 });
  }

  private returnToTitle(): void {
    this.scene.start('TitleScene');
  }
}
