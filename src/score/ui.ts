import { IGameRendererSize } from '@/renderer';
import { GameSkinFiles } from '@/skins/file';
import { IGameSkinElement, IGameSkinElementTextureNumber } from '@/skins/types';
import { GameUITexturedNumber } from '@/ui/textured-number';
import { parseDoublePrecist } from '@/utils/math';
import { Container } from 'pixi.js';

interface IGameScoreUIElements {
  readonly score: IGameSkinElementTextureNumber,
  readonly combo: IGameSkinElementTextureNumber,
  readonly accurate: IGameSkinElementTextureNumber,
}

interface IGameScoreUISprites {
  readonly score: GameUITexturedNumber,
  readonly combo: GameUITexturedNumber,
  readonly accurate: GameUITexturedNumber,
}

const accurateToText = (number: number) => `${parseDoublePrecist(number * 100, 2)}%`;

export class GameScoreUI {
  readonly container = new Container();
  readonly elements: IGameScoreUIElements;
  readonly sprites: IGameScoreUISprites;

  constructor(elements: IGameSkinElement[], skinFiles: GameSkinFiles, container: Container, size: IGameRendererSize) {
    this.elements = {
      score: elements.find(e => e.type === 'score')! as IGameSkinElementTextureNumber,
      combo: elements.find(e => e.type === 'combo')! as IGameSkinElementTextureNumber,
      accurate: elements.find(e => e.type === 'accurate')! as IGameSkinElementTextureNumber,
    };

    this.sprites = {
      score: new GameUITexturedNumber(skinFiles.numbers.score, this.elements.score, size, 7),
      combo: new GameUITexturedNumber(skinFiles.numbers.combo, this.elements.combo, size),
      accurate: new GameUITexturedNumber(skinFiles.numbers.accurate, this.elements.accurate, size),
    };

    this.container.addChild(
      this.sprites.score.view,
      this.sprites.combo.view,
      this.sprites.accurate.view
    );
    container.addChild(this.container);
    this.resize(size);
  }

  resize(size: IGameRendererSize) {
    const { sprites } = this;

    sprites.score.resize(size);
    sprites.combo.resize(size);
    sprites.accurate.resize(size);
  }

  updateUI(score: number, combo: number, accurate: number) {
    const { sprites } = this;

    sprites.score.number = score;
    sprites.combo.number = combo;
    sprites.accurate.number = accurateToText(accurate);
  }
}
