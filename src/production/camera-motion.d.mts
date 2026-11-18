export type CameraPoint = { x: number; y: number };
export type TransitionSpec = { style: 'cut' | 'fade' | 'depth' } | { style: 'slide'; from: 'left' | 'right' | 'top' | 'bottom' };
export type SpatialCamera = CameraPoint & { scale: number; opacity: number };
export function cameraTransition(frame: number, start: number, duration?: number): number;
export function slideVector(from: 'left' | 'right' | 'top' | 'bottom'): CameraPoint;
export function spatialCamera(input: { transition: number; role: 'current' | 'previous'; spec: TransitionSpec; width?: number; height?: number }): SpatialCamera;
export function elementMotion(input: { transition: number; active: boolean; spec: TransitionSpec; distance?: number }): SpatialCamera;
export function worldCamera(input: { transitions: Array<TransitionSpec | undefined>; index: number; transition: number; width?: number; height?: number }): CameraPoint;
