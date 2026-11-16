// Camera guard props for "Napoleon vs. the Rabbits": the swarm (instanced), the king rabbit in the bicorne, the cages,
// the carriage, the army on the hill.
import * as THREE from "three";
import { swarmBox } from "./rabbits";
import { carriageAt, HAT_REST } from "./story";
import { CAGES, HILL } from "./layout";

const B = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));
export const PROPS: Record<string, (t: number) => THREE.Box3> = {
  swarm: (t) => swarmBox(t),
  king: () => B(HAT_REST.x - 0.3, 0, HAT_REST.z - 0.3, HAT_REST.x + 0.3, 0.75, HAT_REST.z + 0.3),
  cages: () => B(CAGES[0].x - 1, 0, CAGES[8].z - 0.6, CAGES[7].x + 1, 1.0, CAGES[0].z + 0.6),
  carriage: (t) => { const c = carriageAt(t); return B(c.x - 1.3, 0, c.z - 0.9, c.x + 4.2, 2.7, c.z + 0.9); },
  army: () => B(HILL.x - 16, HILL.h, HILL.z - 12, HILL.x + 5, HILL.h + 2, HILL.z + 12),
};
