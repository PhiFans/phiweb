import { GameChartData } from './data';
import { GameAudioClip } from '@/audio/clip';

export class GameChart {
  readonly data: GameChartData;
  readonly audio: GameAudioClip;
  // TODO: Maybe `PIXI.Sprite`
  readonly background: unknown;

  constructor(data: GameChartData, audio: GameAudioClip, background: unknown) {
    this.data = data;
    this.audio = audio;
    this.background = background;
  }
}
