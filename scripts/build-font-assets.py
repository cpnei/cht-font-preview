from __future__ import annotations

import hashlib
import json
from pathlib import Path

import fontTools
from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
FONT_FILES = (
    ("ChenYuluoyan-2.0-Thin", "Font Select Inkline", "Thin"),
    ("MantouSans-Regular", "Font Select Broadstroke", "Regular"),
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as font_file:
        for chunk in iter(lambda: font_file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def rename_preview(font: TTFont, family: str, style: str) -> None:
    names = font["name"]
    postscript = family.replace(" ", "") + "-" + style
    preview_names = {
        1: family + " " + style if style != "Regular" else family,
        2: "Regular",
        3: postscript,
        4: family + " " + style if style != "Regular" else family,
        6: postscript,
        16: family,
        17: style,
    }
    # Names for the derivative are separate from the original credit and license records.
    for name_id in (*preview_names, 18, 20, 21, 22, 25):
        names.removeNames(nameID=name_id)
    for name_id, value in preview_names.items():
        names.setName(value, name_id, 3, 1, 0x409)


samples = json.loads((ROOT / "src/samples.json").read_text(encoding="utf-8"))
pairing_sample = json.loads((ROOT / "src/pairing-sample.json").read_text(encoding="utf-8"))
preview_text = "".join(sample["text"] for sample in samples)
preview_text += pairing_sample["heading"] + pairing_sample["body"]
preview_text += "".join(chr(codepoint) for codepoint in range(0x20, 0x7F))
preview_text += "Aa臺灣"
source_lock = json.loads((ROOT / "assets.lock.json").read_text(encoding="utf-8"))
locked_sources = {asset["path"]: asset for asset in source_lock["assets"]}

assets = []
for name, preview_family, style in FONT_FILES:
    source = ROOT / "assets/fonts" / f"{name}.ttf"
    source_metadata = locked_sources[source.relative_to(ROOT).as_posix()]
    if source.stat().st_size != source_metadata["bytes"] or sha256(source) != source_metadata["sha256"]:
        raise RuntimeError(f"Original font does not match assets.lock.json: {source.name}")
    full_path = ROOT / "public/fonts" / f"{name}.woff2"
    subset_path = ROOT / "public/fonts" / f"{preview_family.replace(' ', '-')}.preview.woff2"

    full_font = TTFont(source, recalcTimestamp=False)
    full_font.flavor = "woff2"
    full_font.save(full_path)
    full_font.close()

    preview_font = TTFont(source, recalcTimestamp=False)
    options = subset.Options()
    options.flavor = "woff2"
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=preview_text)
    subsetter.subset(preview_font)
    rename_preview(preview_font, preview_family, style)
    preview_font.flavor = "woff2"
    preview_font.save(subset_path)
    preview_font.close()

    for output in (full_path, subset_path):
        assets.append({
            "path": output.relative_to(ROOT).as_posix(),
            "bytes": output.stat().st_size,
            "sha256": sha256(output),
        })
        print(f"Generated {output.relative_to(ROOT)} ({output.stat().st_size:,} bytes)")

lock = {
    "fonttools": fontTools.__version__,
    "previewTextSource": "src/samples.json and src/pairing-sample.json plus ASCII U+0020–U+007E",
    "assets": assets,
}
(ROOT / "optimized-fonts.lock.json").write_text(
    json.dumps(lock, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
