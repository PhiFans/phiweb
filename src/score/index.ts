import { GameChart } from '../chart';
import { onScoreTick } from './tick';
import { GameAudioChannel } from '@/audio/channel';
import { EGameChartNoteType, GameChartNote } from '../chart/note';
import { EGameScoreJudgeType } from './types';
import { GameChartScoreInputs } from './inputs';
import { GameChartScoreJudge } from './judge';
import { IGameRendererSize } from '@/renderer';
import { IGameSkinHitsounds } from '@/skins/file/types';
import { AnimatedSprite, Container, Rectangle, Texture, Sprite } from 'pixi.js';
import { GameSkinFileTexture, GameSkinFileTextureAnimated } from '@/skins/file/texture';
import { GameSkinFiles } from '@/skins/file';

interface IGameScoreJudgeRange {
  readonly perfect: number,
  readonly good: number,
  readonly bad: number,
}

interface IGameScoreJudgeCount extends Array<number> {
  /** Perfect */
  3: number,
  /** Good */
  2: number,
  /** Bad */
  1: number,
  /** Miss */
  0: number,
}

const ScoreJudgeRanges: {
  readonly normal: IGameScoreJudgeRange,
  readonly challenge: IGameScoreJudgeRange
} = {
  normal: {
    perfect: 80,
    good: 160,
    bad: 180,
  },
  challenge: {
    perfect: 40,
    good: 75,
    bad: 90,
  }
};

class GameScoreHitParticle {
  readonly particleLength = 3;
  readonly time: number;
  readonly x: number;
  readonly y: number;
  readonly angle: number[] = [];
  readonly cosr: number[] = [];
  readonly sinr: number[] = [];
  readonly distance: number[] = [];
  readonly sprites: Sprite[] = [];
  isDestroyed = false;

  // TODO: Use `ParticleContainer` and `Particle`
  constructor(type: EGameScoreJudgeType, time: number, x: number, y: number, texture: Texture, container: Container) {
    this.time = time;
    this.x = x;
    this.y = y;

    const { particleLength, angle, cosr, sinr, distance, sprites } = this;
    let i = 0;
    while (i < particleLength) {
      const _angle = Math.random() * 2 * Math.PI;

      distance[i] = Math.random() * 80 + 185;
      angle[i] = _angle;
      cosr[i] = Math.cos(_angle);
      sinr[i] = Math.sin(_angle);

      sprites[i] = new Sprite({
        texture, x, y,
        scale: 1,
        anchor: 0.5,
        tint: type === 3 ? 0xFFECA0 : 0xB4E1FF,
      });
      i++;
    }

    container.addChild(...sprites);
  }

  destroy() {
    this.isDestroyed = true;
    for (const particle of this.sprites) particle.removeFromParent();
  }
}

export class GameScore {
  readonly chart: GameChart;
  readonly notes: GameChartNote[];
  readonly size: IGameRendererSize;
  readonly audioChannel: GameAudioChannel;
  readonly notesCount: number;

  skinHitEffects!: GameSkinFileTextureAnimated;
  skinHitParticle!: GameSkinFileTexture;
  skinHitsounds!: IGameSkinHitsounds;
  hitEffectContainer?: Container<AnimatedSprite>;
  hitParticleContainer?: Container<Sprite>;
  readonly hitParticles: GameScoreHitParticle[] = [];

  readonly inputs: GameChartScoreInputs;
  readonly judges: GameChartScoreJudge[] = [];
  readonly onScoreTick: (currentTime: number) => void;

  private readonly scorePerCombo: number;
  private readonly scorePerNote: number;
  private readonly scorePerNoteGood: number;
  readonly judgeRange: IGameScoreJudgeRange;
  readonly isAutoPlay: boolean;
  private readonly judgeCount: IGameScoreJudgeCount = [ 0, 0, 0, 0 ];

  score: number = 0;
  combo: number = 0;
  maxCombo: number = 0;
  accurate: number = 0;
  accurateText: string = '0.00%';

  constructor(chart: GameChart) {
    this.chart = chart;
    this.notes = this.chart.data.notes;
    this.size = this.chart.game.renderer.size;
    this.notesCount = this.notes.length; // TODO: Fake notes

    const { audio, options } = this.chart.game;
    this.audioChannel = audio.channels.effect;

    if (options.challengeMode) {
      this.judgeRange = ScoreJudgeRanges.challenge;
      this.scorePerCombo = 1000000 / this.notesCount;
      this.scorePerNote = 0;
    } else {
      this.judgeRange = ScoreJudgeRanges.normal;
      this.scorePerCombo = 900000 / this.notesCount;
      this.scorePerNote = 100000 / this.notesCount;
    }
    this.scorePerNoteGood = this.scorePerNote * 0.65;
    this.isAutoPlay = options.autoPlay;

    this.inputs = new GameChartScoreInputs(this.chart.game);
    this.onScoreTick = onScoreTick.bind(this);
  }

  createSprites(container: Container, skinTextures: GameSkinFiles, skinHitsounds: IGameSkinHitsounds) {
    this.skinHitEffects = skinTextures.hitEffects;
    this.skinHitParticle = skinTextures.hitParticle;
    this.skinHitsounds = skinHitsounds;

    if (!this.hitEffectContainer) this.hitEffectContainer = new Container();

    this.hitEffectContainer.label = 'Hit effect container';
    this.hitEffectContainer.interactive = this.hitEffectContainer.interactiveChildren = false;
    this.hitEffectContainer.cullable = this.hitEffectContainer.cullableChildren = false;
    this.hitEffectContainer.boundsArea = new Rectangle(0, 0, 0, 0);
    this.hitEffectContainer.zIndex = 2;

    if (!this.hitParticleContainer) this.hitParticleContainer = new Container();

    this.hitParticleContainer.label = 'Hit particle container';
    this.hitParticleContainer.interactive = this.hitEffectContainer.interactiveChildren = false;
    this.hitParticleContainer.cullable = this.hitParticleContainer.cullableChildren = false;
    this.hitParticleContainer.boundsArea = new Rectangle(0, 0, 0, 0);
    this.hitParticleContainer.zIndex = 3;

    container.addChild(this.hitEffectContainer);
    container.addChild(this.hitParticleContainer);
  }

  updateScore(type: EGameScoreJudgeType) {
    const { isAutoPlay, judgeCount, scorePerCombo, scorePerNote, scorePerNoteGood, notesCount } = this;

    if (isAutoPlay) judgeCount[3] += 1;
    else judgeCount[type] += 1;

    if (type >= EGameScoreJudgeType.GOOD) {
      this.combo += 1;
      if (this.maxCombo < this.combo) this.maxCombo = this.combo;
    } else {
      // TODO: Line status
      this.combo = 0;
    }

    this.score = Math.round(
      (this.maxCombo * scorePerCombo) +
      (scorePerNote * judgeCount[3] + scorePerNoteGood * judgeCount[2])
    );

    this.accurate = (judgeCount[3] + judgeCount[2] * 0.65) / notesCount;
    this.accurateText = `${this.accurate * 100}`;
  }

  playHitEffects(x: number, y: number, judgeType: EGameScoreJudgeType, currentTime: number, playHitsound: boolean = true, noteType: EGameChartNoteType = 1) {
    const { size, audioChannel, skinHitEffects, skinHitParticle, skinHitsounds, hitEffectContainer, hitParticleContainer, hitParticles } = this;
    const { playlist } = audioChannel;

    if (judgeType >= EGameScoreJudgeType.GOOD) {
      const { speed, textures } = skinHitEffects;
      const animation = new AnimatedSprite(textures!, true);

      animation.position.set(x, y);
      animation.anchor.set(0.5);
      animation.scale.set(size.noteScale * 5.6)
      animation.tint = judgeType === 3 ? 0xFFECA0 : 0xB4E1FF;
      animation.animationSpeed = speed;
      animation.loop = false;

      animation.onFrameChange = () => {
        animation.alpha = 1 - (animation.currentFrame / animation.totalFrames);
      };

      animation.onComplete = () => {
        animation.removeFromParent();
        animation.stop();
        animation.destroy();
      };

      hitEffectContainer!.addChild(animation);
      animation.play();

      hitParticles[hitParticles.length] = new GameScoreHitParticle(judgeType, currentTime, x, y, skinHitParticle.texture!, hitParticleContainer!);
    }

    if (!playHitsound) return;
    if (noteType === 1 || noteType === 3) playlist[playlist.length] = skinHitsounds.tap.clip!;
    if (noteType === 2) playlist[playlist.length] = skinHitsounds.drag.clip!;
    if (noteType === 4) playlist[playlist.length] = skinHitsounds.flick.clip!;
  }
}
