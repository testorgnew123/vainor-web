#!/usr/bin/env python3
"""Generate public/favicon.ico for the VAINOR brand (V-chevron on obsidian)."""
from PIL import Image, ImageDraw

CANVAS = 256  # draw large, downsample for clean anti-aliasing
OBSIDIAN = "#181A20"
GOLD = "#D4A435"

img = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Solid obsidian rounded-square backing (keeps the mark visible on any browser tab bg)
pad = 8
draw.rounded_rectangle([pad, pad, CANVAS - pad, CANVAS - pad], radius=48, fill=OBSIDIAN)

# Gold V-chevron, same proportions as the Logo.tsx SVG path, scaled to this canvas
scale = (CANVAS - 2 * pad) / 40 * 0.82
offset = CANVAS / 2 - (20 * scale)
pts = [(4, 6), (11, 6), (20, 26), (29, 6), (36, 6), (20, 36)]
scaled = [(offset + x * scale, offset + y * scale) for x, y in pts]
draw.polygon(scaled, fill=GOLD)

img.save("public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print("Wrote public/favicon.ico")
