import { GameRecorder } from '.';
import * as Overlay from '@/utils/overlay';

const sleep = (time: number) => new Promise((res) => setTimeout(() => res(void 0), time));

export async function onRecordTick(this: GameRecorder) {
  const {
    game,
    clock,
    ticker,
  } = this;
  const chart = game.chart!;
  const {
    renderer
  } = game;

  Overlay.setSubtitle(`Processing frame ${clock.frameCurrent + 1}/${clock.framesTotal}...`);
  
  // Ticking chart
  const {
    time: currentTime,
    length: timeLength,
    fps,
  } = clock;
  chart.onChartTick(currentTime, chart.data.container!);
  chart.score.onScoreTick(currentTime, (fps / 1000));
  chart.score.ui.updateUIProgress(currentTime / timeLength);

  // Grab canvas content
  const framePixleData = renderer.renderer.extract.pixels({
    target: renderer.stage,
  });
  await sleep(0);

  if (clock.frameCurrent + 1 < clock.framesTotal) {
    clock.tick();
    ticker.update();
  } else {
    // Handle end recording
  }
}
