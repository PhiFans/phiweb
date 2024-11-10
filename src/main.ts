import { Text } from 'pixi.js';
import { GameRenderer } from './renderer';
import './style/index.css';

const StageCanvas = document.querySelector<HTMLCanvasElement>('canvas#app')!;

const app = new GameRenderer();
app.init({
  canvas: StageCanvas,
}).then(() => initApp());

const initApp = async () => {
  const text = new Text({
    text: 'Hello world!',
    style: {
      fill: 0x000000,
      fontSize: 24,
      align: 'center',
    },
  });

  text.anchor.set(0.5);
  text.position.set(
    app.renderer.width / 2,
    app.renderer.height / 2
  );

  app.stage.addChild(text);

  // Resizer
  window.addEventListener('resize', () => {
    app.resize(document.documentElement.clientWidth, document.documentElement.clientHeight);

    text.position.x = app.renderer.width / 2;
    text.position.y = app.renderer.height / 2;
  });

  // For debug
  globalThis.__PIXI_RENDERER__ = app.renderer;
  globalThis.__PIXI_STAGE__ = app.stage;
};