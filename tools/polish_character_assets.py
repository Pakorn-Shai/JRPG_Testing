from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
CHAR_DIR = ROOT / "assets" / "textures" / "characters"


def crop_grid_frame(sheet: Image.Image, col: int, row: int, size: int = 64) -> Image.Image:
    x = col * size
    y = row * size
    return sheet.crop((x, y, x + size, y + size)).convert("RGBA")


def save_png(path: Path, image: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)
    print(f"wrote {path.relative_to(ROOT).as_posix()}")


def sprite_meta(path: Path, uuid: str) -> dict:
    name = path.stem
    return {
        "ver": "1.0.27",
        "importer": "image",
        "imported": True,
        "uuid": uuid,
        "files": [".json", ".png"],
        "subMetas": {
            "6c48a": {
                "importer": "texture",
                "uuid": f"{uuid}@6c48a",
                "displayName": name,
                "id": "6c48a",
                "name": "texture",
                "userData": {
                    "wrapModeS": "clamp-to-edge",
                    "wrapModeT": "clamp-to-edge",
                    "imageUuidOrDatabaseUri": uuid,
                    "isUuid": True,
                    "visible": False,
                    "minfilter": "linear",
                    "magfilter": "linear",
                    "mipfilter": "none",
                    "anisotropy": 0,
                },
                "ver": "1.0.22",
                "imported": True,
                "files": [".json"],
                "subMetas": {},
            },
            "f9941": {
                "importer": "sprite-frame",
                "uuid": f"{uuid}@f9941",
                "displayName": name,
                "id": "f9941",
                "name": "spriteFrame",
                "userData": {
                    "trimThreshold": 1,
                    "rotated": False,
                    "offsetX": 0,
                    "offsetY": 0,
                    "trimX": 0,
                    "trimY": 0,
                    "width": 64,
                    "height": 64,
                    "rawWidth": 64,
                    "rawHeight": 64,
                    "borderTop": 0,
                    "borderBottom": 0,
                    "borderLeft": 0,
                    "borderRight": 0,
                    "packable": True,
                    "pixelsToUnit": 100,
                    "pivotX": 0.5,
                    "pivotY": 0.5,
                    "meshType": 0,
                    "isUuid": True,
                    "imageUuidOrDatabaseUri": f"{uuid}@6c48a",
                    "atlasUuid": "",
                    "trimType": "none",
                },
                "ver": "1.0.12",
                "imported": True,
                "files": [".json"],
                "subMetas": {},
            },
        },
        "userData": {
            "type": "sprite-frame",
            "fixAlphaTransparencyArtifacts": False,
            "hasAlpha": True,
            "redirect": f"{uuid}@6c48a",
        },
    }


def write_meta(path: Path, uuid: str) -> None:
    meta_path = path.with_suffix(path.suffix + ".meta")
    if meta_path.exists():
        uuid = json.loads(meta_path.read_text(encoding="utf-8")).get("uuid", uuid)

    data = sprite_meta(path, uuid)
    meta_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"wrote {meta_path.relative_to(ROOT).as_posix()}")


def draw_chief_sprite() -> Image.Image:
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    outline = (42, 31, 24, 255)
    robe_dark = (84, 62, 42, 255)
    robe_mid = (139, 103, 64, 255)
    robe_light = (190, 154, 103, 255)
    skin = (229, 181, 132, 255)
    hair = (236, 229, 202, 255)
    shadow = (40, 28, 24, 160)
    staff = (148, 104, 47, 255)
    staff_hi = (232, 190, 86, 255)

    draw.ellipse((20, 51, 45, 59), fill=shadow)
    draw.line((13, 17, 13, 55), fill=outline, width=3)
    draw.line((14, 17, 14, 55), fill=staff, width=1)
    draw.ellipse((9, 10, 17, 20), fill=staff_hi, outline=outline)

    draw.polygon([(24, 24), (40, 24), (48, 55), (17, 55)], fill=outline)
    draw.polygon([(26, 25), (39, 25), (45, 54), (20, 54)], fill=robe_mid)
    draw.polygon([(25, 27), (31, 26), (29, 53), (20, 54)], fill=robe_dark)
    draw.polygon([(36, 26), (41, 28), (44, 53), (34, 53)], fill=robe_light)
    draw.line((32, 28, 32, 54), fill=outline, width=1)

    draw.ellipse((21, 7, 44, 31), fill=outline)
    draw.ellipse((23, 8, 42, 30), fill=hair)
    draw.ellipse((25, 12, 40, 31), fill=skin)
    draw.polygon([(24, 24), (40, 24), (38, 43), (27, 43)], fill=hair)
    draw.rectangle((28, 30, 37, 47), fill=hair)
    draw.point((29, 21), fill=outline)
    draw.point((36, 21), fill=outline)
    draw.line((30, 26, 35, 26), fill=(120, 74, 52, 255), width=1)

    draw.rectangle((21, 32, 26, 47), fill=robe_light)
    draw.rectangle((39, 32, 44, 47), fill=robe_dark)
    draw.rectangle((25, 52, 31, 57), fill=outline)
    draw.rectangle((35, 52, 41, 57), fill=outline)

    return img


def main() -> None:
    sheet = Image.open(CHAR_DIR / "player_sheet.png").convert("RGBA")
    side_walk = [crop_grid_frame(sheet, col, 0) for col in range(4)]
    front_idle = crop_grid_frame(sheet, 0, 3)

    save_png(CHAR_DIR / "player_idle.png", side_walk[0])
    write_meta(CHAR_DIR / "player_idle.png", "85d18c38-b636-44cb-ba66-d41830d2a81c")
    frame_uuids = [
        "7a0ec6fd-e2fd-4dff-b83a-5d5dcff4a101",
        "7a0ec6fd-e2fd-4dff-b83a-5d5dcff4a102",
        "7a0ec6fd-e2fd-4dff-b83a-5d5dcff4a103",
        "7a0ec6fd-e2fd-4dff-b83a-5d5dcff4a104",
    ]
    for index, frame in enumerate(side_walk):
        path = CHAR_DIR / f"player_walk_{index}.png"
        save_png(path, frame)
        write_meta(path, frame_uuids[index])

    save_png(CHAR_DIR / "player_front_idle.png", front_idle)
    write_meta(CHAR_DIR / "player_front_idle.png", "7a0ec6fd-e2fd-4dff-b83a-5d5dcff4a105")

    save_png(CHAR_DIR / "npc_chief.png", draw_chief_sprite())
    write_meta(CHAR_DIR / "npc_chief.png", "fdaaad96-7a90-41d0-952a-4919986959cf")


if __name__ == "__main__":
    main()
