from fontTools import subset
from fontTools.ttLib import TTFont


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


def make_preview(font: TTFont, text: str, family: str, style: str, *, compact=False) -> str:
    options = subset.Options()
    options.flavor = "woff2"
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    if compact:
        options.hinting = False
        options.desubroutinize = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    rename_derivative(font, family, style)
    if compact and "CFF " in font:
        top = font["CFF "].cff.topDictIndex[0]
        if hasattr(top, "FDArray"):
            # CID glyphs get their Private dictionaries from FDArray.
            top.rawDict.pop("Private", None)
            top.__dict__.pop("Private", None)
    font.flavor = "woff2"
    return "".join(chr(point) for point in sorted(font.getBestCmap()))
