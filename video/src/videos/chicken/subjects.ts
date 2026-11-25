// Camera guard props for "This Chicken Lived 18 Months Without a Head": Mike himself (a 3D rooster, not a person),
// the neck diagram, the truck, the money on the porch table, the farmhouse.
import * as THREE from "three";
import { EASEL, TRUCK, PORCH, HOUSE } from "./layout";
import { mikeAt, truckX } from "./story";

const B = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));
export const PROPS: Record<string, (t: number) => THREE.Box3> = {
  mike: (t) => { const m = mikeAt(t), p = m.p; return B(p.x - 0.38, p.y, p.z - 0.38, p.x + 0.38, p.y + (m.headless ? 1.08 : 1.15), p.z + 0.38); },
  diagram: () => B(EASEL.x - 0.6, 0.7, EASEL.z, EASEL.x + 0.6, 2.2, EASEL.z + 0.1),
  truck: (t) => { const x = truckX(t); return B(x - 2.6, 0, TRUCK.z - 1.0, x + 3.9, 2.0, TRUCK.z + 1.0); },
  money: () => B(2.9, PORCH.h + 0.8, -6.9, 4.1, PORCH.h + 1.05, -6.4),
  house: () => B(HOUSE.x0, 0, HOUSE.z0, HOUSE.x1, HOUSE.h + 2.6, HOUSE.z1),
};
