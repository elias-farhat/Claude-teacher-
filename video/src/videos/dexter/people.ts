// The cast of "The Luckiest Fool in History" (3D cast from bridge/char3d.ts; the Moon card drawer stays the fallback).
// Timothy Dexter: purple coat, buff breeches, a big black tricorne, goofy grin. The merchants: dark coats, tricornes
// over powdered wigs, smug. Townsfolk of 1790s Newburyport, West Indies planters in straw hats, sailors, the fur-hatted
// captain in red mittens, Newcastle's miners, mourners in black.
import type { Outfit } from "../bridge/toon";
import { SKINS } from "../bridge/toon";
export { person, personKey } from "../moon/people";
import type { Extra as MoonExtra, Look as MoonLook } from "../moon/people";

export type Look = Omit<MoonLook, "mode" | "gest"> & { mode?: MoonLook["mode"] | "run"; gest?: MoonLook["gest"] | "fist" | "hug" | "lift" | "charge" | "flee" | "stir" | "shrug2" };
export type Extra = MoonExtra & { banner?: string; pan?: boolean; mittens?: string; sack?: boolean; coins?: boolean; ink?: boolean };

export const DEXTER: Outfit = { jacket: "#7a3f9a", pants: "#e8d8b0", boots: "#241a20", hat: "tricorn", cap: "#22202a", hair: "#7a4a2a", buttons: "#e8b84a", skin: "#ffe2c2" };
export const MERCHANT = (v: number): Outfit => ({ jacket: ["#2a3a30", "#3a2a3a", "#2a2f48"][v % 3], pants: ["#3a3434", "#2e2e3a", "#4a4036"][v % 3], boots: "#1e1a1a", hat: "tricorn", cap: "#1d1b22", hair: "#e8e4dc",
  buttons: "#c9a04a", build: v === 1 ? "stout" : undefined, skin: SKINS[v % 3] });
export const TOWN = (v: number): Outfit => ({ jacket: ["#8a5a3a", "#5d7a3a", "#a8743a", "#6a5a8a", "#9a3a3a", "#3a6a7a"][v % 6], pants: ["#4a3a2a", "#3b3f52", "#5a4a3a"][v % 3], boots: "#3a2a20",
  hat: v % 3 === 1 ? "bonnet" : v % 3 === 2 ? "tricorn" : "hair", cap: "#2a2a30", hair: ["#4a3020", "#2a1a12", "#8a5a2a", "#5a4034"][v % 4], buttons: "#c9a04a", skin: SKINS[v % 4] });
export const PLANTER = (v: number): Outfit => ({ jacket: ["#efe9dc", "#e6dcc4", "#f4efe4"][v % 3], pants: "#c9b48a", boots: "#5a3a26", hat: "straw", hair: "#2a1a12", buttons: "#8a6a4a", skin: ["#c99067", "#a8714a", "#8a5a3a", "#ecd0b6"][v % 4] });
export const SAILOR = (v: number): Outfit => ({ jacket: v % 2 ? "#2a4f7a" : "#f2efe6", pants: "#3a4a6a", boots: "#2a1a14", hat: "cap", cap: v % 2 ? "#e2453c" : "#2a3a5a", hair: "#4a3020", buttons: "#f2efe6", skin: SKINS[(v + 1) % 4] });
export const CAPTAIN: Outfit = { jacket: "#6a4a32", pants: "#3a3030", boots: "#1e1a1a", hat: "fur", cap: "#5a3a26", hair: "#5a4034", moustache: "#5a4034", buttons: "#d9b45a", build: "stout", skin: "#f5c9a0" };
export const FURSAILOR = (v: number): Outfit => ({ jacket: v % 2 ? "#3a4a5a" : "#4a3a30", pants: "#2e3446", boots: "#1e1a1a", hat: "fur", cap: v % 2 ? "#4a3426" : "#6a5a4a", hair: "#4a3020", buttons: "#c9a04a", skin: SKINS[v % 4] });
export const MINER = (v: number): Outfit => ({ jacket: ["#4a4440", "#3a3a42", "#54483e"][v % 3], pants: "#2e2c2a", boots: "#1e1a1a", hat: "cap", cap: "#2a2a2e", hair: "#2a1a12", buttons: "#8a8070", skin: SKINS[(v + 2) % 4] });
export const MOURNER = (v: number): Outfit => ({ jacket: "#24242c", pants: "#1e1e24", boots: "#141016", hat: v % 2 ? "hair" : "tricorn", cap: "#141016", hair: "#4a3020", buttons: "#6a6a72", skin: SKINS[v % 4] });
