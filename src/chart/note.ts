import { Container, Sprite } from 'pixi.js';
import { Nullable } from '@/utils/types';
import { GameChartJudgeLine } from './judgeline';
import { Game } from '@/game';
import { IGameScoreNote, EGameScoreJudgeType } from '@/score/types';
import { GameSkin } from '@/skins';

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

const getNoteSkinTexture = (skin: GameSkin, type: string, useHighQuality = true, useHighlight = true) => {
  const { playfields } = skin;
  const targetTextures = playfields.filter((e) => e.type === 'note' && e.id === type);
  return targetTextures.find((e) => e.isHighQuality === useHighQuality && e.isHighlight === useHighlight)!.texture!;
};

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

  /** The real note position when on line. Only be used & calculaed when ticking */
  realLinePosX: number = 0;
  /** The real note position when on line. Only be used & calculaed when ticking */
  realLinePosY: number = 0;

  /** The real note position. Only be used & calculaed when ticking */
  realPosX: number = 0;
  /** The real note position. Only be used & calculaed when ticking */
  realPosY: number = 0;

  /** The real hold end position. Only be used & calculaed when ticking */
  realHoldEndPosX: number = 0;
  /** The real hold end position. Only be used & calculaed when ticking */
  realHoldEndPosY: number = 0;

  /**
   * The score detail of the note
   */
  readonly score: IGameScoreNote = {
    isScored: false,
    isScoreAnimated: false,
    score: EGameScoreJudgeType.UNSCORED,
    timeBetween: 0,
    isHolding: false,
    animationTime: null
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

  createSprite(game: Game, skin: GameSkin, zIndex: number = 24) {
    if (!skin) throw new Error('No skin set, please set a skin');

    if (this.type === EGameChartNoteType.HOLD) this.createSpriteHold(game, skin);
    else this.createSpriteNonHold(game, skin);

    this.sprite!.zIndex = zIndex;
    this.sprite!.label = 'Note';
  }

  private createSpriteNonHold(game: Game, skin: GameSkin) {
    const getSpriteTexture = () => {
      const { useHighlight, useHighQualitySkin } = game.options;

      if (this.type === EGameChartNoteType.TAP) return getNoteSkinTexture(skin, 'tap', useHighlight, useHighQualitySkin);
      if (this.type === EGameChartNoteType.DRAG) return getNoteSkinTexture(skin, 'drag', useHighlight, useHighQualitySkin);
      if (this.type === EGameChartNoteType.FLICK) return getNoteSkinTexture(skin, 'flick', useHighlight, useHighQualitySkin);
    };

    const sprite = new Sprite(getSpriteTexture());

    sprite.anchor.set(0.5);
    this.sprite = sprite;
  }

  private createSpriteHold(game: Game, skin: GameSkin) {
    const { useHighlight, useHighQualitySkin } = game.options;

    const baseContainer = new Container();
    const spriteHead = new Sprite(getNoteSkinTexture(skin, 'hold-head', useHighlight, useHighQualitySkin));
    const spriteBody = new Sprite(getNoteSkinTexture(skin, 'hold-body', useHighlight, useHighQualitySkin));
    const spriteEnd = new Sprite(getNoteSkinTexture(skin, 'hold-end', false, useHighQualitySkin));

    spriteHead.anchor.set(0.5, 0);
    spriteBody.anchor.set(0.5, 1);
    spriteEnd.anchor.set(0.5, 1);

    spriteBody.zIndex = 1;
    spriteEnd.zIndex = 2;

    baseContainer.addChild(spriteHead, spriteBody, spriteEnd);
    baseContainer.sortChildren();

    this.sprite = baseContainer;
  }
}
