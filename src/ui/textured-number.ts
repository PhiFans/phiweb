import { Graphics, Texture } from 'pixi.js';
import { GameSkinFileTexture } from '@/skins/file/texture';
import { IGameSkinElementTextureNumber } from '@/skins/types';

const calculateTextureLength = (textures: Texture[]) => {
  let result = 0;
  for (const texture of textures) result += texture.width;
  return result;
};

export class GameUITexturedNumber extends Graphics {
  private readonly textures: Record<string, GameSkinFileTexture> = {};
  readonly info: IGameSkinElementTextureNumber;

  private _numberText: string = '';
  private _numberDigits: number = 0;
  private _numberDigitsMin: number = 0;

  // TODO: Skin meta
  constructor(textures: GameSkinFileTexture[], info: IGameSkinElementTextureNumber, minDigits: number = 0, label: string = '') {
    super();

    for (let i = 0; i < textures.length; i++) {
      const texture = textures[i];
      if (!texture.texture) throw new Error('Number texture not created, please create it first!');

      if (i === 10) this.textures['.'] = texture;
      else if (i === 11) this.textures['%'] = texture;
      else this.textures[`${i}`] = texture;
    }
    this.info = info;
    this._numberDigitsMin = minDigits;
    this.label = label;
  }

  private updateSprites() {
    const { textures, info, _numberText, _numberDigits, _numberDigitsMin } = this;
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
    this.clear();
    for (const texture of result) {
      this.texture(texture, 0xFFFFFF, currentPosX, 0);
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

  set minDigits(value: number) {
    this._numberDigitsMin = value;
  }
}
