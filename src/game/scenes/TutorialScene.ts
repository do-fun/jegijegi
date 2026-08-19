import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../dimensions';
import { isConfirmKey } from '../inputKeys';
import { TUTORIAL_SEEN_KEY } from '../progress';
import { drawNaturalBackdrop } from '../naturalBackdrop';
import { configureResponsiveCamera } from '../responsiveCamera';
import { initializeAudio, preloadAudio, startMusic, toggleMuted } from '../audio';

const FONT = 'Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif';

export class TutorialScene extends Phaser.Scene {
  private ready = false;
  private leaving = false;

  constructor() {
    super('TutorialScene');
  }

  preload(): void {
    preloadAudio(this);
    if (!this.textures.exists('player-kick')) {
      this.load.spritesheet('player-kick', '/assets/characters/player-sprite-v4.png', {
        frameWidth: 384,
        frameHeight: 1024,
      });
    }
    if (!this.textures.exists('jegi-real')) {
      this.load.image('jegi-real', '/assets/items/jegi-real.png');
    }
  }

  create(): void {
    this.ready = false;
    this.leaving = false;
    initializeAudio(this);
    startMusic(this);
    sessionStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    configureResponsiveCamera(this);
    this.cameras.main.setBackgroundColor(0xaedbe8);

    const graphics = drawNaturalBackdrop(this, GAME_HEIGHT - 42);
    graphics.lineStyle(3, 0x8c6a43, 0.75).strokeRoundedRect(170, 92, 1100, 706, 28);
    graphics.fillStyle(0xfff4d6, 0.94).fillRoundedRect(188, 110, 1064, 670, 22);

    this.add.text(GAME_WIDTH / 2, 154, '어떻게 차나요?', {
      fontFamily: FONT,
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#244f46',
    }).setOrigin(0.5);

    this.add.text(1194, 154, 'M  음소거', {
      fontFamily: FONT,
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#397064',
    }).setOrigin(1, 0.5);

    const cards = [
      { x: 234, key: '←  →', title: '낙하 지점으로 이동', body: '떨어지는 제기 아래로\n캐릭터를 움직이세요.' },
      { x: 552, key: 'SPACE', title: '제기 차기', body: '발의 최고점에 맞추면 PERFECT!\n제기를 들고 있을 때는 서브합니다.' },
      { x: 870, key: '♥ 2', title: '생명을 지키세요', body: '바닥에 떨어지거나 목표 미달이면\n생명을 하나 잃습니다.' },
    ];

    cards.forEach((card) => {
      graphics.fillStyle(0x416f5b, 0.96).fillRoundedRect(card.x, 254, 286, 306, 18);
      this.add.text(card.x + 143, 308, card.key, {
        fontFamily: FONT,
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#f1bd4a',
      }).setOrigin(0.5);
      this.add.text(card.x + 143, 382, card.title, {
        fontFamily: FONT,
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#f7e9c8',
      }).setOrigin(0.5);
      this.add.text(card.x + 143, 452, card.body, {
        fontFamily: FONT,
        fontSize: '17px',
        align: 'center',
        lineSpacing: 8,
        color: '#c9bea4',
      }).setOrigin(0.5);
    });

    graphics.fillStyle(0xffe7a8, 0.9).fillRoundedRect(318, 574, 385, 108, 13);
    graphics.lineStyle(3, 0xd99a20, 0.9).strokeRoundedRect(318, 574, 385, 108, 13);
    const hitGraphics = this.add.graphics().setDepth(2);
    this.drawHitExample(hitGraphics, 365, 679, 2, 382, 642, false);
    this.add.text(460, 589, 'GOOD  +50', {
      fontFamily: FONT,
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#a76d00',
    });
    this.add.text(460, 623, '발이 올라가는 동안\n안쪽 복숭아뼈로 제기를 맞추기', {
      fontFamily: FONT,
      fontSize: '14px',
      lineSpacing: 5,
      color: '#4d432d',
    });

    graphics.fillStyle(0xd6f1ed, 0.94).fillRoundedRect(737, 574, 385, 108, 13);
    graphics.lineStyle(4, 0x3eb7c2, 0.95).strokeRoundedRect(737, 574, 385, 108, 13);
    this.drawHitExample(hitGraphics, 784, 679, 2, 797, 637, true);
    this.add.text(879, 589, 'PERFECT  +100', {
      fontFamily: FONT,
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#167d87',
    });
    this.add.text(879, 623, '안쪽 복숭아뼈가 최고점일 때 맞추기\n연속 성공 시 +100 보너스', {
      fontFamily: FONT,
      fontSize: '14px',
      lineSpacing: 5,
      color: '#244f46',
    });

    this.add.text(GAME_WIDTH / 2, 708, '스테이지 목표는 최소 횟수입니다  ·  남은 시간 동안 더 높은 기록에 도전하세요', {
      fontFamily: FONT,
      fontSize: '21px',
      fontStyle: 'bold',
      color: '#397064',
    }).setOrigin(0.5);

    const prompt = this.add.text(GAME_WIDTH / 2, 754, '아무 키나 누르면 시작', {
      fontFamily: FONT,
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#244f46',
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.4, duration: 750, yoyo: true, repeat: -1 });

    this.time.delayedCall(180, () => {
      this.ready = true;
      this.input.keyboard?.on('keydown', this.startGame, this);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.startGame, this);
    });
  }

  private drawHitExample(
    graphics: Phaser.GameObjects.Graphics,
    playerX: number,
    playerY: number,
    frame: number,
    targetX: number,
    targetY: number,
    perfect: boolean,
  ): void {
    const color = perfect ? 0x25aeb9 : 0xd99a20;

    this.add.sprite(playerX, playerY, 'player-kick', frame)
      .setOrigin(0.5, 0.88)
      .setScale(0.1)
      .setAlpha(0.58)
      .setDepth(1);

    graphics.fillStyle(color, 0.14).fillCircle(targetX, targetY, 23);
    graphics.lineStyle(perfect ? 4 : 3, color, 1).strokeCircle(targetX, targetY, 23);
    graphics.lineStyle(2, color, 0.95).lineBetween(targetX - 10, targetY, targetX + 10, targetY);
    graphics.lineBetween(targetX, targetY - 10, targetX, targetY + 10);

    const jegiY = targetY - 9;
    this.add.image(targetX, jegiY, 'jegi-real')
      .setOrigin(0.5, 0.86)
      .setDisplaySize(16, 24)
      .setDepth(3);

    if (!perfect) {
      graphics.lineStyle(3, color, 0.85).lineBetween(targetX - 31, targetY + 20, targetX - 31, targetY - 14);
      graphics.fillStyle(color, 0.9).fillTriangle(
        targetX - 38, targetY - 7,
        targetX - 24, targetY - 7,
        targetX - 31, targetY - 19,
      );
    } else {
      graphics.lineStyle(3, color, 0.85).lineBetween(targetX - 20, targetY - 28, targetX + 20, targetY - 28);
    }
  }

  private startGame(event: KeyboardEvent): void {
    if (!this.ready || this.leaving || event.repeat) return;
    if (event.code === 'KeyM') {
      toggleMuted(this);
      return;
    }
    if (event.code === 'Escape') {
      this.leaving = true;
      this.scene.start('TitleScene');
      return;
    }
    if (!isConfirmKey(event)) return;
    this.leaving = true;
    this.scene.start('GameScene');
  }
}
