export const SEGMENT_ANGLE = 45;
export const FULL_TURN = 360;
export const START_DURATION = 400;
export const SPEED = 360; // degrees per second

// Zero points up, positive angles run clockwise. Index 0 is centered at zero.
export function normalizeAngle(angle: number): number {
  return ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN;
}

export function centerAngle(index: number): number {
  if (!Number.isInteger(index) || index < 0 || index >= 8) throw new Error("Ungültiger Segmentindex.");
  return index * SEGMENT_ANGLE;
}

export function targetRotation(current: number, index: number, minimumTurns = 2): number {
  if (!Number.isFinite(current) || !Number.isInteger(minimumTurns) || minimumTurns < 0) {
    throw new Error("Ungültiger Drehwinkel.");
  }
  const alignment = normalizeAngle(-centerAngle(index));
  return current + minimumTurns * FULL_TURN + normalizeAngle(alignment - normalizeAngle(current));
}

export function polar(angle: number, radius: number, center = 300) {
  const radians = angle * Math.PI / 180;
  return { x: center + Math.sin(radians) * radius, y: center - Math.cos(radians) * radius };
}

export function segmentPath(index: number, radius = 286): string {
  const angle = centerAngle(index);
  const start = polar(angle - SEGMENT_ANGLE / 2, radius);
  const end = polar(angle + SEGMENT_ANGLE / 2, radius);
  return `M 300 300 L ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y} Z`;
}

/** Boundaries under the fixed top pointer, including the half-segment offset. */
export function crossingNumber(rotation: number): number {
  return Math.floor((rotation + SEGMENT_ANGLE / 2) / SEGMENT_ANGLE);
}
