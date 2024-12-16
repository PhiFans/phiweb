import { Graphics, Sprite, Texture } from 'pixi.js';
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

export class GameStagePausing implements IGameStageBase {
  readonly game: Game;
  readonly layout: Layout;

  readonly buttonResume: FancyButton;
  readonly buttonRestart: FancyButton;
  readonly buttonQuit: FancyButton;

  readonly sliderProgress: Slider;

  constructor(game: Game) {
    this.buttonResume = createButtonView('Resume');
    this.buttonRestart = createButtonView('Restart');
    this.buttonQuit = createButtonView('Quit');

    this.sliderProgress = createSliderView(400, 20);

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
}