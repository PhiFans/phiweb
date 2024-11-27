import { decodeFile } from './utils/file';
import { IFile, IFileAudio, IFileChart } from './utils/types';

export class GameFiles extends Map<string, IFile> {
  from(_files: File | FileList): Promise<this> {
    return new Promise(async (res) => {
      const files: File[] = [];
      if (_files instanceof FileList) files.push(..._files);
      else files.push(_files);

      for (let i = 0; i < files.length; i++) {
        try {
          const result = await decodeFile(files[i]);
          if (result instanceof Array) result.forEach((file) => files.push(file));
          else this.set(result.filename, result);
        } catch (e) {
          console.error(e);
        }
      }

      console.log(this);
      res(this);
    });
  }

  getCharts() {
    const result: [ string, IFileChart ][] = [];
    this.forEach((value, filename) => {
      if (value.type === 'chart') result.push([ filename, value ]);
    });
    return new GameFiles(result);
  }

  getAudios() {
    const result: [ string, IFileAudio ][] = [];
    this.forEach((value, filename) => {
      if (value.type === 'audio') result.push([ filename, value ]);
    });
    return new GameFiles(result);
  }
}
