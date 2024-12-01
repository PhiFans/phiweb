import { Graphics, Texture } from 'pixi.js';
import { GameSkinFileTexture } from '@/skins/file/texture';
import { IGameSkinElementTexture } from '@/skins/types';

const calculateTextureLength = (textures: Texture[]) => {
  let result = 0;
  for (const texture of textures) result += texture.width;
  return result;
};

export class GameUITexturedNumber {
  private readonly textures: Record<string, GameSkinFileTexture> = {};
  readonly info: IGameSkinElementTexture;

  private readonly _view: Graphics = new Graphics();
  private _numberText: string = '';
  private _numberDigits: number = 0;
  private _numberDigitsMin: number = 0;

  // TODO: Skin meta
  constructor(textures: GameSkinFileTexture[], info: IGameSkinElementTexture) {
    for (let i = 0; i < textures.length; i++) {
      const texture = textures[i];
      if (!texture.texture) throw new Error('Number texture not created, please create it first!');

      if (i === 10) this.textures['.'] = texture;
      else if (i === 11) this.textures['%'] = texture;
      else this.textures[`${i}`] = texture;
    }
    this.info = info;
  }

  private updateSprites() {
    const { textures, info, _numberText, _numberDigits, _numberDigitsMin, _view } = this;
    const result: Texture[] = [];

    for (let i = 0; i < _numberDigits; i++) {
      const number = _numberText[i];
      result.push(textures[number].texture!);
    }

    if (_numberDigitsMin !== 0) {
      while (result.length < _numberDigitsMin) {
        result.unshift(textures['0'].texture!);
      }
    }

    const textureLength = calculateTextureLength(result);
    let currentPosX = info.align === 'left' ? 0 : info.align === 'right' ? -textureLength : textureLength / -2;
    _view.clear();
    for (const texture of result) {
      _view.texture(texture, 0xFFFFFF, currentPosX, 0);
      currentPosX += texture.width;
    };
  }

  set number(number: number | string) {
    const { _numberText } = this;
    if (`${number}` === _numberText) return;

    this._numberText = `${number}`;
    this._numberDigits = this._numberText.length;
    this.updateSprites();
  }

  get view() {
    return this._view;
  }

  set minDigits(value: number) {
    this._numberDigitsMin = value;
  }
}
