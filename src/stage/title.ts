import { Graphics, Text } from 'pixi.js';
import { FancyButton, Select } from '@pixi/ui';
import { Layout } from '@pixi/layout';
import { PopupReadFiles } from '@/utils/file';
import { IGameStageBase } from '.';
import { Game } from '@/game';
import { GameChartData } from '@/chart/data';
import { GameAudioClip } from '@/audio/clip';

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

const createSelectItem = (textStr: string[]) => {
  const item = {
    items: textStr,
    width: 240,
    height: 40,
    backgroundColor: 0x666666,
    hoverColor: 0xAAAAAA,
    textStyle: {
      fill: 0xFFFFFF,
      margin: 8,
    },
    radius: 0,
  };
  return item;
}

const createSelectView = (width: number = 160, height: number = 40) => {
  const select = new Select({
    closedBG: new Graphics()
      .rect(0, 0, width, height)
      .fill(0x666666),
    openBG: new Graphics()
      .rect(0, 0, width, height)
      .fill(0xAAAAAA),
    textStyle: {
      fill: 0xFFFFFF,
      fontWeight: 'bold',
    },
    items: createSelectItem([]),
  });
  return select;
};

export class GameStageTitle implements IGameStageBase {
  readonly game: Game;
  readonly layout: Layout;

  selectorChart: Select;
  selectorAudio: Select;

  listsChart: string[] = [];
  listsAudio: string[] = [];

  selectedChart?: string;
  selectedAudio?: string;

  constructor(game: Game) {
    const TitleButtonLoadFiles = createButtonView('Load files');
    const TitleButtonLoadSkin = createButtonView('Load skin');
    const TitleButtonStart = createButtonView('Start');

    this.selectorChart = createSelectView(240);
    this.selectorAudio = createSelectView(240);

    this.selectorChart.onSelect.connect((_, text) => {
      this.selectedChart = text;
    });
    this.selectorAudio.onSelect.connect((_, text) => {
      this.selectedAudio = text;
    });

    TitleButtonLoadFiles.onPress.connect(() => this.onClickSelect());
    TitleButtonLoadSkin.onPress.connect(() => this.onClickSelectSkin());
    TitleButtonStart.onPress.connect(() => this.onStartGame());

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
          content: TitleButtonLoadSkin,
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
        {
          content: this.selectorChart,
          styles: {
            margin: 8,
          },
        },
        {
          content: this.selectorAudio,
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
      this.game.files.from(files)
        .then((fileList) => {
          const allCharts = fileList.getCharts();
          const allChartLists = [ ...allCharts.keys() ];
          const newChartLists = allChartLists.filter((e) => this.listsChart.indexOf(e) === -1);
          this.selectorChart.addItems(createSelectItem(newChartLists));
          this.listsChart.push(...newChartLists);

          const allAudios = fileList.getAudios();
          const allAudioLists = [ ...allAudios.keys() ];
          const newAudioLists = allAudioLists.filter((e) => this.listsAudio.indexOf(e) === -1);
          this.selectorAudio.addItems(createSelectItem(newAudioLists));
          this.listsAudio.push(...newAudioLists);

          // Select the first files automatically
          this.selectorChart.value = 0;
          this.selectorAudio.value = 0;
          this.selectedChart = this.listsChart[this.selectorChart.value];
          this.selectedAudio = this.listsAudio[this.selectorAudio.value];

          // Update the button's text to autofit
          // @ts-ignore 
          this.selectorChart.openButton.setState('default', true); this.selectorChart.closeButton.setState('default', true);
          // @ts-ignore 
          this.selectorAudio.openButton.setState('default', true); this.selectorAudio.closeButton.setState('default', true);
        });
    });
  }

  private onClickSelectSkin() {
    PopupReadFiles()
      .then((files) => {
        if (!files || !files[0]) return;
        const [ file ] = files;
        this.game.skins.load(file);
      });
  }

  private onStartGame() {
    if (!this.selectedChart || !this.selectedAudio) {
      console.error('No chart or audio selected');
      return;
    }

    const chartFile = this.game.files.get(this.selectedChart)!;
    const audioFile = this.game.files.get(this.selectedAudio)!;

    this.game.startChart(chartFile.data as GameChartData, audioFile.data as GameAudioClip);
  }
}
