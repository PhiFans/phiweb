import { Container, Sprite } from 'pixi.js';
import { Nullable } from '@/utils/types';
import { GameChartJudgeLine } from './judgeline';
import { Game } from '@/game';

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

  createSprite(container: Container, game: Game, zIndex: number = 24) {
    if (this.type === EGameChartNoteType.HOLD) this.createSpriteHold(game, zIndex);
    else this.createSpriteNonHold(game, zIndex);

    this.sprite!.label = 'Note';
    return container.addChild(this.sprite!);
  }

  private createSpriteNonHold(game: Game, zIndex: number = 24) {
    const getSpriteTexture = () => {
      const { currentSkin } = game.skins;
      if (!currentSkin) throw new Error('No skin set, please set a skin');
      const { useHighQualitySkin } = game.options;
      const quality = useHighQualitySkin && currentSkin.high ? 'high' : 'normal';

      // TODO: Note highligh
      if (this.type === EGameChartNoteType.TAP) return currentSkin[quality]!.notes.tap.normal.texture!;
      if (this.type === EGameChartNoteType.DRAG) return currentSkin[quality]!.notes.drag.normal.texture!;
      if (this.type === EGameChartNoteType.FLICK) return currentSkin[quality]!.notes.flick.normal.texture!;
    };

    const sprite = new Sprite(getSpriteTexture());

    sprite.anchor.set(0.5);
    sprite.zIndex = zIndex;
    sprite.cullable = true;

    this.sprite = sprite;
  }

  private createSpriteHold(game: Game, zIndex: number = 24) {
    const { currentSkin } = game.skins;
    if (!currentSkin) throw new Error('No skin set, please set a skin');
    const { useHighQualitySkin } = game.options;
    const quality = useHighQualitySkin && currentSkin.high ? 'high' : 'normal';

    const baseContainer = new Container();
    const spriteHead = new Sprite(currentSkin[quality]!.notes.hold.head.normal.texture!); // TODO: Note highligh
    const spriteBody = new Sprite(currentSkin[quality]!.notes.hold.body.normal.texture!); // TODO: Note highligh
    const spriteEnd = new Sprite(currentSkin[quality]!.notes.hold.end.texture!); // TODO: Note highligh

    spriteHead.anchor.set(0.5, 0);
    spriteBody.anchor.set(0.5, 1);
    spriteEnd.anchor.set(0.5, 1);

    spriteBody.zIndex = 1;
    spriteEnd.zIndex = 2;

    baseContainer.addChild(spriteHead, spriteBody, spriteEnd);
    baseContainer.sortChildren();

    baseContainer.zIndex = zIndex;
    baseContainer.cullable = true;

    this.sprite = baseContainer;
  }
}
