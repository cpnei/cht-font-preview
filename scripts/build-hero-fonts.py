"""Lock compatible headline glyphs from each catalog font for same-origin delivery."""
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from subprocess import check_output
from urllib.parse import urlencode, urljoin
from urllib.request import Request, urlopen
import json
import re

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

from font_subsets import make_preview

ROOT = Path(__file__).resolve().parents[1]
HEADLINE = json.loads((ROOT / "src/site-headline.json").read_text())
POINTS = set(map(ord, HEADLINE["lead"] + HEADLINE["end"]))
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
OUTPUT = ROOT / "public/hero-fonts"
OUTPUT.mkdir(exist_ok=True)
LOCK_PATH = ROOT / "assets/hero-fonts.lock.json"
previous = json.loads(LOCK_PATH.read_text()) if LOCK_PATH.exists() else {}
layout_failures = previous.get("layoutFailures", {})
fonts = json.loads(check_output(
    ["node", "--input-type=module", "-e",
     "import {fonts} from './src/fonts.ts'; console.log(JSON.stringify(fonts));"], cwd=ROOT
))


@lru_cache(maxsize=1024)
def fetch(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": UA}), timeout=15) as response:
                return response.read()
        except OSError:
            if attempt == 2:
                raise


def range_covers(point, declaration):
    if not declaration:
        return True
    for token in declaration.upper().split(","):
        low, _, high = token.strip().removeprefix("U+").partition("-")
        if "?" in low:
            high = low.replace("?", "F")
            low = low.replace("?", "0")
        if int(low, 16) <= point <= int(high or low, 16):
            return True
    return False


def covers_weight(descriptor, weight):
    aliases = {"normal": "400", "bold": "700"}
    values = [int(aliases.get(token, token)) for token in descriptor.split()]
    return values[0] <= weight <= values[-1]


def stylesheet(loader, weight):
    if loader["kind"] == "google":
        family = loader["family"] + (f":wght@{weight}" if loader["axis"] else "")
        return "https://fonts.googleapis.com/css2?" + urlencode({
            "family": family, "text": "".join(map(chr, sorted(POINTS))), "display": "swap",
        })
    source = loader["stylesheet"]
    return source if isinstance(source, str) else source[str(weight)]


def usable_faces(css, family, weight, stretch):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    for block in reversed(re.findall(r"@font-face\s*\{([^}]+)\}", css, re.I)):
        declarations = dict(re.findall(r"([a-z-]+)\s*:\s*([^;]+)", block))
        declarations = {key: value.strip() for key, value in declarations.items()}
        if (declarations.get("font-family", "").strip("\"'") != family
                or declarations.get("font-style", "normal") != "normal"
                or not covers_weight(declarations.get("font-weight", "400"), weight)
                or declarations.get("font-stretch", "normal") != stretch):
            continue
        url = re.search(r"url\(\s*[\"']?([^\"')]+)[\"']?\s*\)", declarations.get("src", ""))
        if url:
            yield url.group(1).strip(), declarations.get("unicode-range")


def record(path, data):
    return {"path": path, "bytes": len(data), "sha256": sha256(data).hexdigest()}


def remote_candidate(font, weight, family, stretch):
    loader = font["loader"]
    css_url = stylesheet(loader, weight)
    css = fetch(css_url)
    remaining = set(POINTS)
    pending = []
    for source, codepoints in usable_faces(css.decode(), loader["family"], weight, stretch):
        matches = {point for point in remaining if range_covers(point, codepoints)}
        if not matches:
            continue
        url = urljoin(css_url, source)
        data = fetch(url)
        with TTFont(BytesIO(data), recalcTimestamp=False) as upstream:
            cmap = upstream.getBestCmap()
            matches = {point for point in matches if cmap.get(point) not in (None, ".notdef")}
            if not matches:
                continue
            if "fvar" in upstream:
                axes = {axis.axisTag: weight if axis.axisTag == "wght" else axis.defaultValue
                        for axis in upstream["fvar"].axes}
                instantiateVariableFont(upstream, axes, inplace=True)
            characters = make_preview(upstream, "".join(map(chr, sorted(matches))), family, "Regular", compact=True)
            buffer = BytesIO()
            upstream.save(buffer)
        covered = set(map(ord, characters)) & matches
        if covered:
            pending.append((url, data, buffer.getvalue(), sorted(covered)))
            remaining -= covered
        if not remaining:
            break
    if remaining:
        return None, [], "".join(map(chr, sorted(remaining)))
    faces, sources = [], []
    for index, (url, data, binary, covered) in enumerate(pending):
        path = OUTPUT / f"{font['id']}-{weight}-{index + 1}.woff2"
        path.write_bytes(binary)
        faces.append({"path": f"hero-fonts/{path.name}", "range": ",".join(f"U+{point:X}" for point in covered)})
        sources.append({**record(path.relative_to(ROOT).as_posix(), binary), "url": url,
                        "sourceSha256": sha256(data).hexdigest()})
    return faces, sources, None


def evaluate(font):
    font_id = font["id"]
    font_source = font["loader"]
    default = font["defaultWeight"]
    failures = []
    for weight in sorted(font["weights"], key=lambda w: (abs(w - default), w)):
        layout_reason = layout_failures.get(font_id, {}).get(str(weight))
        if layout_reason:
            failures.append({"weight": weight, "reason": layout_reason})
            continue
        entry = {"id": font_id, "weight": weight}
        if font_source["kind"] == "local":
            preview = font_source["files"][str(weight)]["preview"]
            with TTFont(ROOT / "public" / preview["path"], lazy=True) as local:
                cmap = local.getBestCmap()
                missing = "".join(chr(point) for point in sorted(POINTS) if cmap.get(point) in (None, ".notdef"))
            if not missing:
                return entry, [], {"id": font_id, "weight": weight, "license": font["licensePath"]}
        else:
            family = f"Font Select Hero {font_id}"
            stretch = font_source.get("stretch", "normal")
            faces, sources, missing = remote_candidate(font, weight, family, stretch)
            if not missing:
                return {**entry, "family": family, "stretch": stretch, "faces": faces}, sources, {
                    "id": font_id, "weight": weight, "license": font["licensePath"],
                    "stylesheet": stylesheet(font_source, weight),
                    "stylesheetSha256": sha256(fetch(stylesheet(font_source, weight))).hexdigest(),
                }
        failures.append({"weight": weight, "reason": f"缺字 {missing}"})
    return None, [], {"id": font_id, "excluded": failures}


with ThreadPoolExecutor(max_workers=8) as executor:
    results = list(executor.map(evaluate, fonts))
candidates = [candidate for candidate, _, _ in results if candidate]
assets = [asset for _, files, _ in results for asset in files]
manifest = ROOT / "src/hero-fonts.json"
manifest.write_text(json.dumps(candidates, indent=2, ensure_ascii=False) + "\n")
assets.append(record(manifest.relative_to(ROOT).as_posix(), manifest.read_bytes()))
asset_paths = {asset["path"] for asset in assets}
for path in OUTPUT.glob("*.woff2"):
    if path.relative_to(ROOT).as_posix() not in asset_paths:
        path.unlink()
LOCK_PATH.write_text(json.dumps({
    "headline": HEADLINE, "layoutFailures": layout_failures,
    "audit": [audit for _, _, audit in results], "assets": assets,
}, indent=2, ensure_ascii=False) + "\n")
print(f"Prepared {len(candidates)}/{len(fonts)} candidates from actual glyph coverage.")
