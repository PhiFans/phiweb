import { Container, Sprite, Texture } from 'pixi.js';
import { Nullable } from '@/utils/types';
import { GameChartJudgeLine } from './judgeline';

export enum EGameChartNoteType {
  TAP = 1,
  DRAG = 2,
  HOLD = 3,
  FLICK = 4,
}

export class GameChartNote {
  readonly judgeline: GameChartJudgeLine;
  readonly type: EGameChartNoteType;
  readonly isAbove: boolean;
  readonly time: number;
  /**
   * The time length of hold.
   */
  readonly holdTime: Nullable<number>;
  /**
   * The end time of hold.
   */
  readonly holdEndTime: Nullable<number>;
  readonly speed: number;
  readonly floorPosition: number;
  /**
   * The floor position length of hold time length
   */
  readonly holdLength: Nullable<number>;
  /**
   * The end floor position of hold end time
   */
  readonly holdFloorPosition: Nullable<number>;
  readonly posX: number;

  sprite?: Sprite | Container;

  constructor(
    judgeline: GameChartJudgeLine,
    type: EGameChartNoteType,
    isAbove: boolean,
    time: number,
    speed: number,
    posX: number,
    floorPosition: number,
    holdTime: Nullable<number>,
    holdLength: Nullable<number>
  ) {
    this.judgeline = judgeline;
    this.type = type;
    this.isAbove = isAbove;
    this.time = time;
    this.holdTime = holdTime;
    this.speed = speed;
    this.posX = posX;
    this.floorPosition = floorPosition;
    this.holdEndTime = this.type === EGameChartNoteType.HOLD ? this.time + this.holdTime! : null;
    this.holdLength = holdLength;
    this.holdFloorPosition = this.type === EGameChartNoteType.HOLD ? this.floorPosition + this.holdLength! : null;
  }

  createSprite(container: Container, zIndex: number = 24) {
    // TODO: Skin loader
    const sprite = new Sprite(Texture.WHITE);

    sprite.anchor.set(0.5);

    if (this.type !== EGameChartNoteType.HOLD) {
      // TODO: Skin loader
      if (this.type === EGameChartNoteType.TAP) sprite.tint = 0x0AC2FF;
      if (this.type === EGameChartNoteType.DRAG) sprite.tint = 0xFFE600;
      if (this.type === EGameChartNoteType.FLICK) sprite.tint = 0xFE4343;

      sprite.zIndex = zIndex;
      sprite.cullable = true;

      this.sprite = sprite;
      return container.addChild(this.sprite);
    }

    const baseContainer = new Container();
    const spriteBody = new Sprite(Texture.WHITE);

    sprite.anchor.set(0.5, 0);
    spriteBody.anchor.set(0.5, 1);

    sprite.tint = spriteBody.tint = 0x0AC2FF;
    spriteBody.zIndex = 1;

    baseContainer.addChild(sprite, spriteBody);
    baseContainer.sortChildren();

    baseContainer.zIndex = zIndex;
    baseContainer.cullable = true;

    this.sprite = baseContainer;
    return container.addChild(this.sprite);
  }
}
