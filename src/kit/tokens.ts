import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// Series tokens — see SERIES.md §1.2 / §1.3. Do not add colours here per episode;
// episode palettes live with the episode.

const fraunces = loadFraunces("normal", { weights: ["600", "800"], subsets: ["latin"] });
const inter = loadInter("normal", { weights: ["400", "500", "700", "900"], subsets: ["latin"] });
const caveat = loadCaveat("normal", { weights: ["500", "700"], subsets: ["latin"] });

const ZH = `"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", sans-serif`;

export const FONT = {
  serif: `${fraunces.fontFamily}, ${ZH}`,
  ui: `${inter.fontFamily}, ${ZH}`,
  zh: ZH,
  hand: `${caveat.fontFamily}, ${ZH}`,
};

export const INK = {
  paper: "#F3EEE4",
  paperDeep: "#E8E0D2",
  ink: "#161616",
  muted: "#8C877D",
  highlighter: "#FFD84D",
  redpen: "#E5482D",
  white: "#FFFDF8",
};

/** Unified warm key light from the top-left: near contact shadow + far soft shadow. */
export const shadow = (lift = 1) =>
  `0 ${2 * lift}px ${4 * lift}px rgba(70,45,20,0.16), 0 ${18 * lift}px ${44 * lift}px rgba(70,45,20,${0.16 + 0.04 * lift})`;

export const CANVAS = { w: 1080, h: 1920 };

export const SPRING_UI = { damping: 200 } as const;
export const SPRING_POP = { damping: 12, stiffness: 170 } as const;
