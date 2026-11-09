// Camera guard + auto-framer adapter: the Moon short (shots.ts -> camtrack.json).
import * as THREE from "three";
import { loop, guardOnly, AutoCfg } from "./auto";
import { MoonWorld } from "../videos/moon/world";
import { camAt, camAtHand, setTrack, getTrack, FPS, TOTAL, SHOTS } from "../videos/moon/story";
import { stage } from "../videos/moon/stage";
import { SHOT_SPECS } from "../videos/moon/shots";
import { shipX } from "../videos/moon/story";
import { SHIP_LINE, WATER, MOON_TOP } from "../videos/moon/layout";
import { PROPS } from "../videos/moon/subjects";

const cfg = (): AutoCfg => {
  const w = new MoonWorld({} as never) as unknown as { dio: { ship: THREE.Object3D }; moonX: THREE.Object3D; root: THREE.Object3D };
  return { video: "moon", fps: FPS, total: TOTAL, root: w.root, specs: SHOT_SPECS, camAt, camAtHand, setTrack, getTrack,
    vias: (t) => SHOTS.filter((s) => s.via && Math.abs(s.at - t) < 1.6).map((s) => s.via!), props: PROPS,
    stage: (t, c, cam) => stage(t, c as never, cam),
    setTime: (t) => { w.dio.ship.position.set(shipX(t), WATER.y + 0.4, SHIP_LINE.z); w.moonX.visible = camAt(t).pos.y > MOON_TOP - 1; } };
};
export const autoframe = (n = 5) => loop(cfg(), n);
export const guard = () => guardOnly(cfg()).rows;
