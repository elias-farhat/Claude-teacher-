// Where everything stands in the Moon Hoax short (x = east, z = south, metres): a cartoon diorama world where New
// York's harbour faces "South Africa" across a short strait and a small, close Moon hangs over the water, so every
// camera glide between beats is <= ~90 m (CLAUDE.md: 25-30 frame glides, peak <= ~6 m/frame).
//   New York 1835 : street along x at z = 0 (x -20..40): The Sun print shop (north row), The Herald (south row)
//   harbour        : pier x 40..50; strait x 48..95 (water y = -1.5); "EUROPE" coast far to the north-east
//   the Cape       : beach x 95..101, Herschel's cottage + garden + his normal telescope, the hill with the giant telescope
//   the Moon       : sphere over the strait; its flat top holds the forest, the ocean, the goats and the bat-people
import * as THREE from "three";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const STREET = { x0: -24, x1: 46, road: 5, facade: 8 };
export const WATER = { x0: 46, x1: 160, y: -1.5 };
export const PIER = { x0: 40, x1: 52, z: 0, w: 4 };
export const CAPE = { x0: 87, x1: 142 };
export const COTTAGE = { x: 98, z: 13 };
export const GARDEN = { x: 98, z: 6 };             // Herschel's tea table + normal telescope (line 12), letters (17)
export const BEACH = { x: 90.5, z: -2 };            // line 14: Herschel on vacation, no signal
export const HILL = { x: 112, z: -12, r: 15, h: 7 };
export const MOON = { c: V(64, 44, -28), r: 14 };
export const MOON_TOP = MOON.c.y + MOON.r;          // the plateau the moon scenes stand on
/** the giant telescope: eyepiece on the hill top, tube aimed at the Moon */
export const EYEPIECE = V(HILL.x - 4, HILL.h + 1.6, HILL.z);
export const TUBE_DIR = MOON.c.clone().sub(EYEPIECE).normalize();
export const TUBE_LEN = 24;
export const TUBE_END = EYEPIECE.clone().addScaledVector(TUBE_DIR, TUBE_LEN);
export const SHIP_LINE = { x0: 58, x1: 84, z: 8 };  // line 13: the slow letter ship crawls across the strait
export const EUROPE = { x: 120, z: -95 };           // distant coast (line 10)

export type RoomName = "sun" | "herald";
export type Opening = { wall: "n" | "s" | "e" | "w"; at: number; y: number; w: number; h: number; door?: boolean };
export type RoomSpec = { o: THREE.Vector3; w: number; d: number; h: number; open: Opening[] };
export const ROOMS: Record<RoomName, RoomSpec> = {
  // The Sun: a tiny print shop on the north row; window + door on the street (south wall, z = -8)
  sun: { o: V(25, 0, -11.5), w: 10, d: 7, h: 3.8, open: [{ wall: "s", at: -1.8, y: 0.9, w: 2.4, h: 1.9 }, { wall: "s", at: 3.0, y: 0, w: 1.4, h: 2.5, door: true }] },
  // The Herald (rival paper), south row; window + door on the street (north wall, z = +8)
  herald: { o: V(9, 0, 11.5), w: 9, d: 7, h: 3.8, open: [{ wall: "n", at: -1.5, y: 0.9, w: 2.4, h: 1.9 }, { wall: "n", at: 2.6, y: 0, w: 1.4, h: 2.5, door: true }] },
};
export const ROOM_AT: Record<RoomName, THREE.Vector3> = Object.fromEntries(Object.entries(ROOMS).map(([k, r]) => [k, r.o])) as Record<RoomName, THREE.Vector3>;
export const insideRoom = (p: THREE.Vector3): string | null => {
  for (const [k, r] of Object.entries(ROOMS)) if (Math.abs(p.x - r.o.x) < r.w / 2 && Math.abs(p.z - r.o.z) < r.d / 2 && p.y > r.o.y - 0.2 && p.y < r.o.y + r.h) return k;
  // inside the telescope tube
  const d = p.clone().sub(EYEPIECE), along = d.dot(TUBE_DIR);
  if (along > -0.5 && along < TUBE_LEN && d.clone().addScaledVector(TUBE_DIR, -along).length() < 1.6) return "tube";
  return null;
};
