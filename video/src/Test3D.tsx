// 5 s smoke test (composition "Test3D") of the skill's stack: ThreeCanvas, shadowed sun + hemisphere light, Lambert materials,
// a Canvas2D texture, fog, and an EffectComposer chain (bloom -> NEUTRAL tone map) with MSAA.
import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { quality } from "./quality";

const checker = () => {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d")!;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? "#d9a441" : "#7a4e2d"; g.fillRect(x * 32, y * 32, 32, 32); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const Cam: React.FC<{ f: number }> = ({ f }) => {
  const cam = useThree((s) => s.camera);
  const a = f / 150 * Math.PI * 0.8;
  cam.position.set(Math.sin(a) * 9, 4 + f * 0.01, Math.cos(a) * 9);
  cam.lookAt(0, 1, 0);
  return null;
};

export const Test3D: React.FC = () => {
  const f = useCurrentFrame();
  const q = quality();
  const { width, height } = useVideoConfig();
  const tex = useMemo(checker, []);
  const s = interpolate(f, [0, 150], [0, Math.PI * 2]);
  return (
    <AbsoluteFill style={{ background: "#3e7fd2" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 40, position: [0, 4, 9] }}
        onCreated={({ scene }) => { scene.background = new THREE.Color("#8fb6e6"); scene.fog = new THREE.Fog("#b8d0ec", 12, 40); }}>
        <Cam f={f} />
        <hemisphereLight args={["#cfe3ff", "#6b5a3a", 0.8]} />
        <directionalLight position={[5, 8, 3]} intensity={2.2} castShadow shadow-mapSize={[q.shadowMap, q.shadowMap]}
          shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshLambertMaterial map={tex} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 4, 0.6 + Math.abs(Math.sin(s * 2 + i)) * 1.2, Math.sin(a) * 4]} rotation={[s, s * 1.3 + i, 0]} castShadow receiveShadow>
              {i % 2 ? <boxGeometry args={[0.9, 0.9, 0.9]} /> : <icosahedronGeometry args={[0.6, 1]} />}
              <meshLambertMaterial color={new THREE.Color().setHSL(i / 12, 0.7, 0.55)} />
            </mesh>
          );
        })}
        <mesh position={[0, 1.6, 0]} castShadow>
          <torusKnotGeometry args={[0.8, 0.28, 160, 24]} />
          <meshStandardMaterial color="#ff7a3d" emissive="#ff5500" emissiveIntensity={1.6} roughness={0.4} />
        </mesh>
        <EffectComposer multisampling={q.msaa}>
          <Bloom luminanceThreshold={1.0} intensity={0.5} levels={6} radius={0.6} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        </EffectComposer>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
