import decodeAudio from 'audio-decode';
import JSZip from 'jszip';
import SparkMD5 from 'spark-md5';
import { GameChartData } from '@/chart/data';
import { GameAudio } from '@/audio';
import { Nullable, TChartInfo, TChartInfoCSV } from './types';
import { IFile } from './types';
import { Game } from '@/game';
import { TGameDBFile } from '@/storage';

export const PopupReadFiles = (multiple = false, accept: string | Array<string> = ''): Promise<Nullable<FileList>> => new Promise((res) => {
  const fileDOM = document.createElement('input');
  fileDOM.type = 'file';
  fileDOM.multiple = multiple;
  fileDOM.accept = typeof accept === 'string' ? accept : accept?.join(',');

  fileDOM.addEventListener('input', () => {
    const { files } = fileDOM;
    res(files);
  });

  fileDOM.click();
});

export const ReadFileAsText = (file: File | Blob): Promise<string> => new Promise((res, rej) => {
  const reader = new FileReader();

  reader.onload = () => {
    res(reader.result as string);
  };

  reader.onerror = (e) => {
    rej(e);
  };

  reader.readAsText(file);
});

export const ReadFileAsArrayBuffer = (file: File | Blob): Promise<ArrayBuffer> => new Promise((res, rej) => {
  const reader = new FileReader();

  reader.onload = () => {
    res(reader.result as ArrayBuffer);
  };

  reader.onerror = (e) => {
    rej(e);
  };

  reader.readAsArrayBuffer(file);
});

export const ReadFileAsAudioBuffer = (file: File | Blob): Promise<AudioBuffer> => new Promise(async (res, rej) => {
  try {
    const arrayBuffer = await ReadFileAsArrayBuffer(file);
    const audioBuffer = await decodeAudio(arrayBuffer);
    res(audioBuffer);
  } catch (e) {
    rej(e);
  }
});

export const getFileMD5 = (file: Blob, chunkSize = 2097152): Promise<string> => new Promise((res, rej) => {
  const fileSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
  const chunks = Math.ceil(file.size / chunkSize);
  const spark = new SparkMD5.ArrayBuffer();
  const reader = new FileReader();
  let currentChunk = 0;

  reader.onload = (e) => {
    spark.append((e.target as FileReader).result as ArrayBuffer);
    currentChunk++;

    if (currentChunk < chunks) loadChunk();
    else {
      res(spark.end());
      spark.destroy();
    }
  };

  reader.onerror = (e) => {
    rej(e);
  };

  function loadChunk() {
    const start = currentChunk * chunkSize;
    const end = (start + chunkSize) < file.size ? start + chunkSize : file.size;
    reader.readAsArrayBuffer(fileSlice.call(file, start, end));
  }

  loadChunk();
});

export const generateImageBitmap = (file: Blob, scale?: number): Promise<ImageBitmap> => new Promise(async (res, rej) => {
  try {
    const orig = await window.createImageBitmap(file);
    if (!scale || scale === 1) return res(orig);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = orig.width * scale;
    canvas.height = orig.height * scale;

    ctx.drawImage(orig, 0, 0, canvas.width, canvas.height);
    return res(await window.createImageBitmap(canvas));
  } catch (e) {
    rej(e);
  }
});

export const extractZip = (file: File): Promise<File[]> => new Promise((res) => {
  (new Promise(() => {
    throw new Error('Promise chain!');
  })).catch(async () => {
    // Decode as zip file
    const files = await unzipFile(file);
    res(files);
  }).catch(async () => {
    // Or just return an array
    res([ file ]);
  });
});

export const importChartFiles = (
  game: Game,
  files: File[] | FileList
): Promise<{
  files: TGameDBFile[],
  decodedFiles: IFile[],
  infos: TChartInfo[],
}> => new Promise(async (res) => {
  const allFiles: File[] = [];
  const chartInfos: TChartInfo[] = [];
  const supportedFiles: TGameDBFile[] = [];
  const decodedFiles: IFile[] = [];

  // Extract zip(s)
  for (const file of files) {
    allFiles.push(...(await extractZip(file)));
  }

  // Decode files
  for (const file of allFiles) {
    let isSupportedFile = false;

    (await (new Promise(() => {
      throw new Error('Promise chain!');
    })).catch(async () => {
      // Decode as chart file
      const fileText = await ReadFileAsText(file);
      const chartResult = await GameChartData.from(fileText);
      decodedFiles.push({
        filename: file.name,
        type: 'chart',
        data: chartResult,
      });
      isSupportedFile = true;
    }).catch(async () => {
      // Decode as image
      const bitmap = await window.createImageBitmap(file);
      decodedFiles.push({
        filename: file.name,
        type: 'image',
        data: bitmap
      });
      isSupportedFile = true;
    }).catch(async () => {
      // Decode as audio file
      const audioBuffer = await ReadFileAsAudioBuffer(file);
      const audioResult = GameAudio.from(audioBuffer);
      decodedFiles.push({
        filename: file.name,
        type: 'audio',
        data: audioResult,
      });
      isSupportedFile = true;
    }).catch(async () => {
      // Read chart info (info.csv)
      if (file.name !== 'info.csv') throw new Error('This may not a info file');
      const textRaw = await ReadFileAsText(file);
      const csvResult = decodeCSV<TChartInfoCSV>(textRaw);

      for (const csv of csvResult) {
        chartInfos.push({
          name: csv.Name,
          artist: 'Unknown',
          designer: csv.Designer,
          level: csv.Level,
          illustrator: csv.Illustrator,

          chart: csv.Chart,
          audio: csv.Music,
          image: csv.Image,
          extraFiles: [],
        });
      }
    }).catch(() => {
      console.warn(`Unsupported file type. File name: ${file.name}`);
    }));

    // Add supported files to storage
    if (isSupportedFile) {
      const fileInfo = await game.storage.addFile(file.name, file);
      supportedFiles.push({
        md5: fileInfo.md5,
        filename: file.name,
        blob: file,
      });
    }
  }

  // Push files to chart info
  for (const chartInfo of chartInfos) {
    chartInfo.chart = supportedFiles.find((e) => e.filename === chartInfo.chart)!.md5;
    chartInfo.audio = supportedFiles.find((e) => e.filename === chartInfo.audio)!.md5;
    chartInfo.image = supportedFiles.find((e) => e.filename === chartInfo.image)!.md5;

    chartInfo.extraFiles = [ ...supportedFiles
      .filter((e) => e.md5 !== chartInfo.chart)
      .filter((e) => e.md5 !== chartInfo.audio)
      .filter((e) => e.md5 !== (chartInfo.image || ''))
      .map((e) => e.md5)
    ];
  }

  res({
    files: supportedFiles,
    decodedFiles,
    infos: chartInfos,
  });
});

export const decodeFile = (file: File): Promise<IFile | File[]> => new Promise((res, rej) => {
  (new Promise(() => {
    throw new Error('Promise chain!');
  })).catch(async () => {
    // Decode as zip file
    const files = await unzipFile(file);
    res(files);
  }).catch(async () => {
    // Decode as chart file
    const fileText = await ReadFileAsText(file);
    const chartResult = await GameChartData.from(fileText);
    res({
      filename: file.name,
      type: 'chart',
      data: chartResult,
    });
  }).catch(async () => {
    // Decode as image
    const bitmap = await window.createImageBitmap(file);
    res({
      filename: file.name,
      type: 'image',
      data: bitmap
    });
  }).catch(async () => {
    // Decode as audio file
    const audioBuffer = await ReadFileAsAudioBuffer(file);
    const audioResult = GameAudio.from(audioBuffer);
    res({
      filename: file.name,
      type: 'audio',
      data: audioResult,
    });
  }).catch(() => {
    rej(`Unsupported file type. File name: ${file.name}`);
  });
});

export const unzipFile = (file: File | Blob): Promise<File[]> => new Promise((res, rej) => {
  JSZip.loadAsync(file, { createFolders: false })
    .then(async (files) => {
      const result = [];

      for (const name in files.files) {
        const file = files.files[name];
        result.push(new File(
          [ await file.async('blob') ],
          name,
          {
            lastModified: file.date.getTime(),
          }
        ));
      }

      res(result);
    })
    .catch(e => rej(e));
});

export const decodeCSV = <T extends { [key: string]: string }>(raw: string): T[] => {
  const rawLines = raw.split(/[\r\n]+/);
  const resultKeys: string[] = [];
  const result: T[] = [];

  for (const rawLine of rawLines) {
    const rawInfos = rawLine.split(/,/);
    if (resultKeys.length <= 0) resultKeys.push(...rawInfos);
    else {
      const info: Record<string, string> = {};
      for (let i = 0; i < resultKeys.length; i++) {
        const key = resultKeys[i];
        const value = rawInfos[i] || '';
        info[key] = value;
      }
      result.push(info as T);
    }
  }

  if (resultKeys.length <= 0 || result.length <= 0) throw new Error('Not a valid .csv file');
  return result;
};
