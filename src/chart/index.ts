import { GameChartJudgeLine } from './judgeline';
import { ConvertFromOfficial } from './converter/official';
import { Nullable } from '@/utils';
import { IChartOfficial } from './converter/official/types';

const ParseJSON = (string: string): Nullable<unknown> => {
  try {
    return JSON.parse(string) as unknown;
  } catch (e) {
    return null;
  }
}

export class GameChart {
  lines: Array<GameChartJudgeLine> = new Array();

  static from(rawData: string): Promise<GameChart> {return new Promise((res, rej) => {
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
}