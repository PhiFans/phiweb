import { fetchFile } from '@ffmpeg/util';
import { GameRecorder } from '.';
import * as Overlay from '@/utils/overlay';
import { FFmpeg } from '@ffmpeg/ffmpeg';

const CHUNK_SIZE = 100;

const sleep = (time: number) => new Promise((res) => setTimeout(() => res(void 0), time));

const downloadFile = (name: string, fileData: Uint8Array | string) => {
  const dom = document.createElement('a');
  const file = new Blob([ fileData ]);
  const url = URL.createObjectURL(file);

  dom.href = url;
  dom.download = name;
  dom.click();
};

const processVidoeChunk = async (
  ffmpeg: FFmpeg,
  width: number,
  height: number,
  fps: number,
  beginFrame: number,
  frameCount: number = CHUNK_SIZE,
  useCodecWhenMerge = false,
) => {
  const chunkID = Math.floor(beginFrame / CHUNK_SIZE);
  const framesTxt = Array.from({ length: frameCount }, (_, i) => (
    `file '${beginFrame + i}.png'`
  )).join('\n');
  const frameFiles = new Array(frameCount * 2).fill(0);

  for (let i = 0, j = 0; i < frameFiles.length; i++) {
    if (i % 2 === 0) frameFiles[i] = '-i';
    else {
      frameFiles[i] = `${beginFrame + j}.png`;
      j++;
    }
  }

  await ffmpeg.writeFile('frames.txt', new TextEncoder().encode(framesTxt));
  await ffmpeg.exec([
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', 'frames.txt',
    '-frames:v', `${frameCount}`,
    '-video_track_timescale', '90000',
    '-vf', `settb=1/${fps},setpts=N/(${fps}*TB)`,
    '-x264-params', `keyint=${fps}:min-keyint=${fps}`,
    '-r', `${fps}`,
    '-frames:v', `${frameCount}`,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    `chunk_${chunkID}${chunkID !== 0 ? '_temp' : ''}.mp4`
  ]);

  if (chunkID !== 0) {
    // await ffmpeg.exec([
    //   '-i', `chunk_${chunkID - 1}.mp4`,
    //   '-i', `chunk_${chunkID}_temp.mp4`,
    //   '-c', 'copy',
    //   '-fflags', '+genpts',
    //   '-video_track_timescale', '90000',
    //   '-avoid_negative_ts', 'make_zero',
    //   `chunk_${chunkID}.mp4`
    // ]);

    await ffmpeg.exec([
      '-i', `chunk_${chunkID - 1}.mp4`,
      '-i', `chunk_${chunkID}_temp.mp4`,
      '-filter_complex', '[0][1]concat=n=2:v=1:a=0[outv]',
      '-map', '[outv]',
      '-fflags', '+genpts',
      '-r', `${fps}`,
      '-c:v', 'libx264',
      '-video_track_timescale', '90000',
      '-avoid_negative_ts', 'make_zero',
      `chunk_${chunkID}.mp4`
    ]);

    await ffmpeg.deleteFile(`chunk_${chunkID - 1}.mp4`);
    await ffmpeg.deleteFile(`chunk_${chunkID}_temp.mp4`);
  }

  for (let i = 0; i < frameCount; i++) {
    await ffmpeg.deleteFile(`${beginFrame + i}.png`);
  }
  await ffmpeg.deleteFile('frames.txt');
};

export async function onRecordTick(this: GameRecorder) {
  const {
    options,
    game,
    clock,
    ticker,
    ffmpeg,
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
  const frameCanvas = renderer.renderer.extract.canvas({
    target: renderer.stage,
    format: 'png',
    quality: 1,
  });
  const frameBase64 = frameCanvas.toDataURL!('image/png', 1);

  // FFmpeg processing
  await ffmpeg.writeFile(`${clock.frameCurrent}.png`, await fetchFile(frameBase64));
  if (clock.frameCurrent - this._beginFrame >= CHUNK_SIZE) {
    processVidoeChunk(
      ffmpeg,
      options.width,
      options.height,
      options.fps,
      this._beginFrame
    );
    this._beginFrame = clock.frameCurrent;
  }

  if (clock.frameCurrent + 1 < clock.framesTotal) {
    clock.tick();
    ticker.update();
  } else {
    const chunksTotal = Math.ceil(clock.framesTotal / CHUNK_SIZE);
    const framesRemain = clock.framesTotal - ((chunksTotal - 1) * CHUNK_SIZE);

    if (framesRemain > 0) {
      await processVidoeChunk(
        ffmpeg,
        options.width,
        options.height,
        options.fps,
        (chunksTotal - 1) * CHUNK_SIZE,
        framesRemain
      );
    }

    const result = await ffmpeg.readFile(`chunk_${chunksTotal - 1}.mp4`);
    downloadFile('output.mp4', result);
    // Handle end recording
  }
}
