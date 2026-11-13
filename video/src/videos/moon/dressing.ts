// Ground dressing from the Kenney nature kit (look pass, 2026-11-13): the Moon plateau was a bare pale plane with
// nothing between the camera and the cast. Low tufts, flowers, mushrooms and small rocks fill the foreground band
// (between the front-edge cameras and the cast, never taller than ~0.4 m so they sit under the subjects in frame);
// bushes, big rocks, logs and pines stand behind the cast and round the rim for mid/background depth.
// Clear circles keep every prop off the subjects (goats, bat-people, waves, the day card); a seeded RNG keeps it
// identical in every render chunk.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { MOON, MOON_TOP } from "./layout";
import { lam } from "../bridge/build";

const LOW = ["grass_large", "grass_leafsLarge", "grass", "flower_redA", "flower_yellowB", "flower_purpleC", "flower_yellowA", "mushroom_redGroup", "mushroom_tanGroup", "rock_smallA", "rock_smallFlatB", "rock_smallC"];
const MID = ["plant_bushDetailed", "plant_bushLarge", "stone_largeB", "rock_largeA", "log", "stump_round"];
const TALL = ["tree_pineRoundC", "tree_oak", "tree_pineTallA_detailed"];
export const DRESS_NAMES = [...LOW, ...MID, ...TALL];

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
const CLEAR: [number, number, number][] = [[2.7, 4.0, 1.5], [-0.1, 2.5, 1.6], [6.0, 1.6, 1.4], [-1.8, 2.4, 1.0]];
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
