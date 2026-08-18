import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../dimensions';
import { isConfirmKey } from '../inputKeys';
import { drawNaturalBackdrop } from '../naturalBackdrop';
import { configureResponsiveCamera } from '../responsiveCamera';
import {
  createStageEnvironment,
  hasRain,
  hasWind,
  type StageEnvironment,
} from '../environment';
import {
  applySuccessfulKick,
  resolveStageTimeout,
  STAGE_TARGETS,
  type HitGrade,
  type ScoreState,
} from '../rules';
import {
  applyPerfectBoost,
  getLuckyPouchSpawnDelay,
  getLuckyPouchSpawnBounds,
  isLuckyPouchCollected,
  LUCKY_POUCH_FALL_SPEED,
  LUCKY_POUCH_START_STAGE,
  PERFECT_BOOST_SECONDS,
} from '../powerup';
import { InputManager } from '../systems/InputManager';

const FONT = 'Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif';
const PLAYER_Y = 770;
const PLAYER_EDGE_PADDING = 90;
const FLIGHT_EDGE_PADDING = 34;
const FLY_EDGE_PADDING = 28;
const PLAYER_SPEED = 480;
const KICK_DURATION = 0.25;
const PERFECT_START = 0.1;
const PERFECT_END = 0.15;
const KICK_RADIUS = 70;
const KICK_FOOT_APEX_Y = 642;
const FLIGHT_RISE_SECONDS = 0.68;
const FLIGHT_FALL_SECONDS = 0.74;
const FLIGHT_HEIGHT = 390;
const GROUND_Y = 760;
const STAGE_SECONDS = 20;
const HOLD_PENALTY_SECONDS = 5;
// 10스테이지 전체 플레이 검증이 끝나면 false로 되돌린다.
const DISABLE_LIFE_LOSS_FOR_PLAYTEST = true;
const RESULT_SECONDS = 1.15;
const PERFECT_HIT_STOP = 0.04;
const ANGLE_STEP_SPEED = 185;
const WIND_VELOCITY_CHANGE = 80;
const MAX_HORIZONTAL_SPEED = ANGLE_STEP_SPEED * 3;
const FLY_COLLISION_COOLDOWN = 0.25;

type PlayState = 'held' | 'flying' | 'stage-result' | 'ended';
type StageResultKind = 'clear' | 'retry';

interface FlightState {
  x: number;
  startY: number;
  peakY: number;
  elapsed: number;
  riseDuration: number;
  fallDuration: number;
  horizontalVelocity: number;
  grade: HitGrade | 'serve';
  fallWindApplied: boolean;
}

interface FlyState {
  id: number;
  x: number;
  y: number;
  velocity: number;
  collided: boolean;
}

interface LuckyPouchState {
  x: number;
  y: number;
  rotation: number;
}

export class GameScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private playerX = GAME_WIDTH / 2;
  private playerMoveDirection = 0;
  private walkElapsed = 0;
  private state: PlayState = 'held';
  private flight: FlightState | null = null;
  private kickActive = false;
  private kickConnected = false;
  private kickElapsed = 0;
  private stage = 1;
  private stageTime = STAGE_SECONDS;
  private stageSuccesses = 0;
  private totalSuccesses = 0;
  private goodCount = 0;
  private perfectCount = 0;
  private stageStarted = false;
  private holdTime = 0;
  private lives = 2;
  private scoreState: ScoreState = { score: 0, combo: 0, consecutivePerfects: 0, maxCombo: 0 };
  private hitStopRemaining = 0;
  private resultRemaining = 0;
  private stageResultKind: StageResultKind = 'clear';
  private externalPaused = false;
  private muted = false;
  private environment!: StageEnvironment;
  private flies: FlyState[] = [];
  private flyCollisionCooldown = 0;
  private pendingInsectBonus = 0;
  private luckyPouch: LuckyPouchState | null = null;
  private luckyPouchSpawnRemaining = 0;
  private luckyPouchCollectedThisStage = false;
  private perfectBoostRemaining = 0;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private jegiSprite!: Phaser.GameObjects.Image;
  private kickTargetGraphics!: Phaser.GameObjects.Graphics;
  private weatherGraphics!: Phaser.GameObjects.Graphics;
  private flyGraphics!: Phaser.GameObjects.Graphics;
  private luckyPouchGraphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private muteText!: Phaser.GameObjects.Text;
  private weatherText!: Phaser.GameObjects.Text;
  private perfectBoostText!: Phaser.GameObjects.Text;
  private heldPrompt!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private overlayShade!: Phaser.GameObjects.Rectangle;
  private overlayTitle!: Phaser.GameObjects.Text;
  private overlayBody!: Phaser.GameObjects.Text;
  private pauseShade!: Phaser.GameObjects.Rectangle;
  private pauseText!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    if (!this.textures.exists('player-kick')) {
      this.load.spritesheet('player-kick', '/assets/characters/player-sprite-v4.png', {
        frameWidth: 384,
        frameHeight: 1024,
      });
    }
    if (!this.textures.exists('player-walk')) {
      this.load.spritesheet('player-walk', '/assets/characters/player-walk.png', {
        frameWidth: 768,
        frameHeight: 1024,
      });
    }
    if (!this.textures.exists('jegi-real')) {
      this.load.image('jegi-real', '/assets/items/jegi-real.png');
    }
  }

  create(): void {
    this.resetRun();
    configureResponsiveCamera(this);
    this.inputManager = new InputManager(this);
    this.cameras.main.setBackgroundColor(0xaedbe8);
    this.cameras.main.fadeIn(220, 174, 219, 232);
    this.drawArena();
    this.createHud();
    this.createActors();
    this.createOverlays();
    this.renderAll();

    this.input.keyboard?.on('keydown', this.handleGlobalKey, this);
    window.addEventListener('blur', this.pauseFromEnvironment);
    window.addEventListener('focus', this.resumeFromEnvironment);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  update(_time: number, deltaMs: number): void {
    const delta = Math.min(deltaMs / 1000, 0.05);
    const actions = this.inputManager.read();

    if (actions.mutePressed) this.toggleMute();
    if (this.externalPaused || this.state === 'ended') return;

    if (this.hitStopRemaining > 0) {
      this.hitStopRemaining = Math.max(0, this.hitStopRemaining - delta);
      return;
    }

    if (this.state === 'stage-result') {
      this.resultRemaining -= delta;
      if (this.resultRemaining <= 0) this.finishStageResult();
      return;
    }

    if (this.stageStarted) {
      this.stageTime = Math.max(0, this.stageTime - delta);
      if (this.stageTime <= 0) {
        this.resolveTimeout();
        return;
      }
    }

    if (!this.kickActive) {
      this.playerMoveDirection = actions.move;
      this.walkElapsed = actions.move === 0 ? 0 : this.walkElapsed + delta;
      const movementBounds = this.getVisibleHorizontalBounds(PLAYER_EDGE_PADDING);
      this.playerX = Phaser.Math.Clamp(
        this.playerX + actions.move * PLAYER_SPEED * delta,
        movementBounds.min,
        movementBounds.max,
      );
    } else {
      this.playerMoveDirection = 0;
    }

    if (this.state === 'held') {
      if (this.stageStarted) {
        this.holdTime += delta;
        if (this.holdTime >= HOLD_PENALTY_SECONDS) {
          this.holdTime -= HOLD_PENALTY_SECONDS;
          this.loseLife();
          if (this.lives <= 0) return;
          this.showFeedback(
            DISABLE_LIFE_LOSS_FOR_PLAYTEST ? '대기 시간 초과\nLIFE 유지' : '대기 시간 초과\nLIFE -1',
            'miss',
          );
        }
      }

      if (actions.kickPressed) this.serve();
    } else if (this.state === 'flying') {
      if (actions.kickPressed && !this.kickActive) this.beginKick();
      this.updateFlight(delta);
      this.updateFlies(delta);
      this.checkFlyCollisions();
      if (this.kickActive) this.updateKick(delta);
    }

    // 제한 시간 종료와 바닥 실패 등 상태 변경을 먼저 확정한 뒤 복주머니를 처리한다.
    this.updateLuckyPouch(delta);

    this.renderAll();
  }

  private resetRun(): void {
    this.playerX = GAME_WIDTH / 2;
    this.playerMoveDirection = 0;
    this.walkElapsed = 0;
    this.state = 'held';
    this.flight = null;
    this.kickActive = false;
    this.kickConnected = false;
    this.kickElapsed = 0;
    this.stage = 1;
    this.stageTime = STAGE_SECONDS;
    this.stageSuccesses = 0;
    this.totalSuccesses = 0;
    this.goodCount = 0;
    this.perfectCount = 0;
    this.stageStarted = false;
    this.holdTime = 0;
    this.lives = 2;
    this.scoreState = { score: 0, combo: 0, consecutivePerfects: 0, maxCombo: 0 };
    this.hitStopRemaining = 0;
    this.resultRemaining = 0;
    this.externalPaused = false;
    this.muted = localStorage.getItem('jegijegi.muted') === 'true';
    this.flyCollisionCooldown = 0;
    this.pendingInsectBonus = 0;
    this.luckyPouch = null;
    this.luckyPouchSpawnRemaining = getLuckyPouchSpawnDelay(Math.random());
    this.luckyPouchCollectedThisStage = false;
    this.perfectBoostRemaining = 0;
    this.configureEnvironment();
  }

  private drawArena(): void {
    drawNaturalBackdrop(this, GROUND_Y);
  }

  private createHud(): void {
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: FONT,
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#7f9aab',
    };
    const valueStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: FONT,
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#f7e9c8',
    };

    const hudCards = this.add.graphics();
    const cards = [
      { x: 92, width: 218, color: 0xf1bd4a },
      { x: 324, width: 176, color: 0x5bbbc8 },
      { x: 514, width: 178, color: 0xef5b4c },
      { x: 706, width: 210, color: 0x8da9ff },
      { x: 930, width: 218, color: 0x5ee7f0 },
      { x: 1162, width: 186, color: 0xf1bd4a },
    ];
    cards.forEach((card) => {
      hudCards.fillStyle(0x244f46, 0.94).fillRoundedRect(card.x, 14, card.width, 70, 12);
      hudCards.fillStyle(card.color, 0.9).fillRoundedRect(card.x, 14, 5, 70, 3);
    });

    this.add.text(112, 23, '점수', labelStyle).setLetterSpacing(2);
    this.add.text(344, 23, '콤보', labelStyle).setLetterSpacing(2);
    this.add.text(534, 23, '생명', labelStyle).setLetterSpacing(2);
    this.add.text(726, 23, '스테이지', labelStyle).setLetterSpacing(2);
    this.add.text(950, 23, '성공 횟수', labelStyle).setLetterSpacing(2);
    this.add.text(1182, 23, '남은 시간', labelStyle).setLetterSpacing(2);

    this.scoreText = this.add.text(112, 43, '', { ...valueStyle, color: '#f1bd4a' });
    this.comboText = this.add.text(344, 43, '', { ...valueStyle, color: '#5bbbc8' });
    this.livesText = this.add.text(534, 43, '', { ...valueStyle, color: '#ef7468' });
    this.stageText = this.add.text(726, 43, '', { ...valueStyle, color: '#b9c8ff' });
    this.targetText = this.add.text(950, 43, '', { ...valueStyle, color: '#5ee7f0' });
    this.timerText = this.add.text(1182, 43, '', { ...valueStyle, color: '#f7e9c8' });
    this.muteText = this.add.text(1314, 43, '', { ...valueStyle, fontSize: '24px', color: '#f1bd4a' });
    this.weatherText = this.add.text(GAME_WIDTH / 2, 110, '', {
      ...labelStyle,
      fontSize: '20px',
      color: '#5ee7f0',
      backgroundColor: '#0a263b',
      padding: { x: 14, y: 7 },
    }).setOrigin(0.5, 0);

    this.perfectBoostText = this.add.text(GAME_WIDTH / 2, 98, '', {
      ...valueStyle,
      fontSize: '22px',
      color: '#fff1b8',
      backgroundColor: '#a53a32',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5, 0).setDepth(8).setVisible(false);

    this.heldPrompt = this.add.text(GAME_WIDTH / 2, 708, '', {
      fontFamily: FONT,
      fontSize: '21px',
      fontStyle: 'bold',
      color: '#f7e9c8',
      backgroundColor: '#123c58',
      padding: { x: 22, y: 11 },
    }).setOrigin(0.5).setDepth(5);

    this.feedbackText = this.add.text(GAME_WIDTH / 2, 500, '', {
      fontFamily: FONT,
      fontSize: '36px',
      fontStyle: 'bold',
      align: 'center',
      color: '#f1bd4a',
      stroke: '#071b2f',
      strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0);
  }

  private createActors(): void {
    this.playerSprite = this.add.sprite(this.playerX, PLAYER_Y, 'player-kick', 0)
      .setOrigin(0.5, 0.88)
      .setScale(0.29)
      .setAlpha(0.58)
      .setDepth(1);
    this.jegiSprite = this.add.image(this.playerX, KICK_FOOT_APEX_Y, 'jegi-real')
      .setOrigin(0.5, 0.86)
      .setDisplaySize(67, 100)
      .setDepth(3);
    this.kickTargetGraphics = this.add.graphics().setDepth(2);
    this.weatherGraphics = this.add.graphics();
    this.flyGraphics = this.add.graphics();
    this.luckyPouchGraphics = this.add.graphics().setDepth(4);
  }

  private createOverlays(): void {
    this.overlayShade = this.add.rectangle(-1200, -600, GAME_WIDTH + 2400, GAME_HEIGHT + 1200, 0x03101d, 0.84)
      .setOrigin(0).setDepth(20).setVisible(false);
    this.overlayTitle = this.add.text(GAME_WIDTH / 2, 350, '', {
      fontFamily: FONT,
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#f7e9c8',
      stroke: '#ef5b4c',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(21).setVisible(false);
    this.overlayBody = this.add.text(GAME_WIDTH / 2, 475, '', {
      fontFamily: FONT,
      fontSize: '25px',
      align: 'center',
      lineSpacing: 10,
      color: '#c9bea4',
    }).setOrigin(0.5).setDepth(21).setVisible(false);

    this.pauseShade = this.add.rectangle(-1200, -600, GAME_WIDTH + 2400, GAME_HEIGHT + 1200, 0x03101d, 0.78)
      .setOrigin(0).setDepth(30).setVisible(false);
    this.pauseText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '일시 정지\n게임 화면으로 돌아오면 이어서 진행됩니다', {
      fontFamily: FONT,
      fontSize: '38px',
      fontStyle: 'bold',
      align: 'center',
      lineSpacing: 14,
      color: '#f7e9c8',
    }).setOrigin(0.5).setDepth(31).setVisible(false);
  }

  private serve(): void {
    this.stageStarted = true;
    this.holdTime = 0;
    this.kickActive = false;
    this.kickConnected = false;
    const heldPoint = this.getHeldJegiPoint();
    this.launchFlight(0, 'serve', heldPoint.x, heldPoint.y);
    this.inputManager.requireFreshKick();
  }

  private beginKick(): void {
    this.kickActive = true;
    this.kickConnected = false;
    this.kickElapsed = 0;
  }

  private updateKick(delta: number): void {
    this.kickElapsed += delta;
    if (!this.kickConnected && this.kickElapsed <= PERFECT_END && this.flight) {
      const foot = this.getFootPoint();
      const jegi = this.getJegiPoint();
      if (Phaser.Math.Distance.Between(foot.x, foot.y, jegi.x, jegi.y) <= KICK_RADIUS) {
        const timingGrade: HitGrade = this.kickElapsed >= PERFECT_START ? 'perfect' : 'good';
        const grade = applyPerfectBoost(timingGrade, this.perfectBoostRemaining);
        this.resolveHit(grade, jegi.x, jegi.y);
        return;
      }
    }

    if (this.kickElapsed >= KICK_DURATION) {
      this.kickActive = false;
      this.kickConnected = false;
      this.kickElapsed = 0;
    }
  }

  private resolveHit(grade: HitGrade, x: number, y: number): void {
    const result = applySuccessfulKick(this.scoreState, grade, this.pendingInsectBonus);
    this.scoreState = result;
    this.pendingInsectBonus = 0;
    this.stageSuccesses += 1;
    this.totalSuccesses += 1;
    if (grade === 'perfect') this.perfectCount += 1;
    else this.goodCount += 1;
    this.kickConnected = true;
    const direction = grade === 'good' ? (Math.random() < 0.5 ? -1 : 1) : 0;
    this.launchFlight(direction, grade, x, y);
    this.showFeedback(`${grade === 'perfect' ? 'PERFECT' : 'GOOD'}\n+${result.gained}`, grade);
    if (grade === 'perfect') this.hitStopRemaining = PERFECT_HIT_STOP;
  }

  private launchFlight(direction: -1 | 0 | 1, grade: HitGrade | 'serve', x?: number, y?: number): void {
    const startX = x ?? this.playerX + 32;
    const startY = y ?? KICK_FOOT_APEX_Y;
    const raining = hasRain(this.environment.weather);
    const rainFactor = raining ? 0.85 : 1;
    const fallFactor = raining ? 0.85 : 1;
    let horizontalVelocity = direction * ANGLE_STEP_SPEED;
    if (hasWind(this.environment.weather) && grade !== 'perfect') {
      horizontalVelocity += this.environment.windDirection * WIND_VELOCITY_CHANGE;
    }
    this.flight = {
      x: startX,
      startY,
      peakY: Math.max(170, startY - FLIGHT_HEIGHT * rainFactor),
      elapsed: 0,
      riseDuration: FLIGHT_RISE_SECONDS * rainFactor,
      fallDuration: FLIGHT_FALL_SECONDS * fallFactor,
      horizontalVelocity: Phaser.Math.Clamp(horizontalVelocity, -MAX_HORIZONTAL_SPEED, MAX_HORIZONTAL_SPEED),
      grade,
      fallWindApplied: false,
    };
    this.flies.forEach((fly) => { fly.collided = false; });
    this.flyCollisionCooldown = 0;
    this.state = 'flying';
    if (grade === 'serve') this.feedbackText.setAlpha(0);
  }

  private updateFlight(delta: number): void {
    if (!this.flight) return;
    const wasRising = this.flight.elapsed < this.flight.riseDuration;
    this.flight.elapsed += delta;
    if (
      wasRising
      && this.flight.elapsed >= this.flight.riseDuration
      && hasWind(this.environment.weather)
      && !this.flight.fallWindApplied
    ) {
      this.flight.horizontalVelocity = Phaser.Math.Clamp(
        this.flight.horizontalVelocity + this.environment.windDirection * WIND_VELOCITY_CHANGE,
        -MAX_HORIZONTAL_SPEED,
        MAX_HORIZONTAL_SPEED,
      );
      this.flight.fallWindApplied = true;
    }

    this.flight.x += this.flight.horizontalVelocity * delta;
    const flightBounds = this.getVisibleHorizontalBounds(FLIGHT_EDGE_PADDING);
    if (this.flight.x <= flightBounds.min) {
      this.flight.x = flightBounds.min;
      this.flight.horizontalVelocity = Math.abs(this.flight.horizontalVelocity);
    } else if (this.flight.x >= flightBounds.max) {
      this.flight.x = flightBounds.max;
      this.flight.horizontalVelocity = -Math.abs(this.flight.horizontalVelocity);
    }
    const point = this.getJegiPoint();
    if (point.y >= GROUND_Y) this.handleFloorFailure();
  }

  private getJegiPoint(): Phaser.Math.Vector2 {
    if (!this.flight) return new Phaser.Math.Vector2(this.playerX + 32, KICK_FOOT_APEX_Y);
    const flight = this.flight;
    let y: number;

    if (flight.elapsed <= flight.riseDuration) {
      const t = Phaser.Math.Clamp(flight.elapsed / flight.riseDuration, 0, 1);
      const eased = 1 - (1 - t) * (1 - t);
      y = Phaser.Math.Linear(flight.startY, flight.peakY, eased);
    } else {
      const t = Phaser.Math.Clamp((flight.elapsed - flight.riseDuration) / flight.fallDuration, 0, 1);
      y = Phaser.Math.Linear(flight.peakY, GROUND_Y, t * t);
    }
    return new Phaser.Math.Vector2(flight.x, y);
  }

  private getFootPoint(): Phaser.Math.Vector2 {
    return this.getKickPose().foot;
  }

  private getKickPose(): { knee: Phaser.Math.Vector2; foot: Phaser.Math.Vector2; extension: number } {
    const restKnee = new Phaser.Math.Vector2(this.playerX + 20, PLAYER_Y - 30);
    const restFoot = new Phaser.Math.Vector2(this.playerX + 35, PLAYER_Y - 8);
    const foldedKnee = new Phaser.Math.Vector2(this.playerX + 35, PLAYER_Y - 110);
    const foldedFoot = new Phaser.Math.Vector2(this.playerX + 30, PLAYER_Y - 80);
    const strikeKnee = new Phaser.Math.Vector2(this.playerX + 36, PLAYER_Y - 80);
    const strikeFoot = new Phaser.Math.Vector2(this.playerX + 32, KICK_FOOT_APEX_Y);

    if (!this.kickActive) return { knee: restKnee, foot: restFoot, extension: 0 };

    const interpolate = (
      from: Phaser.Math.Vector2,
      to: Phaser.Math.Vector2,
      progress: number,
    ): Phaser.Math.Vector2 => {
      const eased = Phaser.Math.Easing.Sine.InOut(Phaser.Math.Clamp(progress, 0, 1));
      return new Phaser.Math.Vector2(
        Phaser.Math.Linear(from.x, to.x, eased),
        Phaser.Math.Linear(from.y, to.y, eased),
      );
    };

    if (this.kickElapsed < 0.045) {
      const progress = this.kickElapsed / 0.045;
      return {
        knee: interpolate(restKnee, foldedKnee, progress),
        foot: interpolate(restFoot, foldedFoot, progress),
        extension: progress * 0.45,
      };
    }
    if (this.kickElapsed < PERFECT_START) {
      const progress = (this.kickElapsed - 0.045) / (PERFECT_START - 0.045);
      return {
        knee: interpolate(foldedKnee, strikeKnee, progress),
        foot: interpolate(foldedFoot, strikeFoot, progress),
        extension: Phaser.Math.Linear(0.45, 1, progress),
      };
    }
    if (this.kickElapsed <= PERFECT_END) {
      return { knee: strikeKnee, foot: strikeFoot, extension: 1 };
    }
    if (this.kickElapsed < 0.205) {
      const progress = (this.kickElapsed - PERFECT_END) / (0.205 - PERFECT_END);
      return {
        knee: interpolate(strikeKnee, foldedKnee, progress),
        foot: interpolate(strikeFoot, foldedFoot, progress),
        extension: Phaser.Math.Linear(1, 0.45, progress),
      };
    }

    const progress = (this.kickElapsed - 0.205) / (KICK_DURATION - 0.205);
    return {
      knee: interpolate(foldedKnee, restKnee, progress),
      foot: interpolate(foldedFoot, restFoot, progress),
      extension: Phaser.Math.Linear(0.45, 0, progress),
    };
  }

  private configureEnvironment(): void {
    this.environment = createStageEnvironment(this.stage);
    const spawnBounds = this.getVisibleHorizontalBounds(80);
    this.flies = Array.from({ length: this.environment.flyCount }, (_, id) => ({
      id,
      x: Phaser.Math.Between(Math.ceil(spawnBounds.min), Math.floor(spawnBounds.max)),
      y: Phaser.Math.Between(220, 500),
      velocity: (id % 2 === 0 ? 1 : -1) * Phaser.Math.Between(95, 145),
      collided: false,
    }));
  }

  private updateLuckyPouch(delta: number): void {
    this.perfectBoostRemaining = Math.max(0, this.perfectBoostRemaining - delta);
    if (
      !this.stageStarted
      || this.stage < LUCKY_POUCH_START_STAGE
      || this.state !== 'flying'
      || this.luckyPouchCollectedThisStage
    ) return;

    if (!this.luckyPouch) {
      this.luckyPouchSpawnRemaining -= delta;
      if (this.luckyPouchSpawnRemaining > 0) return;
      const arenaBounds = this.getVisibleHorizontalBounds(70);
      const bounds = getLuckyPouchSpawnBounds(
        this.playerX,
        arenaBounds.min,
        arenaBounds.max,
      );
      this.luckyPouch = {
        x: Phaser.Math.Between(Math.ceil(bounds.min), Math.floor(bounds.max)),
        y: 128,
        rotation: 0,
      };
      return;
    }

    this.luckyPouch.y += LUCKY_POUCH_FALL_SPEED * delta;
    this.luckyPouch.rotation += delta * 2.4;
    if (isLuckyPouchCollected(this.luckyPouch.x, this.luckyPouch.y, this.playerX, PLAYER_Y)) {
      this.luckyPouch = null;
      this.luckyPouchSpawnRemaining = getLuckyPouchSpawnDelay(Math.random());
      this.luckyPouchCollectedThisStage = true;
      this.perfectBoostRemaining = PERFECT_BOOST_SECONDS;
      this.showFeedback('복주머니 획득\nPERFECT 5초', 'perfect');
      return;
    }

    if (this.luckyPouch.y > GROUND_Y + 38) {
      this.luckyPouch = null;
      this.luckyPouchSpawnRemaining = getLuckyPouchSpawnDelay(Math.random());
    }
  }

  private updateFlies(delta: number): void {
    this.flyCollisionCooldown = Math.max(0, this.flyCollisionCooldown - delta);
    const raining = hasRain(this.environment.weather);
    const windy = hasWind(this.environment.weather);
    for (const fly of this.flies) {
      let speedFactor = raining ? 0.72 : 1;
      if (windy) {
        const movingWithWind = Math.sign(fly.velocity) === this.environment.windDirection;
        speedFactor *= movingWithWind ? 1.25 : 0.78;
      }
      fly.x += fly.velocity * speedFactor * delta;
      const flyBounds = this.getVisibleHorizontalBounds(FLY_EDGE_PADDING);
      if (fly.x <= flyBounds.min || fly.x >= flyBounds.max) {
        fly.x = Phaser.Math.Clamp(fly.x, flyBounds.min, flyBounds.max);
        fly.velocity *= -1;
      }
    }
  }

  private checkFlyCollisions(): void {
    if (!this.flight || this.flyCollisionCooldown > 0) return;
    const risingPerfect = this.flight.grade === 'perfect' && this.flight.elapsed <= this.flight.riseDuration;
    if (risingPerfect) return;
    const jegi = this.getJegiPoint();
    const fly = this.flies.find((candidate) => (
      !candidate.collided && Phaser.Math.Distance.Between(jegi.x, jegi.y, candidate.x, candidate.y) <= 35
    ));
    if (!fly) return;

    fly.collided = true;
    this.flyCollisionCooldown = FLY_COLLISION_COOLDOWN;
    const change = Math.random() < 0.5 ? -ANGLE_STEP_SPEED : ANGLE_STEP_SPEED;
    this.flight.horizontalVelocity = Phaser.Math.Clamp(
      this.flight.horizontalVelocity + change,
      -MAX_HORIZONTAL_SPEED,
      MAX_HORIZONTAL_SPEED,
    );
    this.pendingInsectBonus = Math.min(150, this.pendingInsectBonus + 50);
    this.showFeedback(`FLY +${this.pendingInsectBonus}`, 'good');
  }

  private handleFloorFailure(): void {
    this.flight = null;
    this.luckyPouch = null;
    this.luckyPouchSpawnRemaining = getLuckyPouchSpawnDelay(Math.random());
    this.luckyPouchCollectedThisStage = false;
    this.perfectBoostRemaining = 0;
    this.kickActive = false;
    this.kickConnected = false;
    this.scoreState.combo = 0;
    this.scoreState.consecutivePerfects = 0;
    this.pendingInsectBonus = 0;
    this.state = 'held';
    this.holdTime = 0;
    this.saveRecords();
    this.loseLife();
    if (this.lives > 0) {
      this.inputManager.requireFreshKick();
      this.showFeedback(DISABLE_LIFE_LOSS_FOR_PLAYTEST ? 'LIFE 유지' : 'LIFE -1', 'miss');
    }
  }

  private loseLife(): void {
    if (DISABLE_LIFE_LOSS_FOR_PLAYTEST) return;
    this.lives -= 1;
    this.saveRecords();
    if (this.lives <= 0) this.endGame('GAME OVER');
  }

  private resolveTimeout(): void {
    this.stageTime = 0;
    this.kickActive = false;
    this.kickConnected = false;
    this.flight = null;
    this.pendingInsectBonus = 0;
    this.luckyPouch = null;
    this.perfectBoostRemaining = 0;
    this.saveStageRecord();
    const result = resolveStageTimeout(
      this.stageSuccesses,
      STAGE_TARGETS[this.stage - 1],
      DISABLE_LIFE_LOSS_FOR_PLAYTEST ? Math.max(1, this.lives) : this.lives,
    );

    if (result === 'clear') {
      this.showStageResult('clear');
      return;
    }

    if (!DISABLE_LIFE_LOSS_FOR_PLAYTEST) this.lives -= 1;
    this.scoreState.combo = 0;
    this.scoreState.consecutivePerfects = 0;
    this.saveRecords();
    if (result === 'game-over') {
      this.endGame('GAME OVER');
    } else {
      this.showStageResult('retry');
    }
  }

  private showStageResult(kind: StageResultKind): void {
    this.state = 'stage-result';
    this.stageResultKind = kind;
    this.resultRemaining = RESULT_SECONDS;
    this.overlayShade.setVisible(true);
    this.overlayTitle.setText(kind === 'clear' ? 'STAGE CLEAR' : 'STAGE RETRY').setVisible(true);
    this.overlayBody.setText(
      kind === 'clear'
        ? `KICK ${this.stageSuccesses}  /  ${STAGE_TARGETS[this.stage - 1]}`
        : `목표 ${STAGE_TARGETS[this.stage - 1]}  ·  기록 ${this.stageSuccesses}\n${DISABLE_LIFE_LOSS_FOR_PLAYTEST ? '테스트 모드 · 생명 유지' : '생명 -1'}`,
    ).setVisible(true);
  }

  private finishStageResult(): void {
    this.overlayShade.setVisible(false);
    this.overlayTitle.setVisible(false);
    this.overlayBody.setVisible(false);

    if (this.stageResultKind === 'clear') {
      if (this.stage >= STAGE_TARGETS.length) {
        this.completeRun();
        return;
      }
      if ([3, 6, 9].includes(this.stage)) this.lives = Math.min(3, this.lives + 1);
      this.stage += 1;
      this.configureEnvironment();
    }

    this.stageTime = STAGE_SECONDS;
    this.stageSuccesses = 0;
    this.stageStarted = false;
    this.holdTime = 0;
    this.state = 'held';
    this.flight = null;
    this.kickActive = false;
    this.kickConnected = false;
    this.luckyPouch = null;
    this.luckyPouchSpawnRemaining = getLuckyPouchSpawnDelay(Math.random());
    this.luckyPouchCollectedThisStage = false;
    this.perfectBoostRemaining = 0;
    this.inputManager.requireFreshKick();
    this.renderAll();
  }

  private completeRun(): void {
    this.saveStageRecord();
    this.saveRecords();
    this.scene.start('ResultScene', {
      score: this.scoreState.score,
      bestScore: this.readNumber('jegijegi.bestScore'),
      totalSuccesses: this.totalSuccesses,
      goodCount: this.goodCount,
      perfectCount: this.perfectCount,
      maxCombo: this.scoreState.maxCombo,
    });
  }

  private endGame(title: 'GAME OVER'): void {
    this.state = 'ended';
    this.flight = null;
    this.kickActive = false;
    this.kickConnected = false;
    this.luckyPouch = null;
    this.perfectBoostRemaining = 0;
    this.pauseShade.setVisible(false);
    this.pauseText.setVisible(false);
    this.saveStageRecord();
    this.saveRecords();
    const best = this.readNumber('jegijegi.bestScore');
    this.overlayShade.setVisible(true);
    this.overlayTitle.setText(title).setVisible(true);
    this.overlayBody.setText(
      `점수 ${this.scoreState.score}  ·  최고 ${best}\n스테이지 ${this.stage}  ·  최대 콤보 ${this.scoreState.maxCombo}\n\n아무 키나 누르면 재시작`,
    ).setVisible(true);
  }

  private handleGlobalKey(event: KeyboardEvent): void {
    if (event.repeat) return;
    if (event.code === 'Escape') {
      this.scene.start('TitleScene');
      return;
    }
    if (this.state !== 'ended' || !isConfirmKey(event)) return;
    this.scene.restart();
  }

  private toggleMute(): void {
    this.muted = !this.muted;
    localStorage.setItem('jegijegi.muted', String(this.muted));
    this.muteText.setText(this.muted ? '🔇' : '🔊');
  }

  private showFeedback(message: string, grade: HitGrade | 'miss'): void {
    this.feedbackText
      .setText(message)
      .setPosition(this.playerX, 520)
      .setColor(grade === 'perfect' ? '#5ee7f0' : grade === 'good' ? '#f1bd4a' : '#ef5b4c')
      .setAlpha(1)
      .setScale(grade === 'perfect' ? 1.18 : 1);
    this.tweens.killTweensOf(this.feedbackText);
    this.tweens.add({
      targets: this.feedbackText,
      y: this.feedbackText.y - 50,
      alpha: 0,
      scale: 0.92,
      duration: 620,
      ease: 'Cubic.out',
    });
  }

  private renderAll(): void {
    this.drawWeather();
    this.drawFlies();
    this.drawLuckyPouch();
    this.drawPlayer();
    this.drawJegi();
    this.drawKickTarget();
    this.updateHud();
  }

  private drawLuckyPouch(): void {
    const graphics = this.luckyPouchGraphics.clear();
    if (!this.luckyPouch || this.state === 'stage-result' || this.state === 'ended') return;
    const { x, y, rotation } = this.luckyPouch;
    const sway = Math.sin(rotation) * 4;

    graphics.fillStyle(0x7d201d, 0.3).fillEllipse(x, y + 19, 43, 12);
    graphics.fillStyle(0xd94b3f, 1).fillRoundedRect(x - 21 + sway, y - 18, 42, 42, 12);
    graphics.fillStyle(0xf1bd4a, 1).fillRoundedRect(x - 24 + sway, y - 18, 48, 8, 4);
    graphics.lineStyle(3, 0xffe7a8, 0.95).strokeCircle(x + sway, y + 4, 9);
    graphics.fillStyle(0xffe7a8, 0.95).fillCircle(x + sway, y + 4, 3);
    graphics.lineStyle(3, 0xf1bd4a, 1).lineBetween(x - 14 + sway, y - 11, x - 20 + sway, y - 29);
    graphics.lineBetween(x + 14 + sway, y - 11, x + 20 + sway, y - 29);
  }

  private drawPlayer(): void {
    let frame = 0;
    let xOffset = 0;
    let texture = 'player-kick';
    const moving = this.playerMoveDirection !== 0 && !this.kickActive;

    if (this.state === 'held') {
      frame = 1;
      xOffset = 8;
    } else if (this.kickActive) {
      // 기존 최고점 프레임은 다리를 뒤로 접은 자세로 읽혀 사용하지 않는다.
      frame = 2;
      xOffset = 3;
    } else if (moving) {
      texture = 'player-walk';
      frame = Math.floor(this.walkElapsed / 0.12) % 2;
      xOffset = frame === 0 ? -19 : 18;
    }

    const bob = moving ? -Math.abs(Math.sin((this.walkElapsed / 0.12) * Math.PI)) * 3 : 0;
    this.playerSprite
      .setTexture(texture, frame)
      .setPosition(this.playerX + xOffset, PLAYER_Y + bob)
      .setAlpha(0.58);
  }

  private drawJegi(): void {
    const point = this.state === 'held'
      ? this.getHeldJegiPoint()
      : this.getJegiPoint();
    if (this.state === 'stage-result' || this.state === 'ended') {
      this.jegiSprite.setVisible(false);
      return;
    }

    let angle = this.state === 'held' ? -8 : 0;
    if (this.flight) {
      if (this.flight.elapsed < this.flight.riseDuration) {
        const progress = this.flight.elapsed / this.flight.riseDuration;
        angle = progress < 0.82 ? 180 : Phaser.Math.Linear(180, 0, (progress - 0.82) / 0.18);
      }
    }
    this.jegiSprite
      .setPosition(point.x, point.y)
      .setAngle(angle)
      .setVisible(true);
  }

  private getHeldJegiPoint(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.playerX + 61, 607);
  }

  private drawKickTarget(): void {
    const graphics = this.kickTargetGraphics.clear();
    if (!this.kickActive || this.kickElapsed > KICK_DURATION) return;
    const foot = this.getFootPoint();
    const perfect = this.kickElapsed >= PERFECT_START && this.kickElapsed <= PERFECT_END;
    const descending = this.kickElapsed > PERFECT_END;
    const color = perfect ? 0x5ee7f0 : descending ? 0x7f9aab : 0xf1bd4a;
    graphics.fillStyle(color, perfect ? 0.12 : 0.06).fillCircle(foot.x, foot.y, KICK_RADIUS);
    graphics.lineStyle(perfect ? 5 : 3, color, perfect ? 1 : descending ? 0.35 : 0.72);
    graphics.strokeCircle(foot.x, foot.y, KICK_RADIUS);
    graphics.lineStyle(2, color, perfect ? 0.95 : 0.55);
    graphics.lineBetween(foot.x - 13, foot.y, foot.x + 13, foot.y);
    graphics.lineBetween(foot.x, foot.y - 13, foot.x, foot.y + 13);
    graphics.fillStyle(color, 1).fillCircle(foot.x, foot.y, perfect ? 7 : 5);
  }

  private drawWeather(): void {
    const graphics = this.weatherGraphics.clear();
    if (!hasRain(this.environment.weather)) return;
    graphics.lineStyle(2, 0x5bbbc8, 0.22);
    for (let index = 0; index < 28; index += 1) {
      const x = 110 + ((index * 173) % (GAME_WIDTH - 220));
      const y = 145 + ((index * 97 + Math.floor(this.stageTime * 50)) % 560);
      graphics.lineBetween(x, y, x - 12, y + 34);
    }
  }

  private drawFlies(): void {
    const graphics = this.flyGraphics.clear();
    for (const fly of this.flies) {
      graphics.fillStyle(0x2a2119, 0.94).fillCircle(fly.x, fly.y, 12);
      graphics.fillStyle(0xd9eef0, 0.68).fillEllipse(fly.x - 12, fly.y - 6, 18, 11);
      graphics.fillEllipse(fly.x + 12, fly.y - 6, 18, 11);
      graphics.fillStyle(0x0f1512, 0.9).fillCircle(fly.x + Math.sign(fly.velocity) * 7, fly.y - 1, 5);
    }
  }

  private updateHud(): void {
    this.scoreText.setText(this.scoreState.score.toString());
    this.comboText.setText(`× ${this.scoreState.combo}`);
    this.livesText.setText(
      DISABLE_LIFE_LOSS_FOR_PLAYTEST ? '∞' : '♥'.repeat(Math.max(0, this.lives)),
    );
    this.stageText.setText(`${this.stage} / 10`);
    this.targetText.setText(`${this.stageSuccesses} / ${STAGE_TARGETS[this.stage - 1]}`);
    this.timerText.setText(`${Math.ceil(this.stageTime).toString().padStart(2, '0')}초`)
      .setColor(this.stageTime <= 5 && this.stageStarted ? '#ef5b4c' : '#f7e9c8');
    this.muteText.setText(this.muted ? '🔇' : '🔊');
    const weatherLabel = hasWind(this.environment.weather)
      ? (this.environment.windDirection < 0 ? '← 바람' : '바람 →')
      : '';
    this.weatherText.setText(weatherLabel).setVisible(weatherLabel.length > 0);
    this.perfectBoostText
      .setText(`복주머니 PERFECT  ${this.perfectBoostRemaining.toFixed(1)}초`)
      .setVisible(this.perfectBoostRemaining > 0);

    if (this.state === 'held' && !this.stageStarted) {
      this.heldPrompt.setText('SPACE로 제기를 서브하세요').setVisible(true);
    } else if (this.state === 'held') {
      const remaining = Math.max(0, Math.ceil(HOLD_PENALTY_SECONDS - this.holdTime));
      this.heldPrompt.setText(
        DISABLE_LIFE_LOSS_FOR_PLAYTEST
          ? `SPACE로 재개  ·  테스트 모드 LIFE 유지 (${remaining}초)`
          : `SPACE로 재개  ·  ${remaining}초 후 LIFE -1`,
      ).setVisible(true);
    } else {
      this.heldPrompt.setVisible(false);
    }
  }

  private saveRecords(): void {
    const bestScore = this.readNumber('jegijegi.bestScore');
    const maxCombo = this.readNumber('jegijegi.maxCombo');
    if (this.scoreState.score > bestScore) localStorage.setItem('jegijegi.bestScore', String(this.scoreState.score));
    if (this.scoreState.maxCombo > maxCombo) localStorage.setItem('jegijegi.maxCombo', String(this.scoreState.maxCombo));
  }

  private saveStageRecord(): void {
    const key = `jegijegi.stage.${this.stage}.kicks`;
    if (this.stageSuccesses > this.readNumber(key)) localStorage.setItem(key, String(this.stageSuccesses));
  }

  private readNumber(key: string): number {
    const value = Number.parseInt(localStorage.getItem(key) ?? '0', 10);
    return Number.isFinite(value) ? value : 0;
  }

  private getVisibleHorizontalBounds(padding: number): { min: number; max: number } {
    const view = this.cameras.main.worldView;
    if (view.width <= 0) return { min: padding, max: GAME_WIDTH - padding };
    return { min: view.left + padding, max: view.right - padding };
  }

  private pauseFromEnvironment = (): void => {
    if (this.externalPaused) return;
    this.externalPaused = true;
    this.inputManager.reset();
    const showPauseMessage = this.state !== 'stage-result' && this.state !== 'ended';
    this.pauseShade.setVisible(showPauseMessage);
    this.pauseText.setVisible(showPauseMessage);
  };

  private resumeFromEnvironment = (): void => {
    if (document.hidden) return;
    this.externalPaused = false;
    this.inputManager.reset();
    this.pauseShade.setVisible(false);
    this.pauseText.setVisible(false);
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) this.pauseFromEnvironment();
    else this.resumeFromEnvironment();
  };

  private cleanup(): void {
    this.input.keyboard?.off('keydown', this.handleGlobalKey, this);
    window.removeEventListener('blur', this.pauseFromEnvironment);
    window.removeEventListener('focus', this.resumeFromEnvironment);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}
