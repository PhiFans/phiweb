import JSZip from 'jszip';
import { Texture, TextureSource } from 'pixi.js';
import { Game } from '@/game';
import { GameAudio } from '@/audio';
import { ReadFileAsAudioBuffer, downloadFile, generateImageBitmap } from '@/utils/file';
import {
  createFontFamily,
  getFileByPath,
  getFilesByPath,
  getPlayfieldsFromList,
  getSoundsFromList
} from './utils';
import {
  SkinFile,
  SkinInput,
  IGameSkinMeta,
  TGameSkinElement,
  TGameSkinElementCoordinate,
  TGameSkinPlayfield,
  TGameSkinSound,
  TGameSkinElementFiled,
  TGameSkinElementFiledArray,
  TGameSkinHitsounds
} from './types';

const RegFileExt = /\.([a-zA-Z\d]+)$/;

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
