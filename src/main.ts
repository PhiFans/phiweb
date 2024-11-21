import { GameRenderer } from './renderer';
import { GameStage } from './stage';
import { GameAudio } from './audio';
import './style/index.css';

const StageCanvas = document.querySelector<HTMLCanvasElement>('canvas#app')!;

const app = new GameRenderer();
app.init({
  canvas: StageCanvas,
  backgroundColor: 0x000000,
}).then(() => initApp());

const initApp = async () => {
  const stages = new GameStage(app.containers.ui);
  stages.resize(app.renderer.width, app.renderer.height);

  const audio = new GameAudio();
  console.log(audio);

  // Resizer
  window.addEventListener('resize', () => {
    app.resize(document.documentElement.clientWidth, document.documentElement.clientHeight);

    stages.resize(app.renderer.width, app.renderer.height);
  });

  // For debug
  globalThis.__PIXI_RENDERER__ = app.renderer;
  globalThis.__PIXI_STAGE__ = app.stage;
};
