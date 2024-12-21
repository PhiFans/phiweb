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

export interface IFileImage extends IFileBasic {
  type: 'image',
  data: ImageBitmap,
}

export interface IFileAudio extends IFileBasic {
  type: 'audio',
  data: GameAudioClip,
}

export type IFile = IFileChart | IFileImage | IFileAudio;

export type TChartInfo = {
  name: string,
  artist: string,
  designer: string,
  level: string,
  illustrator: string,

  // Files
  chart: string,
  audio: string,
  image?: string,
  extraFiles: string[],
};

export type TChartInfoCSV = {
  Name: string,
  Designer: string,
  Level: string,
  Illustrator: string,

  Chart: string,
  Music: string,
  Image: string,
}

/* ==================== Math ==================== */
export type TAreaPoint = [
  /** Start X */
  number,
  /** Start Y */
  number,
  /** End X */
  number,
  /** End Y */
  number
];
