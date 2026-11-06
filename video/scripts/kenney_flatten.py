#!/usr/bin/env python3
"""Flattens Kenney kit zips into one folder of <name>.glb files that still find their textures.

usage: kenney_flatten.py <dest> <kit.zip>...

- Kits are processed in priority order fantasy-town, nature, castle (others after). When two kits ship a model with
  the same name (castle and fantasy-town both have wall / wall-half / wall-corner / stairs-stone), the first kit wins.
- Newer Kenney kits reference an external "Textures/colormap.png" from each GLB, and different kits ship different
  colormaps under that same name. Each kit's textures are copied to <dest>/Textures/<kit>-<file> and the image URIs
  inside its GLBs are rewritten to match, so every model keeps its own kit's colours.
Standard library only.
"""
import json
import os
import struct
import sys
import zipfile

ORDER = ["fantasy-town", "nature", "castle"]


def kit_name(path):
    base = os.path.basename(path).lower()
    for k in ORDER:
        if k in base:
            return k
    return os.path.splitext(base)[0].replace("kenney_", "")


def rewrite_glb(data, prefix):
    """Returns (new_glb_bytes, [original external image uris]); URIs 'Textures/x' become 'Textures/<prefix>-x'."""
    magic, version, _ = struct.unpack_from("<III", data, 0)
    if magic != 0x46546C67:  # 'glTF'
        raise ValueError("not a GLB")
    jlen, jtype = struct.unpack_from("<II", data, 12)
    if jtype != 0x4E4F534A:  # 'JSON'
        raise ValueError("first GLB chunk is not JSON")
    gltf = json.loads(data[20:20 + jlen])
    rest = data[20 + jlen:]
    uris = []
    for img in gltf.get("images", []):
        uri = img.get("uri")
        if uri and not uri.startswith("data:"):
            uris.append(uri)
            d, f = os.path.split(uri)
            img["uri"] = f"{d}/{prefix}-{f}" if d else f"{prefix}-{f}"
    if not uris:
        return data, []
    j = json.dumps(gltf, separators=(",", ":")).encode()
    j += b" " * (-len(j) % 4)  # JSON chunk is padded with spaces to 4 bytes
    out = struct.pack("<III", magic, version, 12 + 8 + len(j) + len(rest)) + struct.pack("<II", len(j), 0x4E4F534A) + j + rest
    return out, uris


def main():
    dest, zips = sys.argv[1], sys.argv[2:]
    zips.sort(key=lambda z: ORDER.index(kit_name(z)) if kit_name(z) in ORDER else len(ORDER))
    os.makedirs(os.path.join(dest, "Textures"), exist_ok=True)
    owner = {}
    for z in zips:
        kit = kit_name(z)
        Z = zipfile.ZipFile(z)
        names = Z.namelist()
        glbs = [n for n in names if n.lower().endswith(".glb") and "/" in n]
        added = clashes = 0
        textures = set()
        for n in glbs:
            folder, file = n.rsplit("/", 1)
            model = file[:-4]
            if model in owner:
                clashes += 1
                continue
            data, uris = rewrite_glb(Z.read(n), kit)
            for u in uris:
                src = f"{folder}/{u}"
                if src not in names:
                    raise SystemExit(f"kenney: ERROR {kit}: {file} needs {u}, which is not in the zip")
                textures.add((src, os.path.join(dest, os.path.dirname(u), f"{kit}-{os.path.basename(u)}")))
            with open(os.path.join(dest, file), "wb") as fh:
                fh.write(data)
            owner[model] = kit
            added += 1
        for src, out in sorted(textures):
            os.makedirs(os.path.dirname(out), exist_ok=True)
            with open(out, "wb") as fh:
                fh.write(Z.read(src))
        print(f"kenney: {kit}: {added} models, {len(textures)} textures"
              + (f", {clashes} name clashes kept from an earlier kit" if clashes else ""))
    print(f"kenney: {len(owner)} models in {dest}")


if __name__ == "__main__":
    main()
