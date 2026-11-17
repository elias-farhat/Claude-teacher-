// The cast of "The Pope Who Put a Corpse on Trial" (3D cast from bridge/char3d.ts; the Moon card drawer stays the
// fallback). Pope Stephen VI: a tall white-and-gold mitre, red robes, a red face (he is always furious). Formosus: the
// late pope, pale green, X eyes, gold-and-white robes, mitre slipping. The nervous young deacon in black; bishops in
// purple with white mitres; monks in brown hoods; guards in kettle helmets; the Roman crowd.
import type { Outfit } from "../bridge/toon";
import { SKINS } from "../bridge/toon";
export { person, personKey } from "../moon/people";
import type { Extra as MoonExtra, Look as MoonLook } from "../moon/people";

export type Look = Omit<MoonLook, "mode" | "gest"> & { mode?: MoonLook["mode"] | "run"; gest?: MoonLook["gest"] | "fist" | "hug" | "lift" | "charge" | "flee" | "stir" | "shrug2" | "aim" | "swing" | "salute" | "clap" | "flail" | "slam" | "whisper" | "nose" | "recoil" | "shake" | "tear" };
export type Extra = MoonExtra & { banner?: string; spear?: boolean; xeyes?: boolean; hatTilt?: number; scroll?: string; staff?: boolean; shovel?: boolean; lantern?: boolean };

export const STEPHEN: Outfit = { jacket: "#a8261e", pants: "#f4f0e6", boots: "#5a1a14", hat: "mitre", cap: "#f4f0e6", hair: "#4a3020", buttons: "#d9a43a", skin: "#f29a86", build: "stout" };
export const STEPHEN_BARE: Outfit = { ...STEPHEN, hat: "hair" };
export const FORMOSUS: Outfit = { jacket: "#f2ead2", pants: "#e8dcc0", boots: "#8a6a3a", hat: "mitre", cap: "#f2ead2", hair: "#d8d8c8", buttons: "#d9a43a", skin: "#b8d8a8" };
export const FORMOSUS_BARE: Outfit = { ...FORMOSUS, hat: "hair" };
export const DEACON: Outfit = { jacket: "#22222c", pants: "#1e1e26", boots: "#141018", hat: "hair", hair: "#6a3a22", buttons: "#f4f0e6", skin: "#ffe2c2" };
export const BISHOP = (v: number): Outfit => ({ jacket: ["#6a2a7a", "#5a2a6a", "#7a3a8a", "#62307a"][v % 4], pants: "#f4f0e6", boots: "#3a2030", hat: "mitre", cap: "#f4f0e6", hair: ["#d8d4cc", "#8a8070", "#4a3020", "#c8c4bc"][v % 4], buttons: "#d9a43a", skin: SKINS[v % 4], build: v % 3 === 1 ? "stout" : undefined });
export const MONK = (v: number): Outfit => ({ jacket: v ? "#6a4a32" : "#5a3e2a", pants: "#4a3424", boots: "#2a1a14", hat: "hood", cap: v ? "#6a4a32" : "#5a3e2a", hair: "#4a3020", buttons: "#4a3424", skin: SKINS[(v + 1) % 4] });
export const GUARD = (v: number): Outfit => ({ jacket: v ? "#8a2a2a" : "#7a2626", pants: "#3a3030", boots: "#1e1a1a", hat: "kettle", cap: "#8f96a2", hair: "#2a1a12", buttons: "#c9a04a", skin: SKINS[(v + 2) % 4] });
export const ROMAN = (v: number): Outfit => ({ jacket: ["#8a5a3a", "#5d7a3a", "#a8743a", "#6a5a8a", "#9a3a3a", "#3a6a7a"][v % 6], pants: ["#4a3a2a", "#3b3f52", "#5a4a3a"][v % 3], boots: "#3a2a20",
  hat: v % 3 === 1 ? "bonnet" : "hair", hair: ["#4a3020", "#2a1a12", "#8a5a2a", "#5a4034"][v % 4], buttons: "#c9a04a", skin: SKINS[v % 4] });
