// Subject boxes for the guard and the auto-framer. Ids: "c:name" a character by exact stage name, "c:/re/" a group of
// characters (judged as their union box), "f:prefix" an effect / label card by key prefix, "w:name" a world prop box.
import * as THREE from "three";

export type Place = { key: string; x: number; y: number; z: number; scale?: number };
export type FxCard = { key: string; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean; yaw?: number };
/** one character's head: centre, half width, and its box from the chin to the hat top (metres) */
export type Head = { key: string; c: THREE.Vector3; hw: number; y0: number; y1: number };
export type Subj = { id: string; opt?: boolean; kind: "char" | "prop"; pts: THREE.Vector3[]; own?: THREE.Box3; head?: THREE.Vector3; chest?: number;
  heads?: Head[]; centre: THREE.Vector3; height: number; width: number; bottom: number; top: number };

export const nameOf = (key: string) => { const p = key.split("|"); return p[0] === "up" ? p[1] : p[0]; };
const isUp = (key: string) => key.startsWith("up|");
const modeOf = (key: string) => { const p = key.split("|"); return p[0] === "up" ? p[2] : p[1]; };

/** subject boxes at this moment (billboards face the camera position `eye`); missing ids are returned separately */
export const subjectsAt = (ids: string[], st: { places: Place[]; fx: FxCard[] }, eye: THREE.Vector3, right: THREE.Vector3, up: THREE.Vector3,
  props: Record<string, (t: number) => THREE.Box3> | undefined, t: number) => {
  const out: Subj[] = [], missingAll: string[] = [];
  for (const id0 of ids) {
    const opt = id0.startsWith("?"), id = opt ? id0.slice(1) : id0;
    const k = id.slice(0, 1), s = id.slice(2);
    const missing: string[] = opt ? [] : missingAll;
    const n0 = out.length;
    if (k === "c") {
      const re = s.startsWith("/") ? new RegExp(s.slice(1, -1)) : null;
      const ps = st.places.filter((p) => (re ? re.test(nameOf(p.key)) : nameOf(p.key) === s));
      if (!ps.length) { missing.push(id); continue; }
      // billboard rectangle facing the camera: width 0.62 m, feet .. hat top 1.78 m (seated: legs .. head top)
      const pts: THREE.Vector3[] = []; let head: THREE.Vector3 | undefined; let bottom = Infinity, top = -Infinity, chest = 0; const heads: Head[] = [];
      for (const p of ps) {
        const sc = p.scale ?? 1, sit = modeOf(p.key) === "sit", up0 = isUp(p.key);
        const y0 = p.y + (up0 ? 0.81 : sit ? -0.45 : 0) * sc, y1 = p.y + (sit ? 1.2 : 1.78) * sc, hc = p.y + (sit ? 0.86 : 1.44) * sc;
        const side = new THREE.Vector3(eye.z - p.z, 0, -(eye.x - p.x)); if (side.lengthSq() < 1e-8) side.set(1, 0, 0); side.normalize().multiplyScalar(0.31 * sc);
        const b = new THREE.Vector3(p.x, 0, p.z);
        for (const y of [y0, y1]) for (const s2 of [-1, 1]) pts.push(b.clone().addScaledVector(side, s2).setY(y));
        if (!head || hc > head.y) head = new THREE.Vector3(p.x, hc, p.z);
        heads.push({ key: p.key, c: new THREE.Vector3(p.x, hc, p.z), hw: 0.26 * sc, y0: hc - 0.25 * sc, y1: hc + 0.32 * sc });
        bottom = Math.min(bottom, y0); top = Math.max(top, y1); chest = Math.max(chest, p.y + (sit ? 0.55 : 1.0) * sc);
      }
      out.push(finish({ id, kind: "char", pts, head: ps.length === 1 ? head : undefined, heads, chest, bottom, top }));
    } else if (k === "f") {
      const fs = st.fx.filter((p) => { const parts = p.key.split("|"); return parts[0].startsWith(s) || parts[parts.length - 1].startsWith(s); });
      if (!fs.length) { missing.push(id); continue; }
      const pts: THREE.Vector3[] = [];
      for (const p of fs) {
        const c0 = new THREE.Vector3(p.x, p.y, p.z);
        if (p.flat) { const r = Math.max(p.w, p.h) / 2; for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) pts.push(c0.clone().add(new THREE.Vector3(a * r, 0, b * r))); }
        else {
          // a card with a fixed yaw hangs on a wall / stands in the set (its own right vector); otherwise it faces the camera
          const r = p.yaw !== undefined ? new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw)) : right, u = p.yaw !== undefined ? new THREE.Vector3(0, 1, 0) : up;
          for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) pts.push(c0.clone().addScaledVector(r, a * p.w / 2).addScaledVector(u, b * p.h / 2));
        }
      }
      out.push(finish({ id, kind: "prop", pts, bottom: Math.min(...pts.map((p) => p.y)), top: Math.max(...pts.map((p) => p.y)) }));
    } else if (k === "w") {
      const bx = props?.[s]?.(t); if (!bx) { missing.push(id); continue; }
      const pts: THREE.Vector3[] = [];
      for (const x of [bx.min.x, bx.max.x]) for (const y of [bx.min.y, bx.max.y]) for (const z of [bx.min.z, bx.max.z]) pts.push(new THREE.Vector3(x, y, z));
      out.push(finish({ id, kind: "prop", pts, bottom: bx.min.y, top: bx.max.y, own: bx.clone().expandByScalar(0.5) }));
    }
    if (opt && out.length > n0) out[out.length - 1].opt = true;
  }
  return { subj: out, missing: missingAll };
};
/** heads of the named characters on stage that are NOT among the declared subjects (background life "bg..." excluded):
 *  the guard keeps their faces out of the caption band too when they are big in the picture */
export const bystanderHeads = (ids: string[], st: { places: Place[] }): Head[] => {
  const pats = ids.map((i) => (i.startsWith("?") ? i.slice(1) : i)).filter((i) => i.startsWith("c:")).map((i) => i.slice(2));
  const isSubj = (n: string) => pats.some((s) => (s.startsWith("/") ? new RegExp(s.slice(1, -1)).test(n) : s === n));
  const out: Head[] = [];
  for (const p of st.places) {
    const n = nameOf(p.key); if (n.startsWith("bg") || isSubj(n)) continue;
    const sc = p.scale ?? 1, sit = modeOf(p.key) === "sit", hc = p.y + (sit ? 0.86 : 1.44) * sc;
    out.push({ key: p.key, c: new THREE.Vector3(p.x, hc, p.z), hw: 0.26 * sc, y0: hc - 0.25 * sc, y1: hc + 0.32 * sc });
  }
  return out;
};
const finish = (s: Omit<Subj, "centre" | "height" | "width">): Subj => {
  const b = new THREE.Box3().setFromPoints(s.pts), c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3());
  return { ...s, centre: c, height: Math.max(0.05, sz.y), width: Math.max(0.05, Math.hypot(sz.x, sz.z)) };
};

/** the point to focus on: the head of the first required character in front of the camera (else the first prop's
 *  centre), and the blur radius at infinity capped so that no subject's key point (heads, prop centres) gets a
 *  circle of confusion above maxCoC px (CLAUDE.md: subjects are never blurred). Shared by the renderer and the guard. */
export const lensFor = (subs: Subj[], cam: THREE.Camera, dof: number, nearScale = 1.2, maxCoC = 1.2) => {
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  const depth = (p: THREE.Vector3) => p.clone().sub(cam.position).dot(fwd);
  const keyPts = (s: Subj) => (s.kind === "char" ? (s.heads ?? []).map((h) => h.c) : [s.centre]).filter((p) => depth(p) > 0.2);
  const req = subs.filter((s) => !s.opt), order = [...req, ...subs.filter((s) => s.opt)];
  let focusPt: THREE.Vector3 | null = null;
  for (const s of order) { const k = keyPts(s); if (k.length) { focusPt = k.reduce((a, p) => (depth(p) < depth(a) ? p : a)); break; } }
  if (!focusPt) return null;
  const focus = Math.max(0.3, depth(focusPt));
  let worst = 0;
  for (const s of subs) for (const p of keyPts(s)) { const d = depth(p), c = 1 - focus / d; worst = Math.max(worst, c < 0 ? -c * nearScale : c); }
  const cInf = worst > 1e-4 ? Math.min(dof, maxCoC / worst) : dof;
  return { focus, cInf, focusPt };
};
/** circle of confusion (px at 1080x1920) of a point for a lens */
export const cocAt = (p: THREE.Vector3, cam: THREE.Camera, focus: number, cInf: number, nearScale = 1.2) => {
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd); const d = Math.max(1e-3, p.clone().sub(cam.position).dot(fwd)), c = cInf * (1 - focus / d);
  return c < 0 ? -c * nearScale : c;
};
