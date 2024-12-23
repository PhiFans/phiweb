import JSZip from 'jszip';
import { Game } from '@/game';
import { TGameSkinElementCoordinate } from './types';
import { Texture, TextureSource } from 'pixi.js';
import { ReadFileAsAudioBuffer, downloadFile, generateImageBitmap } from '@/utils/file';
import { GameAudio } from '@/audio';
import {
  IGameSkinMeta,
  TGameSkinElement,
  TGameSkinPlayfield,
  TGameSkinPlayfieldIDNote,
  TGameSkinSound,
  TGameSkinSoundIDHitsound,
  TGameSkinElementFiled,
  TGameSkinElementFiledArray,
  TGameSkinHitsounds
} from './types';

type SkinInput = File | Blob | string;
type SkinFile = {
  name: string,
  nameExt: string,
  file: Blob,
};

const RegFileExt = /\.([a-zA-Z\d]+)$/;

const getFileByPath = (fileList: SkinFile[], path: string, highQuality = false): File => {
  const file = fileList.find((e) => e.name === path);
  const fileHigh = fileList.find((e) => e.name === `${path}@2x`);

  if (!file) throw new Error(`Cannot find skin file: ${path}`);
  if (fileHigh && highQuality) return new File([ fileHigh.file ], path);
  else return new File([ file.file ], path);
};

const getFilesByPath = (fileList: SkinFile[], path: string, highQuality = false): Record<string, File> => {
  const RegFile = new RegExp(`^${path.replace(/\//, '\\/')}-([\\da-zA-Z]+)(@2x)?$`);

  const result: Record<string, File> = {};
  const resultHigh: Record<string, File> = {};

  for (const file of fileList) {
    if (!RegFile.test(file.name)) continue;
    const regResult = RegFile.exec(file.name)!;

    if (regResult[2] === '@2x') resultHigh[regResult[1]] = new File([ file.file ], file.name);
    else result[regResult[1]] = new File([ file.file ], file.name);
  }

  if (Object.keys(resultHigh).length > 0 && highQuality) return resultHigh;
  else return result;
};

const createFontFamily = (name: string, file: Blob) => {
  const dom = document.createElement('style');
  dom.innerHTML = `@font-family {
  font-family: "${name}";
  src: url(${URL.createObjectURL(file)});
}`
  document.head.appendChild(dom);
  return dom;
};

// TODO: Need a better way to save it
const getPlayfieldsFromList = (fileList: SkinFile[]): TGameSkinPlayfield[] => {
  const RegPlayfieldTest = /^(note)-/;
  const RegPlayfieldNote = /^note-(tap|drag|hold-(head|body|end)|flick)(-highlight)?(@2x)?$/;
  const result: TGameSkinPlayfield[] = [];

  for (const file of fileList) {
    if (!RegPlayfieldTest.test(file.name)) continue;

    if (RegPlayfieldNote.test(file.name)) {
      const testResult = RegPlayfieldNote.exec(file.name)!;
      const id = testResult[1] as TGameSkinPlayfieldIDNote;
      const isHighlight = testResult[3] === '-highlight';
      const isHighQuality = testResult[4] === '@2x';
      const resultFile = new File([ file.file ], file.name);

      result.push({
        type: 'note', id,
        file: resultFile,
        isHighlight, isHighQuality,
      });

      if (id === 'hold-end') result.push({
        type: 'note', id,
        file: resultFile,
        isHighlight: true, isHighQuality,
      });
    }
  }

  return result;
};

const getSoundsFromList = (fileList: SkinFile[]): TGameSkinSound[] => {
  const RegHitsound = /^hitsound-(tap|drag|flick)$/;
  const result: TGameSkinSound[] = [];

  for (const file of fileList) {
    if (RegHitsound.test(file.name)) {
      const id = RegHitsound.exec(file.name)![1] as TGameSkinSoundIDHitsound;

      result.push({
        type: 'hitsound', id,
        file: new File([ file.file ], file.name),
      });
    }
  }

  return result;
};

export class GameSkin {
  readonly name: string;
  readonly author: string;
  readonly version: string;
  readonly elements: TGameSkinElementFiled[];
  readonly playfields: TGameSkinPlayfield[];
  readonly sounds: TGameSkinSound[];

  constructor(name: string, author: string, version: string, elements: TGameSkinElementFiled[], playfields: TGameSkinPlayfield[], sounds: TGameSkinSound[]) {
    this.name = name;
    this.author = author;
    this.version = version;
    this.elements = [ ...elements ];
    this.playfields = playfields;
    this.sounds = sounds;
  }

  create(useHighQuality = true) {return new Promise(async (res) => {
    const qualityName = useHighQuality ? 'high' : 'normal';
    const { elements, playfields, sounds, name } = this;

    const promiseElements: Promise<unknown>[] = [];
    const promisePlayfields: Promise<unknown>[] = [];
    const promiseSounds: Promise<unknown>[] = [];

    // Create texture(s) for elements
    for (const element of elements) {
      if (
        element.type === 'song-name' ||
        element.type === 'song-level' ||
        element.type === 'song-artist' ||
        element.type === 'text'
      ) continue;

      let promise: Promise<unknown>;
      if (
        element.type === 'image' ||
        element.type === 'pause-button' ||
        element.type === 'progress-bar'
      ) {
        promise = new Promise((res, rej) => {
          const file = element.file[qualityName];
          generateImageBitmap(file, useHighQuality ? 1 : 2)
            .then((bitmap) => {
              element.texture = new Texture({
                source: TextureSource.from(bitmap),
                label: `${name}: ${file.name}`,
                defaultAnchor: {
                  x: element.anchor ? element.anchor.x : 0,
                  y: element.anchor ? element.anchor.y : 0,
                }
              });
              res(element.texture);
            })
            .catch(e => rej(e));
        });
      } else {
        promise = new Promise((res, rej) => {
          const { file: _files, anchor } = (element as TGameSkinElementFiledArray & { anchor?: TGameSkinElementCoordinate });
          const files = _files[qualityName];
          const subPromises: Promise<[ string, Texture ]>[] = [];

          for (const name in files) {
            const file = files[name];
            subPromises.push(new Promise((res, rej) => {
              generateImageBitmap(file, useHighQuality ? 1 : 2)
                .then((bitmap) => {
                  const result = new Texture({
                    source: TextureSource.from(bitmap),
                    label: `${name}: ${file.name}`,
                    defaultAnchor: {
                      x: anchor ? anchor.x : 0,
                      y: anchor ? anchor.y : 0,
                    },
                  });
                  res([ name, result ]);
                })
                .catch(e => rej(e));
            }));
          }

          Promise.all<Promise<[ string, Texture ]>[]>(subPromises).then((_result) => {
            const result: Record<string, Texture> = {};
            for (const _subresult of _result) result[_subresult[0]] = _subresult[1];
            (element as TGameSkinElementFiledArray).texture = result;
            res(result);
          }).catch(e => rej(e));
        });
      }

      if (promise) promiseElements.push(promise);
    }

    for (const playfield of playfields) {
      promisePlayfields.push(new Promise((res, rej) => {
        generateImageBitmap(playfield.file, useHighQuality ? 1 : 2)
          .then((bitmap) => {
            const result = Texture.from(bitmap);
            result.label = `${name}: ${playfield.file.name}`;
            playfield.texture = result;
            res(result);
          })
          .catch(e => rej(e));
      }));
    }

    // Create audio clip for sounds
    for (const sound of sounds) {
      const { file } = sound;

      promiseSounds.push(new Promise((res, rej) => {
        ReadFileAsAudioBuffer(file)
          .then((buffer) => {
            const result = GameAudio.from(buffer);
            sound.clip = result;
            res(result);
          })
          .catch(e => rej(e));
      }));
    }

    await Promise.all(promiseElements);
    await Promise.all(promisePlayfields);
    await Promise.all(promiseSounds);

    res(this);
  })}

  get hitsounds(): TGameSkinHitsounds {
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
    fileList: SkinFile[]
  ): GameSkin {
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
              normal: getFilesByPath(fileList, e.path, false),
              high: getFilesByPath(fileList, e.path, true),
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
        case 'pause-button':
        case 'progress-bar':
        case 'image': {
          newElements.push({
            ...e,
            file: {
              normal: getFileByPath(fileList, e.path, false),
              high: getFileByPath(fileList, e.path, true),
            }
          });
          break;
        }
        default: {
          console.warn(`No such skin element type: ${(e as TGameSkinElement).type}, skipping...`);
        }
      }
    }

    return new GameSkin(
      name,
      author,
      version,
      newElements,
      getPlayfieldsFromList(fileList),
      getSoundsFromList(fileList)
    );
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
    else return this.loadFromURL(skin);
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

  private loadFromFile(skin: File | Blob): Promise<GameSkin> {return new Promise((res, rej) => {
    JSZip.loadAsync(skin, { createFolders: false })
      .then(async (result) => {
        const { files } = result;
        const skinMeta = await this.parseSkinMeta(files['skin.json']); // TODO: Skin meta
        const fileList: SkinFile[] = [];

        for (const name in files) {
          if (files[name].dir) continue;
          fileList.push({
            name: name.replace(RegFileExt, ''),
            nameExt: name,
            file: await files[name].async('blob'),
          });
        }

        this.loadFromFileList(skinMeta, fileList)
          .then((e) => res(e))
          .catch((e) => rej(e));
      })
      .catch((e) => {
        rej('Read skin file error, this may not a valid skin file.');
        console.error(e);
      });
  });}

  private loadFromURL(url: string): Promise<GameSkin> {return new Promise(async (res, rej) => {
    const blob = await downloadFile(url);

    (new Promise(() => {
      throw new Error('Promise chain!')
    })).catch(async () => {
      // Decode as zip skin
      const skin = await this.loadFromFile(blob);
      res(skin);
    }).catch(async () => {
      // TODO: Decode as skin meta
      throw new Error(`Read from online skin.json are not implemented`);
    }).catch(() => {
      rej(`Cannot load online skin from URL: ${url}`);
    });
  })}

  private loadFromFileList(meta: IGameSkinMeta, files: SkinFile[]): Promise<GameSkin> {return new Promise(async (res) => {
    const resultSkin = GameSkin.from(meta.name, meta.author, meta.version, meta.elements, files);

    for (const font of meta.fontFamilies) {
      const fontFile = files.find((e) => e.name === font.path);
      if (!fontFile) {
        console.warn(`Font path: ${font.path} not found, skipping...`);
        continue;
      }

      // TODO: For some reason `fontfaceobserver` is broken, wait for another implement for loading the font.
      createFontFamily(font.name, fontFile.file);
      await (new Promise((res) => setTimeout(() => res(void 0), 200)));
    }

    this.set(meta.name, resultSkin);
    res(resultSkin);
    this.setSkin(meta.name);

    console.log(resultSkin);
    console.log(files);
  })}

  get currentSkin() {
    return this._currentSkin;
  }
}
