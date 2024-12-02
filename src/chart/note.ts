import { Container, Sprite } from 'pixi.js';
import { Nullable } from '@/utils/types';
import { GameChartJudgeLine } from './judgeline';
import { Game } from '@/game';
import { IGameChartScoreNote, EGameChartScoreJudgeType } from './score/types';

export enum EGameChartNoteType {
  TAP = 1,
  DRAG = 2,
  HOLD = 3,
  FLICK = 4,
}

export interface IGameChartNote {
  judgeline: GameChartJudgeLine;
  type: EGameChartNoteType;
  isAbove: boolean;
  time: number;
  /**
   * The time length of hold.
   */
  holdTime: Nullable<number>;
  speed: number;
  /**
   * Wether if another note have the same time to this note.
   */
  isSameTime: boolean;
  floorPosition: number;
  /**
   * The floor position length of hold time length
   */
  holdLength: Nullable<number>;
  posX: number;
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
  /**
   * Wether if another note have the same time to this note.
   */
  readonly isSameTime: boolean;
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

  /**
   * The score detail of the note
   */
  readonly score: IGameChartScoreNote = {
    isScored: false,
    isScoreAnimated: false,
    score: EGameChartScoreJudgeType.UNSCORED,
    timeBetween: 0,
    isHolding: false,
    animationTime: NaN
  };

  sprite?: Sprite | Container;

  constructor(
    judgeline: GameChartJudgeLine,
    type: EGameChartNoteType,
    isAbove: boolean,
    time: number,
    speed: number,
    posX: number,
    isSameTime: boolean,
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
    this.isSameTime = isSameTime;
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
      const { useHighQualitySkin, useHighlight } = game.options;
      const quality = useHighQualitySkin && currentSkin.high ? 'high' : 'normal';
      const highlight = useHighlight && this.isSameTime ? 'highlight' : 'normal';

      if (this.type === EGameChartNoteType.TAP) return currentSkin[quality]!.notes.tap[highlight].texture!;
      if (this.type === EGameChartNoteType.DRAG) return currentSkin[quality]!.notes.drag[highlight].texture!;
      if (this.type === EGameChartNoteType.FLICK) return currentSkin[quality]!.notes.flick[highlight].texture!;
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
    const { useHighQualitySkin, useHighlight } = game.options;
    const quality = useHighQualitySkin && currentSkin.high ? 'high' : 'normal';
    const highlight = useHighlight && this.isSameTime ? 'highlight' : 'normal';

    const baseContainer = new Container();
    const spriteHead = new Sprite(currentSkin[quality]!.notes.hold.head[highlight].texture!);
    const spriteBody = new Sprite(currentSkin[quality]!.notes.hold.body[highlight].texture!);
    const spriteEnd = new Sprite(currentSkin[quality]!.notes.hold.end.texture!);

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


