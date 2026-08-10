import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

const COLORS = {
  navy: 0x071b2f,
  blue: 0x123c58,
  sky: 0x5bbbc8,
  cream: '#f7e9c8',
  mutedCream: '#c9bea4',
  red: 0xef5b4c,
  gold: 0xf1bd4a,
};

const FONT_FAMILY = 'Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif';

export class TitleScene extends Phaser.Scene {
  private isStarting = false;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    // Phaser는 Scene 인스턴스를 재사용하므로 재진입할 때 시작 잠금을 초기화한다.
    this.isStarting = false;
    this.cameras.main.setBackgroundColor(COLORS.navy);
    this.drawBackdrop();
    this.drawTopStats();
    this.drawLogo();
    this.drawStartPrompt();

    // Scene 전환에 사용한 입력이 타이틀의 시작 입력으로 이어지지 않게 한다.
    this.time.delayedCall(120, () => {
      this.input.keyboard?.once('keydown', this.startGame, this);
      this.input.once('pointerdown', this.startGame, this);
    });
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x0a2339, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    graphics.fillStyle(0x0d2d45, 0.72);
    graphics.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.54, 390);
    graphics.lineStyle(2, 0x285168, 0.48);
    graphics.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.54, 410);
    graphics.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT * 0.54, 465);

    graphics.lineStyle(2, 0xf1bd4a, 0.45);
    graphics.lineBetween(74, 62, GAME_WIDTH - 74, 62);
    graphics.lineBetween(74, GAME_HEIGHT - 62, GAME_WIDTH - 74, GAME_HEIGHT - 62);

    graphics.fillStyle(0xef5b4c, 0.85);
    graphics.fillRect(74, 58, 112, 8);
    graphics.fillRect(GAME_WIDTH - 186, GAME_HEIGHT - 66, 112, 8);
    graphics.fillStyle(0x5bbbc8, 0.85);
    graphics.fillRect(GAME_WIDTH - 186, 58, 112, 8);
    graphics.fillRect(74, GAME_HEIGHT - 66, 112, 8);

    for (let index = 0; index < 34; index += 1) {
      const x = 70 + ((index * 197) % (GAME_WIDTH - 140));
      const y = 90 + ((index * 113) % (GAME_HEIGHT - 180));
      const radius = index % 3 === 0 ? 2 : 1;
      graphics.fillStyle(0xf7e9c8, index % 2 === 0 ? 0.1 : 0.06);
      graphics.fillCircle(x, y, radius);
    }
  }

  private drawTopStats(): void {
    const bestScore = Number.parseInt(localStorage.getItem('jegijegi.bestScore') ?? '0', 10);
    const maxCombo = Number.parseInt(localStorage.getItem('jegijegi.maxCombo') ?? '0', 10);

    this.add
      .text(94, 100, '최고 점수', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        fontStyle: 'bold',
        color: COLORS.mutedCream,
      })
      .setLetterSpacing(2);

    this.add
      .text(94, 130, bestScore.toString().padStart(6, '0'), {
        fontFamily: FONT_FAMILY,
        fontSize: '38px',
        fontStyle: 'bold',
        color: COLORS.cream,
      })
      .setLetterSpacing(3);

    this.add
      .text(GAME_WIDTH - 94, 100, '최대 콤보', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        fontStyle: 'bold',
        color: COLORS.mutedCream,
      })
      .setOrigin(1, 0)
      .setLetterSpacing(2);

    this.add
      .text(GAME_WIDTH - 94, 130, `× ${maxCombo.toString().padStart(3, '0')}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '38px',
        fontStyle: 'bold',
        color: COLORS.cream,
      })
      .setOrigin(1, 0)
      .setLetterSpacing(3);
  }

  private drawLogo(): void {
    const centerX = GAME_WIDTH / 2;
    const logo = this.add.container(centerX, 418);

    const shadow = this.add
      .text(8, 12, 'JEGI\nJEGI!', {
        align: 'center',
        fontFamily: FONT_FAMILY,
        fontSize: '126px',
        fontStyle: '900',
        color: '#03101d',
        lineSpacing: -32,
      })
      .setOrigin(0.5)
      .setLetterSpacing(8)
      .setAlpha(0.55);

    const title = this.add
      .text(0, 0, 'JEGI\nJEGI!', {
        align: 'center',
        fontFamily: FONT_FAMILY,
        fontSize: '126px',
        fontStyle: '900',
        color: COLORS.cream,
        stroke: '#ef5b4c',
        strokeThickness: 5,
        lineSpacing: -32,
      })
      .setOrigin(0.5)
      .setLetterSpacing(8);

    logo.add([shadow, title]);
    this.createJegi(centerX + 238, 315);

    this.tweens.add({
      targets: logo,
      y: logo.y - 7,
      duration: 1800,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private createJegi(x: number, y: number): void {
    const jegi = this.add.container(x, y).setAngle(10);
    const graphics = this.add.graphics();

    graphics.fillStyle(COLORS.gold, 1);
    graphics.fillCircle(0, 0, 25);
    graphics.lineStyle(5, 0x9b6b1c, 0.85);
    graphics.strokeCircle(0, 0, 25);
    graphics.fillStyle(0x342716, 0.72);
    graphics.fillCircle(0, 0, 8);

    const strips = [
      { points: [-19, -8, -60, -94, -29, -105, -4, -22], color: COLORS.red },
      { points: [-8, -20, -18, -124, 14, -130, 10, -22], color: COLORS.sky },
      { points: [7, -19, 31, -111, 60, -97, 20, -7], color: COLORS.red },
      { points: [14, -12, 62, -71, 79, -45, 22, 5], color: COLORS.sky },
    ];

    strips.forEach(({ points, color }) => {
      graphics.fillStyle(color, 0.96);
      graphics.fillPoints(
        [
          new Phaser.Math.Vector2(points[0], points[1]),
          new Phaser.Math.Vector2(points[2], points[3]),
          new Phaser.Math.Vector2(points[4], points[5]),
          new Phaser.Math.Vector2(points[6], points[7]),
        ],
        true,
      );
    });

    jegi.add(graphics);
    this.tweens.add({
      targets: jegi,
      y: y - 18,
      angle: -5,
      duration: 1250,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private drawStartPrompt(): void {
    const isTouchDevice = navigator.maxTouchPoints > 0;
    const message = isTouchDevice ? '화면을 터치하세요' : '아무 키나 누르세요';
    const prompt = this.add
      .text(GAME_WIDTH / 2, 708, message, {
        fontFamily: FONT_FAMILY,
        fontSize: '27px',
        fontStyle: 'bold',
        color: COLORS.cream,
        backgroundColor: '#123c58',
        padding: { x: 34, y: 17 },
      })
      .setOrigin(0.5)
      .setLetterSpacing(2);

    this.tweens.add({
      targets: prompt,
      alpha: 0.45,
      duration: 800,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private startGame(): void {
    if (this.isStarting) {
      return;
    }

    this.isStarting = true;
    this.cameras.main.fadeOut(280, 7, 27, 47);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('GameScene');
    });
  }
}
