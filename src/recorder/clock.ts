
export class RecorderClock {
  private _fps = 60;
  private _length = 0;
  private _framesTotal = 0;
  private _frameCurrent = 0;

  tick() {
    if (this._frameCurrent + 1 >= this._framesTotal)
      this._frameCurrent = this._framesTotal - 1;
    else
      this._frameCurrent++;
  }

  get fps() {
    return this._fps;
  }

  set fps(fps: number) {
    this._fps = fps;
    this.calcFrames();
  }

  get length() {
    return this._length;
  }

  set length(length: number) {
    this._length = length;
    this.calcFrames();
  }

  get framesTotal() {
    return this._framesTotal;
  }

  get frameCurrent() {
    return this._frameCurrent;
  }

  set frameCurrent(frame: number) {
    if (frame + 1 >= this._framesTotal)
      this._frameCurrent = this._framesTotal - 1;
    else
      this._frameCurrent = frame;
  }

  private calcFrames() {
    this._framesTotal = Math.ceil((this._length / 1000) * this._fps);
  }
}
