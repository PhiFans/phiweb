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
  speed: number;
  posX: number;
  /** Wether if another note have the same time to this note. */
  isSameTime: boolean;
  floorPosition: number;
  /** The time length of hold. */
  holdTime: Nullable<number>;
  /** The floor position length of hold time length */
  holdLength: Nullable<number>;

  isFake?: boolean,
  scaleX?: number,
  visibleTime?: number,
}

export type TNoteRaw = Readonly<Omit<IGameChartNote, 'judgeline' | 'isSameTime' | 'floorPosition'>>;

const getNoteSkinTexture = (skin: GameSkin, type: string, useHighQuality = true, useHighlight = true) => {
  const { playfields } = skin;
  const targetTextures = playfields.filter((e) => e.type === 'note' && e.id === type);
  return targetTextures.find((e) => e.isHighQuality === useHighQuality && e.isHighlight === useHighlight)!.texture!;
};

export class GameChartNote {
  readonly raw: TNoteRaw;

  readonly judgeline: GameChartJudgeLine;
  readonly type: EGameChartNoteType;
  readonly isAbove: boolean;
  readonly time: number;
  readonly speed: number;
  /** Wether if another note have the same time to this note. */
  readonly isSameTime: boolean;
  readonly floorPosition: number;
  readonly posX: number;

  // Hold props
  /** The time length of hold. */
  readonly holdTime: Nullable<number>;
  /** The end time of hold. */
  readonly holdEndTime: Nullable<number>;
  /** The floor position length of hold time length */
  readonly holdLength: Nullable<number>;
  /** The end floor position of hold end time */
  readonly holdFloorPosition: Nullable<number>;

  // Extra props
  /** Wether this note comes from official chart, used for hold length calculation. */
  readonly isOfficial: boolean;
  readonly isFake: boolean;
  readonly scaleX: number;
  readonly visibleTime: number;

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
    isHoldScored: false,
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

    // Hold props
    holdTime: Nullable<number>,
    holdLength: Nullable<number>,

    // Extra props
    isOfficial: boolean = false,
    isFake: boolean = false,
    scaleX: number = 1,
    visibleTime: number = -Infinity
  ) {
    this.judgeline = judgeline;
    this.type = type;
    this.isAbove = isAbove;
    this.time = time;
    this.speed = speed;
    this.posX = posX;
    this.isSameTime = isSameTime;
    this.floorPosition = floorPosition;

    this.holdTime = holdTime;
    this.holdEndTime = this.type === EGameChartNoteType.HOLD ? this.time + this.holdTime! : null;
    this.holdLength = holdLength;
    this.holdFloorPosition = this.type === EGameChartNoteType.HOLD ? this.floorPosition + this.holdLength! : null;

    this.isOfficial = isOfficial;
    this.isFake = isFake;
    this.scaleX = scaleX;
    this.visibleTime = visibleTime;

    // Save to raw
    this.raw = Object.freeze<TNoteRaw>({
      type: this.type,
      isAbove: this.isAbove,
      time: this.time,
      speed: this.speed,
      posX: this.posX,
      holdTime: this.holdTime,
      holdLength: this.holdLength,
    });
  }

  createSprite(game: Game, skin: GameSkin, zIndex: number = 24) {
    if (!skin) throw new Error('No skin set, please set a skin');

    if (this.type === EGameChartNoteType.HOLD) this.createSpriteHold(game, skin);
    else this.createSpriteNonHold(game, skin);

    this.sprite!.zIndex = zIndex;
    this.sprite!.label = 'Note';
  }

  reset() {
    this.realLinePosX = 0;
    this.realLinePosY = 0;

    this.realPosX = 0;
    this.realPosY = 0;

    this.realHoldEndPosX = 0;
    this.realHoldEndPosY = 0;

    this.score.isScored = false;
    this.score.isHoldScored = false;
    this.score.isScoreAnimated = false;
    this.score.score = EGameScoreJudgeType.UNSCORED;
    this.score.timeBetween = 0;
    this.score.isHolding = false;
    this.score.animationTime = null;

    if (this.sprite && this.type === EGameChartNoteType.HOLD) {
      const holdLength = (this.isOfficial ? this.holdTime! * 0.0006 : this.holdLength!) * this.speed;

      this.sprite.children[0].visible = true;
      this.sprite.children[1].scale.y = 1;
      this.sprite.children[1].height = holdLength;
      this.sprite.children[2].position.y = -holdLength;
    }
  }

  private createSpriteNonHold(game: Game, skin: GameSkin) {
    const getSpriteTexture = () => {
      const { useHighlight, useHighQualitySkin } = game.options;
      const { isSameTime } = this;

      if (this.type === EGameChartNoteType.TAP) return getNoteSkinTexture(skin, 'tap', useHighQualitySkin, useHighlight && isSameTime);
      if (this.type === EGameChartNoteType.DRAG) return getNoteSkinTexture(skin, 'drag', useHighQualitySkin, useHighlight && isSameTime);
      if (this.type === EGameChartNoteType.FLICK) return getNoteSkinTexture(skin, 'flick', useHighQualitySkin, useHighlight && isSameTime);
    };

    const sprite = new Sprite(getSpriteTexture());

    sprite.anchor.set(0.5);
    this.sprite = sprite;
  }

  private createSpriteHold(game: Game, skin: GameSkin) {
    const { useHighlight, useHighQualitySkin } = game.options;
    const { isSameTime } = this;

    const baseContainer = new Container();
    const spriteHead = new Sprite(getNoteSkinTexture(skin, 'hold-head', useHighQualitySkin, useHighlight && isSameTime));
    const spriteBody = new Sprite(getNoteSkinTexture(skin, 'hold-body', useHighQualitySkin, useHighlight && isSameTime));
    const spriteEnd = new Sprite(getNoteSkinTexture(skin, 'hold-end', useHighQualitySkin, false));

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
