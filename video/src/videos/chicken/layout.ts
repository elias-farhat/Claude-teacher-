// Where everything stands in "This Chicken Lived 18 Months Without a Head" (x = east, z = south, metres):
//   the Olsen farm (origin): the farmhouse to the north with its porch facing south, the red barn to the east, the
//                            dirt yard with the chopping block; Mike struts, pecks and is fed here (lines 1-4, 9)
//   the kitchen (x +200): an open-roofed set (bright: sun on the table), the table, the eyedropper, the neck diagram on
//                         an easel (lines 5-6)
//   the sideshow (x -200): the striped tent with the MIRACLE MIKE banner, the ticket booth, the queue, the truck (7-8)
//   the spotlight stage (z +200): a round stage, a pedestal, the crowd (line 10)
import * as THREE from "three";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const HOUSE = { x0: -6, x1: 6, z0: -16, z1: -8, h: 4.2 };
export const PORCH = { x0: -6, x1: 6, z0: -8, z1: -5, h: 0.45 };
export const BARN = { x0: 12, x1: 22, z0: -18, z1: -8 };
export const CHOP = V(5, 0, 2);                    // the chopping block
export const GRAIN = V(0.6, 0, -2.4);              // where Mike pecks in the morning (line 4)
export const KITCHEN = V(200, 0, 0);               // centre of the kitchen floor
export const TABLE = V(200, 0, -0.6);              // the kitchen table (top 0.8)
export const EASEL = V(203.1, 0, -2.0);            // the neck diagram
export const TENT = V(-200, 0, -8);                // the sideshow tent (entrance faces south)
export const BOOTH = V(-196, 0, -1.2);             // the ticket booth
export const TRUCK = V(-188, 0, 3);                // the MIRACLE MIKE truck (parked, then on the road)
export const RING = V(0, 0, 200);                  // the spotlight stage
export const insideRoom = (_p: THREE.Vector3): string | null => null;   // every set is open to the sun (bright, readable)
