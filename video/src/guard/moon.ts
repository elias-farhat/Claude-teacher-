// Camera guard adapter: the Moon Hoax short.
import * as THREE from "three";
import { run } from "./core";
import { MoonWorld } from "../videos/moon/world";
import { camAt, FPS, TOTAL, shipX } from "../videos/moon/story";
import { stage } from "../videos/moon/stage";
import { SHIP_LINE, WATER, MOON_TOP } from "../videos/moon/layout";
import { WINDOWS, PROPS } from "../videos/moon/subjects";

export const guard = () => {
  const w = new MoonWorld({} as never) as unknown as { dio: { ship: THREE.Object3D }; moonX: THREE.Object3D; root: THREE.Object3D };
  return run({
    name: "moon", fps: FPS, total: TOTAL, root: w.root,
    camAt: (t) => camAt(t), stage: (t, c, cam) => stage(t, c as never, cam),
    setTime: (t) => { w.dio.ship.position.set(shipX(t), WATER.y + 0.4, SHIP_LINE.z); w.moonX.visible = camAt(t).pos.y > MOON_TOP - 1; },
    props: PROPS, windows: WINDOWS,
  });
};
