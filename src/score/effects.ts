import { Sprite, Container, Texture, Rectangle, AnimatedSprite } from 'pixi.js';
import { Channel } from '@phifans/audio';
import { EGameScoreJudgeType } from './types';
import { EGameChartNoteType } from '@/chart/note';
import { IGameRendererSize } from '@/renderer';
import { GameSkin } from '@/skins';
import { TGameSkinElementFiledHitEffect, TGameSkinHitsounds } from '@/skins/types';

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
  readonly animateFrameCount: number;
  readonly animateSpeed: number;
  readonly animate: AnimatedSprite;
  isDestroyed = false;

  // TODO: Use `ParticleContainer` and `Particle`
  // TODO: Animation speed
  constructor(
    type: EGameScoreJudgeType,
    time: number,
    x: number,
    y: number,
    texture: Texture,
    animationTextures: Texture[],
    animationSpeed: number,
    animationScale: number,
    container: Container
  ) {
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
        tint: type === 3 ? 0xFFECA0 : 0xB4E1FF,
      });
      i++;
    }

    this.animateFrameCount = animationTextures.length;
    this.animateSpeed = animationSpeed;

    this.animate = new AnimatedSprite(animationTextures);
    this.animate.position.set(x, y);
    this.animate.tint = type === 3 ? 0xFFECA0 : 0xB4E1FF;
    this.animate.scale = animationScale;
    this.animate.autoUpdate = false;

    container.addChild(this.animate, ...sprites);
  }

  destroy() {
    this.isDestroyed = true;
    for (const particle of this.sprites) particle.removeFromParent();
    this.animate.removeFromParent();
  }
}

export class GameScoreEffects {
  readonly container: Container;
  readonly audioChannel: Channel;
  readonly size: IGameRendererSize;
  readonly skin: {
    hitEffect: TGameSkinElementFiledHitEffect,
    sounds: TGameSkinHitsounds,
  };
  readonly skinTextures: {
    hitEffects: Texture[],
    hitParticle: Texture,
  };
  readonly particles: GameScoreEffectHitParticle[] = [];

  constructor(
    { elements, hitsounds }: GameSkin,
    container: Container,
    audioChannel: Channel,
    size: IGameRendererSize
  ) {
    this.container = new Container();
    this.audioChannel = audioChannel;
    this.size = size;
    this.skin = {
      hitEffect: elements.find((e) => e.type === 'hit-effect')!,
      sounds: hitsounds,
    };

    const hitEffectTextures = this.skin.hitEffect.texture!;
    const hitEffects: Texture[] = [];
    for (const id in hitEffectTextures) {
      if (!isNaN(parseInt(id))) hitEffects[parseInt(id)] = hitEffectTextures[id];
    }
    this.skinTextures = {
      hitEffects: hitEffects,
      hitParticle: hitEffectTextures['particle'],
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
    const { size, audioChannel, skin, skinTextures, container, particles } = this;
    const { noteScale } = size;
    const { hitEffect, sounds } = skin;
    const { hitEffects, hitParticle } = skinTextures;

    if (judgeType >= EGameScoreJudgeType.GOOD) {
      particles[particles.length] = new GameScoreEffectHitParticle(
        judgeType,
        currentTime,
        x,
        y,
        hitParticle,
        hitEffects,
        hitEffect.speed,
        noteScale * 5.6,
        container
      );
    }

    if (!playHitsound) return;
    if (noteType === 1 || noteType === 3) audioChannel.pushClipToQueue(sounds.tap);
    if (noteType === 2) audioChannel.pushClipToQueue(sounds.drag);
    if (noteType === 4) audioChannel.pushClipToQueue(sounds.flick);
  }

  reset() {
    const { particles } = this;
    while (particles.length > 0) {
      particles[0].destroy();
      particles.splice(0, 1);
    }
  }
}
