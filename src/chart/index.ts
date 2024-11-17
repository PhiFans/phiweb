
export class GameChart {
  static from(rawData: string) {
    return new Promise((res, rej) => {
      try {
        const rawDataJson: any = JSON.parse(rawData);
        if (typeof rawDataJson.formatVersion === 'number' && rawDataJson.formatVersion > 0) {

        } else {
          return rej('Unsupported chart format');
        }
      } catch (e) {
        console.error(e);
        return rej('Unsupported chart format');
      }
    });
  }
}
