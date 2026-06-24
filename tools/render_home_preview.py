from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "resources" / "home"
OUT = ROOT / "output" / "home_tilemap_preview.png"
CANVAS = (1280, 720)


def load(name: str, size: tuple[int, int]) -> Image.Image:
    image = Image.open(ASSETS / f"{name}.png").convert("RGBA")
    return image.resize(size, Image.Resampling.LANCZOS)


def xy(x: float, y: float, width: int, height: int) -> tuple[int, int]:
    return round(CANVAS[0] * 0.5 + x - width * 0.5), round(CANVAS[1] * 0.5 - y - height * 0.5)


def place(canvas: Image.Image, image: Image.Image, x: float, y: float) -> None:
    canvas.alpha_composite(image, xy(x, y, image.width, image.height))


def place_baseline(canvas: Image.Image, image: Image.Image, x: float, baseline_y: float) -> None:
    left = round(CANVAS[0] * 0.5 + x - image.width * 0.5)
    top = round(CANVAS[1] * 0.5 - baseline_y - image.height)
    canvas.alpha_composite(image, (left, top))


def shadow(width: int, height: int) -> Image.Image:
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.ellipse((2, 2, width - 2, height - 2), fill=(24, 14, 10, 66))
    return image


def main() -> None:
    canvas = Image.new("RGBA", CANVAS, (19, 13, 11, 255))

    floor_frames = [load("floor_stone_a", (130, 130)), load("floor_stone_b", (130, 130))]
    for row in range(4):
        for column in range(10):
            place(canvas, floor_frames[(column + row * 3) % 2], -576 + column * 128, -270 + row * 128)

    floor_tint = Image.new("RGBA", (1280, 512), (91, 48, 23, 28))
    place(canvas, floor_tint, 0, -78)

    wall = load("wall_plaster", (130, 180))
    for column in range(10):
        place(canvas, wall, -576 + column * 128, 282)

    place(canvas, load("window", (190, 174)), -355, 275)
    place(canvas, load("window", (190, 174)), 340, 275)
    place(canvas, load("door", (144, 208)), -54, 260)
    place(canvas, load("bookshelf", (126, 152)), 550, 266)
    place(canvas, load("beam_horizontal", (1280, 50)), 0, 183)
    place(canvas, load("beam_horizontal", (1280, 62)), 0, 350)
    for x in (-570, -310, 0, 310, 570):
        place(canvas, load("beam_vertical", (48, 190)), x, 275)

    place(canvas, load("rug_red", (390, 238)), -325, -154)
    place(canvas, load("rug_teal", (390, 238)), 346, -135)

    objects = [
        ("plant", 38, 72, (108, 98)),
        ("potion_cabinet", 178, 66, (150, 142)),
        ("kitchen", 468, 60, (274, 264)),
        ("bed", -488, -2, (218, 224)),
        ("firewood", 292, -18, (124, 101)),
        ("table", -250, -115, (312, 209)),
        ("player", -330, -150, (112, 112)),
        ("fireplace", 438, -196, (210, 254)),
    ]

    for name, x, baseline_y, size in sorted(objects, key=lambda item: item[2], reverse=True):
        place_baseline(canvas, shadow(round(size[0] * 0.72), max(18, round(size[1] * 0.14))), x, baseline_y + 1)
        if name == "player":
            image = Image.open(ROOT / "assets" / "textures" / "characters" / "player_idle.png").convert("RGBA")
            image = image.resize(size, Image.Resampling.NEAREST)
        else:
            image = load(name, size)
        place_baseline(canvas, image, x, baseline_y)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(OUT, quality=95)
    print(OUT)


if __name__ == "__main__":
    main()
