
export interface IGameSkinMeta {
  name: string,
  author: string,
  version: string,
  elements: TGameSkinElement[]
}

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
  type: 'score' | 'combo' | 'accurate',
};

export type TGameSkinElementText = TGameSkinElementAligned & {
  type: 'song-name' | 'song-level' | 'song-artist',
  fontFamily: string,
  size: number,
};

export type TGameSkinElementTexture = TGameSkinElementPathed & TGameSkinElementAnchored & {
  type: 'image',
};

export type TGameSkinElementTextCustom = TGameSkinElementAligned & {
  type: 'text',
  fontFamily: string,
  text: string,
};

export type TGameSkinElementAnimation = TGameSkinElementPathed & TGameSkinElementAnchored & {
  type: 'animation',
  speed: number,
};

export type TGameSkinElementComboText = TGameSkinElementPathed & TGameSkinElementAnchored & {
  type: 'combo-text',
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
  TGameSkinElementText |
  TGameSkinElementTexture |
  TGameSkinElementTextCustom |
  TGameSkinElementAnimation |
  TGameSkinElementComboText |
  TGameSkinElementHitEffect
);

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
