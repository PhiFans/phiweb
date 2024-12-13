import { GameChartJudgeLine } from './judgeline';
import { GameChartNote } from './note';
import { ConvertFromOfficial } from './converter/official';
import { Nullable } from '@/utils/types';
import { IChartOfficial } from './converter/official/types';
import { Container, Rectangle } from 'pixi.js';
import { Game } from '@/game';
import { GameSkin } from '@/skins';
import { ConvertFromPhiEdit } from './converter/phiedit';

const ParseJSON = (string: string): Nullable<unknown> => {
  try {
    return JSON.parse(string) as unknown;
  } catch (e) {
    return null;
  }
}

export class GameChartData {
  offset: number;
  lines: Array<GameChartJudgeLine> = new Array();
  notes: Array<GameChartNote> = new Array();

  container?: Container;

  constructor(offset: number) {
    this.offset = Math.floor(offset);
  }

  static from(rawData: string): Promise<GameChartData> {return new Promise((res, rej) => {
    const rawJson = ParseJSON(rawData);

    (new Promise(() => {
      throw new Error('Promise chain!');
    })).catch(() => {
      // Parse official chart
      if (!rawJson) throw new Error('Not a JSON chart file!');
      res(ConvertFromOfficial(rawJson as IChartOfficial));
    }).catch(() => {
      // Parse PhiEdit chart
      res(ConvertFromPhiEdit(rawData));
    }).catch(() => {
      rej('Unsupported chart format');
    });
  });}

  createSprites(container: Container, game: Game, skin: GameSkin) {
    if (!this.container) this.container = new Container();

    this.container.label = 'Chart sprites container';
    this.container.interactive = this.container.interactiveChildren = false;
    this.container.cullableChildren = false;
    this.container.boundsArea = new Rectangle(0, 0, 0, 0);
    this.container.zIndex = 1;

    for (const line of this.lines) {
      // TODO: Line texture maybe
      line.createSprites(this.container);
    }

    const lineLength = this.lines.length;
    for (let i = 0; i < this.notes.length; i++) {
      const note = this.notes[i];
      const zIndex = note.type !== 3 ? lineLength + 1 + i : ((i - 10) > 0 ? i - 10 : 0);
      this.notes[i].createSprite(game, skin, zIndex);
    }

    container.addChild(this.container);
  }

  get notesTotal() {
    return this.notes.length;
  }

  get notesTotalReal() {
    return this.notes.filter(e => !e.isFake).length;
  }
}
