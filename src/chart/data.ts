import { GameChartJudgeLine } from './judgeline';
import { GameChartNote } from './note';
import { ConvertFromOfficial } from './converter/official';
import { Nullable } from '@/utils/types';
import { IChartOfficial } from './converter/official/types';
import { Container } from 'pixi.js';

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

  constructor(offset: number) {
    this.offset = Math.round(offset);
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
      rej('Unsupported chart format');
    });
  });}

  createSprites(container: Container) {
    for (const line of this.lines) {
      line.createSprites(container);
    }

    const lineLength = this.lines.length;
    for (let i = 0; i < this.notes.length; i++) {
      const note = this.notes[i];
      const zIndex = note.type !== 3 ? lineLength + 1 + i : ((i - 10) > 0 ? i - 10 : 0);
      this.notes[i].createSprite(container, zIndex);
    }
  }
}
