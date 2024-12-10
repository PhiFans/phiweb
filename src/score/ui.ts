import { IGameRendererSize } from '@/renderer';
import { GameSkin } from '@/skins';
import { TGameSkinElement, TGameSkinElementTypeText } from '@/skins/types';
import { GameUITexturedNumber } from '@/ui/textured-number';
import { parseDoublePrecist } from '@/utils/math';
import { Container, Sprite, Text } from 'pixi.js';

type TGameScoreUIElementBase = TGameSkinElement & {
  sprite: unknown,
};

type TGameScoreUIElementNumber = TGameScoreUIElementBase & {
  type: 'score' | 'combo' | 'accurate',
  sprite: GameUITexturedNumber,
};

type TGameScoreUIElementTexture = TGameScoreUIElementBase & {
  type: 'combo-text' | 'image',
  sprite: Sprite,
};

type TGameScoreUIElementText = TGameScoreUIElementBase & {
  type: TGameSkinElementTypeText,
  sprite: Text,
};

type TGameScoreUIElement = TGameScoreUIElementNumber | TGameScoreUIElementTexture | TGameScoreUIElementText;

const accurateToText = (number: number) => `${parseDoublePrecist(number * 100, 2)}%`;

export class GameScoreUI {
  readonly container = new Container();
  readonly elements: TGameScoreUIElement[] = [];

  constructor(skin: GameSkin, container: Container, size: IGameRendererSize, options: { autoPlay: boolean }) {
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
          case 'combo-text': {
            const result: TGameScoreUIElement = {
              ...e,
              sprite: new Sprite(options.autoPlay ? e.texture!['autoplay'] : e.texture!['normal']),
            };
            result.sprite.anchor.set(e.anchor.x, e.anchor.y);
            return result;
          }
          case 'song-name': { // TODO: Song info
            const result: TGameScoreUIElement = {
              ...e,
              sprite: new Text({
                text: 'Song name',
                style: {
                  fontFamily: e.fontFamily,
                  fontSize: e.size,
                  align: e.align,
                  fill: 0xFFFFFF,
                },
              }),
            };
            result.sprite.anchor.set(e.anchor.x, e.anchor.y);
            return result;
          }
          case 'song-level': { // TODO: Song info
            const result: TGameScoreUIElement = {
              ...e,
              sprite: new Text({
                text: 'IN Lv.?',
                style: {
                  fontFamily: e.fontFamily,
                  fontSize: e.size,
                  align: e.align,
                  fill: 0xFFFFFF,
                },
              }),
            };
            result.sprite.anchor.set(e.anchor.x, e.anchor.y);
            return result;
          }
          case 'song-artist': { // TODO: Song info
            const result: TGameScoreUIElement = {
              ...e,
              sprite: new Text({
                text: 'Song artist',
                style: {
                  fontFamily: e.fontFamily,
                  fontSize: e.size,
                  align: e.align,
                  fill: 0xFFFFFF,
                },
              }),
            };
            result.sprite.anchor.set(e.anchor.x, e.anchor.y);
            return result;
          }
          case 'text': {
            const result: TGameScoreUIElement = {
              ...e,
              sprite: new Text({
                text: e.text,
                style: {
                  fontFamily: e.fontFamily,
                  fontSize: e.size,
                  align: e.align,
                  fill: 0xFFFFFF,
                },
              }),
            };
            result.sprite.anchor.set(e.anchor.x, e.anchor.y);
            return result;
          }
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

      sprite.scale.set(heightPercent * (scale || 1));
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
