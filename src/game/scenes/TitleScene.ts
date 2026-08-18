import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../dimensions';
import { isConfirmKey } from '../inputKeys';
import { shouldShowTutorial, TUTORIAL_SEEN_KEY } from '../progress';
import { drawNaturalBackdrop } from '../naturalBackdrop';
import { configureResponsiveCamera } from '../responsiveCamera';

const COLORS = {
  navy: 0xaedbe8,
  cream: '#173e43',
  mutedCream: '#4e6b5f',
};

const FONT_FAMILY = 'Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif';

export class TitleScene extends Phaser.Scene {
  private isStarting = false;

  constructor() {
    super('TitleScene');
  }

  preload(): void {
    if (!this.textures.exists('jegi-real')) {
      this.load.image('jegi-real', '/assets/items/jegi-real.png');
    }
  }

  create(): void {
    // Phaser는 Scene 인스턴스를 재사용하므로 재진입할 때 시작 잠금을 초기화한다.
    this.isStarting = false;
    configureResponsiveCamera(this);
    this.cameras.main.setBackgroundColor(COLORS.navy);
    this.drawBackdrop();
    this.drawTopStats();
    this.drawLogo();
    this.drawStartPrompt();

    // Scene 전환에 사용한 입력이 타이틀의 시작 입력으로 이어지지 않게 한다.
    this.time.delayedCall(120, () => {
      this.input.keyboard?.on('keydown', this.startFromKeyboard, this);
      this.input.on('pointerdown', this.startFromPointer, this);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.startFromKeyboard, this);
      this.input.off('pointerdown', this.startFromPointer, this);
    });
  }

  private drawBackdrop(): void {
    drawNaturalBackdrop(this, GAME_HEIGHT - 62);
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
      .text(94, 130, bestScore.toString(), {
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
      .text(GAME_WIDTH - 94, 130, `× ${maxCombo}`, {
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
        color: '#fff3d1',
        stroke: '#315d43',
        strokeThickness: 8,
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
    const jegi = this.add.image(x, y, 'jegi-real')
      .setOrigin(0.5, 0.86)
      .setDisplaySize(160, 240)
      .setAngle(8);
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
        color: '#fff3d1',
        backgroundColor: '#315d43',
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
      const nextScene = shouldShowTutorial(localStorage.getItem(TUTORIAL_SEEN_KEY))
        ? 'TutorialScene'
        : 'GameScene';
      this.scene.start(nextScene);
    });
  }

  private startFromKeyboard(event: KeyboardEvent): void {
    if (!isConfirmKey(event)) {
      return;
    }
    this.startGame();
  }

  private startFromPointer(pointer: Phaser.Input.Pointer): void {
    if (!pointer.wasTouch) {
      return;
    }
    this.startGame();
  }
}
