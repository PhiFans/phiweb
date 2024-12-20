import { GameDatabase } from '@/database';

export class GameStorage {
  readonly dbFile: GameDatabase;

  constructor() {
    this.dbFile = new GameDatabase('file_db', 1, {
      structures: [
        { name: 'md5', options: { key: true } },
        { name: 'filename', options: { index: true, unique: true } },
        { name: 'blob' },
      ]
    });
  }
}
