/// <reference types="vite/client" />

import type { Application, Container, AbstractRenderer } from "pixi.js";

declare global {
  interface Window {
    webkitAudioContext: AudioContext,
  }

  // For Devtool
  var __PIXI_APP__ = new Application;
  var __PIXI_STAGE__ = new Container;
  var __PIXI_RENDERER__ = new AbstractRenderer;
}