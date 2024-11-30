import JSZip from 'jszip';
import { GameSkinFileTexture } from './texture';
import { IGameSkinElement } from '../types';

export type JSZipFiles = {
  [ key: string ]: JSZip.JSZipObject,
};
export type JSZipFilesMap = Map<string, JSZip.JSZipObject>;

export type IGameSkinElementFiles = IGameSkinElement & {
  files: JSZipFilesMap;
};

export interface IGameSkinFileBase<S = unknown, R = unknown> {
  readonly source: S,
  create: () => R,
  destroy: () => void,
}

export interface IGameSkinFileNote {
  readonly normal: GameSkinFileTexture,
  readonly highlight: GameSkinFileTexture,
}

export interface IGameSkinFileNoteHold {
  readonly head: IGameSkinFileNote,
  readonly body: IGameSkinFileNote,
  readonly end: GameSkinFileTexture,
}

export interface IGameSkinFileNotes {
  readonly tap: IGameSkinFileNote,
  readonly drag: IGameSkinFileNote,
  readonly hold: IGameSkinFileNoteHold,
  readonly flick: IGameSkinFileNote,
}

export interface IGameSkinFileTexts {
  readonly score: GameSkinFileTexture[],
  readonly accurate: GameSkinFileTexture[],
  readonly combo: GameSkinFileTexture[],
  // readonly comboText: GameSkinFileTexture, // TODO: Maybe move to elements
}
