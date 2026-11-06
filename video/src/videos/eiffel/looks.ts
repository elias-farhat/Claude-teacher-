// Lighting arc of the Eiffel short (STYLE_BIBLE.md 4): morning -> warm interiors -> golden -> night -> blue police
// night -> pre-dawn -> grey dawn -> soft sunrise. Each look = the bridge's LightPreset (two-tone world + character
// cards), a 5-stop sky, a colour grade and a practical-light gain. Shadows always lean purple/plum, never grey.
import { LIGHTS, LightPreset } from "../bridge/lights";
import { GRADES, GradeParams } from "../bridge/grade";

type C3 = [number, number, number];
export type LookName = "morning" | "cafe" | "lamp" | "golden" | "warm" | "cool" | "dim" | "neutral" | "sunset" | "dusk"
  | "night" | "nightwarm" | "police" | "predawn" | "greydawn" | "sunrise";
export type Look = {
  L: LightPreset;
  sky: string[]; skyE: number[];          // on-screen sky colours by elevation (deg)
  grade: GradeParams; gradeK: number;
  glowK: number;                           // practical lights gain (0 = off by day outdoors)
  window: string;                          // emissive colour of window panes seen from inside
  cloud: { lit: string; mid: string; shade: string } | null;
  interior: boolean;
};
const D = LIGHTS.day, G = LIGHTS.golden;
const P = (base: LightPreset, o: Partial<LightPreset>): LightPreset => ({ ...base, ...o });
const mulC = (c: C3, k: number): C3 => [c[0] * k, c[1] * k, c[2] * k];

const GRADE_NIGHT: GradeParams = { ky: [0, 0.07, 0.2, 0.47, 0.74, 0.9, 1], sat: [1.1, 1.08, 1.0], tintS: [0.05, -0.01], tintM: [0.03, -0.01], tintH: [-0.01, 0.01], vig: [0.28, 0.35] };
const GRADE_WARM: GradeParams = { ky: [0, 0.08, 0.24, 0.53, 0.8, 0.93, 1], sat: [1.05, 1.12, 1.1], tintS: [0.035, 0.012], tintM: [-0.01, 0.012], tintH: [-0.015, 0.01], vig: [0.24, 0.38] };
const GRADE_DAWN: GradeParams = { ky: [0, 0.09, 0.26, 0.56, 0.82, 0.94, 1], sat: [0.95, 1.0, 1.0], tintS: [0.03, 0.01], tintM: [0.01, 0.0], tintH: [-0.006, 0.006], vig: [0.18, 0.42] };

const DAYSKY = { sky: ["#b9d2ee", "#a2c4ec", "#76a7e3", "#5a92dc", "#3d7bd0"], skyE: [0, 3, 8, 16, 40] };
const dayCloud = { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" };
const goldCloud = { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" };

// interiors: the "sun" is the light through the window (it lands as a lit patch), everything else lives in the
// purple shade colour plus the warm practical pools (lamps, chandelier)
const interior = (lit: C3, shade: C3, tint: C3, el = 35): LightPreset => P(D, {
  el, lit, shade, lift: [0.03, 0.02, 0.06], lambert: 0.4, term: 0.25, charTint: tint, charShade: 0.82, charGrad: 0.1, bodyGrad: 0.24,
  sideTint: [0.88, 0.82, 0.95], fogNear: 400, fogFar: 2000, actorShadow: true, sunI: 3.2,
});

export const LOOKS: Record<LookName, Look> = {
  morning: { L: P(D, { az: 70, el: 38, fogNear: 420, fogFar: 3400, fog: "#bcd3ee", lit: [1.6, 1.5, 1.32] }), ...DAYSKY, grade: GRADES.day, gradeK: 1, glowK: 0, window: "#cfe3f7", cloud: dayCloud, interior: false },
  cafe: { L: P(D, { az: 60, el: 32, fogNear: 300, fogFar: 2600, fog: "#d6dceb", lit: [1.68, 1.46, 1.18], charTint: [1.0, 0.92, 0.86] }), ...DAYSKY, grade: GRADE_WARM, gradeK: 0.6, glowK: 0.4, window: "#f3e2c0", cloud: dayCloud, interior: false },
  lamp: { L: interior([1.2, 0.8, 0.45], [0.14, 0.1, 0.17], [1.0, 0.8, 0.6], 25), sky: ["#3a2d40", "#2c2236", "#211a2c", "#1a1524", "#14101c"], skyE: [0, 4, 10, 20, 40], grade: GRADE_WARM, gradeK: 1, glowK: 1.4, window: "#3a3a5a", cloud: null, interior: true },
  golden: { L: P(G, { fogNear: 300, fogFar: 2800 }), sky: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"], skyE: [0, 4, 10, 20, 40], grade: GRADES.golden, gradeK: 1, glowK: 0.7, window: "#ffcf8e", cloud: goldCloud, interior: false },
  warm: { L: interior([1.45, 1.0, 0.6], [0.17, 0.12, 0.2], [1.0, 0.84, 0.66]), sky: ["#ffcf8e", "#f2b07c", "#d98f7c", "#a8788c", "#6f5f86"], skyE: [0, 4, 10, 20, 40], grade: GRADE_WARM, gradeK: 1, glowK: 1.2, window: "#ffcf8e", cloud: null, interior: true },
  cool: { L: interior([0.75, 0.85, 1.15], [0.12, 0.12, 0.22], [0.86, 0.9, 1.05]), sky: ["#9fb4d6", "#7f97c4", "#647bb0", "#4f6299", "#3c4a7c"], skyE: [0, 4, 10, 20, 40], grade: GRADE_NIGHT, gradeK: 0.6, glowK: 0.7, window: "#8aa0c8", cloud: null, interior: true },
  dim: { L: interior([0.9, 0.6, 0.38], [0.09, 0.07, 0.13], [0.95, 0.76, 0.6], 20), sky: ["#3a2d40", "#2c2236", "#211a2c", "#1a1524", "#14101c"], skyE: [0, 4, 10, 20, 40], grade: GRADE_WARM, gradeK: 1, glowK: 1.6, window: "#2b2a44", cloud: null, interior: true },
  neutral: { L: interior([1.45, 1.38, 1.25], [0.28, 0.26, 0.34], [1.0, 0.95, 0.92], 45), ...DAYSKY, grade: GRADES.day, gradeK: 1, glowK: 0.3, window: "#d7e6f6", cloud: null, interior: true },
  sunset: { L: P(G, { az: 25, el: 6, fogNear: 280, fogFar: 2600, lit: [1.6, 0.66, 0.28], shade: [0.17, 0.13, 0.32] }), sky: ["#ffb36b", "#f59464", "#e07574", "#a9628c", "#5f4c84"], skyE: [0, 4, 10, 20, 40], grade: GRADES.golden, gradeK: 1, glowK: 0.8, window: "#ffb36b", cloud: goldCloud, interior: false },
  dusk: { L: P(G, { az: 40, el: 3, lit: [0.95, 0.5, 0.42], shade: [0.12, 0.1, 0.26], lift: [0.03, 0.04, 0.12], charTint: [0.92, 0.74, 0.7], sunI: 3 }), sky: ["#f08a6a", "#c4708a", "#8a5f94", "#584c86", "#352f63"], skyE: [0, 4, 10, 20, 40], grade: GRADE_WARM, gradeK: 0.8, glowK: 1.1, window: "#e48a6a", cloud: goldCloud, interior: true },
  night: { L: P(D, { az: 120, el: 40, lit: [0.42, 0.5, 0.86], shade: [0.07, 0.07, 0.17], lift: [0.02, 0.025, 0.08], charTint: [0.72, 0.8, 1.05], charShade: 0.8, sideTint: [0.8, 0.85, 1.0], fog: "#1c2340", fogNear: 60, fogFar: 700, sunCol: "#a9c0ff", sunI: 1.2, actorShadow: true }), sky: ["#2a3561", "#212b52", "#1a2145", "#141938", "#0d112a"], skyE: [0, 4, 10, 20, 40], grade: GRADE_NIGHT, gradeK: 1, glowK: 1.6, window: "#ffbf6e", cloud: null, interior: false },
  nightwarm: { L: interior([0.85, 0.62, 0.42], [0.1, 0.08, 0.16], [0.98, 0.8, 0.64], 25), sky: ["#2a3561", "#212b52", "#1a2145", "#141938", "#0d112a"], skyE: [0, 4, 10, 20, 40], grade: GRADE_WARM, gradeK: 1, glowK: 1.6, window: "#26305c", cloud: null, interior: true },
  police: { L: P(D, { az: 140, el: 35, lit: [0.36, 0.45, 0.95], shade: [0.05, 0.06, 0.17], lift: [0.02, 0.03, 0.1], charTint: [0.66, 0.78, 1.1], charShade: 0.78, sideTint: [0.75, 0.82, 1.05], fog: "#141c3c", fogNear: 50, fogFar: 600, sunCol: "#9fb8ff", sunI: 1.1, actorShadow: true }), sky: ["#22305e", "#1b2652", "#151d44", "#101636", "#0a0e26"], skyE: [0, 4, 10, 20, 40], grade: GRADE_NIGHT, gradeK: 1, glowK: 2.0, window: "#ffbf6e", cloud: null, interior: false },
  predawn: { L: P(D, { az: 20, el: 4, lit: [0.75, 0.68, 0.9], shade: [0.12, 0.12, 0.26], lift: [0.03, 0.04, 0.1], charTint: [0.86, 0.84, 1.0], fog: "#6a6f9a", fogNear: 120, fogFar: 1400, sunCol: "#d8c8ff", sunI: 1.8, actorShadow: false }), sky: ["#e7a7a0", "#b58ea8", "#7e7aa6", "#545c90", "#33396c"], skyE: [0, 4, 10, 20, 40], grade: GRADE_DAWN, gradeK: 1, glowK: 0.9, window: "#c9a3b0", cloud: goldCloud, interior: false },
  greydawn: { L: interior([0.9, 0.92, 1.05], [0.17, 0.17, 0.26], [0.9, 0.9, 1.0], 18), sky: ["#c7c7d6", "#b0b3c8", "#9a9fbb", "#858aaa", "#6e7396"], skyE: [0, 4, 10, 20, 40], grade: GRADE_DAWN, gradeK: 1, glowK: 0.4, window: "#c9cede", cloud: null, interior: true },
  sunrise: { L: interior([1.65, 1.08, 0.7], [0.2, 0.16, 0.26], [1.0, 0.88, 0.78], 10), sky: ["#ffd29a", "#f9b98a", "#e6a08e", "#b98fa5", "#7f7fae"], skyE: [0, 4, 10, 20, 40], grade: GRADE_WARM, gradeK: 0.7, glowK: 0.3, window: "#ffd7a0", cloud: null, interior: true },
};
/** practical light colour (linear RGB, before the look's glowK) */
export const LAMP: C3 = [3.2, 1.9, 0.8];
export const POLICE: C3 = [0.5, 1.1, 4.2];
export const COOLWIN: C3 = [0.7, 0.9, 1.6];
export { mulC };
