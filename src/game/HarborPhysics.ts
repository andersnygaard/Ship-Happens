/**
 * Simple 2D ship physics for the port maneuvering minigame.
 * Handles position, velocity, heading, throttle, collision, and docking detection.
 */

import type { WallSegment, DockingBerth, HarborLayout } from "../data/harborLayouts";

// ─── Constants ──────────────────────────────────────────────────────────────

/** Throttle levels: stop, slow, fast. */
export const THROTTLE_LEVELS = [0, 1.2, 2.8] as const;
export const MAX_THROTTLE_INDEX = THROTTLE_LEVELS.length - 1;

/** Base turning rate in radians/second at full speed. */
const BASE_TURN_RATE = 2.0;

/** Drag coefficient — ship decelerates when throttle is zero. */
const DRAG = 0.97;

/** Minimum speed to allow turning. */
const MIN_SPEED_FOR_TURN = 0.05;

/** Collision bounce factor. */
const BOUNCE_FACTOR = 0.4;

/** Ship collision radius (half-width for simple circle collision). */
export const SHIP_RADIUS = 12;

/** Damage per collision (percentage points). */
const COLLISION_DAMAGE_MIN = 2;
const COLLISION_DAMAGE_MAX = 5;

/** Condition threshold for auto-fail. */
const CONDITION_FAIL_THRESHOLD = 10;

// ─── Ship State ─────────────────────────────────────────────────────────────

export interface ShipPhysicsState {
  x: number;
  y: number;
  heading: number; // radians, 0 = right, increases clockwise
  speed: number;
  throttleIndex: number; // index into THROTTLE_LEVELS
  turnDirection: number; // -1 = left, 0 = none, 1 = right
  conditionPercent: number;
}

export interface ManeuveringResult {
  success: boolean;
  docked: boolean;
  timedOut: boolean;
  conditionFailed: boolean;
  finalCondition: number;
  damageDealt: number;
}

// ─── Physics Update ─────────────────────────────────────────────────────────

/**
 * Create the initial ship state from a layout.
 */
export function createShipState(layout: HarborLayout, shipCondition: number): ShipPhysicsState {
  return {
    x: layout.start.x,
    y: layout.start.y,
    heading: layout.start.heading,
    speed: 0,
    throttleIndex: 0,
    turnDirection: 0,
    conditionPercent: shipCondition,
  };
}

/**
 * Update ship physics for one frame.
 * @param ship - Current ship state (mutated in place)
 * @param dt - Delta time in seconds
 * @param layout - Harbor layout for collision detection
 * @returns true if a collision occurred this frame
 */
export function updateShipPhysics(
  ship: ShipPhysicsState,
  dt: number,
  layout: HarborLayout,
): boolean {
  // Apply throttle to speed
  const targetSpeed = THROTTLE_LEVELS[ship.throttleIndex];
  if (targetSpeed > ship.speed) {
    ship.speed += (targetSpeed - ship.speed) * dt * 2;
  } else {
    ship.speed *= DRAG;
  }

  // Clamp very small speeds to zero
  if (ship.speed < 0.01) {
    ship.speed = 0;
  }

  // Apply turning (turning rate depends on speed)
  if (ship.turnDirection !== 0 && ship.speed > MIN_SPEED_FOR_TURN) {
    const speedFactor = Math.min(ship.speed / THROTTLE_LEVELS[1], 1.0);
    const turnRate = BASE_TURN_RATE * speedFactor;
    ship.heading += ship.turnDirection * turnRate * dt;
  }

  // Normalize heading
  ship.heading = normalizeAngle(ship.heading);

  // Calculate velocity from heading and speed
  const vx = Math.cos(ship.heading) * ship.speed;
  const vy = Math.sin(ship.heading) * ship.speed;

  // Move ship
  const newX = ship.x + vx * dt * 60; // Scale to ~60fps feel
  const newY = ship.y + vy * dt * 60;

  // Check collision with walls
  let collided = false;
  const collisionResult = checkWallCollisions(newX, newY, SHIP_RADIUS, layout.walls);

  if (collisionResult.collided) {
    // Bounce back: push ship away from wall
    ship.x += collisionResult.pushX * BOUNCE_FACTOR;
    ship.y += collisionResult.pushY * BOUNCE_FACTOR;
    ship.speed *= BOUNCE_FACTOR;

    // Apply damage
    const damage = COLLISION_DAMAGE_MIN + Math.random() * (COLLISION_DAMAGE_MAX - COLLISION_DAMAGE_MIN);
    ship.conditionPercent = Math.max(0, ship.conditionPercent - damage);
    collided = true;
  } else {
    ship.x = newX;
    ship.y = newY;
  }

  // Keep ship in canvas bounds (800x600)
  ship.x = Math.max(SHIP_RADIUS, Math.min(800 - SHIP_RADIUS, ship.x));
  ship.y = Math.max(SHIP_RADIUS, Math.min(600 - SHIP_RADIUS, ship.y));

  return collided;
}

/**
 * Increase throttle by one level.
 */
export function throttleUp(ship: ShipPhysicsState): void {
  if (ship.throttleIndex < MAX_THROTTLE_INDEX) {
    ship.throttleIndex++;
  }
}

/**
 * Decrease throttle by one level.
 */
export function throttleDown(ship: ShipPhysicsState): void {
  if (ship.throttleIndex > 0) {
    ship.throttleIndex--;
  }
}

/**
 * Set turn direction: -1 (left/port), 0 (straight), 1 (right/starboard).
 */
export function setTurnDirection(ship: ShipPhysicsState, direction: number): void {
  ship.turnDirection = Math.sign(direction);
}

/**
 * Check if ship condition has dropped below the auto-fail threshold.
 */
export function isConditionFailed(ship: ShipPhysicsState): boolean {
  return ship.conditionPercent < CONDITION_FAIL_THRESHOLD;
}

// ─── Docking Detection ──────────────────────────────────────────────────────

/**
 * Check if the ship has reached the docking berth.
 * Ship center must be inside the berth rectangle.
 */
export function checkDocking(ship: ShipPhysicsState, berth: DockingBerth): boolean {
  return (
    ship.x >= berth.x &&
    ship.x <= berth.x + berth.width &&
    ship.y >= berth.y &&
    ship.y <= berth.y + berth.height
  );
}

// ─── Collision Detection ────────────────────────────────────────────────────

interface CollisionResult {
  collided: boolean;
  pushX: number;
  pushY: number;
}

/**
 * Check if a circle (ship) intersects any wall segments.
 * Returns push direction to resolve the collision.
 */
function checkWallCollisions(
  cx: number,
  cy: number,
  radius: number,
  walls: readonly WallSegment[],
): CollisionResult {
  let totalPushX = 0;
  let totalPushY = 0;
  let collided = false;

  for (const wall of walls) {
    const dist = pointToSegmentDistance(cx, cy, wall.x1, wall.y1, wall.x2, wall.y2);
    if (dist.distance < radius) {
      collided = true;
      // Push away from nearest point on segment
      const pushDist = radius - dist.distance + 1;
      const dx = cx - dist.nearestX;
      const dy = cy - dist.nearestY;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      totalPushX += (dx / len) * pushDist;
      totalPushY += (dy / len) * pushDist;
    }
  }

  return { collided, pushX: totalPushX, pushY: totalPushY };
}

/**
 * Calculate the shortest distance from a point to a line segment.
 */
function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { distance: number; nearestX: number; nearestY: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    // Segment is a point
    const dist = Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    return { distance: dist, nearestX: x1, nearestY: y1 };
  }

  // Project point onto the line, clamp to segment
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;
  const distance = Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);

  return { distance, nearestX, nearestY };
}

/**
 * Normalize an angle to [-PI, PI].
 */
function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * Calculate the shortest angular difference to turn from current heading
 * toward a target heading. Used for mouse-click steering.
 * Returns -1 (turn left), 0 (on target), or 1 (turn right).
 */
export function getSteeringDirection(currentHeading: number, targetHeading: number): number {
  const diff = normalizeAngle(targetHeading - currentHeading);
  if (Math.abs(diff) < 0.05) return 0; // Close enough
  return diff > 0 ? 1 : -1;
}

/**
 * Calculate the angle from the ship position to a target point.
 */
export function angleToPoint(shipX: number, shipY: number, targetX: number, targetY: number): number {
  return Math.atan2(targetY - shipY, targetX - shipX);
}
