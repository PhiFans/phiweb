
export const parseDoublePrecist = (double: number, precision: number = 0) => Math.round(double * (10 ** precision)) / (10 ** precision);
