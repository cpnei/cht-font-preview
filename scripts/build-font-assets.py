from __future__ import annotations

import hashlib
import json
import os
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen
from zipfile import ZipFile

import fontTools
from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
FONT_FILES = (
    ("chenyuluoyan", "ChenYuluoyan-2.0-Thin", "Font Select Inkline", 100, "Thin"),
    ("mantou-sans", "MantouSans-Regular", "Font Select Broadstroke", 400, "Regular"),
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as font_file:
        for chunk in iter(lambda: font_file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def rename_derivative(font: TTFont, family: str, style: str) -> None:
    names = font["name"]
    postscript = family.replace(" ", "") + "-" + style
    full_name = family if style == "Regular" else f"{family} {style}"
    preview_names = {
        1: full_name,
        2: "Regular",
        3: postscript,
        4: full_name,
        6: postscript,
        16: family,
        17: style,
    }
    # Names for the derivative are separate from the original credit and license records.
    for name_id in (*preview_names, 18, 20, 21, 22, 25):
        names.removeNames(nameID=name_id)
    for name_id, value in preview_names.items():
        names.setName(value, name_id, 3, 1, 0x409)
    if names.getDebugName(13) is None:
        names.setName("Licensed under the SIL Open Font License, Version 1.1.", 13, 3, 1, 0x409)
        names.setName("https://openfontlicense.org", 14, 3, 1, 0x409)

    if "CFF " in font:
        cff = font["CFF "].cff
        top = cff.topDictIndex[0]
        cff.fontNames[0] = postscript
        top.FamilyName = family
        top.FullName = full_name


def make_preview(font: TTFont, text: str, family: str, style: str) -> str:
    options = subset.Options()
    options.flavor = "woff2"
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    rename_derivative(font, family, style)
    font.flavor = "woff2"
    return "".join(chr(point) for point in sorted(font.getBestCmap()))


def record_file(path: Path, assets: list) -> None:
    assets.append({
        "path": path.relative_to(ROOT).as_posix(),
        "bytes": path.stat().st_size,
        "sha256": sha256(path),
    })
    print(f"Generated {path.relative_to(ROOT)} ({path.stat().st_size:,} bytes)", flush=True)


def record_face(full: Path, preview: Path, characters: str, assets: list) -> dict:
    for path in (full, preview):
        record_file(path, assets)
    return {
        "path": full.relative_to(ROOT / "public").as_posix(),
        "bytes": full.stat().st_size,
        "preview": {
            "path": preview.relative_to(ROOT / "public").as_posix(),
            "bytes": preview.stat().st_size,
            "characters": characters,
        },
    }


def build_expanded_fonts(text: str, assets: list, local_faces: dict) -> None:
    manifest = json.loads((ROOT / "assets/web-font-sources.json").read_text(encoding="utf-8"))
    cache = Path(os.environ.get("FONT_SELECT_SOURCE_CACHE", ROOT / "assets/.font-cache"))
    cache.mkdir(parents=True, exist_ok=True)
    verified = set()

    def read_source(source: dict) -> bytes:
        name = source["download"]
        path = cache / name
        download = manifest["downloads"][name]
        if name not in verified:
            if not path.exists():
                with urlopen(download["url"], timeout=120) as response:
                    data = response.read()
                if hashlib.sha256(data).hexdigest() != download["sha256"]:
                    raise RuntimeError(f"Download does not match the locked SHA-256: {name}")
                path.write_bytes(data)
            if sha256(path) != download["sha256"]:
                raise RuntimeError(f"Cached source does not match the locked SHA-256: {name}")
            verified.add(name)
        if "member" in source:
            with ZipFile(path) as archive:
                return archive.read(source["member"])
        return path.read_bytes()

    jason_credits = []
    for font in manifest["fonts"]:
        font_id, family = font["id"], font["family"]
        faces = {}
        for face in font["weights"]:
            weight, style = face["weight"], face["style"]
            source = read_source(face)
            stem = ROOT / "public/fonts" / f"{font_id}-{weight}"
            full_path = stem.with_suffix(".woff2")
            preview_path = stem.with_suffix(".preview.woff2")
            with TTFont(BytesIO(source), recalcTimestamp=False) as original:
                if original["OS/2"].usWeightClass != weight:
                    raise RuntimeError(f"Unexpected source weight for {font_id}: {weight}")
                if font_id.startswith("jason-handwriting-"):
                    jason_credits.append(original["name"].getDebugName(0))
                if original.flavor == "woff2":
                    full_path.write_bytes(source)
                else:
                    rename_derivative(original, family, style)
                    original.flavor = "woff2"
                    original.save(full_path)
            with TTFont(BytesIO(source), recalcTimestamp=False) as preview:
                characters = make_preview(preview, text, family, style)
                preview.save(preview_path)
            faces[weight] = record_face(full_path, preview_path, characters, assets)
        local_faces[font_id] = {"family": family, "files": faces}

    for filename, source in manifest["licenses"].items():
        path = ROOT / "public/licenses" / filename
        path.write_bytes(read_source(source))
        record_file(path, assets)

    # The author declares the OFL in the source README. Combine its attribution
    # and the original fonts' copyright notices with SIL's complete license text.
    author_readme = read_source({"download": "jason-readme.md"}).decode("utf-8")
    declaration = next(line for line in author_readme.splitlines() if "under SIL Open Font License" in line)
    official_ofl = read_source({"download": "sil-ofl.txt"}).decode("utf-8")
    license_body = official_ofl[official_ofl.index("This Font Software is licensed"):]
    jason_license = ROOT / "public/licenses/jason-handwriting.txt"
    jason_license.write_text(
        "\n".join(jason_credits) + '\nReserved Font Name "JasonHandwriting4" in the original #4 font.\n\n'
        + declaration + "\n" + manifest["downloads"]["jason-readme.md"]["url"] + "\n\n"
        + license_body,
        encoding="utf-8",
    )
    record_file(jason_license, assets)


samples = json.loads((ROOT / "src/samples.json").read_text(encoding="utf-8"))
pairing_sample = json.loads((ROOT / "src/pairing-sample.json").read_text(encoding="utf-8"))
preview_text = "".join(sample["text"] for sample in samples)
preview_text += pairing_sample["heading"] + pairing_sample["body"]
preview_text += "".join(chr(codepoint) for codepoint in range(0x20, 0x7F))
preview_text += "Aa臺灣"
source_lock = json.loads((ROOT / "assets.lock.json").read_text(encoding="utf-8"))
locked_sources = {asset["path"]: asset for asset in source_lock["assets"]}

assets = []
local_faces = {}
for font_id, name, preview_family, weight, style in FONT_FILES:
    source = ROOT / "assets/fonts" / f"{name}.ttf"
    source_metadata = locked_sources[source.relative_to(ROOT).as_posix()]
    if source.stat().st_size != source_metadata["bytes"] or sha256(source) != source_metadata["sha256"]:
        raise RuntimeError(f"Original font does not match assets.lock.json: {source.name}")
    full_path = ROOT / "public/fonts" / f"{name}.woff2"
    subset_path = ROOT / "public/fonts" / f"{preview_family.replace(' ', '-')}.preview.woff2"

    with TTFont(source, recalcTimestamp=False) as full_font:
        full_font.flavor = "woff2"
        full_font.save(full_path)

    with TTFont(source, recalcTimestamp=False) as preview_font:
        characters = make_preview(preview_font, preview_text, preview_family, style)
        preview_font.save(subset_path)
    local_faces[font_id] = {
        "family": preview_family,
        "files": {weight: record_face(full_path, subset_path, characters, assets)},
    }

build_expanded_fonts(preview_text, assets, local_faces)
local_metadata = ROOT / "src/local-font-assets.json"
local_metadata.write_text(json.dumps(local_faces, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
record_file(local_metadata, assets)

lock = {
    "fonttools": fontTools.__version__,
    "previewTextSource": "src/samples.json and src/pairing-sample.json plus ASCII U+0020–U+007E",
    "assets": assets,
}
(ROOT / "optimized-fonts.lock.json").write_text(
    json.dumps(lock, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
