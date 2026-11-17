// Camera guard props for "The Pope Who Put a Corpse on Trial": the throne, the falling mitre, the wrapped body.
import * as THREE from "three";
import { THRONE, RIVER, BANK } from "./layout";
import { mitreFallAt, bundleAt, stephenMitreAt } from "./story";

const B = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));
export const PROPS: Record<string, (t: number) => THREE.Box3> = {
  throne: () => B(THRONE.x - 0.4, THRONE.h, THRONE.z - 0.6, THRONE.x + 0.6, THRONE.h + 2.2, THRONE.z + 0.6),
  mitre: (t) => { const p = mitreFallAt(t).p; return B(p.x - 0.25, p.y, p.z - 0.25, p.x + 0.25, p.y + 0.6, p.z + 0.25); },
  smitre: (t) => { const p = stephenMitreAt(t).p; return B(p.x - 0.25, p.y, p.z - 0.25, p.x + 0.25, p.y + 0.6, p.z + 0.25); },
  water: () => B(RIVER.x - 1.3, RIVER.y, BANK.z - 0.8, RIVER.x + 0.7, RIVER.y + 1.6, BANK.z + 1.2),   // the splash spot on the Tiber, just behind the monks
  bundle: (t) => { const p = bundleAt(t).p; return B(p.x - 0.8, p.y - 0.25, p.z - 0.25, p.x + 0.8, p.y + 0.25, p.z + 0.25); },
};
