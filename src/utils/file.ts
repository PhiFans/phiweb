import decodeAudio from 'audio-decode';
import JSZip from 'jszip';
import SparkMD5 from 'spark-md5';
import { GameChartData } from '@/chart/data';
import { GameAudio } from '@/audio';
import { Nullable } from './types';
import { IFile } from './types';

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
