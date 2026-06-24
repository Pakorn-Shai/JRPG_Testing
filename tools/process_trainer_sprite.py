from __future__ import annotations

from pathlib import Path

from PIL import Image

from process_home_tileset import directory_meta, write_sprite


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art_source" / "trainer_chibi_sheet.png"
OUTPUT = ROOT / "assets" / "resources" / "characters"


def crop_alpha(image: Image.Image, padding: int = 12) -> Image.Image:
    bbox = image.getbbox()
    if bbox is None:
        return image
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(image.width, bbox[2] + padding)
    bottom = min(image.height, bbox[3] + padding)
    return image.crop((left, top, right, bottom))


def main() -> None:
    sheet = Image.open(SOURCE).convert("RGBA")
    cell_width = sheet.width // 4

    OUTPUT.mkdir(parents=True, exist_ok=True)
    directory_meta(ROOT / "assets" / "resources")
    directory_meta(OUTPUT)

    for index in range(4):
        frame = sheet.crop(
            (
                index * cell_width,
                0,
                (index + 1) * cell_width,
                sheet.height,
            )
        )
        frame = crop_alpha(frame)
        frame.thumbnail((180, 220), Image.Resampling.LANCZOS)
        write_sprite(OUTPUT / f"trainer_walk_{index}.png", frame)

    write_sprite(OUTPUT / "trainer_idle.png", crop_alpha(
        sheet.crop((0, 0, cell_width, sheet.height))
    ).resize((104, 220), Image.Resampling.LANCZOS))


if __name__ == "__main__":
    main()
