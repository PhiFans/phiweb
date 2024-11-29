import JSZip from 'jszip';
import { Game } from '@/game';
import { GameSkinFiles } from './file';
import { GameSkinFileTexture } from './file/texture';
import { createNoteSkin } from './file/utils';
import { Nullable } from '@/utils/types';
import { IGameSkinFileNotes } from './file/types';
import { IGameSkinMeta } from './types';

type SkinInput = File | Blob | string
// XXX: These might need move to `utils`
type JSZipFiles = {
  [ key: string ]: JSZip.JSZipObject,
};
type JSZipFilesMap = Map<string, JSZip.JSZipObject>;

const RegFileExtImage = /\.(jpe?g|png)$/;
const RegFileQualityHigh = /@2x\./;

const getFileListFromZip = (files: JSZipFiles): JSZipFilesMap => {
  const result: [ string, JSZip.JSZipObject ][] = [];
  for (const name in files) {
    const file = files[name];
    if (file.dir) continue;
    result.push([ name, file ]);
  }
  return new Map(result);
};

const getFilesByQuality = (fileList: JSZipFilesMap, high = false): Nullable<JSZipFilesMap> => {
  const result: [ string, JSZip.JSZipObject ][] = [];
  fileList.forEach((value, filename) => {
    if (!RegFileExtImage.test(filename)) return;

    const realFileName = filename.replace(RegFileExtImage, '').replace('@2x', '');
    if (RegFileQualityHigh.test(filename) && high) result.push([ realFileName, value ]);
    else if (!RegFileQualityHigh.test(filename) && !high) result.push([ realFileName, value ]);
  });

  if (result.length <= 0) return null;
  else return new Map(result);
};

// XXX: This might need move to `utils`
const createSkinFileClass = (fileList: JSZipFilesMap): Promise<GameSkinFiles> => new Promise(async (res) => {
  const noteClass: IGameSkinFileNotes = {
    tap: (await createNoteSkin(fileList, 'note-tap')),
    drag: (await createNoteSkin(fileList, 'note-drag')),
    hold: {
      head: (await createNoteSkin(fileList, 'note-hold-head')),
      body: (await createNoteSkin(fileList, 'note-hold-body')),
      end: new GameSkinFileTexture((await window.createImageBitmap((await fileList.get('note-hold-end')!.async('blob'))))),
    },
    flick: (await createNoteSkin(fileList, 'note-flick')),
  };
  return res(new GameSkinFiles(noteClass));
});

export class GameSkin {
  readonly name: string;
  readonly author: string;
  readonly version: string;
  readonly normal: GameSkinFiles;
  readonly high: Nullable<GameSkinFiles> = null;

  constructor(name: string, author: string, version: string, filesNormal: GameSkinFiles, filesHigh: Nullable<GameSkinFiles> = null) {
    this.name = name;
    this.author = author;
    this.version = version;
    this.normal = filesNormal;
    this.high = filesHigh;
  }

  create(useHighQualitySkin = false) {
    if (this.high && useHighQualitySkin) this.high.create();
    else this.normal.create();
  }

  destroy() {
    this.normal.destroy();
    if (this.high) this.high.destroy();
  }
}

export class GameSkins extends Map<string, GameSkin> {
  readonly game: Game;
  private _currentSkin?: GameSkin;

  constructor(game: Game) {
    super();

    this.game = game;
  }

  load(skin: SkinInput) {
    if (skin instanceof File || skin instanceof Blob) return this.loadFromFile(skin);
  }

  setSkin(name: string) {
    const result = this.get(name);
    if (!result) throw new Error(`No such skin called ${name}`);
    this._currentSkin = result;
    return this._currentSkin;
  }

  // TODO: Skin meta type
  private parseSkinMeta(skinMeta: JSZip.JSZipObject): Promise<IGameSkinMeta> {return new Promise(async (res, rej) => {
    if (!skinMeta) return rej('No skin.json found');
    const rawText = await skinMeta.async('text');
    const rawJson = JSON.parse(rawText);
    res(rawJson);
  });}

  private loadFromFile(skin: File | Blob) {return new Promise((res, rej) => {
    JSZip.loadAsync(skin, { createFolders: false })
      .then(async (result) => {
        const { files } = result;
        const skinMeta = await this.parseSkinMeta(files['skin.json']); // TODO: Skin meta

        const fileList = getFileListFromZip(files);
        const fileListLow = getFilesByQuality(fileList, false)!;
        const fileListHigh = getFilesByQuality(fileList, true);

        const skinClassLow = await createSkinFileClass(fileListLow);
        let skinClassHigh: Nullable<GameSkinFiles> = null;
        if (fileListHigh) skinClassHigh = await createSkinFileClass(fileListHigh);

        // TODO: Skin meta
        const skinResult = new GameSkin(
          skinMeta.name,
          skinMeta.author,
          skinMeta.version,
          skinClassLow,
          skinClassHigh
        );
        this.set(skinMeta.name, skinResult);
        res(skinResult);
        this.setSkin(skinMeta.name);

        console.log(skinMeta);
        console.log(this);
      })
      .catch((e) => {
        rej('Read skin file error, this may not a valid skin file.');
        console.error(e);
      });
  });}

  get currentSkin() {
    return this._currentSkin;
  }
}
