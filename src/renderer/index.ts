import { Game } from '@/game';
import { autoDetectRenderer, isWebGPUSupported, Container, Ticker, Rectangle, Graphics } from 'pixi.js';
import type { Renderer, AutoDetectOptions } from 'pixi.js';

const DefaultRendererOptions: Partial<AutoDetectOptions> = {
  preference: 'webgpu',
  antialias: true,
  autoDensity: true,
  backgroundColor: 0xffffff,
  resolution: window.devicePixelRatio,
  width: document.documentElement.clientWidth,
  height: document.documentElement.clientHeight,
  hello: true,
};
export let isWebGPUAvailable: boolean = false;
isWebGPUSupported().then((result) => isWebGPUAvailable = result);

const CreateContainerMask = (x: number, y: number, width: number, height: number) => {
  return new Graphics()
    .rect(x, y, width, height)
    .fill(0xFFFFFF);
};

export interface IGameRendererSize {
  width: number,
  height: number,
  widthHalf: number,
  heightHalf: number,
  /** The real width of the screen */
  widthReal: number,
  /** The real half width of the screen */
  widthRealHalf: number,
  /** `widthRealHalf - widthHalf` */
  widthOffset: number,
  widthPercent: number,
  /** Used for culling notes */
  widthHalfBorder: number,
  /** Used for culling notes */
  heightHalfBorder: number,

  noteScale: number,
  noteWidth: number,
  noteSpeed: number,

  hitParticleScale: number,

  lineScale: number,
  heightPercent: number,
}

export class GameRenderer {
  readonly game: Game;
  renderer!: Renderer;
  readonly stage: Container;
  readonly ticker: Ticker;
  readonly containers: {
    ui: Container,
    game: Container,
  };

  readonly size: IGameRendererSize = {
    width: 0,
    height: 0,
    widthHalf: 0,
    heightHalf: 0,
    widthReal: 0,
    widthRealHalf: 0,
    widthOffset: 0,
    widthPercent: 0,
    widthHalfBorder: 0,
    heightHalfBorder: 0,

    noteScale: 0,
    noteWidth: 0,
    noteSpeed: 0,

    hitParticleScale: 0,

    lineScale: 0,
    heightPercent: 1,
  };

  readonly _stageRectangle = new Rectangle(0, 0, 0, 0);
  readonly _stageRectangleGame = new Rectangle(0, 0, 0, 0);

  constructor(game: Game) {
    this.game = game;
    this.stage = new Container;
    this.stage.label = 'Stage';
    this.stage.sortableChildren = true;
    this.stage.boundsArea = this._stageRectangle;

    this.containers = {
      ui: new Container,
      game: new Container,
    };

    this.containers.game.label = 'Game container';
    this.containers.ui.label = 'UI container';

    this.containers.ui.boundsArea = this._stageRectangle;

    this.containers.game.sortableChildren = this.containers.ui.sortableChildren = true;
    this.containers.game.interactive = this.containers.game.interactiveChildren = false;
    this.containers.game.cullableChildren = false;
    this.containers.game.boundsArea = this._stageRectangleGame;
    this.containers.ui.zIndex = 10;

    this.stage.addChild(this.containers.game);
    this.stage.addChild(this.containers.ui);

    this.ticker = Ticker.shared;
  }

  init(options: Partial<AutoDetectOptions> = {}) {
    const newInitOptions = { ...DefaultRendererOptions, ...options };

    return new Promise<void>((res, rej) => {
      autoDetectRenderer(newInitOptions)
        .then((renderer) => {
          this.renderer = renderer;

          this.ticker.start();
          this.ticker.add(() => {
            this.renderer.render(this.stage);
          });

          // Prevent right-click menu on canvas
          this.renderer.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

          this.resize(
            newInitOptions.width || document.documentElement.clientWidth,
            newInitOptions.height || document.documentElement.clientHeight,
            newInitOptions.resolution || window.devicePixelRatio
          );
          res();
        }).catch((e) => {
          rej(e);
        });
    });
  }

  resize(width: number, height: number, resolution: number = window.devicePixelRatio) {
    this.renderer.resize(width, height, resolution);

    const { size, containers } = this;

    size.widthReal = width;
    size.height = height;

    size.widthRealHalf = size.widthReal / 2;
    size.heightHalf = size.height / 2;

    // TODO: Made as an option?
    size.width = size.height / 9 * 16 >= size.widthReal ? size.widthReal : size.height / 9 * 16;
    size.widthHalf = size.width / 2;
    size.widthOffset = size.widthRealHalf - size.widthHalf;

    size.widthHalfBorder = size.widthHalf * 1.2;
    size.heightHalfBorder = size.heightHalf * 1.2;

    size.widthPercent = size.width * (9 / 160);

    size.noteScale = size.width / 8080 * (this.game.options.useHighQualitySkin ? 1 : 2); // TODO: Settings
    size.noteWidth = size.width * 0.117775;
    size.noteSpeed = size.height * 0.6;

    size.hitParticleScale = size.noteScale * 6;

    size.lineScale = size.width > size.height * 0.75 ? size.height / 18.75 : size.width / 14.0625;
    size.heightPercent = size.height / 1080;

    // this._stageRectangle.width = width * resolution;
    // this._stageRectangle.height = height * resolution;

    // this.stage.boundsArea = this._stageRectangle;
    // this.containers.ui.boundsArea = this._stageRectangle;

    // this._stageRectangleGame.x = 1 - (width * resolution) / 2;
    // this._stageRectangleGame.y = 1 - (height * resolution) / 2;
    // this._stageRectangleGame.width = (width * resolution);
    // this._stageRectangleGame.height = (height * resolution);

    // this.containers.game.boundsArea = this._stageRectangleGame;
    // this.containers.game.cullArea = this._stageRectangleGame;

    containers.game.position.set(this.size.widthHalf, this.size.heightHalf);
    if (size.widthOffset <= 0) containers.game.mask = null;
    else containers.game.mask = CreateContainerMask(size.widthOffset, 0, size.width, size.height);
  }

  get canvas() {
    return this.renderer.canvas;
  }

  get width() {
    return this.renderer.width;
  }

  get height() {
    return this.renderer.height;
  }
}
