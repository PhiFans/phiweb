import { GameSkinFileTexture } from './texture';
import { IGameSkinFileNote, IGameSkinFileNotes, IGameSkinFileTexts } from './types';

export class GameSkinFiles {
  readonly notes: IGameSkinFileNotes;
  readonly texts: IGameSkinFileTexts;

  constructor(notes: IGameSkinFileNotes, texts: IGameSkinFileTexts) {
    this.notes = notes;
    this.texts = texts;
  }

  create() {
    this.createTextureNote();
    this.createTextureTexts();
  }

  destroy() {
    this.destroyTextureNote();
    this.destroyTextureTexts();
  }

  private createTextureNote() {
    this.createTextureSingle(this.notes.tap);
    this.createTextureSingle(this.notes.drag);
    this.createTextureSingle(this.notes.hold.head);
    this.createTextureSingle(this.notes.hold.body);
    this.notes.hold.end.create();
    this.createTextureSingle(this.notes.flick);
  }

  private createTextureTexts() {
    this.createTextureArray(this.texts.score);
    this.createTextureArray(this.texts.accurate);
    this.createTextureArray(this.texts.combo);
  }

  private createTextureSingle(note: IGameSkinFileNote) {
    note.normal.create();
    note.highlight.create();
    return note;
  }

  private createTextureArray(texts: GameSkinFileTexture[]) {
    for (const text of texts) text.create();
    return texts;
  }

  private destroyTextureNote() {
    this.destroyTextureSingle(this.notes.tap);
    this.destroyTextureSingle(this.notes.drag);
    this.destroyTextureSingle(this.notes.hold.head);
    this.destroyTextureSingle(this.notes.hold.body);
    this.notes.hold.end.destroy();
    this.destroyTextureSingle(this.notes.flick);
  }

  private destroyTextureTexts() {
    this.destroyTextureArray(this.texts.score);
    this.destroyTextureArray(this.texts.accurate);
    this.destroyTextureArray(this.texts.combo);
  }

  private destroyTextureSingle(note: IGameSkinFileNote) {
    note.normal.destroy();
    note.highlight.destroy();
    return note;
  }

  private destroyTextureArray(texts: GameSkinFileTexture[]) {
    for (const text of texts) text.destroy();
    return texts;
  }
}
