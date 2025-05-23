import { Texture } from 'pixi.js';
import { Clip } from '@phifans/audio';

export type SkinInput = File | Blob | string;
export type SkinFile = {
  name: string,
  nameExt: string,
  file: Blob,
};

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
export type TGameSkinElementType = TGameSkinElementTypeTexture | TGameSkinElementTypeText | 'hit-effect' | 'combo-text' | 'animation' | 'pause-button' | 'progress-bar';

export type TGameSkinElementStickTo = {
  x: 'left' | 'center' | 'right',
  y: 'top' | 'center' | 'bottom',
}

export type TGameSkinElementCoordinate = {
  x: number,
  y: number,
};

export type TGameSkinElementBase = {
  type: TGameSkinElementType,
  stickTo: TGameSkinElementStickTo,
  position: TGameSkinElementCoordinate,
  scale: number,
  alpha: number,
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

export type TGameSkinElementHitEffect = Omit<TGameSkinElementPathed & TGameSkinElementAnchored, 'position'> & {
  type: 'hit-effect',
  speed: number,
};

export type TGameSkinElementButtonPause = TGameSkinElementPathed & TGameSkinElementAnchored & {
  type: 'pause-button',
};

export type TGameSkinElementProgressBar = TGameSkinElementPathed & TGameSkinElementAnchored & {
  type: 'progress-bar',
  stickToEnd: TGameSkinElementStickTo,
  positionEnd: IGameSkinElementCoordinate,
};

export type TGameSkinElement = (
  TGameSkinElementNumber |
  TGameSkinElementNumberCombo |
  TGameSkinElementText |
  TGameSkinElementTexture |
  TGameSkinElementTextCustom |
  TGameSkinElementAnimation |
  TGameSkinElementComboText |
  TGameSkinElementHitEffect |
  TGameSkinElementButtonPause |
  TGameSkinElementProgressBar
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

export type TGameSkinElementFiledArray = TGameSkinElement & {
  type: 'score' | 'combo' | 'accurate' | 'combo-text' | 'hit-effect' | 'animation',
  file: TGameSkinFileArray,
  texture?: Record<string, Texture>,
};

export type TGameSkinElementFiledBase = TGameSkinElement & {
  type: 'image' | 'pause-button' | 'progress-bar',
  file: TGameSkinFile,
  texture?: Texture,
};

export type TGameSkinElementFiledNever = TGameSkinElement & {
  type: 'song-name' | 'song-level' | 'song-artist' | 'text',
};

export type TGameSkinElementFiledHitEffect = TGameSkinElementHitEffect & {
  file: TGameSkinFileArray,
  texture?: Record<string, Texture>,
}

export type TGameSkinElementFiled = TGameSkinElementFiledBase | TGameSkinElementFiledArray | TGameSkinElementFiledNever | TGameSkinElementFiledHitEffect;

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
  clip?: Clip,
};

export type TGameSkinSoundHitsound = TGameSkinSoundBase & {
  type: 'hitsound',
  id: TGameSkinSoundIDHitsound,
};

export type TGameSkinSound = TGameSkinSoundHitsound;

export type TGameSkinHitsounds = {
  tap: Clip,
  drag: Clip,
  flick: Clip,
};
