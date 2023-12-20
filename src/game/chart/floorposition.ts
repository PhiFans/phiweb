
export class GameChartFloorPosition {
  readonly startTime: number;
  readonly floorPosition: number;

  constructor({
    startTime,
    floorPosition
  }: GameChartFloorPosition) {
    this.startTime = startTime;
    this.floorPosition = floorPosition;
  }
}