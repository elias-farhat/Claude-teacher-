// Camera guard props for "His College Banned Dogs, So He Brought a Bear": the bear (big; taller sitting up), Boatswain,
// the NO DOGS sign, the fair wagon, the Great Gate arch.
import * as THREE from "three";
import { LODGE, GATE_Z, WAGON } from "./layout";
import { bearAt, dogAt } from "./story";


const B = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));
export const PROPS: Record<string, (t: number) => THREE.Box3> = {
  bear: (t) => { const b = bearAt(t), p = b.p, h = 1.55 + 0.75 * b.up; return B(p.x - 0.55, p.y, p.z - 0.6, p.x + 0.55, p.y + h, p.z + 0.6); },
  dog: (t) => { const p = dogAt(t).p; return B(p.x - 0.35, 0, p.z - 0.45, p.x + 0.35, 1.05, p.z + 0.45); },
  sign: () => B(LODGE.x + 0.65, 0, GATE_Z + 1.85, LODGE.x + 2.05, 1.95, GATE_Z + 1.95),   // the full sign (it pops up in 0.25 s on "no")
  wagon: () => B(WAGON.x - 1.55, 0, WAGON.z - 0.95, WAGON.x + 1.55, 2.85, WAGON.z + 0.95),
  gate: () => B(-2.4, 0, GATE_Z - 0.2, 2.4, 10.5, GATE_Z + 0.4),
};
