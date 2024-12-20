
export type TGameDatabaseStructure = {
  name: string,
  options?: Partial<{
    key: boolean,
    index: boolean,
    unique: boolean,
    multiEntry: boolean,
  }>,
};

export type TGameDatabase = {
  structures: TGameDatabaseStructure[],
  autoIncrement?: boolean,
};

export type TGameDatabaseData = {
  [x: string]: string | number | Blob,
};

const waitFor = (bool: boolean) => new Promise((res) => {
  if (bool) return res(bool);
  const clockId = setInterval(() => {
    if (!bool) return;
    res(bool);
    clearInterval(clockId);
  }, 200);
});

export class GameDatabase {
  readonly name: string;
  readonly version: number;

  private db!: IDBDatabase;
  private isReady = false;

  constructor(name: string, version: number, options: TGameDatabase) {
    this.name = name;
    this.version = version;

    const request = window.indexedDB.open(this.name, this.version);

    request.onsuccess = () => {
      const { result } = request;
      if (!result) return;

      this.db = result;
      if (this.db.version === version) this.isReady = true;
    };

    request.onerror = (e) => {
      throw e;
    };

    request.onupgradeneeded = () => {
      this.db = request.result;

      const indexes: TGameDatabaseStructure[] = [];
      let keyPath = null;

      for (const structure of options.structures) {
        const { options } = structure;
        if (!options) continue;

        if (options.key) keyPath = structure.name;
        else if (options.index) indexes.push(structure);
      }

      const objectOptions = { keyPath: keyPath, autoIncrement: options.autoIncrement };
      const store = this.db.createObjectStore(this.name, objectOptions);

      for (const index of indexes) {
        store.createIndex(index.name, index.name, {
          unique: index.options!.unique,
          multiEntry: index.options!.multiEntry,
        });
      }

      this.isReady = true;
    };
  }

  add(data: TGameDatabaseData) {return new Promise(async (res, rej) => {
    await waitFor(this.isReady);
    const { db } = this;

    const transaction = db.transaction([ this.name ], 'readwrite');
    const store = transaction.objectStore(this.name);

    transaction.oncomplete = () => {
      res(transaction);
    };
    transaction.onerror = (e) => {
      rej(e);
    };

    store.add(data);
  })}
}
