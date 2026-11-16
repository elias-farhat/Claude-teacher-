// The cast of "The War of the Bucket" (3D cast from bridge/char3d.ts; the card drawer from the Moon short stays the
// fallback). Modena wears blue and gold, Bologna red and white. The lords: Modena's podestà (stout, gold coat, blue
// velvet cap with a feather), Bologna's lord (red coat, gold circlet). Modenese soldiers in bascinets, Bologna's in
// kettle hats; the knight who takes the bucket; townsfolk; a modern tourist for the ending.
import type { Outfit } from "../bridge/toon";
import { SKINS } from "../bridge/toon";
export { person, personKey } from "../moon/people";
import type { Extra as MoonExtra, Look as MoonLook } from "../moon/people";
/** the Moon look plus the medieval moves (run; fist / hug / lift / charge / flee are 3D-cast gestures) */
export type Look = Omit<MoonLook, "mode" | "gest"> & { mode?: MoonLook["mode"] | "run"; gest?: MoonLook["gest"] | "fist" | "hug" | "lift" | "charge" | "flee" };

export type Extra = MoonExtra & { bucket?: boolean; spear?: boolean; sword?: boolean; banner?: string; shield?: string };
export const MOD_FLAG = "#e0b23a/#2a4f9a", BOL_FLAG = "#f4f1ea/#b8302c";

export const LORD_M: Outfit = { jacket: "#e0b23a", pants: "#2a4f9a", boots: "#3a2a20", hat: "beret", cap: "#2a4f9a", hair: "#4a3020", moustache: "#4a3020", buttons: "#2a4f9a", build: "stout", skin: "#ffe2c2" };
export const LORD_B: Outfit = { jacket: "#b8302c", pants: "#f4f1ea", boots: "#2a1a14", hat: "crown", cap: "#e0b04a", hair: "#2a1a12", moustache: "#2a1a12", buttons: "#e0b04a", skin: "#f5c9a0" };
export const MOD_SOLDIER = (v: number): Outfit => ({ jacket: v % 2 ? "#2a4f9a" : "#3a62b0", pants: "#e0b23a", boots: "#3a2a20", hat: "bascinet", cap: "#a7adb8", hair: ["#4a3020", "#2a1a12", "#6a4a2a"][v % 3], buttons: "#e0b23a", skin: SKINS[v % 4] });
export const BOL_SOLDIER = (v: number): Outfit => ({ jacket: v % 2 ? "#b8302c" : "#c4443a", pants: "#f4f1ea", boots: "#2a1a14", hat: "kettle", cap: "#8f96a2", hair: ["#2a1a12", "#4a3020", "#5a4034"][v % 3], buttons: "#f4f1ea", skin: SKINS[(v + 1) % 4] });
export const SNEAK = (v: number): Outfit => ({ jacket: v ? "#3a3f5a" : "#33384f", pants: "#2a2e40", boots: "#1e1a20", hat: "bascinet", cap: "#7d838e", hair: "#2a1a12", buttons: "#e0b23a", skin: SKINS[v % 4] });
export const KNIGHT: Outfit = { jacket: "#2a4f9a", pants: "#e0b23a", boots: "#3a2a20", hat: "bascinet", cap: "#c3c8d2", hair: "#6a4a2a", moustache: "#6a4a2a", buttons: "#e0b23a", skin: "#ffe2c2" };
export const TOURIST: Outfit = { jacket: "#3fa7a0", pants: "#3b4f7a", boots: "#f4f1ea", hat: "cap", cap: "#e2453c", buttons: "#3fa7a0", skin: "#e8b48a" };
/** medieval townsfolk: plain wool tunics, bare heads or a linen coif */
export const CITIZEN = (v: number): Outfit => ({ jacket: ["#8a5a3a", "#5d7a3a", "#a8743a", "#6a5a8a", "#9a3a3a", "#3a6a7a"][v % 6], pants: ["#4a3a2a", "#3b3f52", "#5a4a3a"][v % 3], boots: "#3a2a20",
  hat: v % 3 === 1 ? "bonnet" : "hair", hair: ["#4a3020", "#2a1a12", "#8a5a2a", "#5a4034"][v % 4], buttons: "#c9a04a", skin: SKINS[v % 4] });
