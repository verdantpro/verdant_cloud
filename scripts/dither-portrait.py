#!/usr/bin/env python3
"""Generate the two 1-bit dithered portrait plates for the sidebar.

    python3 scripts/dither-portrait.py path/to/photo.jpg

Writes quartz/static/portrait-light.png and portrait-dark.png.

WHY TWO PLATES, NOT ONE PLUS A CSS FILTER
    A 1-bit image cannot be theme-flipped with invert(): inverting the ink also
    inverts the *tones*, so the portrait comes out a photographic negative (face
    glowing white, highlights gone dark). So:

        portrait-light.png : black ink marking the DARK regions  (for a light page)
        portrait-dark.png  : white ink marking the LIGHT regions (for a dark page)

    Both are ink-on-transparency, so each sits on its theme's page background.

WHY 96px WHEN THE CSS SAYS 192px
    Deliberate. custom.scss displays these at 192px with image-rendering:pixelated
    — an exact 2x integer scale, so every dither dot becomes a clean 2x2 block and
    reads as a 1-bit graphic rather than a degraded photo. ANY NON-INTEGER SCALE
    resamples the dots and ruins the texture. If you change SIZE here, change the
    CSS to an exact multiple of it.

TONE WORK IS NOT OPTIONAL
    A dim indoor photo collapses to a black blob at 1-bit (the first attempt was
    60% ink and unreadable). The crop/gamma/contrast below lift it to ~38% ink,
    where the face actually separates from the background. A brighter photo on a
    plain background needs far less of this.

Requires pillow:  python3 -m venv venv && ./venv/bin/pip install pillow
"""

import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

SIZE = 96  # displayed at 2x (192px) — see note above
OUT = Path(__file__).resolve().parent.parent / "quartz" / "static"

# tone curve — tuned for a low-key indoor photo; loosen for a brighter source
CROP_ZOOM = 1.6  # >1 crops in, dropping background clutter
CROP_Y = 0.42  # vertical centre of the crop, as a fraction (faces sit high)
GAMMA = 0.45  # <1 brightens
CONTRAST = 2.3
AUTOCONTRAST_CUTOFF = 7


def toned(src: Path) -> Image.Image:
    img = ImageOps.exif_transpose(Image.open(src)).convert("L")

    w, h = img.size
    side = int(min(w, h) / CROP_ZOOM)
    cx, cy = w // 2, int(h * CROP_Y)
    img = img.crop((cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2))
    img = ImageOps.fit(img, (SIZE, SIZE), method=Image.LANCZOS)

    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=130, threshold=2))
    img = ImageOps.autocontrast(img, cutoff=AUTOCONTRAST_CUTOFF)
    img = img.point(lambda v: int(255 * ((v / 255) ** GAMMA)))
    return ImageEnhance.Contrast(img).enhance(CONTRAST)


def plate(gray: Image.Image, ink: tuple[int, int, int], invert: bool, dst: Path) -> None:
    """Dither `gray` and paint the resulting ink in `ink`, on transparency."""
    bw = (ImageOps.invert(gray) if invert else gray).convert("1", dither=Image.FLOYDSTEINBERG)

    rgba = Image.new("RGBA", bw.size, (0, 0, 0, 0))
    src_px, out_px = bw.load(), rgba.load()
    n = 0
    for y in range(SIZE):
        for x in range(SIZE):
            if src_px[x, y] == 0:  # dithered ink
                out_px[x, y] = (*ink, 255)
                n += 1

    rgba.save(dst, "PNG", optimize=True)
    coverage = n / (SIZE * SIZE)
    # only meaningful on the light plate: the dark plate inks the light regions,
    # so its coverage is roughly the complement and is *expected* to be high
    too_dark = not invert and coverage > 0.5
    warn = "  <-- muddy; brighten the source or lower GAMMA" if too_dark else ""
    print(f"wrote {dst.name}  {SIZE}x{SIZE}  ink {coverage:.0%}{warn}")


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)

    src = Path(sys.argv[1]).expanduser()
    if not src.exists():
        sys.exit(f"no such file: {src}")

    gray = toned(src)
    plate(gray, (0, 0, 0), False, OUT / "portrait-light.png")
    plate(gray, (255, 255, 255), True, OUT / "portrait-dark.png")


if __name__ == "__main__":
    main()
