import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Mesh } from '@babylonjs/core/Meshes/mesh';

import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Meshes/Builders/sphereBuilder';

import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('canvas#app')!;

const engine = new Engine(canvas);
let scene = new Scene(engine);

let camera = new FreeCamera('camera', new Vector3(0, 5, -10), scene);
camera.setTarget(Vector3.Zero());
camera.attachControl(canvas, false);

let light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
light.intensity = 0.7;

let sphere = Mesh.CreateSphere('sphere', 16, 2, scene);
sphere.position.y = 2;

engine.runRenderLoop(() => {
  scene.render();
});
