import Phaser from 'phaser';

export interface InputActions {
  move: -1 | 0 | 1;
  kickPressed: boolean;
  mutePressed: boolean;
}

export class InputManager {
  private readonly left: Phaser.Input.Keyboard.Key;
  private readonly right: Phaser.Input.Keyboard.Key;
  private readonly kick: Phaser.Input.Keyboard.Key;
  private readonly mute: Phaser.Input.Keyboard.Key;
  private suppressLeft = false;
  private suppressRight = false;
  private suppressKick = false;
  private suppressMute = false;

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is unavailable');
    }

    this.left = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.right = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.kick = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.mute = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.reset();
  }

  read(): InputActions {
    this.releaseSuppressedKeys();

    const leftDown = this.left.isDown && !this.suppressLeft;
    const rightDown = this.right.isDown && !this.suppressRight;
    const move = leftDown === rightDown ? 0 : leftDown ? -1 : 1;

    return {
      move,
      kickPressed: !this.suppressKick && Phaser.Input.Keyboard.JustDown(this.kick),
      mutePressed: !this.suppressMute && Phaser.Input.Keyboard.JustDown(this.mute),
    };
  }

  requireFreshKick(): void {
    this.suppressKick = this.kick.isDown;
  }

  reset(): void {
    this.suppressLeft = this.left.isDown;
    this.suppressRight = this.right.isDown;
    this.suppressKick = this.kick.isDown;
    this.suppressMute = this.mute.isDown;
  }

  private releaseSuppressedKeys(): void {
    if (!this.left.isDown) this.suppressLeft = false;
    if (!this.right.isDown) this.suppressRight = false;
    if (!this.kick.isDown) this.suppressKick = false;
    if (!this.mute.isDown) this.suppressMute = false;
  }
}

