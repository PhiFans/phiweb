import { GameAudio } from '@/audio';
import { GameAudioClip } from '@/audio/clip';
import { IGameSkinFileBase } from './types';

export class GameSkinFileSound implements IGameSkinFileBase<AudioBuffer, GameAudioClip> {
  readonly source: AudioBuffer;
  private _clip?: GameAudioClip;

  constructor(source: AudioBuffer) {
    this.source = source;
  }

  create() {
    this._clip = GameAudio.from(this.source);
    return this._clip;
  }

  destroy() {
    if (!this._clip) return;
    this._clip.destroy();
    this._clip = (void 0);
  }

  get clip() {
    return this._clip;
  }
}
