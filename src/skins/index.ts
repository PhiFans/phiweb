import JSZip, { file } from 'jszip';
import { Game } from '@/game';
import { GameSkinFiles } from './file';
import { GameSkinFileTexture } from './file/texture';
import { createAnimatedSkin, createNoteSkin, createNumbersSkin } from './file/utils';
import { Nullable } from '@/utils/types';
import { IGameSkinFileNotes, IGameSkinFileNumbers, IGameSkinHitsounds } from './file/types';
import { IGameSkinElement, IGameSkinElementTexture, IGameSkinMeta, TGameSkinElementComboText, TGameSkinElementHitEffect, TGameSkinElementNumber, TGameSkinElementText, TGameSkinElementTexture } from './types';
import { JSZipFiles, JSZipFilesMap, IGameSkinElementFiles } from './file/types';
import { ReadFileAsAudioBuffer } from '@/utils/file';
import { GameSkinFileSound } from './file/sound';
import { TGameSkinElement } from './types';

type TGameSkinFile = {
  normal: File,
  high: File,
};

type TGameSkinFileArray = {
  normal: File[],
  high: File[],
};

type TGameSkinElementFiledBaseArray = TGameSkinElement & {
  type: 'score' | 'combo' | 'accurate' | 'combo-text' | 'hit-effect' | 'animation',
  file: TGameSkinFileArray,
};

type TGameSkinElementFiledBase = TGameSkinElement & {
  type: 'image',
  file: TGameSkinFile,
};

type TGameSkinElementFiledBaseNever = TGameSkinElement & {
  type: 'song-name' | 'song-level' | 'song-artist' | 'text',
  file: undefined,
};

type TGameSkinElementFiled = TGameSkinElementFiledBase | TGameSkinElementFiledBaseArray | TGameSkinElementFiledBaseNever;

type SkinInput = File | Blob | string;

const RegFileExt = /\.([a-zA-Z\d]+)$/;
const RegFileQualityHigh = /@2x$/;

const getFileListFromZip = (files: JSZipFiles): JSZipFilesMap => {
  const result: [ string, JSZip.JSZipObject ][] = [];
  for (const name in files) {
    const file = files[name];
    if (file.dir) continue;
    result.push([ name.replace(RegFileExt, ''), file ]);
  }
  return new Map(result);
};

const getFileListByPath = (fileList: JSZipFilesMap, _pathStart: string): JSZipFilesMap => {
  const pathStart = _pathStart.replace(/\//, '\\/');
  const RegPath = new RegExp(`^${pathStart}-(\\d|dot|percent)$`);
  const result: [ string, JSZip.JSZipObject ][] = [];

  fileList.forEach((value, filename) => {
    if (!RegPath.test(filename)) return;
    const textId = RegPath.exec(filename)![1];
    result.push([ textId, value ]);
  });

  return new Map(result);
};

const getFilesAnimated = (fileList: JSZipFilesMap, _pathStart: string): JSZipFilesMap => {
  const pathStart = _pathStart.replace(/\//, '\\/');
  const RegPath = new RegExp(`^${pathStart}-(\\d+)$`);
  const result: [ string, JSZip.JSZipObject ][] = [];

  fileList.forEach((value, filename) => {
    if (!RegPath.test(filename)) return;
    const textId = RegPath.exec(filename)![1];
    result.push([ textId, value ]);
  });

  result.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  return new Map(result);
};

const getFilesByQuality = (fileList: JSZipFilesMap, high = false): Nullable<JSZipFilesMap> => {
  const result: [ string, JSZip.JSZipObject ][] = [];
  fileList.forEach((value, filename) => {
    const isHighQuality = RegFileQualityHigh.test(filename);
    const realFileName = filename.replace('@2x', '');

    if (isHighQuality && high) result.push([ realFileName, value ]);
    else if (!isHighQuality && !high) result.push([ realFileName, value ]);
  });

  if (result.length <= 0) return null;
  else return new Map(result);
};

const createSkinElements = (elements: IGameSkinElement[], fileList: JSZipFilesMap) => {
  const result: IGameSkinElementFiles[] = [];

  for (const element of elements) {
    switch (element.type) {
      case 'score':
      case 'accurate':
      case 'combo': {
        const fileListNumber = getFileListByPath(fileList, element.path);
        result.push({
          ...element,
          files: fileListNumber,
        });
        break;
      }
      case 'hit-effect': {
        const fileListAnimated = getFilesAnimated(fileList, element.path);
        result.push({
          ...element,
          files: fileListAnimated,
        })
        break;
      }
    }
  }

  return result;
};

// XXX: This might need move to `utils`
const createSkinFileClass = (fileList: JSZipFilesMap, elements: IGameSkinElementFiles[]): Promise<GameSkinFiles> => new Promise(async (res) => {
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

  const numbersClass: IGameSkinFileNumbers = {
    score: (await createNumbersSkin(elements, 'score')),
    accurate: (await createNumbersSkin(elements, 'accurate', true, true)),
    combo: (await createNumbersSkin(elements, 'combo')),
  };

  const hitEffectElement = elements.find(e => e.type === 'hit-effect')! as IGameSkinElementTexture;
  const hitEffectsClass = await createAnimatedSkin(elements, 'hit-effect');
  const hitParticleFile = new GameSkinFileTexture((await window.createImageBitmap((await fileList.get(`${hitEffectElement.path}-particle`)!.async('blob')))));

  return res(new GameSkinFiles(noteClass, numbersClass, hitEffectsClass, hitParticleFile));
});

const getFileByPath = (fileList: JSZipFilesMap, path: string, highQuality = false): Promise<File> => new Promise(async (res) => {
  const file = fileList.get(path)!;
  const fileHigh = fileList.get(`${path}@2x`);

  if (fileHigh && highQuality) res(new File([ await fileHigh.async('blob') ], path));
  else res(new File([ await file.async('blob') ], path));
});

const getFilesByPath = (fileList: JSZipFilesMap, path: string, highQuality = false): Promise<File[]> => new Promise(async (res) => {
  const RegFile = new RegExp(`^${path.replace(/\//, '\\/')}-([\\da-zA-Z]+)(@2x)?$`);
  const RegFileHigh = new RegExp(`^${path.replace(/\//, '\\/')}-([\\da-zA-Z]+)@2x$`);

  const SortFn = (a: File, b: File) => {
    const aNum = parseInt(RegFile.exec(a.name)![1]);
    const bNum = parseInt(RegFile.exec(b.name)![1]);

    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    else if (isNaN(aNum)) return 1;
    else return -1;
  };

  const fileNames = fileList.keys();
  const result: Array<File> = [];
  const resultHigh: Array<File> = [];

  for (const filename of fileNames) {
    if (!RegFile.test(filename)) continue;

    const file = fileList.get(filename)!;
    if (RegFileHigh.test(filename)) resultHigh.push(new File([ await file.async('blob') ], filename));
    else if (RegFile.test(filename)) result.push(new File([ await file.async('blob') ], filename));
  }

  if (resultHigh.length > 0 && highQuality) res(resultHigh.sort(SortFn));
  else res(result.sort(SortFn));
});

export class GameSkinNew {
  readonly name: string;
  readonly author: string;
  readonly version: string;
  readonly elements: TGameSkinElementFiled[];

  constructor(name: string, author: string, version: string, elements: TGameSkinElementFiled[]) {
    this.name = name;
    this.author = author;
    this.version = version;
    this.elements = [ ...elements ];
  }

  static from(name: string, author: string, version: string, elements: TGameSkinElement[], fileList: JSZipFilesMap) {return new Promise(async (res, rej) => {
    const newElements: TGameSkinElementFiled[] = [];

    for (const e of [ ...elements ]) {
      switch (e.type) {
        case 'score':
        case 'combo':
        case 'accurate':
        case 'hit-effect':
        case 'combo-text':
        case 'animation': {
          newElements.push({
            ...e,
            file: {
              normal: await getFilesByPath(fileList, e.path, false),
              high: await getFilesByPath(fileList, e.path, true),
            },
          })
          break;
        }
        case 'song-name':
        case 'song-level':
        case 'song-artist':
        case 'text': {
          newElements.push({ ...e, file: undefined });
          break;
        }
        case 'image': {
          newElements.push({
            ...e,
            file: {
              normal: await getFileByPath(fileList, e.path, false),
              high: await getFileByPath(fileList, e.path, true),
            }
          });
          break;
        }
        default: {
          console.warn(`No such skin element type: ${(e as TGameSkinElement).type}, skipping...`);
        }
      }
    }

    return res(new GameSkinNew(name, author, version, newElements));
  })}
}

export class GameSkin {
  readonly name: string;
  readonly author: string;
  readonly version: string;
  readonly elements: IGameSkinElement[];
  readonly normal: GameSkinFiles;
  readonly hitsounds: IGameSkinHitsounds;
  readonly high: Nullable<GameSkinFiles> = null;

  constructor(name: string, author: string, version: string, elements: IGameSkinElement[], filesNormal: GameSkinFiles, fileHitsounds: IGameSkinHitsounds, filesHigh: Nullable<GameSkinFiles> = null) {
    this.name = name;
    this.author = author;
    this.version = version;
    this.elements = elements;
    this.normal = filesNormal;
    this.hitsounds = fileHitsounds;
    this.high = filesHigh;
  }

  create(useHighQualitySkin = false) {
    this.createHitsounds();
    if (this.high && useHighQualitySkin) this.high.create();
    else this.normal.create();
  }

  destroy() {
    this.destroyHitsounds();
    this.normal.destroy();
    if (this.high) this.high.destroy();
  }

  private createHitsounds() {
    this.hitsounds.tap.create();
    this.hitsounds.drag.create();
    this.hitsounds.flick.create();
  }

  private destroyHitsounds() {
    this.hitsounds.tap.destroy();
    this.hitsounds.drag.destroy();
    this.hitsounds.flick.destroy();
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

        // const skinElementsLow = createSkinElements(skinMeta.elements, fileListLow);
        // const skinClassLow = await createSkinFileClass(fileListLow, skinElementsLow);

        // let skinClassHigh: Nullable<GameSkinFiles> = null;
        // if (fileListHigh) {
        //   const skinElementHigh = createSkinElements(skinMeta.elements, fileListHigh);
        //   skinClassHigh = await createSkinFileClass(fileListHigh, skinElementHigh);
        // }

        // const fileHitsounds: IGameSkinHitsounds = {
        //   tap: new GameSkinFileSound((await ReadFileAsAudioBuffer((await fileList.get('hitsound-tap')!.async('blob'))))),
        //   drag: new GameSkinFileSound((await ReadFileAsAudioBuffer((await fileList.get('hitsound-drag')!.async('blob'))))),
        //   flick: new GameSkinFileSound((await ReadFileAsAudioBuffer((await fileList.get('hitsound-flick')!.async('blob')))))
        // };

        // // TODO: Skin meta
        // const skinResult = new GameSkin(
        //   skinMeta.name,
        //   skinMeta.author,
        //   skinMeta.version,
        //   skinMeta.elements,
        //   skinClassLow,
        //   fileHitsounds,
        //   skinClassHigh
        // );
        // this.set(skinMeta.name, skinResult);
        // res(skinResult);
        // this.setSkin(skinMeta.name);

        // console.log(skinMeta);
        // console.log(this);

        console.log(fileList);
        console.log(await getFilesByPath(fileList, 'number', true));
        console.log(await getFilesByPath(fileList, 'hit-effect', false));
        console.log(await GameSkinNew.from(skinMeta.name, skinMeta.author, skinMeta.version, skinMeta.elements, fileList));
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
