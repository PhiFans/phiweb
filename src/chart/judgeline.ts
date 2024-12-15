import { Container, Sprite, Texture } from 'pixi.js';
import { ArrayIndexed } from '@/utils/class';
import { GameChartEventSingle } from './event';
import { GameChartEventLayer } from './eventlayer';

export class GameChartJudgeLine {
  readonly eventLayers: Array<GameChartEventLayer> = new Array();
  readonly floorPositions: ArrayIndexed<GameChartEventSingle> = new ArrayIndexed();

  speed: number = 0;
  posX: number = 0;
  posY: number = 0;
  angle: number = 0;
  alpha: number = 0;
  floorPosition: number = 0;

  radian: number = 0;
  cosr: number = 0;
  sinr: number = 0;

  realPosX: number = 0;
  realPosY: number = 0;

  sprite?: Sprite;

  createSprites(container: Container) {
    if (!this.sprite) this.sprite = new Sprite(Texture.WHITE); // TODO: Skin loader

    this.sprite.width = 1920;
    this.sprite.height = 3;
    this.sprite.anchor.set(0.5);

    this.sprite.cullable = true;

    this.sprite.label = 'JudgeLine';
    container.addChild(this.sprite);
  }
}
