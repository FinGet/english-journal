export type TransitionSpec =
  | { style: 'cut' | 'fade' | 'depth' | 'focus' | 'push' | 'hyperspace' | 'glitch' | 'particle' }
  | { style: 'slide'; from: 'left' | 'right' | 'top' | 'bottom' }
  | { style: 'whip'; direction: 'left' | 'right' | 'up' | 'down' };
export const SCENE_TRANSITION_FRAMES: number;
export function transitionEasing(value: number): number;
export function cameraTransition(frame: number, start: number, duration?: number): number;
export function transitionDuration(spec?: TransitionSpec): number;
export function shotSequenceDuration(shots: Array<{ from: number; to: number; transition?: TransitionSpec }>, index: number): number;
