// Camera guard + auto-framer adapter: "His College Banned Dogs, So He Brought a Bear" (shots.ts -> camtrack.json).
import * as THREE from "three";
import { loop, guardOnly, guardFrames, AutoCfg } from "./auto";
import { ByronWorld, KIT_NAMES } from "../videos/byron/world";
import { loadKitSync } from "./glbkit";
import { camAt, camAtHand, setTrack, getTrack, FPS, TOTAL, SHOTS } from "../videos/byron/story";
import { stage } from "../videos/byron/stage";
import { SHOT_SPECS } from "../videos/byron/shots";
import { PROPS } from "../videos/byron/subjects";

// the Kenney set dressing, loaded from disk, so the guard sees every prop the render has (CLAUDE.md 5)
let KIT: Record<string, THREE.Object3D> = {};
export const prepare = async () => { KIT = await loadKitSync(KIT_NAMES()); console.error(`[guard] Kenney kit: ${Object.keys(KIT).length}/${KIT_NAMES().length} models`); };
const cfg = (): AutoCfg => {
  const w = new ByronWorld(KIT as never);
  return { video: "byron", fps: FPS, total: TOTAL, root: w.root, specs: SHOT_SPECS, camAt, camAtHand, setTrack, getTrack,
    vias: (t) => SHOTS.filter((s) => s.via && Math.abs(s.at - t) < 1.6).map((s) => s.via!), props: PROPS,
    stage: (t, c, cam) => stage(t, c as never, cam),
    setTime: (t) => w.setTime(t) };
};
export const autoframe = (n = 5) => loop(cfg(), n);
export const guard = () => guardOnly(cfg()).rows;

export const debugFrames = (fs: number[]) => guardFrames(cfg(), fs).map((r) => console.log(r.f, JSON.stringify(r.fails)));
