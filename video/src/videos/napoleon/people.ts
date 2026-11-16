// The cast of "Napoleon vs. the Rabbits" (3D cast from bridge/char3d.ts; the Moon card drawer stays the fallback).
// Napoleon: grey greatcoat, white breeches, black boots, the sideways bicorne. Berthier: the blue and gold of a
// marshal, bicorne, nervous. Officers in blue with bicornes; farmers in straw hats and caps; General Thiébault, grey
// haired, at his desk in the end.
import type { Outfit } from "../bridge/toon";
import { SKINS } from "../bridge/toon";
export { person, personKey } from "../moon/people";
import type { Extra as MoonExtra, Look as MoonLook } from "../moon/people";

export type Look = Omit<MoonLook, "mode" | "gest"> & { mode?: MoonLook["mode"] | "run"; gest?: MoonLook["gest"] | "fist" | "hug" | "lift" | "charge" | "flee" | "stir" | "shrug2" | "aim" | "swing" | "salute" | "clap" | "flail" };
export type Extra = Omit<MoonExtra, "paper"> & { paper?: MoonExtra["paper"] | "list"; banner?: string; gun?: boolean; stick?: boolean; crate?: boolean; bunny?: boolean };

export const NAPOLEON: Outfit = { jacket: "#8a8c94", pants: "#f2efe6", boots: "#18161c", hat: "bicorne", cap: "#18161c", hair: "#3a2a20", buttons: "#d9b45a", skin: "#f5d6b8" };
export const NAPOLEON_BARE: Outfit = { ...NAPOLEON, hat: "hair" };
export const BERTHIER: Outfit = { jacket: "#2a3f8a", pants: "#f2efe6", boots: "#18161c", hat: "bicorne", cap: "#18161c", hair: "#6a4a2a", buttons: "#e8c04a", skin: "#ffe2c2", build: "stout" };
export const OFFICER = (v: number): Outfit => ({ jacket: v % 2 ? "#2a3f8a" : "#33489a", pants: "#f2efe6", boots: "#18161c", hat: "bicorne", cap: "#18161c", hair: ["#4a3020", "#2a1a12", "#8a5a2a"][v % 3], buttons: "#e8c04a", skin: SKINS[v % 4] });
export const RUSSIAN: Outfit = { jacket: "#2e5a3a", pants: "#f2efe6", boots: "#18161c", hat: "hair", hair: "#c8a060", moustache: "#c8a060", buttons: "#e8c04a", skin: "#ffe2c2" };
export const FARMER = (v: number): Outfit => ({ jacket: ["#8a5a3a", "#5d7a3a", "#a8743a", "#6a5a8a"][v % 4], pants: ["#4a3a2a", "#3b3f52", "#5a4a3a"][v % 3], boots: "#3a2a20",
  hat: v % 2 ? "straw" : "cap", cap: v % 2 ? "#e3cf96" : "#5a4a3a", hair: ["#4a3020", "#2a1a12", "#8a5a2a"][v % 3], buttons: "#c9a04a", skin: SKINS[(v + 1) % 4] });
export const THIEBAULT: Outfit = { jacket: "#2a3f8a", pants: "#f2efe6", boots: "#18161c", hat: "hair", hair: "#e8e4dc", buttons: "#e8c04a", skin: "#ffe2c2", moustache: "#c8c4bc" };
