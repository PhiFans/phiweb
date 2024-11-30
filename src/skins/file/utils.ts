import JSZip from 'jszip';
import { GameSkinFileTexture } from './texture';
import { IGameSkinFileNote } from './types';
import { IGameSkinElementFiles } from './types';
import { EGameSkinElementType } from '../types';

export const createNoteSkin = (fileList: Map<string, JSZip.JSZipObject>, name: string): Promise<IGameSkinFileNote> => new Promise(async (res) => {
  const normalBlob = await fileList.get(name)!.async('blob');
  const highlightBlib = await fileList.get(`${name}-highlight`)!.async('blob');

  res({
    normal: new GameSkinFileTexture((await window.createImageBitmap(normalBlob))),
    highlight: new GameSkinFileTexture((await window.createImageBitmap(highlightBlib))),
  });
});

export const createNumbersSkin = (elements: IGameSkinElementFiles[], type: EGameSkinElementType): Promise<GameSkinFileTexture[]> => new Promise(async (res) => {
  const result: GameSkinFileTexture[] = [];
  const element = elements.find((e) => e.type === type);
  if (!element) throw new Error('No such element');

  for (let i = 0; i < 10; i++) {
    const file = element.files.get(`${i}`);
    if (!file) throw new Error(`Cannot found ID: ${i} for type: ${type}`);
    result.push(new GameSkinFileTexture((await window.createImageBitmap((await file.async('blob'))))));
  }

  if (result.length !== 10) throw new Error(`No enough textures for type: ${type}`);
  return res(result);
});
