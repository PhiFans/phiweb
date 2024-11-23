import { Graphics, Text } from 'pixi.js';
import { FancyButton } from '@pixi/ui';
import { Layout } from '@pixi/layout';
import { PopupReadFiles } from '@/utils/file';
import { IGameStageBase } from '.';
import { Game } from '@/game';

const createButtonView = (textStr: string, width: number = 160, height: number = 40) => {
  const button = new FancyButton({
    defaultView: new Graphics()
      .rect(0, 0, width, height)
      .fill(0x666666),
    hoverView: new Graphics()
      .rect(0, 0, width, height)
      .fill(0xAAAAAA),
    pressedView: new Graphics()
      .rect(0, 0, width, height)
      .fill(0x222222),
    text: new Text({
      text: textStr,
      style: {
        fill: 0xFFFFFF,
        fontWeight: 'bold',
      }
    })
  });
  return button;
};

export class GameStageTitle implements IGameStageBase {
  readonly game: Game;
  readonly layout: Layout;

  constructor(game: Game) {
    const TitleButtonLoadFiles = createButtonView('Load files');
    const TitleButtonStart = createButtonView('Start');

    TitleButtonLoadFiles.onPress.connect(() => this.onClickSelect());

    this.game = game;
    // XXX: How do i use this??
    this.layout = new Layout({
      content: [
        {
          content: TitleButtonLoadFiles,
          styles: {
            margin: 8,
          },
        },
        {
          content: TitleButtonStart,
          styles: {
            margin: 8,
          },
        },
      ],
      styles: {
        padding: 4,
      }
    });
  }

  private onClickSelect() {
    PopupReadFiles(true)
    .then((files) => {
      if (!files || files.length <= 0) return;
      this.game.files.from(files);
    });
  }
}
