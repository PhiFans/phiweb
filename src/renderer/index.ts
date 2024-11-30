import { Game } from '@/game';
import { autoDetectRenderer, isWebGPUSupported, Container, Ticker, Rectangle } from 'pixi.js';
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

export interface IGameRendererSize {
  width: number,
  height: number,
  widthHalf: number,
  heightHalf: number,
  widthPercent: number,

  noteScale: number,
  noteWidth: number,
  noteSpeed: number,

  lineScale: number,
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
    widthPercent: 0,

    noteScale: 0,
    noteWidth: 0,
    noteSpeed: 0,

    lineScale: 0,
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
    this.containers.game.cullableChildren = true;
    this.containers.game.cullArea = this.containers.game.boundsArea = this._stageRectangleGame;
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

    this.size.width = width;
    this.size.height = height;

    this.size.widthHalf = this.size.width / 2;
    this.size.heightHalf = this.size.height / 2;

    this.size.widthPercent = this.size.width * (9 / 160);

    this.size.noteScale = this.size.width / 8000 * (this.game.options.useHighQualitySkin ? 1 : 2); // TODO: Settings
    this.size.noteWidth = this.size.width * 0.117775;
    this.size.noteSpeed = this.size.height * 0.6;

    this.size.lineScale = this.size.width > this.size.height * 0.75 ? this.size.height / 18.75 : this.size.width / 14.0625;

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

    this.containers.game.position.set(this.size.widthHalf, this.size.heightHalf);
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
