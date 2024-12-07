import { Sprite, Container, Texture, Rectangle, AnimatedSprite } from 'pixi.js';
import { GameSkinFileTexture, GameSkinFileTextureAnimated } from '@/skins/file/texture';
import { GameSkinFiles } from '@/skins/file';
import { GameAudioChannel } from '@/audio/channel';
import { EGameScoreJudgeType } from './types';
import { IGameSkinHitsounds } from '@/skins/file/types';
import { EGameChartNoteType } from '@/chart/note';
import { IGameRendererSize } from '@/renderer';

class GameScoreEffectHitParticle {
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

export class GameScoreEffects {
  readonly container: Container;
  readonly audioChannel: GameAudioChannel;
  readonly size: IGameRendererSize;
  readonly skin: {
    hitEffects: GameSkinFileTextureAnimated,
    hitParticle: GameSkinFileTexture,
    sounds: IGameSkinHitsounds,
  };
  readonly particles: GameScoreEffectHitParticle[] = [];

  constructor(
    skinFiles: GameSkinFiles,
    skinFilesSound: IGameSkinHitsounds,
    container: Container,
    audioChannel: GameAudioChannel,
    size: IGameRendererSize
  ) {
    this.container = new Container();
    this.audioChannel = audioChannel;
    this.size = size;
    this.skin = {
      hitEffects: skinFiles.hitEffects,
      hitParticle: skinFiles.hitParticle,
      sounds: skinFilesSound
    };

    this.container.label = 'Hit effects container';
    this.container.interactive = this.container.interactiveChildren = false;
    this.container.cullable = this.container.cullableChildren = false;
    this.container.boundsArea = new Rectangle(0, 0, 0, 0);
    this.container.zIndex = 2;

    container.addChild(this.container);
  }

  playEffects(
    x: number,
    y: number,
    judgeType: EGameScoreJudgeType,
    currentTime: number,
    playHitsound = true,
    noteType: EGameChartNoteType = 1
  ) {
    const { size, audioChannel, skin, container, particles } = this;
    const { hitEffects, hitParticle, sounds } = skin;
    const { playlist } = audioChannel;

    if (judgeType >= EGameScoreJudgeType.GOOD) {
      const { speed, textures } = hitEffects;
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

      container.addChild(animation);
      animation.play();

      particles[particles.length] = new GameScoreEffectHitParticle(judgeType, currentTime, x, y, hitParticle.texture!, container);
    }

    if (!playHitsound) return;
    if (noteType === 1 || noteType === 3) playlist[playlist.length] = sounds.tap.clip!;
    if (noteType === 2) playlist[playlist.length] = sounds.drag.clip!;
    if (noteType === 4) playlist[playlist.length] = sounds.flick.clip!;
  }
}
