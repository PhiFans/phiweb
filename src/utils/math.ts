import { TAreaPoint } from './types';

export const parseDoublePrecist = (double: number, precision: number = 0, mode: (-1 | 0 | 1) = 0) => {
  if (mode === 1) return Math.ceil(double * (10 ** precision)) / (10 ** precision);
  else if (mode === -1) return Math.floor(double * (10 ** precision)) / (10 ** precision);
  else return Math.round(double * (10 ** precision)) / (10 ** precision);
};

export const isPointInArea = (x: number, y: number, area: TAreaPoint): Boolean => {
  return x >= area[0] && x <= area[2] && y >= area[1] && y <= area[3];
};

export const isLinesCollinear = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
  return (y2 - y1) * (x3 - x1) === (y3 - y1) * (x2 - x1);
};

export const isLineOverlapped = (x1: number, x2: number, x3: number, x4: number) => {
  return Math.max(x1, x2) >= Math.min(x3, x4) && Math.max(x3, x4) >= Math.min(x1, x2);
}

export const isLineInArea = (point: TAreaPoint, area: TAreaPoint): Boolean => {
  const [ pointStartX, pointStartY, pointEndX, pointEndY ] = point;
  if (isPointInArea(pointStartX, pointStartY, area)) return true;
  if (isPointInArea(pointEndX, pointEndY, area)) return true;
  if (
    isLinesCollinear(...point, area[0], area[1]) &&
    isLinesCollinear(...point, area[2], area[3]) &&
    isLineOverlapped(point[0], point[2], area[0], area[2])
  ) return true;
  return false;
};
