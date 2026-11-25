// One three.js world for "This Chicken Lived 18 Months Without a Head": the farm, the kitchen, the sideshow, the
// spotlight stage (sets.ts), posed per frame from story.ts / stage.ts. Same lighting model as the Baboon short; Mike (a 3D
// rooster), the hens, the truck, the axe, the money, the brain-stem glow and the spotlight move with the narration.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Kit, V } from "../bridge/build";
import { TONE, CHAR, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { cloudHD } from "../bridge/paint";
import { Actor, Fx, Pool } from "../bridge/cast";
import { Char3D, Rig3 } from "../bridge/char3d";
import { getInputProps } from "remotion";
import { LightPreset } from "../bridge/lights";
import { quality } from "../../quality";
import type { Lamp } from "../rats/hanoi";
import { buildSets, Sets, SET_KIT } from "./sets";
import { LOOKS, Look, LAMP } from "./looks";
import { SHOTS, camAt, Cam, FPS, mikeAt, henAt, truckX, wt, wtn, T_CHOP } from "./story";
import { TRUCK, CHOP } from "./layout";
import { buildRooster, poseRooster, Rooster } from "./rooster";
import { stage, Stage } from "./stage";

const NAMES = SET_KIT;
/** every Kenney model the Chicken world uses (the camera guard loads the same set from disk) */
export const KIT_NAMES = () => [...new Set(NAMES)];
let kitP: Promise<Kit> | null = null;
export const loadChickenKit = () => {
  if (!kitP) {
    const loader = new GLTFLoader();
    kitP = Promise.all(NAMES.map((n) => loader.loadAsync(staticFile(`bridge/kenney/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => {
        const miss = list.filter((e) => !e[1]).map((e) => e[0]);
        console.error(`[kenney] loaded ${list.length - miss.length}/${list.length} models` + (miss.length ? `; missing: ${miss.join(", ")}` : ""));
        return Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit;
      })
      ;
  }
  return kitP;
};

type C3 = [number, number, number];
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpC = (a: C3, b: C3, t: number): C3 => [lerpN(a[0], b[0], t), lerpN(a[1], b[1], t), lerpN(a[2], b[2], t)];
const lerpHex = (a: string, b: string, t: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
const blendL = (A: LightPreset, B: LightPreset, t: number): LightPreset => {
  if (t <= 0) return A; if (t >= 1) return B;
  const o = { ...A } as Record<string, unknown>;
  for (const k of Object.keys(A) as (keyof LightPreset)[]) {
    const a = A[k], b = B[k];
    if (typeof a === "number") o[k] = lerpN(a, b as number, t);
    else if (Array.isArray(a)) o[k] = lerpC(a as C3, b as C3, t);
    else if (typeof a === "string" && a.startsWith("#")) o[k] = lerpHex(a, b as string, t);
    else o[k] = t < 0.5 ? a : b;
  }
  return o as LightPreset;
};

export class ChickenWorld {
  root = new THREE.Group();
  sets: Sets;
  private pool = new Pool();
  private actors: Actor[] = []; private fxs: Fx[] = []; private c3: Char3D[] = [];
  /** 3D cast: place names drawn as 3D figures (default "all"; "none" = the cards; or a list of names) */
  // the 3D cast is the default (approved 2026-11-13); inputProps.char3d = "none" falls back to the cards
  private use3d = (() => { try { const v = (getInputProps() as { char3d?: string[] | "all" | "none" }).char3d ?? "all"; return v === "none" ? [] : v; } catch { return "all" as const; } })();
  private hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.0);
  private sun = new THREE.DirectionalLight("#fff0d6", 2.6);
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 100, 1500);
  private clouds: THREE.Mesh[] = []; private cloudMaps: THREE.Texture[][];
  private lampDots: THREE.Mesh[] = [];
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private sph = new THREE.Sphere(); private v = new THREE.Vector3();
  private sunCache = new Map<number, THREE.Vector3>();
  private mike: Rooster; private hens: Rooster[];
  /** what was on stage in the last update (for the QA probe) */
  last: Stage | null = null;

  constructor(kit: Kit) {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(2600, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.sun.castShadow = true;
    { const m = quality({ shadowMap: 4096, msaa: 4 }).shadowMap; this.sun.shadow.mapSize.set(m, m); }
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = [LOOKS.morning.cloud!, LOOKS.golden.cloud!].map((c) => [0, 1, 2, 3].map((k) => cloudHD(k, c)));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.3, d = 1500 + (i % 3) * 200;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps[0][i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 380 + (i % 4) * 90;
      m.position.set(Math.cos(a) * d, 330 + (i % 4) * 90, 300 + Math.sin(a) * d); m.scale.set(w, w / 2, 1); m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }
    this.sets = buildSets(R, kit);
    this.mike = buildRooster("#f6f2ea", "#2a2a30", 1.15); R.add(this.mike.g);
    this.hens = ["#d8a868", "#a8643a", "#e8d0a0"].map((c, i) => { const h = buildRooster(c, "#6a3a1a", 0.82 - i * 0.04); R.add(h.g); return h; });
    const dot = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.5, 2.8, 1.1) });
    for (const l of this.sets.lamps) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), dot); m.position.copy(l.p); m.layers.set(NOINK); this.lampDots.push(m); R.add(m); }
    this.setTime(0);
  }

  /** time-driven parts of the world (also called by the camera guard): the levers, the signal arm, the trains, the trolley */
  setTime(t: number, cam?: THREE.Vector3) {
    void cam;
    const S = this.sets;
    poseRooster(this.mike, mikeAt(t));
    const yard = t < wt(4) - 0.1;   // the hens leave before the morning (run 47: a hen with a head read as Mike)
    this.hens.forEach((h, i) => { const hp = henAt(i, t); poseRooster(h, { ...hp, visible: yard }); });
    // the axe leans on the block except while Lloyd holds it (line 3); after the chop it is back on the block
    S.axe.visible = !(t >= wt(3) - 0.07 && t < wt(3, "kept") - 0.07);
    S.truck.position.set(truckX(t), 0, TRUCK.z);
    S.money.visible = t >= wt(9) - 0.5;
    // the brain stem glows on "brain stem" and pulses on "keeps you breathing"
    const g0 = wt(5, "brain") - 0.07, br = wtn(5, "the", 2);
    const gk = t < g0 ? 0 : t < br ? Math.min(1, (t - g0) / 0.3) : 0.75 + 0.25 * Math.sin((t - br) * 7);
    (S.glow.material as THREE.MeshBasicMaterial).opacity = 0.9 * gk; S.glow.scale.setScalar(1 + 0.35 * gk);
    S.beam.visible = t >= wt(10) - 0.3;
    void T_CHOP; void CHOP;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  private shadowRCache = new Map<number, number>();
  /** shadow half-size for a shot, from its widest key (frozen for the whole shot) */
  private shadowR(si: number) {
    let r = this.shadowRCache.get(si);
    if (r === undefined) {
      const d = Math.max(...SHOTS[si].keys.map((k) => Math.hypot(k.look[0] - k.pos[0], k.look[1] - k.pos[1], k.look[2] - k.pos[2])));
      r = THREE.MathUtils.clamp(d * 1.3 + 10, 12, 420);
      this.shadowRCache.set(si, r);
    }
    return r;
  }

  /** sun direction (toward the sun) for a shot: camera-relative outdoors, through the back-wall window indoors */
  private sunFor(si: number, L: LightPreset) {
    let s = this.sunCache.get(si);
    if (!s) {
      const sh = SHOTS[si], el = THREE.MathUtils.degToRad(L.el);
      // interiors: the light comes through the room's street window (bath/kitchen face +z, the office -z, the barn
      // door -x); underground it falls down the street shafts
      const inside: Record<string, [number, number]> = {};
      const under = false;
      if (under) s = V(0.15, 1, 0.1).normalize();
      else if (inside[sh.name]) s = V(inside[sh.name][0], Math.tan(el), inside[sh.name][1]).normalize();
      else {
        const k = sh.keys[0], fwd = V(k.look[0] - k.pos[0], 0, k.look[2] - k.pos[2]).normalize();
        const az = THREE.MathUtils.degToRad(L.az), right = V(-fwd.z, 0, fwd.x);
        s = fwd.clone().multiplyScalar(-Math.cos(az)).addScaledVector(right, Math.sin(az)).normalize().multiplyScalar(Math.cos(el)).add(V(0, Math.sin(el), 0)).normalize();
      }
      this.sunCache.set(si, s);
    }
    return s;
  }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene): Cam {
    const t = f / FPS, c = camAt(t);
    cam.position.copy(c.pos); cam.up.set(0, 1, 0); cam.lookAt(c.look); cam.rotateZ(c.roll);
    const interiorNow = c.interior;  // where the camera physically is (flights cross doors / windows)
    cam.fov = c.fov; cam.near = interiorNow ? 0.05 : 0.3; cam.far = 6000; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    // ---- look: the shot's preset, blended across a flight ----
    const A = LOOKS[SHOTS[c.shot].look], B = LOOKS[SHOTS[c.next].look];
    const k = c.next !== c.shot ? THREE.MathUtils.clamp((c.mix - 0.25) / 0.5, 0, 1) : 0;
    const look: Look = k < 0.5 ? A : B, L = blendL(A.L, B.L, k);
    const sunDir = this.sunFor(c.shot, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const dist = c.pos.distanceTo(c.look);
    // shadow frustum: size frozen per shot (a size that tracks the creeping camera re-samples every shadow edge each
    // frame = crawling / shaking shadows) and its centre snapped to whole shadow texels
    const Rr = Math.max(this.shadowR(c.shot), this.shadowR(c.next));
    const texel = (2 * Rr) / this.sun.shadow.mapSize.x;
    const lx = this.v.set(0, 1, 0).cross(sunDir).normalize().clone(), ly = sunDir.clone().cross(lx).normalize();
    const cx = Math.round(c.look.dot(lx) / texel) * texel, cy = Math.round(c.look.dot(ly) / texel) * texel, cz = c.look.dot(sunDir);
    const centre = lx.multiplyScalar(cx).addScaledVector(ly, cy).addScaledVector(sunDir, cz);
    this.sun.position.copy(centre).addScaledVector(sunDir, 900); this.sun.target.position.copy(centre);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 50; sc.far = 1900; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = 1.1;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky + fog ----
    const su = this.skyMat.uniforms, skyA = A.sky, skyB = B.sky;
    for (let i = 0; i < 5; i++) untone(lerpHex(skyA[i], skyB[i], k), su["c" + i].value);
    const e = look.skyE.map((d) => THREE.MathUtils.degToRad(d)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = interiorNow ? null : this.fog; scene.background = null;
    const cloudy = !!look.cloud && !interiorNow;
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i]; m.visible = cloudy;
      if (cloudy) { m.lookAt(cam.position.x, m.position.y, cam.position.z); (m.material as THREE.MeshBasicMaterial).map = this.cloudMaps[look.cloud === LOOKS.golden.cloud ? 1 : 0][i % 4]; }
    }
    // ---- practical lights: 8 nearest to the focus, gain from the look ----
    const glowK = lerpN(A.glowK, B.glowK, k);
    const st: Stage = stage(t, c, cam);
    this.last = st;
    const lamps: (Lamp & { col: C3 })[] = [];
    for (const l of this.sets.lamps) lamps.push({ ...l, col: LAMP });
    for (const l of st.lights) lamps.push(l);
    lamps.sort((a, b) => a.p.distanceTo(c.look) - b.p.distanceTo(c.look));
    const view = cam.matrixWorldInverse;
    for (let i = 0; i < 8; i++) {
      const l = lamps[i], gp = TONE.uGlowPos.value[i], gc = TONE.uGlowCol.value[i];
      if (!l || glowK <= 0) { gp.set(0, 0, 0, 0); continue; }
      const p = this.v.copy(l.p).applyMatrix4(view);
      gp.set(p.x, p.y, p.z, 7 * Math.sqrt(l.k));
      gc.set(l.col[0] * glowK * l.k * 0.35, l.col[1] * glowK * l.k * 0.35, l.col[2] * glowK * l.k * 0.35);
    }
    for (const m of this.lampDots) m.visible = glowK > 0.5;
    // the coal ship and the gold
    const night = [LOOKS.moonlit, LOOKS.starry, LOOKS.silvery].includes(look);
    void night;
    this.setTime(t, cam.position);
    // ---- cast + label cards ----
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0, ci = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const s2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * s2, p.z), 2.5 * s2))) continue;
      const nm = p.key.split("|")[0];
      if (p.rig && (this.use3d === "all" || this.use3d.includes(nm))) {
        while (this.c3.length <= ci) this.c3.push(new Char3D(this.root));
        this.c3[ci++].set(p.rig as Rig3, this.v.set(p.x, p.y, p.z).clone(), p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), s2);
        continue;
      }
      const a = this.actor(ai++), [w, h, kk] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, kk, p.draw);
      a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -s2 : s2, s2, s2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    for (let i = ci; i < this.c3.length; i++) this.c3[i].hide();
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft); e2.mesh.visible = true; e2.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else if (p.yaw !== undefined) e2.mesh.rotation.set(0, p.yaw, p.rot ?? 0);
      else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(p.w, p.h, 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e2 of fused) e2.bind();
    return c;
  }
}
