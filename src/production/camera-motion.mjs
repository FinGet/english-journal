const clamp = value => Math.max(0, Math.min(1, value));
export const SCENE_TRANSITION_FRAMES = 26;
const TRANSITION_DURATIONS = { fade: 26, slide: 26, depth: 26, whip: 26, focus: 46, push: 40, hyperspace: 56, glitch: 12, particle: 36 };

export function transitionEasing(value) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

export function cameraTransition(frame, start, duration = SCENE_TRANSITION_FRAMES) {
  return transitionEasing((frame - start) / duration);
}

export const transitionDuration = spec => !spec || spec.style === 'cut' ? 0 : TRANSITION_DURATIONS[spec.style] ?? SCENE_TRANSITION_FRAMES;

export function shotSequenceDuration(shots, index) {
  const shot = shots[index];
  return shot.to - shot.from + transitionDuration(shots[index + 1]?.transition);
}
