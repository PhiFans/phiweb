import { TChartInfo } from '@/utils/types';
import { GameDatabaseEngine } from './engine';

export class GameDatabase {
  readonly chart: GameDatabaseEngine;

  constructor() {
    this.chart = new GameDatabaseChart();
  }
}

export class GameDatabaseChart extends GameDatabaseEngine {
  constructor() {
    super('chart_db', 1, {
      structures: [
        { name: 'chart', options: { key: true } },
        { name: 'name', options: { index: true } }
      ],
      autoIncrement: true,
    });
  }

  getChartInfoByMD5(md5: string) {
    return this.get<TChartInfo>(md5);
  }

  getChartInfosByName(name: string) {return new Promise(async (res) => {
    const result: TChartInfo[] = [];
    const allCharts = await this.getAll<TChartInfo>();

    for (const chartInfo of allCharts) {
      if (chartInfo.name === name) result.push(chartInfo);
    }

    res(result);
  })}
}
