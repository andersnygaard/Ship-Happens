/**
 * ShipModel — A simple low-poly ship built from basic Three.js geometries.
 *
 * Hull (stretched box), bridge (smaller box on top), bow (wedge at front),
 * and a funnel. Gray/white materials for a classic cargo-ship look.
 */

import * as THREE from "three";
import type { OceanScene } from "./OceanScene";

const HULL_COLOR = 0x555566;
const SUPERSTRUCTURE_COLOR = 0xcccccc;
const FUNNEL_COLOR = 0xcc3333;

export class ShipModel {
  public readonly group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.buildHull();
    this.buildBow();
    this.buildBridge();
    this.buildFunnel();
  }

  private buildHull(): void {
    const hullGeo = new THREE.BoxGeometry(2, 0.8, 6);
    const hullMat = new THREE.MeshStandardMaterial({
      color: HULL_COLOR,
      flatShading: true,
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.set(0, 0, 0);
    this.group.add(hull);

    // Deck (slightly lighter, thin slab on top of hull)
    const deckGeo = new THREE.BoxGeometry(1.8, 0.1, 5.8);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      flatShading: true,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 0.45, 0);
    this.group.add(deck);
  }

  private buildBow(): void {
    // Wedge shape at the front using a custom geometry (triangular prism)
    const bowShape = new THREE.Shape();
    bowShape.moveTo(0, -0.4);
    bowShape.lineTo(1, -0.4);
    bowShape.lineTo(0.5, -0.4);
    bowShape.lineTo(0, -0.4);

    // Use a cone-like shape for simplicity
    const bowGeo = new THREE.ConeGeometry(1, 2, 4);
    const bowMat = new THREE.MeshStandardMaterial({
      color: HULL_COLOR,
      flatShading: true,
    });
    const bow = new THREE.Mesh(bowGeo, bowMat);
    bow.rotation.x = Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.scale.set(0.7, 1, 0.28);
    bow.position.set(0, 0, -4);
    this.group.add(bow);
  }

  private buildBridge(): void {
    const bridgeGeo = new THREE.BoxGeometry(1.4, 0.8, 1.2);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: SUPERSTRUCTURE_COLOR,
      flatShading: true,
    });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(0, 0.9, 1.5);
    this.group.add(bridge);

    // Bridge windows (dark strip)
    const windowGeo = new THREE.BoxGeometry(1.42, 0.15, 1.22);
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x223344,
      flatShading: true,
    });
    const windows = new THREE.Mesh(windowGeo, windowMat);
    windows.position.set(0, 1.1, 1.5);
    this.group.add(windows);
  }

  private buildFunnel(): void {
    const funnelGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.7, 6);
    const funnelMat = new THREE.MeshStandardMaterial({
      color: FUNNEL_COLOR,
      flatShading: true,
    });
    const funnel = new THREE.Mesh(funnelGeo, funnelMat);
    funnel.position.set(0, 1.65, 1.5);
    this.group.add(funnel);
  }

  /**
   * Update the ship position so it bobs on the ocean surface.
   * Call once per frame.
   */
  update(ocean: OceanScene, elapsedTime: number): void {
    const x = this.group.position.x;
    const z = this.group.position.z;
    const waveY = ocean.getWaveHeight(x, z, elapsedTime);
    this.group.position.y = waveY;

    // Slight roll and pitch for realism
    const rollSample = ocean.getWaveHeight(x + 1, z, elapsedTime);
    const pitchSample = ocean.getWaveHeight(x, z + 1, elapsedTime);
    this.group.rotation.z = (rollSample - waveY) * 0.3;
    this.group.rotation.x = (pitchSample - waveY) * 0.2;
  }
}
