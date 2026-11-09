// Camera guard adapter: the Eiffel short's world, camera, cast and subjects.
import * as THREE from "three";
import { run } from "./core";
import { EiffelWorld } from "../videos/eiffel/world";
import { camAt, FPS, TOTAL, trainX, shipX } from "../videos/eiffel/story";
import { stage } from "../videos/eiffel/stage";
import { RAIL } from "../videos/eiffel/paris";
import { WINDOWS, PROPS } from "../videos/eiffel/subjects";

export const guard = () => {
  const world = new EiffelWorld({} as never);
  const w = world as unknown as { paris: { train: { group: THREE.Object3D } }; ship: THREE.Object3D; root: THREE.Object3D };
  return run({
    name: "eiffel", fps: FPS, total: TOTAL, root: w.root,
    camAt: (t) => camAt(t), stage: (t, c, cam) => stage(t, c as never, cam),
    setTime: (t) => { w.paris.train.group.position.set(trainX(t), 0, RAIL.z); w.ship.position.set(shipX(t), 0, -263); },
    props: PROPS, windows: WINDOWS,
  });
};
