import { Container, Sprite, Texture } from 'pixi.js';
import { ArrayIndexed } from '@/utils/class';
import { GameChartEventSingle } from './event';
import { GameChartEventLayer } from './eventlayer';
import { Nullable } from '@/utils/types';

export class GameChartJudgeLine {
  readonly eventLayers: Array<GameChartEventLayer> = new Array();
  readonly floorPositions: ArrayIndexed<GameChartEventSingle> = new ArrayIndexed();
  readonly isCover: boolean;
  readonly parentID: Nullable<number>;

  parent: Nullable<GameChartJudgeLine> = null;

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

  constructor(isCover: boolean = true, parentID: Nullable<number> = null) {
    this.isCover = isCover;
    this.parentID = parentID;
  }

  createSprites(container: Container, zIndex: number = 0) {
    if (!this.sprite) this.sprite = new Sprite(Texture.WHITE); // TODO: Skin loader

    this.sprite.width = 1920;
    this.sprite.height = 3;
    this.sprite.anchor.set(0.5);

    this.sprite.cullable = true;
    this.sprite.zIndex = zIndex;

    this.sprite.label = `JudgeLine ${zIndex}`;
    container.addChild(this.sprite);
  }

  reset() {
    for (const eventlayer of this.eventLayers) eventlayer.reset();
    this.floorPositions.reset();

    this.speed = 0;
    this.posX = 0;
    this.posY = 0;
    this.angle = 0;
    this.alpha = 0;
    this.floorPosition = 0;

    this.radian = 0;
    this.cosr = 0;
    this.sinr = 0;

    this.realPosX = 0;
    this.realPosY = 0;
  }
}
