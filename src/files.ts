import decodeAudio from 'audio-decode';
import { GameChartData } from './chart/data';
import { GameAudioClip } from './audio/clip';
import { GameAudio } from '@/audio';
import { ReadFileAsArrayBuffer, ReadFileAsText } from './utils/file';

type TGameFileChart = {
  type: 'chart',
  data: GameChartData,
};

type TGameFileAudio = {
  type: 'audio',
  data: GameAudioClip,
};

type TGameFile = TGameFileChart | TGameFileAudio;

export class GameFiles extends Map<string, TGameFile> {
  async from(_files: File | FileList) {
    const files: File[] = [];
    if (_files instanceof FileList) files.push(..._files);
    else files.push(_files);

    for (const file of files) {
      await this.fromSingle(file);
      console.log(this);
    }
  }

  getCharts() {
    const result: [ string, TGameFileChart ][] = [];
    this.forEach((value, filename) => {
      if (value.type === 'chart') result.push([ filename, value ]);
    });
    return new GameFiles(result);
  }

  getAudios() {
    const result: [ string, TGameFileAudio ][] = [];
    this.forEach((value, filename) => {
      if (value.type === 'audio') result.push([ filename, value ]);
    });
    return new GameFiles(result);
  }

  private fromSingle(file: File) {
    return (new Promise(() => {
      throw new Error('Promise chain!');
    })).catch(async () => {
      // Decode as chart file
      const fileText = await ReadFileAsText(file);
      const chartResult = await GameChartData.from(fileText);
      this.set(file.name, {
        type: 'chart',
        data: chartResult,
      });
    }).catch(async () => {
      // Decode as audio file
      const arrayBuffer = await ReadFileAsArrayBuffer(file);
      const audioBuffer = await decodeAudio(arrayBuffer);
      const audioResult = GameAudio.from(audioBuffer);
      this.set(file.name, {
        type: 'audio',
        data: audioResult,
      });
    }).catch(() => {
      console.error('Unsupported file type.');
    });
  }
}
