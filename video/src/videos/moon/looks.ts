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
  // look pass 2026-11-13: was az 60 / el 55 (sun overhead: no shadow shapes) with fog from 22 m (everything washed to
  // pale lilac). Now a low raking key from behind-left (az -40 = 40 deg left of backlight: long shadows toward camera, rim on the cast), deep cool shade,
  // fog pushed back so the mid-ground keeps its contrast, full-strength grade, brighter moon-plant glow.
  silvery: { L: P(D, { az: -40, el: 22, lit: [1.75, 1.68, 1.6], shade: [0.1, 0.1, 0.24], lift: [0.025, 0.025, 0.08], charTint: [1.0, 0.98, 1.02], sideTint: [0.78, 0.82, 1.05], fog: "#2c3168", fogNear: 70, fogFar: 520, sunCol: "#f2f0ff", sunI: 3.4, actorShadow: true }), sky: ["#4a4f92", "#373d80", "#272d6c", "#1a1f52", "#0e1238"], skyE: NE, grade: RATS.sewer.grade, gradeK: 1, glowK: 1.8, window: "#cfd8ff", cloud: null, interior: false },
  seaday: { L: P(D, { az: 70, el: 45, fogNear: 500, fogFar: 3600, fog: "#c3d9ef", lit: [1.62, 1.52, 1.34] }), ...{ sky: RATS.morning.sky, skyE: RATS.morning.skyE }, grade: RATS.morning.grade, gradeK: 1, glowK: 0, window: "#cfe3f7", cloud: RATS.morning.cloud, interior: false },
  afternoon: { L: P(D, { az: 50, el: 26, fogNear: 400, fogFar: 3000, fog: "#d8d6e6", lit: [1.66, 1.42, 1.12], charTint: [1.0, 0.94, 0.88] }), sky: ["#f2dcb8", "#d9cdc4", "#a9bedf", "#7fa3d9", "#5a88cf"], skyE: NE, grade: RATS.cafe.grade, gradeK: 0.7, glowK: 0.2, window: "#f3e2c0", cloud: RATS.morning.cloud, interior: false },
};
// Look pass, every scene (2026-11-13, after the katana / roller-coaster reference shorts): one strong, low, one-sided
// key per scene (side light: real shadow shapes on the cast and the sets), deep shade, warm practicals glowing at
// night, fog pushed back so the mid-ground keeps its contrast, full-strength grade. az is measured from the camera
// (0 = from behind it, 90 = from the right side); interiors take their key through the window at elevation el.
type C3 = [number, number, number];
const deep = (c: C3, k: number): C3 => [c[0] * k, c[1] * k, c[2] * k];
const pass = (k: LookName, o: Partial<LightPreset>, rest: Partial<Look> = {}, shadeK = 0.6) => {
  const L = LOOKS[k]; LOOKS[k] = { ...L, ...rest, gradeK: 1, L: { ...L.L, shade: deep(L.L.shade, shadeK), lift: deep(L.L.lift, 0.7), ...o } };
};
pass("moonlit", { az: 80, el: 24, lit: [0.78, 0.88, 1.32], sunI: 2.2, fogNear: 160, fogFar: 1400 }, { glowK: 2.0 });
pass("starry", { az: -75, el: 22, lit: [0.72, 0.8, 1.28], sunI: 2.1, fogNear: 200, fogFar: 1700 }, { glowK: 2.0 });
pass("lamp", { el: 16, lit: [1.45, 0.92, 0.5] }, { glowK: 2.0 }, 0.55);
pass("dim", { el: 14 }, { glowK: 2.0 }, 0.55);
pass("neutral", { el: 22, lit: [1.55, 1.36, 1.1] }, { glowK: 0.9 }, 0.45);
pass("sunrise", { el: 9 }, { glowK: 0.6 }, 0.5);
pass("morning", { az: 75, el: 20, lit: [1.78, 1.56, 1.24], fogNear: 600, fogFar: 4000 });
pass("seaday", { az: 80, el: 30, lit: [1.78, 1.62, 1.34], fogNear: 700, fogFar: 4200 });
pass("afternoon", { az: 62, el: 20, fogNear: 600, fogFar: 4000 });
pass("golden", { az: 65, el: 12, fogNear: 400, fogFar: 3600 });
export { LAMP } from "../rats/looks";
