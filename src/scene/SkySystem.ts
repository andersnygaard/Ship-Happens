/**
 * SkySystem — Day/night cycle with color interpolation for background, fog, and lighting.
 *
 * Time of day is a 0-1 value:
 *   0.00 = midnight
 *   0.25 = dawn / sunrise
 *   0.50 = noon
 *   0.75 = dusk / sunset
 *   1.00 = midnight (wraps)
 *
 * Exposes setTimeOfDay(t) for game logic to control.
 */

import * as THREE from "three";

/** A color stop for sky interpolation. */
interface ColorStop {
  time: number;
  color: THREE.Color;
}

const SKY_STOPS: ColorStop[] = [
  { time: 0.0, color: new THREE.Color(0x0a0a2e) },   // midnight — deep dark blue
  { time: 0.2, color: new THREE.Color(0x1a1a4e) },   // pre-dawn — dark blue
  { time: 0.25, color: new THREE.Color(0xe08050) },   // dawn — orange-pink
  { time: 0.35, color: new THREE.Color(0x87ceeb) },   // morning — light blue
  { time: 0.5, color: new THREE.Color(0x5dade2) },    // noon — blue sky
  { time: 0.65, color: new THREE.Color(0x87ceeb) },   // afternoon — light blue
  { time: 0.75, color: new THREE.Color(0xd35400) },   // dusk — orange-red
  { time: 0.85, color: new THREE.Color(0x1a1a4e) },   // evening — dark blue
  { time: 1.0, color: new THREE.Color(0x0a0a2e) },    // midnight again
];

const LIGHT_INTENSITY_STOPS: { time: number; intensity: number }[] = [
  { time: 0.0, intensity: 0.1 },
  { time: 0.2, intensity: 0.15 },
  { time: 0.25, intensity: 0.5 },
  { time: 0.35, intensity: 0.8 },
  { time: 0.5, intensity: 1.0 },
  { time: 0.65, intensity: 0.8 },
  { time: 0.75, intensity: 0.5 },
  { time: 0.85, intensity: 0.15 },
  { time: 1.0, intensity: 0.1 },
];

const LIGHT_COLOR_STOPS: ColorStop[] = [
  { time: 0.0, color: new THREE.Color(0x334466) },
  { time: 0.25, color: new THREE.Color(0xffaa66) },
  { time: 0.5, color: new THREE.Color(0xffffff) },
  { time: 0.75, color: new THREE.Color(0xff8844) },
  { time: 1.0, color: new THREE.Color(0x334466) },
];

export class SkySystem {
  public fog: THREE.FogExp2;
  private scene: THREE.Scene;
  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private timeOfDay: number = 0.4; // default to mid-morning

  constructor(
    scene: THREE.Scene,
    directionalLight: THREE.DirectionalLight,
    ambientLight: THREE.AmbientLight,
  ) {
    this.scene = scene;
    this.directionalLight = directionalLight;
    this.ambientLight = ambientLight;

    // Add exponential fog for atmospheric depth
    this.fog = new THREE.FogExp2(0x87ceeb, 0.012);
    this.scene.fog = this.fog;

    // Apply initial state
    this.applyTimeOfDay();
  }

  /**
   * Set the time of day (0-1). Can be called from game logic.
   *   0.0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk
   */
  setTimeOfDay(t: number): void {
    this.timeOfDay = t % 1;
    this.applyTimeOfDay();
  }

  /** Get current time-of-day value. */
  getTimeOfDay(): number {
    return this.timeOfDay;
  }

  /**
   * Automatically advance time. Call each frame.
   * @param delta — seconds since last frame
   * @param speed — how fast a full day cycle passes (default: 1 day = 120 seconds)
   */
  update(delta: number, speed: number = 1 / 120): void {
    this.timeOfDay = (this.timeOfDay + delta * speed) % 1;
    this.applyTimeOfDay();
  }

  private applyTimeOfDay(): void {
    const t = this.timeOfDay;

    // Sky / background color
    const skyColor = this.interpolateColorStops(SKY_STOPS, t);
    this.scene.background = skyColor;
    this.fog.color.copy(skyColor);

    // Directional light intensity
    const lightIntensity = this.interpolateScalarStops(LIGHT_INTENSITY_STOPS, t);
    this.directionalLight.intensity = lightIntensity;

    // Directional light color
    const lightColor = this.interpolateColorStops(LIGHT_COLOR_STOPS, t);
    this.directionalLight.color.copy(lightColor);

    // Ambient light — dimmer version
    this.ambientLight.intensity = lightIntensity * 0.5 + 0.1;
    this.ambientLight.color.copy(lightColor);

    // Sun position — arc across the sky
    const sunAngle = (t - 0.25) * Math.PI * 2; // rises at 0.25, sets at 0.75
    this.directionalLight.position.set(
      Math.cos(sunAngle) * 10,
      Math.sin(sunAngle) * 10 + 2,
      5,
    );
  }

  private interpolateColorStops(stops: ColorStop[], t: number): THREE.Color {
    // Find the two stops that bracket t
    let lower = stops[0];
    let upper = stops[stops.length - 1];

    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i].time && t <= stops[i + 1].time) {
        lower = stops[i];
        upper = stops[i + 1];
        break;
      }
    }

    const range = upper.time - lower.time;
    const factor = range > 0 ? (t - lower.time) / range : 0;

    const result = new THREE.Color();
    result.lerpColors(lower.color, upper.color, factor);
    return result;
  }

  private interpolateScalarStops(
    stops: { time: number; intensity: number }[],
    t: number,
  ): number {
    let lower = stops[0];
    let upper = stops[stops.length - 1];

    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i].time && t <= stops[i + 1].time) {
        lower = stops[i];
        upper = stops[i + 1];
        break;
      }
    }

    const range = upper.time - lower.time;
    const factor = range > 0 ? (t - lower.time) / range : 0;
    return lower.intensity + (upper.intensity - lower.intensity) * factor;
  }
}
