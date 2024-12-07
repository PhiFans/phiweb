import { Game } from '@/game';
import { IGameRendererSize } from '@/renderer';

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

export class GameChartScoreInputs {
  private readonly canvas: HTMLCanvasElement;
  private size: IGameRendererSize;
  readonly list: GameChartScoreInput[] = [];

  constructor(game: Game) {
    this.canvas = game.renderer.renderer.canvas;
    this.size = game.renderer.size;

    this.init();
  }

  resize(size: IGameRendererSize) {
    this.size = size;
  }

  private add(type: TGameScoreInputType, id: number | string, x: number, y: number) {
    const { list, size } = this;
    this.remove(type, id);
    list.push(new GameChartScoreInput(
      type, id,
      type !== 'keyboard' ? (x - size.widthHalf) : NaN, type !== 'keyboard' ? (y - size.heightHalf) : NaN
    ));
  }

  private move(type: TGameScoreInputType, id: number | string, x: number, y: number) {
    const { list, size } = this;
    const input = list.find(e => e.type === type && e.id === id);
    if (input) input.move(x - size.widthHalf, y - size.heightHalf);
  }

  private remove(type: TGameScoreInputType, id: number | string) {
    const { list } = this;
    const oldInput = list.findIndex(e => e.type === type && e.id === id);
    if (oldInput !== -1) list.splice(oldInput, 1);
  }

  private init() {
    // Touchscreen
    const { canvas } = this;
    const passive = { passive: false };
    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), passive);
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), passive);
    canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e));

    // Mouse
    canvas.addEventListener('mousedown', (e) => this.onMouseStart(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', (e) => this.onMouseEnd(e));
    canvas.addEventListener('mouseout', (e) => this.onMouseEnd(e));

    // TODO: Keyboard support
  }

  private onTouchStart(e: TouchEvent) {
    e.preventDefault();

    for (const i of e.changedTouches) {
      const { clientX, clientY, identifier } = i;
      this.add('touch', identifier, clientX, clientY);
    }
  }

  private onTouchMove(e: TouchEvent) {
    e.preventDefault();

    for (const i of e.changedTouches) {
      const { clientX, clientY, identifier } = i;
      this.move('touch', identifier, clientX, clientY);
    }
  }

  private onTouchEnd(e: TouchEvent) {
    e.preventDefault();

    for (const i of e.changedTouches) {
      const { identifier } = i;
      this.remove('touch', identifier);
    }
  }

  private onMouseStart(e: MouseEvent) {
    e.preventDefault();
    const { clientX, clientY, button } = e;
    this.add('mouse', button, clientX, clientY);
  }

  private onMouseMove(e: MouseEvent) {
    const { clientX, clientY, button } = e;
    if (!clientX && !clientY) return;
    this.move('mouse', button, clientX, clientY);
  }

  private onMouseEnd(e: MouseEvent) {
    const { button } = e;
    this.remove('mouse', button);
  }
}
