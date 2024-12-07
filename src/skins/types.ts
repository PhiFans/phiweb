
export interface IGameSkinMeta {
  name: string,
  author: string,
  version: string,
  elements: IGameSkinElement[]
}

export type TGameSkinElementTypeTexture = 'score' | 'accurate' | 'combo' | 'combo-text' | 'image';
export type TGameSkinElementTypeTextureAnimated = 'hit-effect' | 'image';
export type TGameSkinElementTypeText = 'song-name' | 'song-level' | 'song-artist' | 'text';
export type TGameSkinElementType = TGameSkinElementTypeTexture | TGameSkinElementTypeTextureAnimated | TGameSkinElementTypeText;

export interface IGameSkinElementBase {
  type: TGameSkinElementType,
  enabled: boolean,
  align: 'left' | 'center' | 'right',
  stickTo: {
    x: 'left' | 'center' | 'right',
    y: 'top' | 'center' | 'bottom',
  },
  position: IGameSkinElementCoordinate,
  scale: number,
}

export interface IGameSkinElementTexture extends IGameSkinElementBase {
  type: 'combo-text' | 'image',
  path: string,
  anchor: IGameSkinElementCoordinate,
}

export interface IGameSkinElementTextureNumber extends IGameSkinElementBase {
  type: 'score' | 'accurate' | 'combo',
  path: string,
}

export interface IGameSkinElementTextureAnimated extends IGameSkinElementBase {
  type: 'hit-effect' | 'image',
  path: string,
  anchor: IGameSkinElementCoordinate,
  speed: number,
}

export interface IGameSkinElementText extends IGameSkinElementBase {
  type: 'song-name' | 'song-level' | 'song-artist' | 'text',
  fontFamily: string,
  size: number,
}

export type IGameSkinElement = IGameSkinElementTexture | IGameSkinElementTextureNumber | IGameSkinElementTextureAnimated | IGameSkinElementText;

export interface IGameSkinElementCoordinate {
  x: number,
  y: number,
}
