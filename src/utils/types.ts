import { GameChartData } from '@/chart/data';
import { GameAudioClip } from '@/audio/clip';

export type Nullable<T> = T | null;


/* ==================== Files ==================== */
export interface IFileBasic {
  filename: string,
  type: string,
  data: unknown,
}

export interface IFileChart extends IFileBasic {
  type: 'chart',
  data: GameChartData,
}

export interface IFileAudio extends IFileBasic {
  type: 'audio',
  data: GameAudioClip,
}

export type IFile = IFileChart | IFileAudio;
