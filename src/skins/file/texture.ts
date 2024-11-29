import { Texture, TextureSource } from 'pixi.js';
import { IGameSkinFileBase } from './types';

export class GameSkinFileTexture implements IGameSkinFileBase<ImageBitmap, Texture<TextureSource<ImageBitmap>>> {
  readonly source: ImageBitmap;
  private _texture?: Texture<TextureSource<ImageBitmap>>;

  constructor(source: ImageBitmap) {
    this.source = source;
  }

  create() {
    this._texture = Texture.from(this.source);
    return this._texture;
  }

  destroy() {
    if (!this._texture) return;
    this._texture.destroy();
    this._texture = (void 0);
  }

  get texture() {
    return this._texture;
  }
}
