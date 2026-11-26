// The cast of "His College Banned Dogs, So He Brought a Bear" (3D cast from bridge/char3d.ts). Lord Byron: dark curls,
// a white shirt with a high collar, a deep-green tail coat and a navy cape; the head porter in a bowler-ish top hat and
// a red waistcoat; the tutors in black gowns and mortarboards; students in gowns. The bear and Boatswain are animals.ts.
import type { Outfit } from "../bridge/toon";
import { SKINS } from "../bridge/toon";
export { person, personKey } from "../moon/people";
import type { Extra as MoonExtra, Look as MoonLook } from "../moon/people";

export type Look = Omit<MoonLook, "mode" | "gest"> & { mode?: MoonLook["mode"] | "run"; gest?: MoonLook["gest"] | "fist" | "hug" | "lift" | "charge" | "flee" | "stir" | "shrug2" | "aim" | "swing" | "salute" | "clap" | "flail" | "slam" | "whisper" | "nose" | "recoil" | "shake" | "tear" | "pull" | "pullLow" | "fold" | "run" };
export type Extra = Omit<MoonExtra, "paper"> & { paper?: string; cape?: string; leash?: boolean; sweat?: boolean; hatTilt?: number };

export const BYRON: Outfit = { jacket: "#2e5a46", pants: "#e8dcc4", boots: "#1e1a1e", hat: "hair", hair: "#2a1a14", buttons: "#e8c060", skin: "#ffe4cc" };
export const BYRON_CAPE = "#24345a";
export const PORTER: Outfit = { jacket: "#b8402e", pants: "#2a2a34", boots: "#1a1418", hat: "tophat", hair: "#8a8070", buttons: "#e8c060", skin: SKINS[1], moustache: "#8a8070", build: "stout" };
export const TUTOR = (v: number): Outfit => ({ jacket: "#22222c", pants: "#22222c", boots: "#141018", hat: "mortarboard", cap: ["#d8b040", "#c8302a", "#4a8ad0"][v % 3], hair: ["#8a8070", "#3a2a1a", "#c8b8a0"][v % 3], buttons: "#e8e0d0", skin: SKINS[(v + 1) % 4], moustache: v === 1 ? "#3a2a1a" : undefined, build: v === 2 ? "stout" : undefined });
export const STUDENT = (v: number): Outfit => ({ jacket: ["#3a5a8a", "#6a3a5a", "#4a6a3a", "#8a5a2a"][v % 4], pants: "#e8dcc4", boots: "#2a1e18", hat: "hair", hair: ["#c89048", "#4a3020", "#8a5a2a", "#2a1a12"][v % 4], buttons: "#e8c060", skin: SKINS[(v + 2) % 4] });
export const GOWN = "#1c1c26";
