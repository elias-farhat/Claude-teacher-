// "The Newspaper That Found Bat-People on the Moon": our original 63 s short in the skill's 2D-characters-in-a-3D-world style.
// One three.js world (world.ts) posed per frame from the word-timed story (story.ts + stage.ts). Post chain as the
// bridge / Eiffel shorts: InkPass -> lens blur -> bloom -> NEUTRAL tone map -> grade (per look). One-word captions
// (STYLE_BIBLE.md 2) at 70 % of the frame height, timed to words.json.
import "@fontsource/montserrat/900.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { isPreview, quality } from "../../quality";
import { InkPass, noInkFallback } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { WhipBlur } from "../bridge/whipblur";
import { subjectsAt, lensFor } from "../../guard/subjects";
import { focusIds } from "../../guard/focus";
import { SHOT_SPECS } from "./shots";
import { PROPS as PROPS_FOR_FOCUS } from "./subjects";

import { GradeEffect } from "../bridge/grade";
import { Kit } from "../bridge/build";
import { MoonWorld, loadMoonKit } from "./world";
import { TOTAL, FPS, SHOTS, captionAt, getTrack } from "./story";
import { LOOKS } from "./looks";

/** QA probe (inputProps { qa: true }): which characters / key props are really visible (in frame AND not hidden
 *  behind world geometry, by a ray to each), where each visible face sits on screen and how big it is. One
 *  "[qa] {...}" line per frame on the console (console.error: Remotion forwards it at the default log level). */
const ray = new THREE.Raycaster();
ray.layers.set(0); // world geometry only: character / label cards live on the NOINK layer
const qaProbe = (f: number, world: MoonWorld, cam: THREE.PerspectiveCamera, c: { mix: number; shot: number }) => {
  const st = world.last;
  if (!st) return;
  const vis: string[] = [], faces: { who: string; y: number; size: number }[] = [];
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  const half = Math.tan((cam.fov * Math.PI) / 360);
  const seen = (p: THREE.Vector3) => {
    const v = p.clone().project(cam);
    if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) return null;
    const d = p.distanceTo(cam.position);
    ray.set(cam.position, p.clone().sub(cam.position).normalize()); ray.far = d - 0.25; ray.near = 0;
    return ray.intersectObject(world.root, true).length ? null : v;
  };
  for (const p of st.places) {
    if (p.key.startsWith("bg")) continue;
    const parts = p.key.split("|"), up = parts[0] === "up", mode = up ? parts[2] : parts[1], sc = p.scale ?? 1;
    const head = new THREE.Vector3(p.x, p.y + (mode === "sit" ? 0.86 : 1.44) * sc, p.z), v = seen(head);
    if (!v) continue;
    const who = up ? parts[1] : parts[0], size = (0.48 * sc) / (2 * head.clone().sub(cam.position).dot(fwd) * half);
    vis.push(who); faces.push({ who, y: +((1 - v.y) / 2).toFixed(3), size: +size.toFixed(3) });
  }
  for (const p of st.fx) if (!p.key.startsWith("bg") && seen(new THREE.Vector3(p.x, p.y, p.z))) vis.push(p.key.split("|").pop()!.replace(/[0-9.]+$/, ""));
  console.error("[qa] " + JSON.stringify({ f, shot: c.shot, flight: c.mix > 0, vis, faces }));
};

export const MOON_FRAMES = TOTAL;

type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; captions: boolean };
// preview (MSAA off) skips the lens "pre" pass: see Bridge.tsx for the depth-feedback reason
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: !isPreview(), bloom: true, grade: true, captions: true,
  ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });
/** test stills / the 720p speed trick: inputProps `{ dpr: 0.6667 }` forces the WebGL buffer size (R3F clamps dpr >= 1) */
const dprOverride = () => (getInputProps() as { dpr?: number }).dpr;

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.55, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("moon kit"));
  useEffect(() => { loadMoonKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

const fwd = new THREE.Vector3();
const Inner: React.FC<{ kit: Kit }> = ({ kit }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new MoonWorld(kit), [kit]);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    // keep the town's ink out to ~1 km
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { widthNear: 5.1, widthFar: 2.6, distNear: 6, distFar: 400, fadeNear: 900, fadeFar: 2200, farOpacity: 0.9 }),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(LOOKS.morning.grade, 1),
    whip: new WhipBlur(),
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const composer = useRef<{ passes: { fullscreenMaterial?: { copyCameraSettings?: (c: THREE.Camera) => void } }[] } | null>(null);
  const nearFar = useRef("");
  const post = useMemo(() => (
    <EffectComposer ref={composer as never} multisampling={quality({ shadowMap: 4096, msaa: 4 }).msaa}>
      {[
        on.ink && <primitive key="ink" object={fx.ink} dispose={null} />,
        on.lens && on.pre && <primitive key="pre" object={fx.lens.pre} dispose={null} />,
        on.lens && <primitive key="lens" object={fx.lens.main} dispose={null} />,
        <primitive key="whip" object={fx.whip} dispose={null} />,
        on.bloom && <primitive key="bloom" object={fx.bloom} dispose={null} />,
        <primitive key="tone" object={fx.tone} dispose={null} />,
        on.grade && <primitive key="grade" object={fx.grade} dispose={null} />,
      ].filter((x): x is React.JSX.Element => !!x)}
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  const c = world.update(f, cam, scene);
  // postprocessing copies the camera's near / far into its depth-reading passes only when the camera is first set, but
  // the world switches near per frame (0.05 m indoors, 0.3 m outdoors): re-sync them every frame, or the lens blur reads
  // distances up to 6x wrong and puts the in-focus subject out of focus (Rats run 25: 20.5 s, 62.0 s)
  const nf = `${cam.near}|${cam.far}|${composer.current?.passes.length}`;
  if (composer.current && nearFar.current !== nf) { for (const p of composer.current.passes) p.fullscreenMaterial?.copyCameraSettings?.(cam); nearFar.current = nf; }
  if ((getInputProps() as { qa?: boolean }).qa) qaProbe(f, world, cam, c);
  noInkFallback(world.root);
  cam.getWorldDirection(fwd);
  fx.lens.focus = Math.max(0.3, c.look.clone().sub(cam.position).dot(fwd));
  fx.lens.cInf = c.dof;
  // auto-framed: focus on the current subject's head and cap the blur so no subject is ever soft (guard/subjects.ts)
  const tr = getTrack();
  if (tr && world.last) {
    const r = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), u = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    const { subj } = subjectsAt(focusIds(SHOT_SPECS, tr, f / FPS), world.last, cam.position, r, u, PROPS_FOR_FOCUS, f / FPS);
    const L = lensFor(subj, cam, c.dof);
    if (L) { fx.lens.focus = L.focus; fx.lens.cInf = L.cInf; }
  }
  fx.whip.strength = (c.blur ?? 0) * 140; fx.whip.dir = c.blurDir ?? 1;
  const look = LOOKS[SHOTS[c.mix > 0.5 ? c.next : c.shot].look];
  const tag = fx.grade as unknown as { _look?: string };
  if (tag._look !== SHOTS[c.mix > 0.5 ? c.next : c.shot].look) { fx.grade.set(look.grade); tag._look = SHOTS[c.mix > 0.5 ? c.next : c.shot].look; }
  fx.grade.amount = look.gradeK;
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

/** one word at a time: white Montserrat Black, thick black outline + soft shadow, baseline at 70 % height */
const Caption: React.FC<{ t: number }> = ({ t }) => {
  const w = captionAt(t);
  if (!w) return null;
  const age = t - w.s, pop = age < 0.1 ? 0.86 + 1.4 * Math.max(0, age) : 1;
  const len = w.w.length, size = len > 9 ? 96 : len > 6 ? 108 : 120;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div style={{
        position: "absolute", top: 1920 * 0.7 - size * 0.8, width: "100%", textAlign: "center",
        fontFamily: "Montserrat, 'Arial Black', sans-serif", fontWeight: 900, fontSize: size, color: "#ffffff", letterSpacing: 1,
        WebkitTextStroke: `${Math.round(size * 0.16)}px #000000`, paintOrder: "stroke fill",
        textShadow: "0 8px 18px rgba(0,0,0,0.55)", transform: `scale(${pop})`, lineHeight: 1,
      }}>{w.w}</div>
    </AbsoluteFill>
  );
};

export const MoonShort: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  const on = useMemo(toggles, []);
  if (!kit) return null;
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
        camera={{ fov: 40, near: 0.1, far: 6000 }}>
        <Inner kit={kit} />
      </ThreeCanvas>
      {on.captions ? <Caption t={f / FPS} /> : null}
    </AbsoluteFill>
  );
};
