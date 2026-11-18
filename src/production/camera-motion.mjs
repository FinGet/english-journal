const clamp = value => Math.max(0, Math.min(1, value));

export function cameraTransition(frame, start, duration = 26) {
  const t = clamp((frame - start) / duration);
  return t * t * (3 - 2 * t);
}

export function slideVector(from) {
  return {
    right: { x: 1, y: 0 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    top: { x: 0, y: -1 },
  }[from] ?? { x: 0, y: 0 };
}

export function spatialCamera({ transition, role, spec, width = 1080, height = 1920 }) {
  const p = clamp(transition);
  if (spec.style === 'cut') return { x: 0, y: 0, scale: 1, opacity: role === 'current' ? 1 : 0 };
  if (spec.style === 'fade') return { x: 0, y: 0, scale: 1, opacity: role === 'current' ? p : 1 - p };
  if (spec.style === 'depth') return {
    x: 0,
    y: 0,
    scale: role === 'current' ? 1.08 - .08 * p : 1 - .08 * p,
    opacity: role === 'current' ? p : 1 - p,
  };
  const route = slideVector(spec.from);
  const offset = role === 'current' ? 1 - p : -p;
  return {
    x: route.x * (width + 96) * offset,
    y: route.y * (height + 96) * offset,
    scale: 1,
    opacity: 1,
  };
}

export function elementMotion({ transition, active, spec, distance = 28 }) {
  const p = clamp(transition);
  if (spec.style === 'cut') return { x: 0, y: 0, scale: 1, opacity: active ? 1 : 0 };
  if (spec.style === 'fade') return { x: 0, y: 0, scale: 1, opacity: p };
  if (spec.style === 'depth') return { x: 0, y: 0, scale: .92 + .08 * p, opacity: p };
  const route = slideVector(spec.from);
  return { x: route.x * distance * (1 - p), y: route.y * distance * (1 - p), scale: 1, opacity: p };
}

export function worldCamera({ transitions, index, transition, width = 1080, height = 1920 }) {
  let x = 0;
  let y = 0;
  for (let step = 1; step < index; step++) {
    if (transitions[step]?.style !== 'slide') continue;
    const route = slideVector(transitions[step].from);
    x += route.x * (width + 96);
    y += route.y * (height + 96);
  }
  const current = transitions[index];
  if (current?.style !== 'slide') return { x, y };
  const route = slideVector(current.from);
  return {
    x: x + route.x * (width + 96) * clamp(transition),
    y: y + route.y * (height + 96) * clamp(transition),
  };
}
