import { GameChartNote, IPhiChartNote } from './note';
import { GameChartEventLayer, IPhiChartEventLayer } from './eventlayer';
import { GameChartFloorPosition } from './floorposition';

export interface IPhiChartJudgeLine {
  // readonly id: number;
  readonly texture?: string;

  notes: Array<IPhiChartNote>;
  eventLayers: Array<IPhiChartEventLayer>;
}

export class GameChartJudgeLine implements IPhiChartJudgeLine {
  // readonly id: number;
  readonly texture?: string;

  notes: Array<GameChartNote>;
  eventLayers: Array<GameChartEventLayer>;
  floorPositions: Array<GameChartFloorPosition>;

  positionX: number;
  positionY: number;
  alpha: number;
  angle: number;
  speed: number;
  floorPosition: number;

  constructor({
    /* id, */
    texture
  }: GameChartJudgeLine) {
    // this.id = id;
    this.texture = texture;

    this.notes = new Array<GameChartNote>();
    this.eventLayers = new Array<GameChartEventLayer>();
    this.floorPositions = new Array<GameChartFloorPosition>(); // NOTE: Should function(s) of calculating floorPosition be written in class?

    // Init prop values
    this.positionX = 0;
    this.positionY = 0;
    this.alpha = 0;
    this.angle = 0;
    this.speed = 1;
    this.floorPosition = 0;
  }

  sortFloorPosition() {
    return this.floorPositions.sort((a, b) => b.startTime - a.startTime);
  }

  calculateValues(time: number) {
    this.calculateEventValues(time);
    this.floorPosition = this.calculateFloorPosition(time, this.floorPosition);
  }

  private calculateEventValues(time: number) {
    let posX = 0,
      posY = 0,
      alpha = 0,
      angle = 0,
      speed = 0;
    
    for (let i = 0, l = this.eventLayers.length; i < l; i++) {
      const eventLayer = this.eventLayers[i];
      
      eventLayer.calculateValues(time);

      posX += eventLayer.positionX;
      posY += eventLayer.positionY;
      alpha += eventLayer.alpha;
      angle += eventLayer.angle;
      speed += eventLayer.speed;
    }

    this.positionX = posX;
    this.positionY = posY;
    this.alpha = alpha;
    this.angle = angle;
    this.speed = speed;
  }

  // TODO: Add calculation with speed value later
  private calculateFloorPosition(time: number, fallbackValue = 0) {
    for (let i = 0, l = this.floorPositions.length; i < l; i++) {
      const floorPosition = this.floorPositions[i];

      if (floorPosition.startTime < time) continue;
      else return floorPosition.floorPosition;
    }

    return fallbackValue;
  }
}
