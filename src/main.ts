import { Game } from './game';
import './style/index.css';

const StageCanvas = document.querySelector<HTMLCanvasElement>('canvas#app')!;
const app = new Game();
app.init({
  canvas: StageCanvas,
  backgroundColor: 0x000000,
}).then(() => {
  // For debug
  globalThis.__PIXI_RENDERER__ = app.renderer.renderer;
  globalThis.__PIXI_STAGE__ = app.renderer.stage;
});

console.log(app);
