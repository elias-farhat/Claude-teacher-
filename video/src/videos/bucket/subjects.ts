// Camera guard subjects for "The War of the Bucket" (CLAUDE.md rule 13): world props as boxes ("w:" ids in shots.ts).
import * as THREE from "three";
import { armyDX } from "./story";
import { WELL_MID, WELL_B, WELL_OUT, ARMY, CASTLE, BOLOGNA, TOWER, ROOM_Y } from "./layout";

const B = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));
const well = (c: THREE.Vector3) => () => B(c.x - 1.0, 0, c.z - 1.0, c.x + 1.0, 2.9, c.z + 1.0);
export const PROPS: Record<string, (t: number) => THREE.Box3> = {
  wellMid: well(WELL_MID),
  bucketMid: () => B(WELL_MID.x + 0.3, 0.75, WELL_MID.z - 0.05, WELL_MID.x + 0.8, 1.2, WELL_MID.z + 0.45),
  wellB: well(WELL_B),
  wellOut: well(WELL_OUT),
  army: (t) => B(ARMY.x0 + armyDX(t), 0, ARMY.z0, ARMY.x1 + armyDX(t), 2.2, ARMY.z1),
  castle: () => B(CASTLE.x - 7, CASTLE.y - 2, CASTLE.z - 7, CASTLE.x + 7, CASTLE.y + 14, CASTLE.z + 7),
  gateB: () => B(BOLOGNA.gateX - 1, 0, BOLOGNA.gateZ - 5, BOLOGNA.gateX + 1, 10, BOLOGNA.gateZ + 5),
  bucketRoom: () => B(TOWER.x - 0.45, ROOM_Y + 0.5, TOWER.z - 0.45, TOWER.x + 0.45, ROOM_Y + 1.4, TOWER.z + 0.45),
};
