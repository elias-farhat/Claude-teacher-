// The Kenney models for the camera guard (Node, no browser): the guard has to see the set dressing too, or a prop in
// front of a face would pass (CLAUDE.md 5). Each .glb is parsed with its images / textures stripped (only the geometry
// matters for ray casts; the browser-only image loader is never touched).
import * as fs from "fs";
import * as path from "path";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const strip = (buf: Buffer): ArrayBuffer => {
  const jsonLen = buf.readUInt32LE(12), json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
  delete json.images; delete json.textures; delete json.samplers;
  for (const m of json.materials ?? []) {
    const p = m.pbrMetallicRoughness; if (p) { delete p.baseColorTexture; delete p.metallicRoughnessTexture; }
    delete m.normalTexture; delete m.occlusionTexture; delete m.emissiveTexture;
  }
  let js = Buffer.from(JSON.stringify(json), "utf8"); const pad = (4 - (js.length % 4)) % 4; js = Buffer.concat([js, Buffer.alloc(pad, 0x20)]);
  const rest = buf.subarray(20 + jsonLen), out = Buffer.alloc(12 + 8 + js.length + rest.length);
  buf.copy(out, 0, 0, 12); out.writeUInt32LE(out.length, 8); out.writeUInt32LE(js.length, 12); out.writeUInt32LE(0x4e4f534a, 16); js.copy(out, 20); rest.copy(out, 20 + js.length);
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.length);
};
export const loadKitSync = async (names: string[], dir = path.resolve("public/bridge/kenney")) => {
  const loader = new GLTFLoader(), kit: Record<string, THREE.Object3D> = {};
  for (const n of names) {
    const f = path.join(dir, `${n}.glb`); if (!fs.existsSync(f)) continue;
    const g = await new Promise<{ scene: THREE.Object3D } | null>((res) => loader.parse(strip(fs.readFileSync(f)), "", (x) => res(x), (e) => { console.error(`[guard] ${n}: ${String((e as unknown as { message?: string }).message ?? e)}`); res(null); }));
    if (g) kit[n] = g.scene; else console.error(`[guard] could not parse ${n}.glb`);
  }
  return kit;
};
