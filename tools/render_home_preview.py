from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "resources" / "home"
OUT = ROOT / "output" / "home_tilemap_preview.png"
VIEW_OUT = ROOT / "output" / "home_viewport_preview.png"
CANVAS = (2304, 720)


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

    floor_frames = [load("floor_wood_a", (130, 130)), load("floor_wood_b", (130, 130))]
    for row in range(4):
        for column in range(18):
            place(canvas, floor_frames[(column + row * 3) % 2], -1088 + column * 128, -270 + row * 128)

    floor_tint = Image.new("RGBA", (2304, 512), (62, 35, 24, 76))
    place(canvas, floor_tint, 0, -78)

    wall = load("wall_plaster", (130, 180))
    for column in range(18):
        place(canvas, wall, -1088 + column * 128, 282)

    place(canvas, load("window", (190, 174)), -850, 275)
    place(canvas, load("window", (190, 174)), -160, 275)
    place(canvas, load("window", (190, 174)), 610, 275)
    place(canvas, load("door", (144, 208)), 1020, 260)
    place(canvas, load("bookshelf", (126, 152)), -610, 266)
    place(canvas, load("beam_horizontal", (2304, 50)), 0, 183)
    place(canvas, load("beam_horizontal", (2304, 62)), 0, 350)
    for x in (-1120, -760, -384, 0, 384, 760, 1120):
        place(canvas, load("beam_vertical", (48, 190)), x, 275)

    place(canvas, load("rug_red", (300, 166)), -760, -178)
    place(canvas, load("rug_teal", (330, 176)), -120, -166)

    objects = [
        ("plant", 80, 52, (86, 125)),
        ("potion_cabinet", 220, 60, (132, 154)),
        ("kitchen", 570, 52, (244, 235)),
        ("bed", -940, -34, (190, 195)),
        ("firewood", 690, -52, (112, 91)),
        ("table", -150, -130, (270, 181)),
        ("player", -650, -160, (92, 184)),
        ("fireplace", 860, -178, (190, 222)),
    ]

    for name, x, baseline_y, size in sorted(objects, key=lambda item: item[2], reverse=True):
        place_baseline(canvas, shadow(round(size[0] * 0.72), max(18, round(size[1] * 0.14))), x, baseline_y + 1)
        if name == "player":
            image = Image.open(ROOT / "assets" / "resources" / "characters" / "trainer_idle.png").convert("RGBA")
            image = image.resize(size, Image.Resampling.LANCZOS)
        else:
            image = load(name, size)
        place_baseline(canvas, image, x, baseline_y)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(OUT, quality=95)
    player_center = round(CANVAS[0] * 0.5 - 650)
    viewport_left = max(0, min(CANVAS[0] - 1280, player_center - 640))
    canvas.crop((viewport_left, 0, viewport_left + 1280, 720)).convert("RGB").save(VIEW_OUT, quality=95)
    print(OUT)
    print(VIEW_OUT)


if __name__ == "__main__":
    main()
