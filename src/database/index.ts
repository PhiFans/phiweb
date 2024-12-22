import { GameDatabaseEngine } from './engine';
import { extractZip, getFileMD5, decodeFile, ReadFileAsText, decodeCSV } from '@/utils/file';
import { GameStorage } from '@/storage';
import { TGameDBFile } from '@/storage';
import { IFile } from '@/utils/types';
import { TChartInfo, TChartInfoCSV } from '@/utils/types';

export class GameDatabase {
  readonly chart: GameDatabaseChart;

  constructor(storage: GameStorage) {
    this.chart = new GameDatabaseChart(storage);
  }
}

export class GameDatabaseChart extends GameDatabaseEngine {
  readonly storage: GameStorage;

  constructor(storage: GameStorage) {
    super('chart_db', 1, {
      structures: [
        { name: 'chart', options: { key: true } },
        { name: 'name', options: { index: true } }
      ],
      autoIncrement: true,
    });
    this.storage = storage;
  }

  importFiles(files: File[] | FileList): Promise<{
    files: TGameDBFile[],
    decodedFiles: IFile[],
    infos: TChartInfo[],
  }> {return new Promise(async (res) => {
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
      const fileMD5 = await getFileMD5(file);
      const oldFile = this.storage.getDecodedFile(fileMD5);
      let isSupportedFile = false;

      if (oldFile) {
        decodedFiles.push(oldFile.file);
        supportedFiles.push({
          md5: fileMD5,
          filename: file.name,
          blob: file,
        });
        continue;
      }

      (await (new Promise(() => {
        throw new Error('Promise chain!');
      })).catch(async () => {
        // Decode regular chart files
        const decodeResult = await decodeFile(file);
        decodedFiles.push(decodeResult as IFile);
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
        const fileInfo = await this.storage.addFile(file.name, file);

        this.storage.addDecodedFile(fileMD5, decodedFiles[decodedFiles.length - 1]);
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

    // Save chart info to dabatase
    for (const info of chartInfos) {
      if (!(await this.get(info.chart))) this.add(info);
    }

    res({
      files: supportedFiles,
      decodedFiles,
      infos: chartInfos,
    });
  })}

  getChartInfoByMD5(md5: string) {
    return this.get<TChartInfo>(md5);
  }

  getChartInfosByName(name: string) {return new Promise(async (res) => {
    const result: TChartInfo[] = [];
    const allCharts = await this.getAll<TChartInfo>();

    for (const chartInfo of allCharts) {
      if (chartInfo.name === name) result.push(chartInfo);
    }

    res(result);
  })}
}
