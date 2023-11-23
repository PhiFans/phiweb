import { Scene } from '@babylonjs/core/scene';
import { Texture } from '@babylonjs/core';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math';

export function materialGenerator(url: string, name: string, scene?: Scene) {
  const baseTexture = new Texture(url, scene);
  const material = new StandardMaterial(name, scene);

  baseTexture.hasAlpha = true;

  material.diffuseTexture = baseTexture;
  material.specularColor = new Color3(0, 0, 0);

  return material;
}