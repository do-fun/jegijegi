import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../dimensions';
import { drawNaturalBackdrop } from '../naturalBackdrop';
import { configureResponsiveCamera } from '../responsiveCamera';
import { AUDIO, initializeAudio, playAudio, preloadAudio, setMusicVolume, startMusic } from '../audio';
import {
  createStagePerformances,
  summarizePerformances,
  type StagePerformance,
} from '../resultStats';

const FONT = 'Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif';

export interface AllClearResult {
  score: number;
  bestScore: number;
  maxCombo: number;
  stagePerformances: StagePerformance[];
}

export class ResultScene extends Phaser.Scene {
  private result: AllClearResult = {
    score: 0,
    bestScore: 0,
    maxCombo: 0,
    stagePerformances: createStagePerformances(10),
  };

  constructor() {
    super('ResultScene');
  }

  init(data: AllClearResult): void {
    this.result = data;
  }

  preload(): void {
    preloadAudio(this);
    if (!this.textures.exists('jegi-real')) {
      this.load.image('jegi-real', '/assets/items/jegi-real.png');
    }
  }

  create(): void {
    initializeAudio(this);
    startMusic(this, 0.1);
    setMusicVolume(this, 0.1);
    playAudio(this, AUDIO.allClear, { volume: 0.72 });
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

    this.add.text(GAME_WIDTH / 2, 150, '10 STAGE ALL CLEAR!', {
      fontFamily: FONT,
      fontSize: '60px',
      fontStyle: 'bold',
      color: '#244f46',
      stroke: '#f1bd4a',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 210, '축하합니다! 모든 스테이지를 완주했습니다', {
      fontFamily: FONT,
      fontSize: '25px',
      fontStyle: 'bold',
      color: '#397064',
    }).setOrigin(0.5);

    const jegi = this.add.image(1088, 194, 'jegi-real')
      .setOrigin(0.5, 0.86)
      .setDisplaySize(46, 69);
    this.tweens.add({
      targets: jegi,
      y: 184,
      angle: 8,
      duration: 820,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    const totals = summarizePerformances(this.result.stagePerformances);
    const stats = [
      { label: '최종 점수', value: this.result.score.toString(), color: '#d99a20' },
      { label: '총 성공', value: `${totals.totalSuccesses}회`, color: '#397064' },
      { label: 'GOOD / PERFECT', value: `${totals.goodCount} / ${totals.perfectCount}`, color: '#168692' },
      { label: '최대 콤보', value: `${this.result.maxCombo}`, color: '#c94a40' },
      { label: '최고 점수', value: this.result.bestScore.toString(), color: '#6a63a8' },
    ];

    stats.forEach((stat, index) => {
      const x = 360 + index * 180;
      const y = 284;
      panel.fillStyle(0xe9e2c7, 0.72).fillRoundedRect(x - 80, y - 38, 160, 78, 12);
      this.add.text(x, y - 20, stat.label, {
        fontFamily: FONT,
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#6a766b',
      }).setOrigin(0.5);
      this.add.text(x, y + 13, stat.value, {
        fontFamily: FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        color: stat.color,
      }).setOrigin(0.5);
    });

    panel.fillStyle(0x315d43, 0.96).fillRoundedRect(330, 342, 780, 38, 8);
    const columns = [
      { x: 380, label: 'STAGE' },
      { x: 565, label: 'GOOD' },
      { x: 755, label: 'PERFECT' },
      { x: 990, label: '최대 연속 PERFECT' },
    ];
    columns.forEach((column) => {
      this.add.text(column.x, 361, column.label, {
        fontFamily: FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#fff3d1',
      }).setOrigin(0.5);
    });

    this.result.stagePerformances.forEach((performance, index) => {
      const y = 399 + index * 30;
      panel.fillStyle(index % 2 === 0 ? 0xe9e2c7 : 0xf6edcf, 0.78)
        .fillRoundedRect(330, y - 14, 780, 28, 5);
      const values = [
        `${index + 1}`,
        `${performance.goodCount}`,
        `${performance.perfectCount}`,
        `× ${performance.maxConsecutivePerfects}`,
      ];
      values.forEach((value, columnIndex) => {
        this.add.text(columns[columnIndex].x, y, value, {
          fontFamily: FONT,
          fontSize: '16px',
          fontStyle: columnIndex === 0 ? 'bold' : 'normal',
          color: columnIndex === 2 ? '#168692' : columnIndex === 3 ? '#c94a40' : '#315d43',
        }).setOrigin(0.5);
      });
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
