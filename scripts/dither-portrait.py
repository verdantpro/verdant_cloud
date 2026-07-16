#!/usr/bin/env python3
"""Generate the 1-bit dithered portrait plates and favicon tiles.

    python3 scripts/dither-portrait.py path/to/photo.jpg
    python3 scripts/dither-portrait.py --icons-only   # rebuild favicons from
                                                      # existing plates

Writes:
    quartz/static/portrait-light.png   black ink on transparency (sidebar, light)
    quartz/static/portrait-dark.png    white ink on transparency (sidebar, dark)
    quartz/static/icon.png             light plate on light surface (favicon)
    quartz/static/icon-dark.png        dark plate on dark surface (favicon)

WHY TWO PLATES, NOT ONE PLUS A CSS FILTER
    A 1-bit image cannot be theme-flipped with invert(): inverting the ink also
    inverts the *tones*, so the portrait comes out a photographic negative (face
    glowing white, highlights gone dark). So:

        portrait-light.png : black ink marking the DARK regions  (for a light page)
        portrait-dark.png  : white ink marking the LIGHT regions (for a dark page)

    Both are ink-on-transparency, so each sits on its theme's page background.

WHY FAVICONS GET OPAQUE TILES
    The sidebar plates are ink-on-transparency because the page already supplies
    the ground. A tab favicon does not: black ink on a transparent 16px icon
    disappears into dark browser chrome (and white ink into light chrome). So
    each favicon composites its plate onto the site's surface colour:

        icon.png      → light plate on lightMode.light  (#f1f2ec)
        icon-dark.png → dark plate on darkMode.light    (#0e0f0e)

    Head.tsx serves them with prefers-color-scheme media queries; a bare
    (no-media) link falls back to icon.png. The favicon plugin still builds
    favicon.ico from icon.png alone (no media query for .ico).

    If the theme surface colours change in quartz.config.yaml, update
    LIGHT_BG / DARK_BG below and re-run --icons-only.

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

# Must match quartz.config.yaml theme.colors.{light,dark}Mode.light — the page
# surface each plate sits on. Favicons need the ground baked in (see docstring).
LIGHT_BG = (0xF1, 0xF2, 0xEC, 255)  # lightMode.light  #f1f2ec
DARK_BG = (0x0E, 0x0F, 0x0E, 255)  # darkMode.light   #0e0f0e

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


def favicon_tile(plate_path: Path, bg: tuple[int, int, int, int], dst: Path) -> None:
    """Composite an ink-on-transparent plate onto an opaque site-surface tile."""
    ink = Image.open(plate_path).convert("RGBA")
    if ink.size != (SIZE, SIZE):
        # never resample dither with a smooth kernel — nearest keeps 1-bit edges
        ink = ink.resize((SIZE, SIZE), Image.NEAREST)
    tile = Image.new("RGBA", (SIZE, SIZE), bg)
    tile.alpha_composite(ink)
    tile.save(dst, "PNG", optimize=True)
    print(f"wrote {dst.name}  {SIZE}x{SIZE}  on #{bg[0]:02x}{bg[1]:02x}{bg[2]:02x}")


def write_icons() -> None:
    light = OUT / "portrait-light.png"
    dark = OUT / "portrait-dark.png"
    for p in (light, dark):
        if not p.exists():
            sys.exit(f"missing {p.name} — run with a photo first, or restore the plates")
    favicon_tile(light, LIGHT_BG, OUT / "icon.png")
    favicon_tile(dark, DARK_BG, OUT / "icon-dark.png")


def main() -> None:
    if len(sys.argv) == 2 and sys.argv[1] in ("--icons-only", "-i"):
        write_icons()
        return

    if len(sys.argv) != 2:
        sys.exit(__doc__)

    src = Path(sys.argv[1]).expanduser()
    if not src.exists():
        sys.exit(f"no such file: {src}")

    gray = toned(src)
    plate(gray, (0, 0, 0), False, OUT / "portrait-light.png")
    plate(gray, (255, 255, 255), True, OUT / "portrait-dark.png")
    write_icons()


if __name__ == "__main__":
    main()
