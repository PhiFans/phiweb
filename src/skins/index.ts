import JSZip from 'jszip';
import { Game } from '@/game';
import { GameSkinFiles } from './file';
import { GameSkinFileTexture } from './file/texture';
import { createAnimatedSkin, createNoteSkin, createNumbersSkin } from './file/utils';
import { Nullable } from '@/utils/types';
import { IGameSkinFileNotes, IGameSkinFileNumbers, IGameSkinHitsounds } from './file/types';
import { IGameSkinElement, IGameSkinElementTexture, IGameSkinMeta } from './types';
import { JSZipFiles, JSZipFilesMap, IGameSkinElementFiles } from './file/types';
import { ReadFileAsAudioBuffer } from '@/utils/file';
import { GameSkinFileSound } from './file/sound';

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

        const skinElementsLow = createSkinElements(skinMeta.elements, fileListLow);
        const skinClassLow = await createSkinFileClass(fileListLow, skinElementsLow);

        let skinClassHigh: Nullable<GameSkinFiles> = null;
        if (fileListHigh) {
          const skinElementHigh = createSkinElements(skinMeta.elements, fileListHigh);
          skinClassHigh = await createSkinFileClass(fileListHigh, skinElementHigh);
        }

        const fileHitsounds: IGameSkinHitsounds = {
          tap: new GameSkinFileSound((await ReadFileAsAudioBuffer((await fileList.get('hitsound-tap')!.async('blob'))))),
          drag: new GameSkinFileSound((await ReadFileAsAudioBuffer((await fileList.get('hitsound-drag')!.async('blob'))))),
          flick: new GameSkinFileSound((await ReadFileAsAudioBuffer((await fileList.get('hitsound-flick')!.async('blob')))))
        };

        // TODO: Skin meta
        const skinResult = new GameSkin(
          skinMeta.name,
          skinMeta.author,
          skinMeta.version,
          skinMeta.elements,
          skinClassLow,
          fileHitsounds,
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
