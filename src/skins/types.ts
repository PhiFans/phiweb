
export enum EGameSkinElementType {
  // Textures
  SCORE = 'score',
  ACCURATE = 'accurate',
  COMBO = 'combo',
  COMBO_TEXT = 'combo-text',
  IMAGE = 'image',

  // Text
  SONG_NAME = 'song-name',
  SONG_LEVEL = 'song-level',
  SONG_ARTIST = 'song-artist',
  TEXT = 'text',
}

export interface IGameSkinMeta {
  name: string,
  author: string,
  version: string,
  elements: IGameSkinElement[]
}

export type TGameSkinElementTypeTexture = (
  EGameSkinElementType.SCORE |
  EGameSkinElementType.ACCURATE |
  EGameSkinElementType.COMBO |
  EGameSkinElementType.COMBO_TEXT |
  EGameSkinElementType.IMAGE
);
export type TGameSkinElementTypeText = (
  EGameSkinElementType.SONG_NAME |
  EGameSkinElementType.SONG_LEVEL |
  EGameSkinElementType.SONG_ARTIST |
  EGameSkinElementType.TEXT
);

export interface IGameSkinElementBase {
  type: string,
  enabled: boolean,
  align: 'left' | 'center' | 'right',
  anchor: IGameSkinElementCoordinate,
  position: IGameSkinElementCoordinate,
  scale: number,
}

export interface IGameSkinElementTexture extends IGameSkinElementBase {
  type: TGameSkinElementTypeTexture,
  path: string,
}

export interface IGameSkinElementText extends IGameSkinElementBase {
  type: TGameSkinElementTypeText,
  fontFamily: string,
  size: number,
}

export type IGameSkinElement = IGameSkinElementTexture | IGameSkinElementText;

export interface IGameSkinElementCoordinate {
  x: number,
  y: number,
}
