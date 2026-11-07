// Lighting arc of the Rat Bounty short (SCRIPT.md "Light" column): bright morning -> cool underground glow -> warm
// house -> dim sickly green kitchen -> lantern-lit sewer -> day -> warm office -> golden -> late afternoon -> sunset ->
// neutral -> warm nest -> warm farm -> dusk barn -> night -> dawn gold -> cool sewer glow. Built on the Eiffel short's
// looks (bridge LightPresets + 5-stop sky + grade + practical-light gain). CLAUDE.md 11: night / underground scenes
// keep the subject lit (practical lights near every subject, high glowK, lifted shade).
import { LIGHTS, LightPreset } from "../bridge/lights";
import { GRADES, GradeParams } from "../bridge/grade";
import { LOOKS as EIFFEL, Look } from "../eiffel/looks";

export type { Look };
type C3 = [number, number, number];
const D = LIGHTS.day, G = LIGHTS.golden;
const P = (base: LightPreset, o: Partial<LightPreset>): LightPreset => ({ ...base, ...o });
const interior = (lit: C3, shade: C3, tint: C3, el = 35): LightPreset => P(D, {
  el, lit, shade, lift: [0.035, 0.03, 0.07], lambert: 0.4, term: 0.25, charTint: tint, charShade: 0.84, charGrad: 0.1, bodyGrad: 0.24,
  sideTint: [0.88, 0.82, 0.95], fogNear: 400, fogFar: 2000, actorShadow: true, sunI: 3.2,
});
const GRADE_COOL: GradeParams = { ky: [0, 0.08, 0.23, 0.52, 0.78, 0.92, 1], sat: [1.05, 1.05, 1.0], tintS: [0.02, -0.02], tintM: [-0.01, -0.015], tintH: [0.0, 0.0], vig: [0.24, 0.38] };
const GRADE_SICK: GradeParams = { ky: [0, 0.07, 0.21, 0.5, 0.76, 0.9, 1], sat: [0.9, 0.95, 0.9], tintS: [-0.02, 0.02], tintM: [-0.02, 0.03], tintH: [-0.01, 0.02], vig: [0.3, 0.32] };
const GRADE_WARM: GradeParams = { ky: [0, 0.08, 0.24, 0.53, 0.8, 0.93, 1], sat: [1.05, 1.12, 1.1], tintS: [0.035, 0.012], tintM: [-0.01, 0.012], tintH: [-0.015, 0.01], vig: [0.24, 0.38] };
const UNDER = ["#2c3340", "#232a36", "#1c222e", "#161b26", "#11151e"], UE = [0, 4, 10, 20, 40];

export type LookName = keyof typeof EIFFEL | "sewer" | "lantern" | "sickly" | "office" | "lateaft" | "nest" | "dawngold" | "bath";
export const LOOKS: Record<LookName, Look> = {
  ...EIFFEL,
  // underground: the "sun" is the daylight falling down the street shafts; the rest is cool shade + lantern pools
  sewer: { L: interior([0.95, 1.05, 1.25], [0.13, 0.16, 0.22], [0.86, 0.94, 1.08], 70), sky: UNDER, skyE: UE, grade: GRADE_COOL, gradeK: 0.9, glowK: 1.4, window: "#8aa0c8", cloud: null, interior: true },
  lantern: { L: interior([1.25, 0.95, 0.6], [0.13, 0.11, 0.18], [1.0, 0.86, 0.7], 60), sky: UNDER, skyE: UE, grade: GRADE_WARM, gradeK: 1, glowK: 1.9, window: "#3a3a5a", cloud: null, interior: true },
  bath: { L: interior([1.5, 1.25, 1.0], [0.22, 0.2, 0.28], [1.0, 0.92, 0.84], 30), ...{ sky: EIFFEL.morning.sky, skyE: EIFFEL.morning.skyE }, grade: GRADE_WARM, gradeK: 0.8, glowK: 1.0, window: "#e9f1fa", cloud: null, interior: true },
  sickly: { L: interior([0.85, 0.95, 0.62], [0.12, 0.15, 0.13], [0.9, 0.97, 0.82], 28), sky: UNDER, skyE: UE, grade: GRADE_SICK, gradeK: 1, glowK: 1.3, window: "#8fa87a", cloud: null, interior: true },
  office: { L: interior([1.5, 1.2, 0.85], [0.2, 0.17, 0.26], [1.0, 0.9, 0.8], 35), sky: EIFFEL.morning.sky, skyE: EIFFEL.morning.skyE, grade: GRADE_WARM, gradeK: 0.8, glowK: 1.0, window: "#e9f1fa", cloud: null, interior: true },
  lateaft: { L: P(G, { az: 40, el: 16, fogNear: 300, fogFar: 2600, lit: [1.6, 1.12, 0.7], shade: [0.2, 0.18, 0.34] }), sky: ["#ffd7a0", "#f6c08e", "#d9a8a0", "#9fa6c8", "#6f86c0"], skyE: UE, grade: GRADES.golden, gradeK: 0.7, glowK: 0.3, window: "#ffcf8e", cloud: EIFFEL.golden.cloud, interior: false },
  nest: { L: interior([1.2, 0.85, 0.55], [0.14, 0.11, 0.18], [1.0, 0.86, 0.72], 70), sky: UNDER, skyE: UE, grade: GRADE_WARM, gradeK: 1, glowK: 2.0, window: "#3a3a5a", cloud: null, interior: true },
  dawngold: { L: P(G, { az: 10, el: 9, fogNear: 260, fogFar: 2400, lit: [1.7, 1.15, 0.72], shade: [0.2, 0.17, 0.33], charTint: [1.0, 0.9, 0.82] }), sky: ["#ffd29a", "#f9b98a", "#e6a08e", "#b98fa5", "#7f7fae"], skyE: UE, grade: GRADES.golden, gradeK: 0.9, glowK: 0.5, window: "#ffd7a0", cloud: EIFFEL.golden.cloud, interior: false },
};
// CLAUDE.md 12: atmospheric haze toward the horizon outdoors (the far city + the hill line fade into the sky)
for (const k of ["morning", "golden", "sunset", "lateaft", "dawngold", "cafe"] as const) {
  const L = LOOKS[k]; LOOKS[k] = { ...L, L: { ...L.L, fogNear: 70, fogFar: 1500 } };
}
export { LAMP, POLICE } from "../eiffel/looks";
void D;
