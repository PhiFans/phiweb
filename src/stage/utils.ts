import { Graphics, Text } from 'pixi.js';
import { FancyButton } from '@pixi/ui';

export const createButtonView = (textStr: string, width: number = 160, height: number = 40) => {
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
