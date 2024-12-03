import { Game } from '@/game';

type TGameScoreInputType = 'touch' | 'mouse' | 'keyboard';

export class GameChartScoreInput {
  readonly type: TGameScoreInputType;
  readonly id: number | string;

  x: number;
  y: number;

  isTapped: boolean = false;
  isMoving: boolean = false;

  // Used for calculating flicks
  lastDeltaX: number = 0;
  lastDeltaY: number = 0;
  deltaX: number = 0;
  deltaY: number = 0;
  currentTime: number = performance.now();
  deltaTime: number = 0;
  /** Wether this input can be used for flicking */
  isFlickable: boolean = false;
  /** Wether this input are used for flicking */
  isFlicked: boolean = false;

  constructor(type: TGameScoreInputType, id: number | string, x: number, y: number) {
    this.type = type;
    this.id = id;
    this.x = x;
    this.y = y;
  }

  move(x: number, y: number) {
    if (this.type === 'keyboard') return;

    this.lastDeltaX = this.deltaX;
    this.lastDeltaY = this.deltaY;
    this.deltaX = x - this.x;
    this.deltaY = y - this.y;
    this.x = x;
    this.y = y;

    const currentTime = performance.now();
    this.deltaTime = currentTime - this.currentTime;
    this.currentTime = currentTime;

    this.isMoving = true;

    const flickSpeed = (this.deltaX * this.lastDeltaX + this.deltaY * this.lastDeltaY) / Math.sqrt(this.lastDeltaX ** 2 + this.lastDeltaY ** 2) / this.deltaTime;
    if (this.isFlickable && flickSpeed < 0.5) {
      this.isFlickable = false;
      this.isFlicked = false;
    } else if (!this.isFlickable && flickSpeed > 1) this.isFlickable = true;
  }
}

export class GameChartScoreInputs extends Array<GameChartScoreInput> {
  readonly canvas: HTMLCanvasElement;

  constructor(game: Game) {
    super();

    this.canvas = game.renderer.renderer.canvas;
  }

  private add(type: TGameScoreInputType, id: number | string, x: number, y: number) {
    this.remove(type, id);
    this.push(new GameChartScoreInput(
      type, id,
      type !== 'keyboard' ? x : NaN, type !== 'keyboard' ? y : NaN
    ));
  }

  private move(type: TGameScoreInputType, id: number | string, x: number, y: number) {
    const input = this.find(e => e.type === type && e.id === id);
    if (input) input.move(x, y);
  }

  private remove(type: TGameScoreInputType, id: number | string) {
    const oldInput = this.findIndex(e => e.type === type && e.id === id);
    if (oldInput !== -1) this.splice(oldInput, 1);
  }

  private init() {
    const passive = { passive: false };
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), passive);
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), passive);
    this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    this.canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e));
  }

  private onTouchStart(e: TouchEvent) {
    e.preventDefault();


  }

  private onTouchMove(e: TouchEvent) {
    e.preventDefault();

  }

  private onTouchEnd(e: TouchEvent) {
    e.preventDefault();

  }
}
