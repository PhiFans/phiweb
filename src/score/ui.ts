import { IGameRendererSize } from '@/renderer';
import { GameSkin } from '@/skins';
import { TGameSkinElement } from '@/skins/types';
import { GameUITexturedNumber } from '@/ui/textured-number';
import { parseDoublePrecist } from '@/utils/math';
import { Container /** , Sprite */ } from 'pixi.js';

type TGameScoreUIElement = TGameSkinElement & {
  sprite: GameUITexturedNumber /** | Sprite */,
};

const accurateToText = (number: number) => `${parseDoublePrecist(number * 100, 2)}%`;

export class GameScoreUI {
  readonly container = new Container();
  readonly elements: TGameScoreUIElement[] = [];

  constructor(skin: GameSkin, container: Container, size: IGameRendererSize) {
    this.elements = [ ...skin.elements ]
      .filter(e => e.type !== 'hit-effect')
      .filter(e => e.enabled)
      .map<TGameScoreUIElement | undefined>((e) => {
        switch (e.type) {
          case 'score':
          case 'combo':
          case 'accurate': {
            return {
              ...e,
              sprite: new GameUITexturedNumber(e, e.type === 'score' ? 7 : 0),
            }
          };
          default: {
            console.warn(`No such element type: ${e.type}, skipping...`);
            return (void 0);
          }
        }
      })
      .filter((e) => (e !== (void 0)));

    for (const e of this.elements) this.container.addChild(e.sprite);
    container.addChild(this.container);
    this.resize(size);
  }

  resize(size: IGameRendererSize) {
    const { elements } = this;
    const { heightPercent, width, widthHalf, height, heightHalf } = size;

    for (const e of elements) {
      if (e.type === 'hit-effect') continue;

      const { stickTo, position, scale, sprite } = e;
      const posX = (
        stickTo.x === 'left' ? position.x * heightPercent :
        stickTo.x === 'center' ? widthHalf + position.x * heightPercent :
        width - position.x * heightPercent
      );
      const posY = (
        stickTo.y === 'top' ? position.y * heightPercent :
        stickTo.y === 'center' ? heightHalf + position.y * heightPercent :
        height - position.y * heightPercent
      );

      sprite.scale.set(heightPercent * scale);
      sprite.position.set(posX, posY);
    }
  }

  updateUI(score: number, combo: number, accurate: number) {
    const { elements } = this;
    const accurateText = accurateToText(accurate);

    for (const e of elements) {
      switch (e.type) {
        case 'score':
          e.sprite.number = score;
          break;
        case 'combo':
          e.sprite.number = combo;
          break;
        case 'accurate':
          e.sprite.number = accurateText;
          break;
      }
    }
  }
}
