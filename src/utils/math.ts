
export const parseDoublePrecist = (double: number, precision: number = 0, round = true) => {
  if (round) return Math.round(double * (10 ** precision)) / (10 ** precision);
  else return Math.floor(double * (10 ** precision)) / (10 ** precision);
};
