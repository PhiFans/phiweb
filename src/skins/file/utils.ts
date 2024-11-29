import JSZip from 'jszip';
import { GameSkinFileTexture } from './texture';
import { IGameSkinFileNote } from './types';

export const createNoteSkin = (fileList: Map<string, JSZip.JSZipObject>, name: string): Promise<IGameSkinFileNote> => new Promise(async (res) => {
  const normalBlob = await fileList.get(name)!.async('blob');
  const highlightBlib = await fileList.get(`${name}-highlight`)!.async('blob');

  res({
    normal: new GameSkinFileTexture((await window.createImageBitmap(normalBlob))),
    highlight: new GameSkinFileTexture((await window.createImageBitmap(highlightBlib))),
  });
});
