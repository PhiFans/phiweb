import JSZip from 'jszip';
import { Game } from '@/game';
import { IGameSkinMeta } from './types';
import { JSZipFiles, JSZipFilesMap } from './file/types';
import { TGameSkinElement } from './types';
import { GameAudioClip } from '@/audio/clip';
import { Texture } from 'pixi.js';

// TODO: Move all types to `./types`
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
  texture?: Texture[],
};

type TGameSkinElementFiledBase = TGameSkinElement & {
  type: 'image',
  file: TGameSkinFile,
  texture?: Texture,
};

type TGameSkinElementFiledBaseNever = TGameSkinElement & {
  type: 'song-name' | 'song-level' | 'song-artist' | 'text',
};

type TGameSkinElementFiled = TGameSkinElementFiledBase | TGameSkinElementFiledBaseArray | TGameSkinElementFiledBaseNever;

type TGameSkinSoundType = 'hitsound';
type TGameSkinSoundIDHitsound = 'tap' | 'drag' | 'flick';

type TGameSkinSoundBase = {
  type: TGameSkinSoundType,
  id: string,
  file: File,
  clip?: GameAudioClip,
};

type TGameSkinSoundHitsound = TGameSkinSoundBase & {
  type: 'hitsound',
  id: TGameSkinSoundIDHitsound,
};

type TGameSkinSound = TGameSkinSoundHitsound;

type TGameSkinHitsounds = {
  tap: GameAudioClip,
  drag: GameAudioClip,
  flick: GameAudioClip,
};

type SkinInput = File | Blob | string;

const RegFileExt = /\.([a-zA-Z\d]+)$/;

const getFileListFromZip = (files: JSZipFiles): JSZipFilesMap => {
  const result: [ string, JSZip.JSZipObject ][] = [];
  for (const name in files) {
    const file = files[name];
    if (file.dir) continue;
    result.push([ name.replace(RegFileExt, ''), file ]);
  }
  return new Map(result);
};

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

const getSoundsFromList = (fileList: JSZipFilesMap): Promise<TGameSkinSound[]> => new Promise(async (res) => {
  const RegHitsound = /^hitsound-(tap|drag|flick)$/;

  const fileNames = fileList.keys();
  const result: TGameSkinSound[] = [];

  for (const filename of fileNames) {
    const file = fileList.get(filename)!;

    if (RegHitsound.test(filename)) {
      const id = RegHitsound.exec(filename)![1] as TGameSkinSoundIDHitsound;

      result.push({
        type: 'hitsound', id,
        file: new File([ await file.async('blob') ], filename),
      });
    }
  }

  return res(result);
});

export class GameSkin {
  readonly name: string;
  readonly author: string;
  readonly version: string;
  readonly elements: TGameSkinElementFiled[];
  readonly sounds: TGameSkinSound[];

  constructor(name: string, author: string, version: string, elements: TGameSkinElementFiled[], sounds: TGameSkinSound[]) {
    this.name = name;
    this.author = author;
    this.version = version;
    this.elements = [ ...elements ];
    this.sounds = sounds;
  }

  getHitsounds(): TGameSkinHitsounds {
    const { sounds } = this;
    return {
      tap: sounds.find((e) => e.type === 'hitsound' && e.id === 'tap')!.clip!,
      drag: sounds.find((e) => e.type === 'hitsound' && e.id === 'drag')!.clip!,
      flick: sounds.find((e) => e.type === 'hitsound' && e.id === 'flick')!.clip!,
    }
  }

  static from(
    name: string,
    author: string,
    version: string,
    elements: TGameSkinElement[],
    fileList: JSZipFilesMap
  ): Promise<GameSkin> {return new Promise(async (res) => {
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
          newElements.push({ ...e });
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

    return res(new GameSkin(name, author, version, newElements, await getSoundsFromList(fileList)));
  })}
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
        const resultSkin = await GameSkin.from(skinMeta.name, skinMeta.author, skinMeta.version, skinMeta.elements, fileList);

        this.set(skinMeta.name, resultSkin);
        res(resultSkin);
        this.setSkin(skinMeta.name);

        console.log(resultSkin);
        console.log(fileList);
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
