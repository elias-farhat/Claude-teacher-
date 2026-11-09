// Camera guard adapter: the Rat Bounty short.
import * as THREE from "three";
import { run } from "./core";
import { RatWorld } from "../videos/rats/world";
import { camAt, FPS, TOTAL, tramX } from "../videos/rats/story";
import { stage } from "../videos/rats/stage";
import { TRAM_Z } from "../videos/rats/layout";
import { WINDOWS } from "../videos/rats/subjects";

export const guard = () => {
  const w = new RatWorld({} as never) as unknown as { hanoi: { tram: THREE.Object3D }; root: THREE.Object3D };
  return run({
    name: "rats", fps: FPS, total: TOTAL, root: w.root,
    camAt: (t) => camAt(t), stage: (t, c, cam) => stage(t, c as never, cam),
    setTime: (t) => { w.hanoi.tram.position.set(tramX(t), 0, TRAM_Z); },
    windows: WINDOWS,
  });
};
