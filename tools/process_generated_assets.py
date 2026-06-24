from pathlib import Path
from PIL import Image, ImageDraw
import polish_character_assets


ROOT = Path(__file__).resolve().parents[1]
GEN = Path(r"C:\Users\Acer\.codex\generated_images\019ef4c0-0e9d-7a82-9962-03713564af1e")

SOURCES = [
    GEN / "ig_0e4847c8d36644af016a3a900e701c8191a4b4e99acd8f89f4.png",
    GEN / "ig_0e4847c8d36644af016a3a904f8f64819195da5553f86f5c72.png",
    GEN / "ig_0e4847c8d36644af016a3a908539148191b62160825bbc9b47.png",
    GEN / "ig_0e4847c8d36644af016a3a90d01cb48191a716b64456ced36f.png",
    GEN / "ig_0e4847c8d36644af016a3a911d985481919246f818f0f3ac1e.png",
    GEN / "ig_0e4847c8d36644af016a3a915eb15c8191acd824baa1f681c0.png",
    GEN / "ig_091cab8f8841be09016a3aa095ee6c8191b20bea1915522eb6.png",
]


def cover_resize(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    img = img.convert("RGBA")
    src_w, src_h = img.size
    dst_w, dst_h = size
    scale = max(dst_w / src_w, dst_h / src_h)
    new_size = (round(src_w * scale), round(src_h * scale))
    img = img.resize(new_size, Image.Resampling.LANCZOS)
    left = (new_size[0] - dst_w) // 2
    top = (new_size[1] - dst_h) // 2
    return img.crop((left, top, left + dst_w, top + dst_h))


def fit_resize(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    img = img.convert("RGBA")
    img.thumbnail(size, Image.Resampling.LANCZOS)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    pos = ((size[0] - img.size[0]) // 2, (size[1] - img.size[1]) // 2)
    out.alpha_composite(img, pos)
    return out


def remove_key(img: Image.Image, key: tuple[int, int, int], threshold: int = 90) -> Image.Image:
    img = img.convert("RGBA")
    pix = img.load()
    key_r, key_g, key_b = key
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = pix[x, y]
            dist = ((r - key_r) ** 2 + (g - key_g) ** 2 + (b - key_b) ** 2) ** 0.5
            key_dominates = False
            if key == (255, 0, 255):
                key_dominates = r > 135 and b > 135 and g < 120
            elif key == (0, 255, 0):
                key_dominates = g > 135 and r < 120 and b < 120

            if dist < threshold or key_dominates:
                pix[x, y] = (r, g, b, 0)
            elif dist < threshold * 1.8:
                alpha = int(255 * (dist - threshold) / (threshold * 0.8))
                if key == (255, 0, 255):
                    r = min(r, max(g, 55))
                    b = min(b, max(g, 70))
                elif key == (0, 255, 0):
                    g = min(g, max(r, b, 70))
                pix[x, y] = (r, g, b, min(a, alpha))
    return img


def dialogue_box() -> Image.Image:
    size = (1000, 200)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(out)
    rect = (8, 8, size[0] - 8, size[1] - 8)
    draw.rounded_rectangle(rect, radius=24, fill=(8, 8, 12, 205), outline=(222, 178, 78, 255), width=5)
    draw.rounded_rectangle((18, 18, size[0] - 18, size[1] - 18), radius=18, outline=(108, 78, 36, 210), width=2)
    return out


def save(img: Image.Image, rel: str) -> None:
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)
    print(path.relative_to(ROOT).as_posix(), img.size, img.mode)


def main() -> None:
    save(cover_resize(Image.open(SOURCES[0]), (1280, 720)), "assets/textures/backgrounds/bg_home.png")
    save(cover_resize(Image.open(SOURCES[1]), (1920, 720)), "assets/textures/backgrounds/bg_village.png")
    save(cover_resize(Image.open(SOURCES[2]), (1280, 720)), "assets/textures/backgrounds/bg_forest.png")
    save(cover_resize(Image.open(SOURCES[6]), (1280, 720)), "assets/textures/backgrounds/bg_title.png")

    player = remove_key(Image.open(SOURCES[3]), (255, 0, 255), threshold=120)
    player_sheet = cover_resize(player, (256, 256))
    save(player_sheet, "assets/textures/characters/player_sheet.png")
    save(player_sheet.crop((0, 0, 64, 64)), "assets/textures/characters/player_idle.png")

    chief = remove_key(Image.open(SOURCES[4]), (255, 0, 255), threshold=120)
    save(fit_resize(chief, (96, 128)), "assets/textures/characters/npc_chief.png")

    slime = remove_key(Image.open(SOURCES[5]), (0, 255, 0), threshold=120)
    save(fit_resize(slime, (64, 64)), "assets/textures/monsters/monster_slime.png")

    save(dialogue_box(), "assets/textures/ui/ui_dialogue_box.png")
    polish_character_assets.main()


if __name__ == "__main__":
    main()
