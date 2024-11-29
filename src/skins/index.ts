import { Game } from '@/game';
import { GameSkinFiles } from './file';

export class GameSkin {
  readonly name: string;
  readonly author: string;
  readonly version: string;
  readonly normal: GameSkinFiles;
  readonly high?: GameSkinFiles;

  constructor(name: string, author: string, version: string, filesNormal: GameSkinFiles, filesHigh?: GameSkinFiles) {
    this.name = name;
    this.author = author;
    this.version = version;
    this.normal = filesNormal;
    this.high = filesHigh;
  }

  create() {
    this.normal.create();
    if (this.high) this.high.create();
  }

  destroy() {
    this.normal.destroy();
    if (this.high) this.high.destroy();
  }
}

export class GameSkins extends Map<string, GameSkin> {
  readonly game: Game;
  private _currentSkin?: GameSkin;

  constructor(game: Game) {
    super();

    this.game = game;
  }

  get currentSkin() {
    return this._currentSkin;
  }
}
