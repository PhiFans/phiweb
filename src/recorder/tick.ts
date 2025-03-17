import { GameRecorder } from '.';

const sleep = (time: number) => new Promise((res) => setTimeout(() => res(void 0), time));

export async function onRecordTick(this: GameRecorder) {
  const {
    game,
    clock
  } = this;
  const chart = game.chart!;

  const {
    time: currentTime,
    length: timeLength,
    fps,
  } = clock;
  chart.onChartTick(currentTime, chart.data.container!);
  chart.score.onScoreTick(currentTime, (fps / 1000));
  chart.score.ui.updateUIProgress(currentTime / timeLength);

  await sleep(1);

  if (clock.frameCurrent + 1 < clock.framesTotal) {
    clock.tick();
  } else {
    // Handle end recording
  }
}
