
export class ArrayIndexed<T> extends Array<T> {
  lastIndex: number = 0;

  reset() {
    this.lastIndex = 0;
  }
}
