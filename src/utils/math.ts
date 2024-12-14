
export const parseDoublePrecist = (double: number, precision: number = 0, mode: (-1 | 0 | 1) = 0) => {
  if (mode === 1) return Math.ceil(double * (10 ** precision)) / (10 ** precision);
  else if (mode === -1) return Math.floor(double * (10 ** precision)) / (10 ** precision);
  else return Math.round(double * (10 ** precision)) / (10 ** precision);
};
