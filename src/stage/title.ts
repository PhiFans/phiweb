import { Graphics } from 'pixi.js';
import { CheckBox, Select } from '@pixi/ui';
import { Layout } from '@pixi/layout';
import { PopupReadFiles } from '@/utils/file';
import { IGameStageBase } from '.';
import { Game } from '@/game';
import { GameChartData } from '@/chart/data';
import { GameAudioClip } from '@/audio/clip';
import { createButtonView } from './utils';

const LayerStyle = {
  marginTop: 8,
  width: '100%',
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

const createCheckboxView = (text: string, checked: boolean = false) => {
  const checkbox = new CheckBox({
    text, checked,
    style: {
      unchecked: new Graphics()
        .rect(0, 0, 40, 40)
        .fill(0x666666),
      checked: new Graphics()
        .rect(0, 0, 40, 40)
        .fill(0x666666)
        .rect(5, 5, 30, 30)
        .fill(0xAAAAAA),
      text: {
        fill: 0xFFFFFF,
      }
    }
  });
  return checkbox;
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

    const CheckAutoPlay = createCheckboxView('Auto play', game.options.autoPlay);
    const CheckHighQualitySkin = createCheckboxView('Use high quality skin', game.options.useHighQualitySkin);

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

    CheckAutoPlay.onChange.connect((e) => game.options.autoPlay = e as boolean);
    CheckHighQualitySkin.onChange.connect((e) => game.options.useHighQualitySkin = e as boolean);

    this.game = game;
    // XXX: How do i use this??
    this.layout = new Layout({
      content: {
        importLayer: {
          content: [
            {
              content: TitleButtonLoadFiles,
              styles: {
                marginRight: 4,
              },
            },
            {
              content: TitleButtonLoadSkin,
              styles: {
                marginLeft: 4,
              },
            },
          ],
          styles: LayerStyle
        },
        selectorLayer: {
          content: [
            {
              content: this.selectorChart,
              styles: {
                marginRight: 4,
              },
            },
            {
              content: this.selectorAudio,
              styles: {
                marginLeft: 4,
              },
            },
          ],
          styles: LayerStyle
        },
        optionsLayer: {
          content: [
            {
              content: CheckAutoPlay,
              styles: {
                marginRight: 4,
              },
            },
            {
              content: CheckHighQualitySkin,
              styles: {
                marginLeft: 4,
              },
            },
          ],
          styles: LayerStyle
        },
        startLayer: {
          content: [
            {
              content: TitleButtonStart,
            }
          ],
          styles: LayerStyle
        },
      },
      styles: {
        padding: 4,
        paddingLeft: 8,
        paddingRight: 8,
        width: '100%',
        height: '100%',
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
