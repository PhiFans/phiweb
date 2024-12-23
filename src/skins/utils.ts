import {
  SkinFile,
  TGameSkinPlayfield,
  TGameSkinPlayfieldIDNote,
  TGameSkinSound,
  TGameSkinSoundIDHitsound
} from './types';

export const getFileByPath = (fileList: SkinFile[], path: string, highQuality = false): File => {
  const file = fileList.find((e) => e.name === path);
  const fileHigh = fileList.find((e) => e.name === `${path}@2x`);

  if (!file) throw new Error(`Cannot find skin file: ${path}`);
  if (fileHigh && highQuality) return new File([ fileHigh.file ], path);
  else return new File([ file.file ], path);
};

export const getFilesByPath = (fileList: SkinFile[], path: string, highQuality = false): Record<string, File> => {
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

export const createFontFamily = (name: string, file: Blob) => {
  const dom = document.createElement('style');
  dom.innerHTML = `@font-family {
  font-family: "${name}";
  src: url(${URL.createObjectURL(file)});
}`
  document.head.appendChild(dom);
  return dom;
};

// TODO: Need a better way to save it
export const getPlayfieldsFromList = (fileList: SkinFile[]): TGameSkinPlayfield[] => {
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

export const getSoundsFromList = (fileList: SkinFile[]): TGameSkinSound[] => {
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
