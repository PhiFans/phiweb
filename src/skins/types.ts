import JSZip from 'jszip';
import { Texture } from 'pixi.js';
import { GameAudioClip } from '@/audio/clip';

export type JSZipFiles = {
  [ key: string ]: JSZip.JSZipObject,
};
export type JSZipFilesMap = Map<string, JSZip.JSZipObject>;


export interface IGameSkinMeta {
  name: string,
  author: string,
  version: string,
  fontFamilies: TGameSkinFontFamily[],
  elements: TGameSkinElement[]
}

export type TGameSkinFontFamily = {
  name: string,
  path: string,
};

export type TGameSkinElementTypeTexture = 'score' | 'accurate' | 'combo' | 'image';
export type TGameSkinElementTypeText = 'song-name' | 'song-level' | 'song-artist' | 'text';
export type TGameSkinElementType = TGameSkinElementTypeTexture | TGameSkinElementTypeText | 'hit-effect' | 'combo-text' | 'animation';

export type TGameSkinElementCoordinate = {
  x: number,
  y: number,
};

export type TGameSkinElementBase = {
  type: TGameSkinElementType,
  enabled: boolean,
  stickTo: {
    x: 'left' | 'center' | 'right',
    y: 'top' | 'center' | 'bottom',
  },
  position: TGameSkinElementCoordinate,
  scale: number,
};

export type TGameSkinElementPathed = TGameSkinElementBase & {
  path: string,
};

export type TGameSkinElementAnchored = TGameSkinElementBase & {
  anchor: TGameSkinElementCoordinate,
};

export type TGameSkinElementAligned = TGameSkinElementBase & {
  align: 'left' | 'center' | 'right',
};

export type TGameSkinElementNumber = TGameSkinElementPathed & TGameSkinElementAligned & {
  type: 'score' | 'accurate',
};

export type TGameSkinElementNumberCombo = TGameSkinElementPathed & TGameSkinElementAligned & {
  type: 'combo',
  autoHide: boolean,
};

export type TGameSkinElementText = TGameSkinElementAligned & TGameSkinElementAnchored & {
  type: 'song-name' | 'song-level' | 'song-artist',
  fontFamily: string,
  size: number,
};

export type TGameSkinElementTexture = TGameSkinElementPathed & TGameSkinElementAnchored & {
  type: 'image',
};

export type TGameSkinElementTextCustom = TGameSkinElementAligned & TGameSkinElementAnchored & {
  type: 'text',
  fontFamily: string,
  text: string,
  size: number,
};

export type TGameSkinElementAnimation = TGameSkinElementPathed & TGameSkinElementAnchored & {
  type: 'animation',
  speed: number,
};

export type TGameSkinElementComboText = TGameSkinElementPathed & TGameSkinElementAnchored & {
  type: 'combo-text',
  autoHide: boolean,
};

export type TGameSkinElementHitEffect = {
  type: 'hit-effect',
  path: string,
  anchor: TGameSkinElementCoordinate,
  scale: number,
  speed: number,
};

export type TGameSkinElement = (
  TGameSkinElementNumber |
  TGameSkinElementNumberCombo |
  TGameSkinElementText |
  TGameSkinElementTexture |
  TGameSkinElementTextCustom |
  TGameSkinElementAnimation |
  TGameSkinElementComboText |
  TGameSkinElementHitEffect
);

export interface IGameSkinElementCoordinate {
  x: number,
  y: number,
}

export type TGameSkinFile = {
  normal: File,
  high: File,
};

export type TGameSkinFileArray = {
  normal: Record<string, File>,
  high: Record<string, File>,
};

export type TGameSkinElementFiledBaseArray = TGameSkinElement & {
  type: 'score' | 'combo' | 'accurate' | 'combo-text' | 'hit-effect' | 'animation',
  file: TGameSkinFileArray,
  texture?: Record<string, Texture>,
};

export type TGameSkinElementFiledBase = TGameSkinElement & {
  type: 'image',
  file: TGameSkinFile,
  texture?: Texture,
};

export type TGameSkinElementFiledBaseNever = TGameSkinElement & {
  type: 'song-name' | 'song-level' | 'song-artist' | 'text',
};

export type TGameSkinElementFiled = TGameSkinElementFiledBase | TGameSkinElementFiledBaseArray | TGameSkinElementFiledBaseNever;

export type TGameSkinPlayfieldType = 'note';
export type TGameSkinPlayfieldIDNote = 'tap' | 'drag' | 'hold-head' | 'hold-body' | 'hold-end' | 'flick';

export type TGameSkinPlayfieldBase = {
  type: TGameSkinPlayfieldType,
  id: string,
  isHighQuality: boolean,
  file: File,
  texture?: Texture,
};

export type TGameSkinPlayfieldNote = TGameSkinPlayfieldBase & {
  type: 'note',
  id: TGameSkinPlayfieldIDNote,
  isHighlight: boolean,
};

export type TGameSkinPlayfield = TGameSkinPlayfieldNote;

export type TGameSkinSoundType = 'hitsound';
export type TGameSkinSoundIDHitsound = 'tap' | 'drag' | 'flick';

export type TGameSkinSoundBase = {
  type: TGameSkinSoundType,
  id: string,
  file: File,
  clip?: GameAudioClip,
};

export type TGameSkinSoundHitsound = TGameSkinSoundBase & {
  type: 'hitsound',
  id: TGameSkinSoundIDHitsound,
};

export type TGameSkinSound = TGameSkinSoundHitsound;

export type TGameSkinHitsounds = {
  tap: GameAudioClip,
  drag: GameAudioClip,
  flick: GameAudioClip,
};
