import { GameDatabase } from '@/database';
import { getFileMD5 } from '@/utils/file';

export type TGameDBFile = {
  md5: string,
  filename: string,
  blob: Blob,
};

export class GameStorage {
  readonly dbFile: GameDatabase;

  constructor() {
    this.dbFile = new GameDatabase('file_db', 1, {
      structures: [
        { name: 'md5', options: { key: true } },
        { name: 'filename', options: { index: true, unique: false } },
        { name: 'blob' },
      ]
    });
  }

  addFile(filename: string, blob: Blob): Promise<{ md5: string, filename: string }> {return new Promise(async (res, rej) => {
    const md5 = await getFileMD5(blob);
    const fileData = await this.dbFile.get<TGameDBFile>(md5);
    if (fileData) return res(fileData);

    this.dbFile.add({
      md5, filename, blob
    }).then(() => res({ md5, filename }))
      .catch(e => rej(e));
  })}
}