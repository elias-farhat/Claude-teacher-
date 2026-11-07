// Lighting arc of the Moon Hoax short (SCRIPT.md "Light" column): moonlit blue night -> lamp-lit print shop -> starry
// Cape night -> moon glow / silvery moon world -> morning city -> dim mystery -> night Cape -> sea day -> bright beach
// -> day office -> golden -> afternoon -> warm sunrise through the window. Built on the Rat / Eiffel looks. CLAUDE.md 11:
// at night the subject is lit (practical lights in stage.ts) and the night looks keep a lifted, moonlit shade.
import { LIGHTS, LightPreset } from "../bridge/lights";
import { LOOKS as RATS, Look } from "../rats/looks";

export type { Look };
const D = LIGHTS.day;
const P = (base: LightPreset, o: Partial<LightPreset>): LightPreset => ({ ...base, ...o });
const NIGHTSKY = ["#33427a", "#28356a", "#1f2a58", "#172046", "#101736"], NE = [0, 4, 10, 20, 40];

export type LookName = keyof typeof RATS | "moonlit" | "starry" | "silvery" | "seaday" | "afternoon";
export const LOOKS: Record<LookName, Look> = {
  ...RATS,
  // moonlit street: cool blue key from the big Moon, lifted shade so faces stay readable
  moonlit: { L: P(D, { az: 150, el: 34, lit: [0.62, 0.72, 1.12], shade: [0.11, 0.12, 0.24], lift: [0.03, 0.035, 0.1], charTint: [0.8, 0.86, 1.05], charShade: 0.84, sideTint: [0.82, 0.86, 1.0], fog: "#1f2a52", fogNear: 80, fogFar: 900, sunCol: "#b9cbff", sunI: 1.6, actorShadow: true }), sky: NIGHTSKY, skyE: NE, grade: RATS.night.grade, gradeK: 1, glowK: 1.5, window: "#ffbf6e", cloud: null, interior: false },
  starry: { L: P(D, { az: 130, el: 30, lit: [0.55, 0.62, 1.05], shade: [0.1, 0.1, 0.22], lift: [0.03, 0.03, 0.09], charTint: [0.8, 0.84, 1.05], charShade: 0.84, fog: "#18204a", fogNear: 120, fogFar: 1200, sunCol: "#b9cbff", sunI: 1.5, actorShadow: true }), sky: ["#2a3870", "#212d62", "#192452", "#121a40", "#0b1030"], skyE: NE, grade: RATS.night.grade, gradeK: 1, glowK: 1.6, window: "#ffbf6e", cloud: null, interior: false },
  // the moon world: silvery top light, soft violet shade, glowing sky
  silvery: { L: P(D, { az: 60, el: 55, lit: [1.25, 1.3, 1.5], shade: [0.22, 0.22, 0.38], lift: [0.05, 0.05, 0.12], charTint: [0.94, 0.95, 1.06], sideTint: [0.9, 0.9, 1.05], fog: "#3a4278", fogNear: 200, fogFar: 1600, sunCol: "#e6ecff", sunI: 2.6, actorShadow: true }), sky: ["#5a5f9e", "#474d8c", "#353c78", "#262c60", "#181e48"], skyE: NE, grade: RATS.sewer.grade, gradeK: 0.6, glowK: 0.8, window: "#cfd8ff", cloud: null, interior: false },
  seaday: { L: P(D, { az: 70, el: 45, fogNear: 500, fogFar: 3600, fog: "#c3d9ef", lit: [1.62, 1.52, 1.34] }), ...{ sky: RATS.morning.sky, skyE: RATS.morning.skyE }, grade: RATS.morning.grade, gradeK: 1, glowK: 0, window: "#cfe3f7", cloud: RATS.morning.cloud, interior: false },
  afternoon: { L: P(D, { az: 50, el: 26, fogNear: 400, fogFar: 3000, fog: "#d8d6e6", lit: [1.66, 1.42, 1.12], charTint: [1.0, 0.94, 0.88] }), sky: ["#f2dcb8", "#d9cdc4", "#a9bedf", "#7fa3d9", "#5a88cf"], skyE: NE, grade: RATS.cafe.grade, gradeK: 0.7, glowK: 0.2, window: "#f3e2c0", cloud: RATS.morning.cloud, interior: false },
};
export { LAMP } from "../rats/looks";
