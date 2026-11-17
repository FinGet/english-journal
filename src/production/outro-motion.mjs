const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { const p = clamp(n); return p * p * (3 - 2 * p); };
export const ACTION_TIMES = [24, 40, 58];
export const OUTRO_SOUND_CUES = [
  { at: ACTION_TIMES[0], duration: 8 },
  { at: ACTION_TIMES[1], duration: 9 },
  { at: ACTION_TIMES[2] + 8, duration: 12 },
];
export function actionState(frame, index) {
  const age = frame - ACTION_TIMES[index];
  const activation = ease(age / 8);
  const scale = age < 0 ? 1 : age < 3 ? 1 - .16 * ease(age / 3) : age < 9 ? .84 + .38 * ease((age - 3) / 6) : 1.22 - .22 * ease((age - 9) / 9);
  return {
    activation, scale,
    rotation: index === 1 && age >= 0 ? -14 * (1 - activation) : 0,
    burst: age > 0 && age < 18 ? Math.sin(Math.PI * age / 18) * .55 : 0,
    radius: 41 + clamp(age / 18) * 21,
    plus: 1 - ease(age / 6),
    check: ease((age - 4) / 9),
    confirmed: age >= 13,
  };
}
