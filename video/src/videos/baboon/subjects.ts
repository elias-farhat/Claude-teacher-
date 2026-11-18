// Camera guard props for "The Baboon Who Ran the Railway": the levers, the loco (whistle shots), the ox cart, the
// trolley, the lady's coach balcony.
import * as THREE from "three";
import { BOX, LEVER, MARKET, RAIL_Z } from "./layout";
import { passFront, trolleyX } from "./story";

const B = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));
export const PROPS: Record<string, (t: number) => THREE.Box3> = {
  levers: () => B(LEVER(0).x - 0.2, BOX.floor, LEVER(0).z - 0.5, LEVER(3).x + 0.2, BOX.floor + 1.1, LEVER(0).z + 0.2),
  loco: (t) => { const f = passFront(t); return B(f - 4, 2.0, RAIL_Z - 1.3, f, 8.2, RAIL_Z + 1.3); },   // up to the whistle puff
  ox: () => B(MARKET.x - 3.2, 0, MARKET.z - 1.0, MARKET.x + 3.4, 2.0, MARKET.z + 1.0),
  trolley: (t) => { const x = trolleyX(t); return B(x - 0.9, 0.2, RAIL_Z - 0.85, x + 0.9, 0.55, RAIL_Z + 0.85); },
};
