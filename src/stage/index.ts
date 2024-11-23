import { Layout } from '@pixi/layout';
import { Container } from 'pixi.js';
import { GameStageTitle } from './title';
import { Game } from '@/game';

export abstract class GameStageBase {
  abstract readonly game: Game;
  abstract readonly layout: Layout;
}

export interface IGameStageBase {
  readonly game: Game;
  readonly layout: Layout;
}

export class GameStage {
  private _currentStage?: IGameStageBase;
  readonly game: Game;
  readonly stageContainer: Container;
  readonly stages: Record<string, IGameStageBase>;

  constructor(game: Game) {
    this.game = game;
    this.stageContainer = this.game.renderer.containers.ui;

    this.stages = {
      title: new GameStageTitle(this.game),
    };

    this.set('title');
  }

  get currentStage() {
    return this._currentStage;
  }

  unsetAll() {
    for (const name in this.stages) {
      this.stages[name].layout.removeFromParent();
    }
  }

  set(name: string) {
    if (!this.stages[name]) throw new Error(`No such stage: ${name}`);
    this.unsetAll();

    this._currentStage = this.stages[name];
    this.stageContainer.addChild(this._currentStage.layout);

    return this._currentStage;
  }

  resize(width: number, height: number) {
    for (const name in this.stages) {
      this.stages[name].layout.resize(width, height);
    }
  }
}
