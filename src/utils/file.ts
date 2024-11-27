import JSZip from 'jszip';
import { Nullable } from './types';

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
