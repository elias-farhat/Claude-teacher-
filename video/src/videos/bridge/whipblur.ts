// Directional motion blur for the 6-frame whip transitions (guard/track.ts): smears the picture along the pan.
// strength = blur length in px at 1080x1920 (scaled to the output), dir = +1 / -1 along screen x. 0 = off (no cost).
import { Effect } from "postprocessing";
import { Uniform } from "three";

const frag = /* glsl */ `
uniform float strength;
uniform float dir;
uniform vec2 res;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (strength < 0.5) { outputColor = inputColor; return; }
  vec2 stepUv = vec2(dir * strength * (res.y / 1920.0) / res.x, 0.0) / 15.0;
  vec4 acc = vec4(0.0);
  for (int i = -15; i <= 15; i++) acc += texture2D(inputBuffer, uv + stepUv * float(i));
  outputColor = acc / 31.0;
}`;
export class WhipBlur extends Effect {
  constructor() { super("WhipBlur", frag, { uniforms: new Map<string, Uniform>([["strength", new Uniform(0)], ["dir", new Uniform(1)], ["res", new Uniform([1080, 1920])]]) }); }
  set strength(v: number) { this.uniforms.get("strength")!.value = v; }
  set dir(v: number) { this.uniforms.get("dir")!.value = v; }
  setSize(w: number, h: number) { this.uniforms.get("res")!.value = [w, h]; }
}
