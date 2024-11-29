import { GameSkinFileTexture } from './texture';

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
