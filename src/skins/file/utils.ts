import JSZip from 'jszip';
import { GameSkinFileTexture, GameSkinFileTextureAnimated } from './texture';
import { IGameSkinFileNote, JSZipFilesMap } from './types';
import { IGameSkinElementFiles } from './types';
import { IGameSkinElementTextureAnimated, TGameSkinElementType, TGameSkinElementTypeTextureAnimated } from '../types';

export const createNoteSkin = (fileList: Map<string, JSZip.JSZipObject>, name: string): Promise<IGameSkinFileNote> => new Promise(async (res) => {
  const normalBlob = await fileList.get(name)!.async('blob');
  const highlightBlib = await fileList.get(`${name}-highlight`)!.async('blob');

  res({
    normal: new GameSkinFileTexture((await window.createImageBitmap(normalBlob))),
    highlight: new GameSkinFileTexture((await window.createImageBitmap(highlightBlib))),
  });
});

export const createNumbersSkin = (elements: IGameSkinElementFiles[], type: TGameSkinElementType, includeDot = false, includePercent = false): Promise<GameSkinFileTexture[]> => new Promise(async (res) => {
  const result: GameSkinFileTexture[] = [];
  const element = elements.find((e) => e.type === type);
  if (!element) throw new Error('No such element');

  for (let i = 0; i < 10; i++) {
    const file = element.files.get(`${i}`);
    if (!file) throw new Error(`Cannot found ID: ${i} for type: ${type}`);
    result.push(new GameSkinFileTexture((await window.createImageBitmap((await file.async('blob'))))));
  }

  if (includeDot) {
    result.push(new GameSkinFileTexture((await window.createImageBitmap((await element.files.get('dot')!.async('blob'))))));
    if (includePercent) result.push(new GameSkinFileTexture((await window.createImageBitmap((await element.files.get('percent')!.async('blob'))))));
  }

  if (result.length < 10) throw new Error(`No enough textures for type: ${type}`);
  return res(result);
});

export const createAnimatedSkin = (elements: IGameSkinElementFiles[], type: TGameSkinElementTypeTextureAnimated): Promise<GameSkinFileTextureAnimated> => new Promise(async (res) => {
  const result: ImageBitmap[] = [];
  const element = elements.find(e => e.type === type) as IGameSkinElementTextureAnimated & { files: JSZipFilesMap };
  if (!element) throw new Error(`No such element type: ${type}`);

  for (let i = 0, l = element.files.size; i < l; i++) {
    const file = element.files.get(`${i}`);
    if (!file) throw new Error(`Cannot found texture ID: ${i} for type: ${type}`);
    result.push((await window.createImageBitmap((await file.async('blob')))));
  }

  return res(new GameSkinFileTextureAnimated(result, element.speed));
});
