// Where everything stands in our Hanoi, 1902 (x = east, z = south, metres). One compact world so that every camera
// glide between story beats stays short (CLAUDE.md: 25-30 frame glides, peak <= ~6 m/frame):
//   east edge  : the rat farm (barn, cages, farmhouse with a flat roof terrace)            x 118..165
//   boulevard  : along x at z = 0 (carriageway z -6..6, tram track, sidewalks, tamarind trees)  x -70..112
//     north row: the fancy house (bathroom + kitchen), the poster wall                      facades at z = -10
//     south row: city hall (the bounty office)                                               facades at z = +10
//   under it   : the new sewer (brick vault along x at z = 3, floor y = -7) with a branch up into the bathroom,
//                the hunters' manhole + ladder, the rats' nest niche
//   north      : the quay (z -30..-45), the Red River (z -45..-70), and across the water the Paris balcony
//                (Doumer's homecoming) on the far bank (facade z = -84)
import * as THREE from "three";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const BLVD = { x0: -70, x1: 112, z0: -10, z1: 10, road: 6 };
export const SEWER = { x0: -64, x1: 106, z: 3, y: -7, w: 4, wallH: 2.6, vault: 1.1 };
export const GRATE = { x: -10, z: 3 };            // line 3: the camera dives through this street grate
export const MANHOLE = { x: 40, z: 3 };           // line 6: the hunters climb down here
export const DRAIN = { x: 57, z: 7.6 };           // line 16: sidewalk drain above the rats' nest
export const NEST = { x: 57, y: SEWER.y, z: 6.6 }; // niche in the sewer's south wall
export const QUAY = { z0: -30, z1: -45, grate: { x: 73, z: -76 } };     // the grate is on the Paris plaza (line 21 ends down it)
export const OUTFLOW = { x: 73, y: -6, z: -76 };   // line 21: chamber under the plaza grate
export const RIVER = { z0: -45, z1: -70, y: -3 };
export const SHIP = { x: 54, z: -54 };            // line 20: the steamer at the quay
export const PALACE = { x: 60, z: -84, w: 46, h: 16, balconyY: 7.2 }; // far bank: Paris (Doumer's balcony)
export const FARM = { barn: { x: 142, z: -4 }, house: { x: 126, z: 20 }, yard: { x: 130, z: 4 } };
export const POSTER = { x: 62, z: -10 };          // poster wall on the north row, facing the boulevard (+z)
export const TRAM_Z = -1.6;

export type RoomName = "bath" | "kitchen" | "office" | "barn";
/** an opening in a room wall: wall n(-z) / s(+z) / e(+x) / w(-x); `at` = centre along the wall (local x for n/s, local z
 *  for e/w), y = sill height above the room floor */
export type Opening = { wall: "n" | "s" | "e" | "w"; at: number; y: number; w: number; h: number; door?: boolean };
export type RoomSpec = { o: THREE.Vector3; w: number; d: number; h: number; open: Opening[] };

export const ROOMS: Record<RoomName, RoomSpec> = {
  // the fancy house, north row: bathroom + kitchen side by side, windows on the boulevard (south wall, z = -10)
  bath: { o: V(7.5, 0, -13.5), w: 5, d: 7, h: 3.6, open: [{ wall: "s", at: 0, y: 1.2, w: 1.6, h: 1.7 }, { wall: "e", at: 0.6, y: 0, w: 1.2, h: 2.4, door: true }] },
  kitchen: { o: V(15, 0, -13.5), w: 10, d: 7, h: 3.6, open: [{ wall: "s", at: 1.5, y: 1.0, w: 2.2, h: 1.9 }, { wall: "w", at: 0.6, y: 0, w: 1.2, h: 2.4, door: true }] },
  // city hall, south row: the bounty office, window on the boulevard (north wall, z = +10)
  office: { o: V(76, 0, 14), w: 11, d: 8, h: 4.4, open: [{ wall: "n", at: -1.5, y: 0.9, w: 2.6, h: 2.6 }, { wall: "n", at: 3.6, y: 0, w: 1.6, h: 2.8, door: true }] },
  // the rat farm barn: big doors on the west end (facing the yard)
  barn: { o: V(FARM.barn.x, 0, FARM.barn.z), w: 18, d: 10, h: 6, open: [{ wall: "w", at: 0, y: 0, w: 4.2, h: 4.2, door: true }, { wall: "s", at: -3, y: 1.6, w: 1.6, h: 1.2 }, { wall: "s", at: 4, y: 1.6, w: 1.6, h: 1.2 }] },
};
export const ROOM_AT: Record<RoomName, THREE.Vector3> = Object.fromEntries(Object.entries(ROOMS).map(([k, r]) => [k, r.o])) as Record<RoomName, THREE.Vector3>;
/** is a point inside a room (or the sewer)? -> fog off, near plane in */
export const insideRoom = (p: THREE.Vector3): string | null => {
  for (const [k, r] of Object.entries(ROOMS)) if (Math.abs(p.x - r.o.x) < r.w / 2 && Math.abs(p.z - r.o.z) < r.d / 2 && p.y > r.o.y - 0.2 && p.y < r.o.y + r.h) return k;
  if (p.y < -0.2) return "sewer";
  return null;
};
