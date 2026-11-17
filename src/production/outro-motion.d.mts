export const ACTION_TIMES: number[];
export const OUTRO_SOUND_CUES: { at: number; duration: number }[];
export function actionState(frame: number, index: number): { activation: number; scale: number; rotation: number; burst: number; radius: number; plus: number; check: number; confirmed: boolean };
