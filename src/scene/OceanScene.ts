/**
 * OceanScene — Animated ocean mesh with wave motion via vertex displacement.
 *
 * Creates a high-segment PlaneGeometry and displaces vertex Y positions
 * using layered sin/cos waves each frame for a natural water look.
 */

import * as THREE from "three";

const OCEAN_SIZE = 120;
const OCEAN_SEGMENTS = 100;

/** Wave layer definition for combining multiple wave patterns. */
interface WaveLayer {
  amplitudeX: number;
  amplitudeZ: number;
  frequencyX: number;
  frequencyZ: number;
  speed: number;
  phase: number;
}

const WAVE_LAYERS: WaveLayer[] = [
  { amplitudeX: 0.3, amplitudeZ: 0.25, frequencyX: 0.08, frequencyZ: 0.06, speed: 1.0, phase: 0 },
  { amplitudeX: 0.15, amplitudeZ: 0.2, frequencyX: 0.15, frequencyZ: 0.12, speed: 1.4, phase: 1.2 },
  { amplitudeX: 0.08, amplitudeZ: 0.1, frequencyX: 0.3, frequencyZ: 0.25, speed: 2.0, phase: 2.5 },
  { amplitudeX: 0.04, amplitudeZ: 0.05, frequencyX: 0.6, frequencyZ: 0.5, speed: 2.8, phase: 4.1 },
];

export class OceanScene {
  public readonly mesh: THREE.Mesh;
  private geometry: THREE.PlaneGeometry;
  private basePositions: Float32Array;

  /** Multiplier for wave amplitude (1.0 = normal, >1 = stormy). */
  private weatherIntensity = 1.0;

  constructor() {
    this.geometry = new THREE.PlaneGeometry(
      OCEAN_SIZE,
      OCEAN_SIZE,
      OCEAN_SEGMENTS,
      OCEAN_SEGMENTS,
    );

    // Rotate so the plane lies in XZ (Y is up)
    this.geometry.rotateX(-Math.PI / 2);

    // Store base vertex positions for displacement
    const posAttr = this.geometry.getAttribute("position");
    this.basePositions = new Float32Array(posAttr.array.length);
    this.basePositions.set(posAttr.array as Float32Array);

    const material = new THREE.MeshStandardMaterial({
      color: 0x1a6e8e,
      flatShading: true,
      side: THREE.DoubleSide,
      metalness: 0.1,
      roughness: 0.7,
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
  }

  /**
   * Update wave vertex positions. Call once per frame.
   * @param elapsedTime — seconds since start (e.g. clock.getElapsedTime())
   */
  update(elapsedTime: number): void {
    const posAttr = this.geometry.getAttribute("position");
    const positions = posAttr.array as Float32Array;
    const vertexCount = posAttr.count;

    for (let i = 0; i < vertexCount; i++) {
      const baseX = this.basePositions[i * 3];
      const baseZ = this.basePositions[i * 3 + 2];

      let y = 0;
      for (const layer of WAVE_LAYERS) {
        y +=
          Math.sin(baseX * layer.frequencyX + elapsedTime * layer.speed + layer.phase) *
          layer.amplitudeX;
        y +=
          Math.cos(baseZ * layer.frequencyZ + elapsedTime * layer.speed * 0.8 + layer.phase) *
          layer.amplitudeZ;
      }

      positions[i * 3 + 1] = y * this.weatherIntensity;
    }

    posAttr.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  /**
   * Get the wave height at a given world (x, z) position.
   * Useful for making objects bob on the water.
   */
  getWaveHeight(x: number, z: number, elapsedTime: number): number {
    let y = 0;
    for (const layer of WAVE_LAYERS) {
      y +=
        Math.sin(x * layer.frequencyX + elapsedTime * layer.speed + layer.phase) *
        layer.amplitudeX;
      y +=
        Math.cos(z * layer.frequencyZ + elapsedTime * layer.speed * 0.8 + layer.phase) *
        layer.amplitudeZ;
    }
    return y * this.weatherIntensity;
  }

  /**
   * Set the weather intensity multiplier for wave amplitude.
   * 1.0 = calm seas, 2.0+ = stormy.
   */
  setWeatherIntensity(intensity: number): void {
    this.weatherIntensity = intensity;
  }
}
