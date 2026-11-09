// Node shim for the camera guard: a do-nothing 2D canvas so the worlds can paint their textures without a browser.
const ctx = new Proxy({}, {
  get(o, k) {
    if (k in o) return o[k];
    if (k === "measureText") return (s) => ({ width: String(s).length * 10, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 });
    if (k === "getImageData" || k === "createImageData") return (x, y, w, h) => ({ width: w ?? x, height: h ?? y, data: new Uint8ClampedArray(4 * (w ?? x) * (h ?? y)) });
    if (k === "createLinearGradient" || k === "createRadialGradient" || k === "createPattern" || k === "createConicGradient") return () => ({ addColorStop() {} });
    if (k === "getTransform") return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
    if (k === "canvas") return undefined;
    return () => {};
  },
  set(o, k, v) { o[k] = v; return true; },
});
const canvas = () => ({ width: 2, height: 2, style: {}, getContext: () => ctx, toDataURL: () => "", addEventListener() {}, removeEventListener() {} });
if (typeof globalThis.document === "undefined") {
  globalThis.document = { createElement: (t) => (t === "canvas" ? canvas() : { style: {}, appendChild() {}, setAttribute() {} }), createElementNS: () => canvas(), fonts: { add() {}, load: async () => [] }, head: { appendChild() {} }, body: { appendChild() {} } };
  globalThis.window = globalThis; globalThis.self = globalThis;
  globalThis.OffscreenCanvas = class { constructor(w, h) { this.width = w; this.height = h; } getContext() { return ctx; } };
  globalThis.ImageData = class { constructor(d, w, h) { this.data = d; this.width = w; this.height = h; } };
}
