import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

const FONT_FAMILY = 'Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x071b2f);
    this.cameras.main.fadeIn(280, 7, 27, 47);

    const escapeKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escapeKey?.once('down', () => {
      // 현재 ESC 이벤트 처리가 끝난 다음 Scene을 전환한다.
      this.time.delayedCall(0, () => this.scene.start('TitleScene'));
    });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 24, 'PLAYGROUND', {
        fontFamily: FONT_FAMILY,
        fontSize: '56px',
        fontStyle: 'bold',
        color: '#f7e9c8',
      })
      .setOrigin(0.5)
      .setLetterSpacing(6);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 48, '게임 플레이 화면은 다음 단계에서 이어집니다', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: '#c9bea4',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 92, 'ESC로 타이틀 화면 돌아가기', {
        fontFamily: FONT_FAMILY,
        fontSize: '17px',
        color: '#7f9aab',
      })
      .setOrigin(0.5);
  }
}
