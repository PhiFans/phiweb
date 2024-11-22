import { Layout } from '@pixi/layout';
import { Container } from 'pixi.js';
import { TitleStage } from './title';
import { Game } from '@/game';

export class GameStage {
  private _currentStage: Layout = TitleStage;
  readonly game: Game;
  readonly stageContainer: Container;
  readonly stages: Record<string, Layout> = {
    title: TitleStage,
  };

  constructor(game: Game) {
    this.game = game;
    this.stageContainer = this.game.renderer.containers.ui;
    this.set('title');
  }

  get currentStage() {
    return this._currentStage;
  }

  unsetAll() {
    for (const name in this.stages) {
      this.stages[name].removeFromParent();
    }
  }

  set(name: string) {
    if (!this.stages[name]) throw new Error(`No such stage: ${name}`);
    this.unsetAll();

    this._currentStage = this.stages[name];
    this.stageContainer.addChild(this._currentStage);

    return this._currentStage;
  }

  resize(width: number, height: number) {
    for (const name in this.stages) {
      this.stages[name].resize(width, height);
    }
  }
}
