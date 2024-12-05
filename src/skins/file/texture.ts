import { Texture, TextureSource } from 'pixi.js';
import { IGameSkinFileAnimated, IGameSkinFileBase } from './types';

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

export class GameSkinFileTextureAnimated implements IGameSkinFileAnimated<ImageBitmap[], Texture<TextureSource<ImageBitmap>>[]> {
  readonly sources: ImageBitmap[];
  readonly speed: number;
  private _textures?: Texture<TextureSource<ImageBitmap>>[];

  constructor(sources: ImageBitmap[], speed: number = 1) {
    this.sources = [ ...sources ];
    this.speed = speed;
  }

  create() {
    const result = [];
    for (const source of this.sources) result.push(Texture.from(source));
    this._textures = result;
    return this._textures;
  }

  destroy() {
    if (!this._textures) return;
    for (const texture of this._textures) texture.destroy();
    this._textures = (void 0);
  }

  get textures() {
    return this._textures;
  }
}
