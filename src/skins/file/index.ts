import { GameSkinFileTexture } from './texture';
import { IGameSkinFileNote, IGameSkinFileNotes, IGameSkinFileNumbers } from './types';

export class GameSkinFiles {
  readonly notes: IGameSkinFileNotes;
  readonly numbers: IGameSkinFileNumbers;

  constructor(notes: IGameSkinFileNotes, numbers: IGameSkinFileNumbers) {
    this.notes = notes;
    this.numbers = numbers;
  }

  create() {
    this.createTextureNote();
    this.createTextureNumbers();
  }

  destroy() {
    this.destroyTextureNote();
    this.destroyTextureNumbers();
  }

  private createTextureNote() {
    this.createTextureSingle(this.notes.tap);
    this.createTextureSingle(this.notes.drag);
    this.createTextureSingle(this.notes.hold.head);
    this.createTextureSingle(this.notes.hold.body);
    this.notes.hold.end.create();
    this.createTextureSingle(this.notes.flick);
  }

  private createTextureNumbers() {
    this.createTextureArray(this.numbers.score);
    this.createTextureArray(this.numbers.accurate);
    this.createTextureArray(this.numbers.combo);
  }

  private createTextureSingle(note: IGameSkinFileNote) {
    note.normal.create();
    note.highlight.create();
    return note;
  }

  private createTextureArray(numbers: GameSkinFileTexture[]) {
    for (const number of numbers) number.create();
    return numbers;
  }

  private destroyTextureNote() {
    this.destroyTextureSingle(this.notes.tap);
    this.destroyTextureSingle(this.notes.drag);
    this.destroyTextureSingle(this.notes.hold.head);
    this.destroyTextureSingle(this.notes.hold.body);
    this.notes.hold.end.destroy();
    this.destroyTextureSingle(this.notes.flick);
  }

  private destroyTextureNumbers() {
    this.destroyTextureArray(this.numbers.score);
    this.destroyTextureArray(this.numbers.accurate);
    this.destroyTextureArray(this.numbers.combo);
  }

  private destroyTextureSingle(note: IGameSkinFileNote) {
    note.normal.destroy();
    note.highlight.destroy();
    return note;
  }

  private destroyTextureArray(numbers: GameSkinFileTexture[]) {
    for (const number of numbers) number.destroy();
    return numbers;
  }
}
