import { Layout } from '@pixi/layout';
import { Container } from 'pixi.js';
import { TitleStage } from './title';

export class GameStage {
  private _currentStage: Layout = TitleStage;
  readonly stageContainer: Container;
  readonly stages: Record<string, Layout> = {
    title: TitleStage,
  };

  constructor(stageContainer: Container) {
    this.stageContainer = stageContainer;
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
