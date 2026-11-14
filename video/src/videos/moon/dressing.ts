// Ground dressing from the Kenney nature kit (look pass, 2026-11-13): the Moon plateau was a bare pale plane with
// nothing between the camera and the cast. Low tufts, flowers, mushrooms and small rocks fill the foreground band
// (between the front-edge cameras and the cast, never taller than ~0.4 m so they sit under the subjects in frame);
// bushes, big rocks, logs and pines stand behind the cast and round the rim for mid/background depth.
// Clear circles keep every prop off the subjects (goats, bat-people, waves, the day card); a seeded RNG keeps it
// identical in every render chunk.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { MOON, MOON_TOP, GARDEN, COTTAGE, BEACH, HILL, STREET } from "./layout";
import { lam } from "../bridge/build";

const LOW = ["grass_large", "grass_leafsLarge", "grass", "flower_redA", "flower_yellowB", "flower_purpleC", "flower_yellowA", "mushroom_redGroup", "mushroom_tanGroup", "rock_smallA", "rock_smallFlatB", "rock_smallC"];
const MID = ["plant_bushDetailed", "plant_bushLarge", "stone_largeB", "rock_largeA", "log", "stump_round"];
const TALL = ["tree_pineRoundC", "tree_oak", "tree_pineTallA_detailed"];
// Earth scenes (look pass, every scene): the Cape garden + telescope hill, the beach, the New York street
const EARTH = ["tree_palmTall", "tree_palmDetailedTall", "tree_palmBend", "rock_largeB", "rock_tallA", "tree_default", "tree_detailed", "plant_bushLargeTriangle", "flower_redB", "flower_yellowC", "tree_pineTallB_detailed", "tree_pineRoundE", "cart", "stall-red", "stall-green", "stall-bench", "lantern"];
export const DRESS_NAMES = [...new Set([...LOW, ...MID, ...TALL, ...EARTH])];

let dressP: Promise<Record<string, THREE.Object3D>> | null = null;
export const loadDressing = () => {
  if (!dressP) {
    const loader = new GLTFLoader();
    dressP = Promise.all(DRESS_NAMES.map((n) => loader.loadAsync(staticFile(`bridge/kenney/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => {
        const miss = list.filter((e) => !e[1]).map((e) => e[0]);
        console.error(`[dressing] loaded ${list.length - miss.length}/${list.length} models` + (miss.length ? `; missing: ${miss.join(", ")}` : ""));
        return Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!]));
      });
  }
  return dressP;
};

const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
// plateau-local (dx, dz) clear circles: goats, bat-people, the wave line, the day-1 card, Herschel's flag spot
const CLEAR: [number, number, number][] = [[2.7, 4.0, 1.5], [-0.1, 2.5, 1.6], [6.0, 1.6, 1.4], [0.6, 3.6, 1.0]];
const clear = (x: number, z: number, pad: number) => CLEAR.every(([cx, cz, r]) => Math.hypot(x - cx, z - cz) > r + pad);

export function buildDressing(root: THREE.Group, kit: Record<string, THREE.Object3D>) {
  const g = new THREE.Group(); g.name = "dressing"; const r = rng(7311);
  const place = (name: string, x: number, z: number, s: number) => {
    const src = kit[name]; if (!src) return;
    const o = src.clone(true);
    o.traverse((m) => {
      const me = m as THREE.Mesh; if (!me.isMesh) return;
      me.castShadow = true; me.receiveShadow = true;
      // the kit's PBR materials go near-black under the toon lights: swap each for the scene's Lambert, its colour
      // lifted and pulled toward the Moon's lavender so the props sit in the world instead of punching holes in it
      const src = (Array.isArray(me.material) ? me.material[0] : me.material) as THREE.MeshStandardMaterial;
      const c = (src.color ?? new THREE.Color("#888")).clone().convertLinearToSRGB();
      const t = c.lerp(new THREE.Color("#8f8cc4"), 0.3);
      me.material = lam(`dress-${t.getHexString()}`, () => ({ color: t }));
    });
    o.position.set(MOON.c.x + x, MOON_TOP - 0.02, MOON.c.z + z); o.rotation.y = r() * Math.PI * 2; o.scale.setScalar(s);
    g.add(o);
  };
  const pick = (a: string[]) => a[Math.floor(r() * a.length)];
  // (no foreground band: low-poly tufts right at the lens read as shards, not lush ground; the lens blur hides them)
  // mid-ground: between and around the cast, low again so nothing covers a face
  for (let i = 0; i < 70; i++) {
    const x = -8 + r() * 16, z = -2 + r() * 7;
    if (Math.hypot(x, z) > 11.8 || !clear(x, z, 0.6)) continue;
    place(pick(LOW), x, z, 1.1 + r() * 0.6);
  }
  // behind the cast and round the sides: bushes, rocks, logs, stumps (up to ~0.9 m)
  for (let i = 0; i < 45; i++) {
    const a = r() * Math.PI * 2, d = 4 + r() * 7.5, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z > -1.5 && Math.abs(x) < 7.5) continue;            // nothing tall in front of or right behind the cast
            // never in front of the cast, where the cameras look through
    if (Math.hypot(x, z) > 11.8 || !clear(x, z, 1.0)) continue;
    place(pick(MID), x, z, 1.8 + r() * 0.9);
  }
  // pines and oaks along the back rim (z < -3): a treeline behind every Moon-top shot
  for (let i = 0; i < 26; i++) {
    const a = Math.PI + 0.15 + r() * (Math.PI - 0.3), d = 9.5 + r() * 2.2, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z > -3 || Math.hypot(x, z) > 11.9) continue;
    place(pick(TALL), x, z, 2.6 + r() * 1.4);
  }
  root.add(g);
  return g;
}

/** Earth dressing: Kenney props in the mid / background of the Cape, the beach and the street, never between a camera
 *  and the cast (every spot is hand-picked against the shot cameras in story.ts; the camera guard checks occlusion
 *  and face cover with these models loaded). Real materials keep their own colours, in the scene's Lambert. */
export function buildEarthDressing(root: THREE.Group, kit: Record<string, THREE.Object3D>) {
  const g = new THREE.Group(); g.name = "earthDressing"; const r = rng(4417);
  const place = (name: string, x: number, y: number, z: number, s: number, rot = r() * Math.PI * 2) => {
    const src = kit[name]; if (!src) return;
    const o = src.clone(true);
    o.traverse((m) => {
      const me = m as THREE.Mesh; if (!me.isMesh) return;
      me.castShadow = true; me.receiveShadow = true;
      const src2 = (Array.isArray(me.material) ? me.material[0] : me.material) as THREE.MeshStandardMaterial;
      const c = (src2.color ?? new THREE.Color("#888")).clone().convertLinearToSRGB();
      me.material = lam(`earth-${c.getHexString()}`, () => ({ color: c }));
    });
    o.position.set(x, y, z); o.rotation.y = rot; o.scale.setScalar(s); g.add(o);
  };
  // the beach (camera on the grass looking west over the sand to the sea): palms further down the beach on both sides,
  // rocks at the waterline
  for (const [n, x, z, s] of [["tree_palmTall", 88.2, 31.0, 3.0], ["tree_palmBend", 87.9, 34.0, 2.8], ["tree_palmDetailedTall", 88.4, 16.5, 3.1], ["tree_palmTall", 88.0, 13.0, 2.7]] as [string, number, number, number][]) place(n, x, 0, z, s);
  for (const [x, z, s] of [[87.4, 27.0, 1.6], [87.5, 20.5, 1.4], [87.3, 36.5, 1.9]]) place("rock_largeB", x, -0.05, z, s);
  // the Cape garden (camera south-west of Herschel's tea table, looking north-east): bushes and trees behind the
  // table and round the cottage, flowers along the back
  const G = GARDEN, C = COTTAGE;
  for (const [n, x, z, s] of [["tree_detailed", 105.5, 9.0, 3.2], ["tree_default", 107.5, 15.5, 3.4], ["tree_detailed", 92.8, 17.5, 3.0], ["tree_default", 104.0, 19.5, 3.0]] as [string, number, number, number][]) place(n, x, 0.02, z, s);
  for (const [x, z] of [[C.x - 4.6, C.z - 1.5], [C.x + 4.4, C.z - 2.0], [C.x + 4.8, C.z + 1.6], [C.x - 4.8, C.z + 2.0], [G.x + 3.6, G.z + 1.8]]) place("plant_bushLargeTriangle", x, 0.02, z, 2.2 + r() * 0.6);
  for (let i = 0; i < 14; i++) { const x = G.x - 2.5 + r() * 6.5, z = G.z + 2.6 + r() * 2.2; place(i % 2 ? "flower_redB" : "flower_yellowC", x, 0.02, z, 1.6 + r() * 0.5); }
  // the telescope hill: pines round its foot (the hill top with Herschel stays clear)
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + r() * 0.3, d = HILL.r + 2 + r() * 5; place(i % 2 ? "tree_pineTallB_detailed" : "tree_pineRoundE", HILL.x + Math.cos(a) * d, 0.02, HILL.z + Math.sin(a) * d, 3.4 + r() * 1.4); }
  // the New York street: market carts and stalls on the pavements, well away from the newsboy / crowd (x 15-30) and
  // the queue at The Sun's door (x 18-27, north side)
  const pv = STREET.road + 1.5;
  // the "whole city is talking" spot (townspeople at x 18.6-23, z -1.2..0.7): a cart and stalls on the cobbles behind
  // them, so the low shot of the readers has a busy street behind it, not bare paving (run 34 pixel check, 32-33.5 s)
  for (const [n, x, z, rot] of [["cart", 16.2, -3.4, 0.4], ["stall-green", 25.6, -3.8, 0], ["stall-red", 21.0, -4.6, 0], ["stall-bench", 18.4, -4.2, 0.2]] as [string, number, number, number][]) place(n, x, 0.02, z, 1.6, rot);
  for (const [n, x, z, rot] of [["stall-red", 4.5, pv, Math.PI], ["cart", 0.5, pv, Math.PI / 2], ["stall-green", 34.5, -pv, 0], ["cart", 38.5, -pv, -Math.PI / 2], ["stall-bench", 32.0, pv, Math.PI], ["stall-red", -6.0, -pv, 0]] as [string, number, number, number][]) place(n, x, 0.12, z, 1.6, rot);
  root.add(g);
  return g;
}
