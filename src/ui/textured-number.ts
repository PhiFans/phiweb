import { GameSkinFileTexture } from '@/skins/file/texture';
// import { IGameSkinElementTexture } from '@/skins/types';
import { Layout } from '@pixi/layout';
import { Sprite } from 'pixi.js';


export class GameUITexturedNumber {
  private readonly textures: GameSkinFileTexture[];
  readonly layout: Layout;
  readonly layoutNumbers: Layout;

  private _numberText: string = '0';
  private _numberDigits: number = 1;

  // TODO: Skin meta
  constructor(textures: GameSkinFileTexture[] /**, info: IGameSkinElementTexture */) {
    this.textures = textures;
    for (const texture of this.textures) if (!texture.texture) throw new Error('Number texture not created, please create it first!');

    this.layout = new Layout({
      content: {
        numbers: {
          content: [ new Sprite(textures[0].texture) ],
          styles: {
            position: 'center', // info.align, // TODO: Skin meta
          }
        },
      },
      styles: {
        position: 'center',
      }
    });
    this.layoutNumbers = this.layout.content.getByID('numbers') as Layout;
  }

  private updateSprites() {
    const { layoutNumbers, _numberText, _numberDigits } = this;
    if (layoutNumbers.children.length > _numberDigits) layoutNumbers.removeChildAt(0);
    if (layoutNumbers.children.length < _numberDigits) layoutNumbers.addContent(new Sprite(this.textures[0]));

    for (let i = 0; i < _numberDigits; i++) {
      const number = parseInt(_numberText[i]);
      const texture = this.textures[number].texture!;
      (layoutNumbers.children[i] as Sprite).texture = texture;
    }

  }

  set number(number: number) {
    if (`${number}` === this._numberText) return;

    this._numberText = `${number}`;
    this._numberDigits = this._numberText.length;
    this.updateSprites();
  }
}