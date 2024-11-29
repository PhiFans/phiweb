import { IGameSkinFileNote, IGameSkinFileNotes } from './types';

export class GameSkinFiles {
  readonly notes: IGameSkinFileNotes;

  constructor(notes: IGameSkinFileNotes) {
    this.notes = notes;
  }

  create() {
    this.createTexture();
  }

  destroy() {
    this.destroyTexture();
  }

  private createTexture() {
    this.createTextureSingle(this.notes.tap);
    this.createTextureSingle(this.notes.drag);
    this.createTextureSingle(this.notes.hold.head);
    this.createTextureSingle(this.notes.hold.body);
    this.notes.hold.end.create();
    this.createTextureSingle(this.notes.flick);
  }

  private createTextureSingle(note: IGameSkinFileNote) {
    note.normal.create();
    note.highlight.create();
    return note;
  }

  private destroyTexture() {
    this.destroyTextureSingle(this.notes.tap);
    this.destroyTextureSingle(this.notes.drag);
    this.destroyTextureSingle(this.notes.hold.head);
    this.destroyTextureSingle(this.notes.hold.body);
    this.notes.hold.end.destroy();
    this.destroyTextureSingle(this.notes.flick);
  }

  private destroyTextureSingle(note: IGameSkinFileNote) {
    note.normal.destroy();
    note.highlight.destroy();
    return note;
  }
}
