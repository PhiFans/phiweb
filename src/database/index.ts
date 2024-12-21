import { GameDatabaseEngine } from './engine';

export class GameDatabase {
  readonly chart: GameDatabaseEngine;

  constructor() {
    this.chart = new GameDatabaseEngine('chart_db', 1, {
      structures: [
        { name: 'id', options: { key: true } },
        { name: 'chart', options: { index: true, unique: true } },
      ],
      autoIncrement: true,
    });
  }
}
