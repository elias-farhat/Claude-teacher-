// The cast of "This Chicken Lived 18 Months Without a Head" (3D cast from bridge/char3d.ts). Lloyd Olsen: denim
// overalls over a red work shirt, a straw hat; Clara: a blue-check house dress, auburn hair; Hope Wade, the promoter: a
// cream suit and a brown fedora; the sideshow crowd. Mike himself is a 3D rooster (rooster.ts), not a person.
import type { Outfit } from "../bridge/toon";
import { SKINS } from "../bridge/toon";
export { person, personKey } from "../moon/people";
import type { Extra as MoonExtra, Look as MoonLook } from "../moon/people";

export type Look = Omit<MoonLook, "mode" | "gest"> & { mode?: MoonLook["mode"] | "run"; gest?: MoonLook["gest"] | "fist" | "hug" | "lift" | "charge" | "flee" | "stir" | "shrug2" | "aim" | "swing" | "salute" | "clap" | "flail" | "slam" | "whisper" | "nose" | "recoil" | "shake" | "tear" | "pull" | "pullLow" | "fold" | "run" };
export type Extra = Omit<MoonExtra, "paper"> & { paper?: string; banner?: string; coins?: boolean; hatTilt?: number; axe?: boolean; dropper?: boolean; sack?: boolean };

export const LLOYD: Outfit = { jacket: "#4a6a9a", pants: "#3e5a88", boots: "#5a3a22", hat: "straw", cap: "#e9cf8f", hair: "#6a4a2a", buttons: "#d9b45a", skin: "#f2c09a", belt: "#c8302a" };
export const CLARA: Outfit = { jacket: "#6a9ad0", pants: "#6a9ad0", boots: "#5a3a2a", hat: "hair", hair: "#a8502a", buttons: "#ffffff", skin: "#ffe2c2", dress: "#6a9ad0" };
export const HOPE: Outfit = { jacket: "#e8dcc0", pants: "#d8ccb0", boots: "#5a3a22", hat: "fedora", cap: "#7a5a3a", hair: "#3a2a1a", buttons: "#8a6a3a", skin: SKINS[1], moustache: "#3a2a1a" };
export const FOLK = (v: number): Outfit => ({ jacket: ["#d8744a", "#5d9a5a", "#c84a5a", "#4a8aa8", "#e0b040", "#8a6ab0"][v % 6], pants: ["#5a4a3a", "#4b4f72", "#6a5a4a"][v % 3], boots: "#3a2a20",
  hat: ["straw", "hair", "bonnet", "cap", "hair", "fedora"][v % 6], cap: ["#e9cf8f", "#7a5a3a", "#f0d8a8", "#4a6a9a", "#7a5a3a", "#6a5040"][v % 6], hair: ["#2a1a12", "#8a5a2a", "#4a3020", "#c89048"][v % 4], buttons: "#c9a04a", skin: SKINS[(v + 1) % 4], dress: v % 6 === 2 || v % 6 === 4 ? ["#e87a9a", "#f0b040"][(v % 6) / 2 - 1] : undefined });
