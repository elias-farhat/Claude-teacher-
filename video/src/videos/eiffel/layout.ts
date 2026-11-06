// Where everything stands in Paris (x = east, z = south, metres; the tower is at the origin). Shared by the city
// (paris.ts), the interiors (rooms.ts) and the camera (story.ts), so camera flights can go physically from a street
// through a door or window into a room: every interior now sits inside a real building.
import * as THREE from "three";

export const RIVER = { z0: -200, z1: -330, y: -4 };
export const CAFE = { x: 152, z: 196, face: -1 };          // café front on the east avenue, facing west (-x)
export const HOTEL = { x: 430, z: -150, w: 110, h: 24 };   // grand hotel on the south quay, facade facing north (-z)
export const HOTEL_FACADE_Z = HOTEL.z - 15;                // its front wall
export const RAIL = { z: -186, y: 0.15 };                  // railway along the south quay
/** second café (line 4) on the "story street" between the tower and the hotel; the first café (line 16-17) stays */
export const CAFE4 = { x: 213, z: -60, face: -1 };
/** the story street: forger, André, the prison ward and the second café sit here, so every camera flight between
 *  scenes outside 15-36 s is at most ~200 m (flights are 20-30 frames with a capped speed) */
export const STREET = { x0: 140, x1: 370, z0: -160, z1: -20 };

export type RoomName = "forger" | "lobby" | "meeting" | "studio" | "andre" | "hospital";
/** an opening in a room wall: wall n(-z) / s(+z) / e(+x) / w(-x); `at` = centre along the wall (local x for n/s, local z
 *  for e/w), y = sill height above the room floor */
export type Opening = { wall: "n" | "s" | "e" | "w"; at: number; y: number; w: number; h: number; door?: boolean };
export type RoomSpec = { o: THREE.Vector3; w: number; d: number; h: number; open: Opening[] };
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const fz = HOTEL_FACADE_Z;

export const ROOMS: Record<RoomName, RoomSpec> = {
  // hotel ground floor: entered through the main door (arcade bay 0), tall window in bay -7
  lobby: { o: V(HOTEL.x, 0, fz + 8), w: 22, d: 16, h: 8, open: [{ wall: "n", at: 0, y: 0, w: 3.2, h: 5, door: true }, { wall: "n", at: -7, y: 1.2, w: 3, h: 4.6 }] },
  // hotel first floor (above the arcade), between the columns; meeting <-> studio share a doorway
  meeting: { o: V(HOTEL.x + 12, 8.5, fz + 4), w: 10, d: 8, h: 4.6, open: [{ wall: "n", at: -1, y: 1.0, w: 1.8, h: 2.6 }, { wall: "e", at: 0, y: 0, w: 1.3, h: 2.4, door: true }, { wall: "s", at: -3.2, y: 0, w: 1.1, h: 2.3, door: true }] },
  studio: { o: V(HOTEL.x + 22, 8.5, fz + 4), w: 10, d: 8, h: 4.6, open: [{ wall: "n", at: 0, y: 1.2, w: 1.6, h: 2.4 }, { wall: "w", at: 0, y: 0, w: 1.3, h: 2.4, door: true }] },
  // standalone buildings, each room's window on the street (north) side
  forger: { o: V(320, 0, -122.5), w: 6, d: 5, h: 3.2, open: [{ wall: "n", at: 1.6, y: 1.1, w: 1.5, h: 1.4 }] },
  andre: { o: V(175, 4.2, -122.5), w: 6, d: 5, h: 3, open: [{ wall: "n", at: -1.2, y: 0.9, w: 1.4, h: 1.6 }] },
  hospital: { o: V(270, 0, -121.5), w: 12, d: 7, h: 4.2, open: [{ wall: "n", at: 0.5, y: 1.0, w: 2.4, h: 2.6 }] },
};
export const ROOM_AT: Record<RoomName, THREE.Vector3> = Object.fromEntries(Object.entries(ROOMS).map(([k, r]) => [k, r.o])) as Record<RoomName, THREE.Vector3>;

/** host buildings around the standalone rooms (north face flush with the room's window wall) */
export type Host = { room: RoomName; x0: number; x1: number; z0: number; z1: number; h: number };
const host = (room: RoomName, wide: number, deep: number, h: number): Host => {
  const r = ROOMS[room], zN = r.o.z - r.d / 2;
  return { room, x0: r.o.x - wide / 2, x1: r.o.x + wide / 2, z0: zN, z1: zN + deep, h };
};
export const HOSTS: Host[] = [host("forger", 18, 20, 19), host("andre", 20, 20, 21), host("hospital", 26, 22, 18)];

/** world-space rectangle of a north-wall opening (x0..x1, y0..y1) on the plane z */
export const northHole = (room: RoomName, k = 0) => {
  const r = ROOMS[room], op = r.open.filter((o) => o.wall === "n")[k];
  return { x0: r.o.x + op.at - op.w / 2, x1: r.o.x + op.at + op.w / 2, y0: r.o.y + op.y, y1: r.o.y + op.y + op.h, z: r.o.z - r.d / 2 };
};
/** facade holes the hotel shell must leave open (lobby door + window, meeting + studio windows) */
export const HOTEL_HOLES = [northHole("lobby", 0), northHole("lobby", 1), northHole("meeting", 0), northHole("studio", 0)];

/** camera portal of a room: a point outside its street opening and one just inside (both at the opening's centre
 *  height), plus doorways that link two rooms directly */
export type Portal = { out: THREE.Vector3; in: THREE.Vector3 };
export const PORTAL: Record<RoomName, Portal> = Object.fromEntries((Object.keys(ROOMS) as RoomName[]).filter((k) => k !== "studio").map((k) => {
  const h = northHole(k, 0), cx = (h.x0 + h.x1) / 2, cy = Math.min(h.y0 + 1.6, (h.y0 + h.y1) / 2);
  return [k, { out: V(cx, cy, h.z - 7), in: V(cx, cy, h.z + 1.4) }];
})) as Record<RoomName, Portal>;
// the studio is reached through the meeting room's east doorway
PORTAL.studio = PORTAL.meeting;
export const LINKS: Record<string, [THREE.Vector3, THREE.Vector3]> = {
  "meeting>studio": [V(ROOMS.meeting.o.x + 3.6, ROOMS.meeting.o.y + 1.6, ROOMS.meeting.o.z), V(ROOMS.studio.o.x - 3.4, ROOMS.studio.o.y + 1.6, ROOMS.studio.o.z)],
};
LINKS["studio>meeting"] = [LINKS["meeting>studio"][1], LINKS["meeting>studio"][0]];
/** hotel rooms are connected inside the building; leaving one for the other goes out and in through the facade */
export const BUILDING: Record<RoomName, string> = { lobby: "hotel", meeting: "hotel", studio: "hotel", forger: "forger", andre: "andre", hospital: "hospital" };
