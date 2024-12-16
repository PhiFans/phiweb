import { Graphics, Sprite, Text, Texture } from 'pixi.js';
import { FancyButton, Slider } from '@pixi/ui';
import { Layout } from '@pixi/layout';
import { Game } from '@/game';
import { createButtonView } from './utils';
import { IGameStageBase } from '.';

const createSliderView = (
  width: number,
  height: number,
  min: number = 0,
  max: number = 100,
  step: number = 1,
  value: number = 0
) => {
  const sliderBg = new Graphics().rect(0, 0, width, height).fill(0x222222);
  const sliderFill = new Graphics().rect(0, 0, width, height).fill(0x666666);
  const sliderHandle = new Graphics()
    .rect(-height / 2, -height / 2, height, height)
    .fill(0xaaaaaa);
  const slider = new Slider({
    bg: sliderBg,
    fill: sliderFill,
    slider: sliderHandle,
    min,
    max,
    step,
    value,
    showValue: false,
  });
  return slider;
};

const fillZero = (number: number, count = 2) => {
  let result = `${number}`;
  while (result.length < count) {
    result = '0' + result;
  }
  return result;
}
const numberToTime = (number: number) => `${fillZero(Math.floor(number / 60))}:${fillZero(Math.floor(number % 60))}`

export class GameStagePausing implements IGameStageBase {
  readonly game: Game;
  readonly layout: Layout;

  readonly buttonResume: FancyButton;
  readonly buttonRestart: FancyButton;
  readonly buttonQuit: FancyButton;

  readonly sliderProgress: Slider;

  private isUpdating: boolean = false;

  constructor(game: Game) {
    this.buttonResume = createButtonView('Resume');
    this.buttonRestart = createButtonView('Restart');
    this.buttonQuit = createButtonView('Quit');

    this.sliderProgress = createSliderView(400, 20);

    this.buttonResume.onPress.connect(() => this.game.resumeChart());
    this.buttonRestart.onPress.connect(() => this.game.restartChart());
    this.buttonQuit.onPress.connect(() => window.history.go(0));

    this.sliderProgress.onUpdate.connect((value) => this.onProgressChange(value));

    this.game = game;
    this.layout = new Layout({
      content: {
        backgroundLayout: {
          content: new Sprite(Texture.EMPTY),
          styles: {
            display: 'block',
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            opacity: 0.5,
          },
        },
        centerLayout: {
          content: {
            buttons: {
              content: [
                this.buttonResume,
                this.buttonRestart,
                this.buttonQuit,
              ],
              styles: {
                position: 'center',
                maxWidth: '100%',
              },
            },
          },
          styles: {
            position: 'center',
            width: '100%',
            height: 1,
          },
        },
        bottomLayout: {
          content: {
            sliderView: {
              content: [
                {
                  id: 'currentTime',
                  content: '00:00',
                  styles: {
                    marginRight: 12,
                    color: 0xFFFFFF,
                  },
                },
                {
                  content: this.sliderProgress,
                  styles: {
                    marginTop: 6,
                  },
                },
                {
                  id: 'totalTime',
                  content: '11:45',
                  styles: {
                    marginLeft: 12,
                    color: 0xFFFFFF,
                  },
                },
              ],
              styles: {
                position: 'center',
                maxWidth: '100%',
              },
            },
          },
          styles: {
            position: 'bottom',
            width: '100%',
            padding: 24,
            textAlign: 'center',
          },
        },
      },
      styles: {
        position: 'center',
        width: '100%',
        height: '100%',
      },
    });

    this.layout.zIndex = 10;
  }

  updateData(currentTime: number, totalTime: number) {
    const currentTimeText = this.layout.getChildByID('currentTime')!.children[0] as Text;
    const totalTimeText = this.layout.getChildByID('totalTime')!.children[0] as Text;

    currentTimeText.text = numberToTime(currentTime / 1000);
    totalTimeText.text = numberToTime(totalTime);

    this.isUpdating = true;

    this.sliderProgress.max = Math.floor(totalTime);
    this.sliderProgress.value = Math.floor(currentTime / 1000);

    setTimeout(() => this.isUpdating = false, 100);
  }

  private onProgressChange(value: number) {
    if (this.isUpdating) return;
    this.game.seekChart(value);

    const currentTimeText = this.layout.getChildByID('currentTime')!.children[0] as Text;
    currentTimeText.text = numberToTime(value);
  }
}
