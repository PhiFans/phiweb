import { Layout } from '@pixi/layout';
import { Container } from 'pixi.js';
import { GameStageTitle } from './title';
import { Game } from '@/game';
import { Nullable } from '@/utils/types';
import { GameStagePausing } from './pausing';

export interface IGameStageBase {
  readonly game: Game;
  readonly layout: Layout;
}

type TGameStages = {
  title: GameStageTitle,
  pausing: GameStagePausing,
};

export class GameStage {
  private _currentStage?: IGameStageBase;
  readonly game: Game;
  readonly stageContainer: Container;
  readonly stages: TGameStages;

  constructor(game: Game) {
    this.game = game;
    this.stageContainer = this.game.renderer.containers.ui;

    this.stages = {
      title: new GameStageTitle(this.game),
      pausing: new GameStagePausing(this.game),
    };

    this.set('title');
  }

  get currentStage() {
    return this._currentStage;
  }

  unsetAll() {
    const stageNames = Object.keys(this.stages) as (keyof TGameStages)[];
    for (const name of stageNames) {
      this.stages[name].layout.removeFromParent();
    }
  }

  set(name: Nullable<keyof TGameStages>) {
    if (name === null) {
      this.unsetAll();
      return;
    };

    if (!this.stages[name]) throw new Error(`No such stage: ${name}`);
    this.unsetAll();

    this._currentStage = this.stages[name];
    this.stageContainer.addChild(this._currentStage.layout);

    return this._currentStage;
  }

  resize(width: number, height: number) {
    const stageNames = Object.keys(this.stages) as (keyof TGameStages)[];
    for (const name of stageNames) {
      this.stages[name].layout.resize(width, height);
    }
  }
}
