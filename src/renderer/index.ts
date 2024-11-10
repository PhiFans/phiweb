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

export class GameRenderer {
  renderer!: Renderer;
  readonly stage: Container;
  readonly ticker: Ticker;
  readonly containers: {
    ui: Container,
    game: Container,
  };

  readonly _stageRectangle = new Rectangle(0, 0, 0, 0);

  constructor() {
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

    this.containers.game.sortableChildren = this.containers.ui.sortableChildren = true;
    this.containers.game.boundsArea = this.containers.ui.boundsArea = this._stageRectangle;

    this.containers.game.interactive = this.containers.game.interactiveChildren = false;
    this.containers.game.cullableChildren = true;
    this.containers.game.cullArea = this._stageRectangle;
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

    this._stageRectangle.width = width * resolution;
    this._stageRectangle.height = height * resolution;
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
