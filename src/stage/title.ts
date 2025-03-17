import { Graphics } from 'pixi.js';
import { CheckBox, Select } from '@pixi/ui';
import { Layout } from '@pixi/layout';
import { PopupReadFiles } from '@/utils/file';
import { IGameStageBase } from '.';
import { Game } from '@/game';
import { createButtonView } from './utils';
import { Nullable, TChartInfo } from '@/utils/types';

const LayerStyle = {
  marginTop: 8,
  width: '100%',
};

const createSelectItem = (infos: TChartInfo[], width = 240) => {
  const item = {
    items: infos.map((info) => `${info.name} - ${info.level} - ${info.designer}`),
    width, height: 40,
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

  listsChart: TChartInfo[] = [];
  selectedChart: Nullable<TChartInfo> = null;

  constructor(game: Game) {
    game.database.chart.getAll()
      .then((charts) => {
        this.updateChartList(charts as TChartInfo[]);
      });

    const TitleButtonLoadFiles = createButtonView('Load files');
    const TitleButtonLoadSkin = createButtonView('Load skin');
    const TitleButtonStart = createButtonView('Start');

    const CheckRecordMode = createCheckboxView('Record Mode', game.options.recordMode);
    const CheckAutoPlay = createCheckboxView('Auto play', game.options.autoPlay);
    const CheckHighQualitySkin = createCheckboxView('Use high quality skin', game.options.useHighQualitySkin);

    this.selectorChart = createSelectView(400);
    this.selectorChart.onSelect.connect((_, text) => {
      const optionMatch = text.match(/^(.+)\s-\s(.+)\s-\s(.+)$/)!;
      const [ , optionName, optionLevel, optionDesigner ] = optionMatch;
      const chartInfo = this.listsChart.find((e) => e.name === optionName && e.level === optionLevel && e.designer === optionDesigner);
      if (!chartInfo) return;
      this.selectedChart = chartInfo;
    });

    TitleButtonLoadFiles.onPress.connect(() => this.onClickSelect());
    TitleButtonLoadSkin.onPress.connect(() => this.onClickSelectSkin());
    TitleButtonStart.onPress.connect(() => this.onStartGame());

    CheckRecordMode.onChange.connect((e) => game.options.recordMode = e as boolean);
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
                marginRight: 4,
              },
            },
            {
              content: this.selectorChart,
              styles: {
                marginLeft: 8,
              },
            },
          ],
          styles: LayerStyle
        },
        optionsLayer: {
          content: [
            {
              content: CheckRecordMode,
            },
          ],
          styles: LayerStyle
        },
        optionsLayer2: {
          content: [
            {
              content: CheckAutoPlay,
            },
          ],
          styles: LayerStyle
        },
        optionsLayer3: {
          content: [
            {
              content: CheckHighQualitySkin,
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
        this.game.database.chart.importFiles(files)
          .then((e) => {
            this.updateChartList(e.infos);
          });
      });
  }

  private updateChartList(newList: TChartInfo[]) {
    this.selectorChart.addItems(createSelectItem(newList, 400));
    this.listsChart.push(...newList);

    // Update the button's text to autofit
    // @ts-ignore
    this.selectorChart.openButton.setState('default', true); this.selectorChart.closeButton.setState('default', true);
    if (this.selectedChart === null) this.selectedChart = this.listsChart[0];
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
    if (!this.selectedChart) {
      console.error('No chart selected');
      return;
    }
    this.game.startChart(this.selectedChart);
  }
}
