import { Container, Graphics, Text } from 'pixi.js';
import { Button } from '@pixi/ui';
import { Layout } from '@pixi/layout';
import decodeAudio from 'audio-decode';
import { PopupReadFiles, ReadFileAsArrayBuffer, ReadFileAsText } from '@/utils/file';
import { GameChart } from '@/chart';
import { GameAudio } from '@/audio';

const createButtonView = (textStr: string) => {
  const container = new Container();
  const graphic = new Graphics();
  const text = new Text({
    text: textStr,
    style: {
      fill: 0xFFFFFF,
    },
  });

  graphic.fillStyle = 'grey';
  graphic.rect(0, 0, 120, 30)
    .fill();

  text.zIndex = 10;
  graphic.zIndex = 0;

  container.addChild(text);
  container.addChild(graphic);
  container.sortChildren();

  return container;
};

const TitleButtonLoadChart = new Button(createButtonView('Load chart'));
const TitleButtonLoadAudio = new Button(createButtonView('Load audio'));

TitleButtonLoadChart.onPress.connect(() => {
  PopupReadFiles()
    .then((e) => {
      if (!e || !e[0]) return;
      const [ chartBlob ] = e;

      ReadFileAsText(chartBlob)
        .then((e) => {
          GameChart.from(e)
            .then((e) => console.log(e));
        })
        .catch((e) => console.error(e));
    });
});

TitleButtonLoadAudio.onPress.connect(() => {
  PopupReadFiles()
    .then((e) => {
      if (!e || !e[0]) return;
      const [ audioBlob ] = e;

      ReadFileAsArrayBuffer(audioBlob)
        .then((e) => {
          decodeAudio(e)
            .then((e) => {
              console.log(GameAudio.from(e));
            })
            .catch((e) => console.error(e));
        })
        .catch((e) => console.error(e));
    });
});

// XXX: How do i use this??
const TitleStage = new Layout({
  content: [
    {
      id: 'title',
      content: 'Hello world',
      styles: {
        color: 0xFFFFFF,
        margin: 8,
      },
    },
    {
      content: TitleButtonLoadChart.view,
      styles: {
        margin: 8,
      },
    },
    {
      content: TitleButtonLoadAudio.view,
      styles: {
        margin: 8,
      },
    },
  ],
  styles: {
    padding: 4,
  }
});

export { TitleStage };