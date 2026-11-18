// The cast of "The Baboon Who Ran the Railway" (3D cast from bridge/char3d.ts). James "Jumper" Wide: railway-blue
// jacket, navy cap, a big moustache; wooden peg legs from line 3 on. Jack: a chacma baboon (grey-brown fur, pink-tan
// muzzle, a tail), smaller than the people; a little railway cap once he is hired (line 12). The lady passenger in a
// bonnet; the two railway bosses in top hats; the market folk and the ox-cart man.
import type { Outfit } from "../bridge/toon";
import { SKINS } from "../bridge/toon";
export { person, personKey } from "../moon/people";
import type { Extra as MoonExtra, Look as MoonLook } from "../moon/people";

export type Look = Omit<MoonLook, "mode" | "gest"> & { mode?: MoonLook["mode"] | "run"; gest?: MoonLook["gest"] | "fist" | "hug" | "lift" | "charge" | "flee" | "stir" | "shrug2" | "aim" | "swing" | "salute" | "clap" | "flail" | "slam" | "whisper" | "nose" | "recoil" | "shake" | "tear" | "pull" | "pullLow" | "fold" | "run" };
export type Extra = MoonExtra & { banner?: string; coins?: boolean; hatTilt?: number; baboon?: string; pegs?: boolean; bottle?: boolean; hammer?: boolean; clipboard?: boolean };

export const FUR = "#8a7a5a";
export const JUMPER: Outfit = { jacket: "#2a4a7a", pants: "#24304a", boots: "#2a1e18", hat: "cap", cap: "#1e2a44", hair: "#5a3a22", buttons: "#d9b45a", skin: "#f2c09a", moustache: "#5a3a22" };
export const JACK: Outfit = { jacket: FUR, pants: FUR, boots: "#4a3a2e", hat: "hair", hair: FUR, buttons: FUR, skin: "#c9a088" };
export const JACK_CAP: Outfit = { ...JACK, hat: "cap", cap: "#1e2a44" };
export const LADY: Outfit = { jacket: "#8a3a6a", pants: "#8a3a6a", boots: "#2a1e22", hat: "straw", cap: "#e9cf8f", hair: "#6a3a22", buttons: "#f4e6c8", skin: "#ffe2c2", dress: "#8a3a6a" };
export const BOSS = (v: number): Outfit => ({ jacket: v ? "#2a2a34" : "#3a2e2a", pants: "#24242c", boots: "#141018", hat: "tophat", hair: v ? "#8a8070" : "#3a2a1a", buttons: "#c9a04a", skin: SKINS[(v + 1) % 4], moustache: v ? "#8a8070" : undefined, build: v ? undefined : "stout" });
export const FOLK = (v: number): Outfit => ({ jacket: ["#a8743a", "#5d7a3a", "#8a3a3a", "#3a6a7a", "#c9a04a", "#6a5a8a"][v % 6], pants: ["#4a3a2a", "#3b3f52", "#5a4a3a"][v % 3], boots: "#3a2a20",
  hat: ["straw", "hair", "bonnet", "cap"][v % 4], cap: "#7a5a3a", hair: ["#2a1a12", "#4a3020", "#8a5a2a", "#1a120c"][v % 4], buttons: "#c9a04a", skin: SKINS[(v + 2) % 4], dress: v % 4 === 2 ? "#c25a7a" : undefined });
