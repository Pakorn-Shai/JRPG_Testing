from __future__ import annotations

import json
import uuid
from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "resources" / "home"
FURNITURE_ATLAS = Path(
    r"C:\Users\Acer\.codex\generated_images\019efa4c-9929-79a3-a615-1539e1dc21b1"
    r"\ig_0fece10f71286567016a3bfebdfe048191a6a50e4b175b4795.png"
)
TILE_ATLAS = Path(
    r"C:\Users\Acer\.codex\generated_images\019efa4c-9929-79a3-a615-1539e1dc21b1"
    r"\ig_0fece10f71286567016a3bff172da081919ab73c8d3d05b1e5.png"
)

FURNITURE_NAMES = [
    "bed",
    "table",
    "potion_cabinet",
    "kitchen",
    "fireplace",
    "plant",
    "rug_red",
    "rug_teal",
    "door",
    "window",
    "bookshelf",
    "firewood",
]

TILE_NAMES = [
    "floor_stone_a",
    "floor_stone_b",
    "floor_wood_a",
    "floor_wood_b",
    "wall_plaster",
    "beam_horizontal",
    "beam_vertical",
    "wall_brick",
]


def directory_meta(path: Path) -> None:
    meta_path = path.with_suffix(".meta")
    if meta_path.exists():
        return
    meta = {
        "ver": "1.2.0",
        "importer": "directory",
        "imported": True,
        "uuid": str(uuid.uuid4()),
        "files": [],
        "subMetas": {},
        "userData": {},
    }
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")


def sprite_meta(path: Path, image_uuid: str, width: int, height: int) -> dict:
    name = path.stem
    half_w = width * 0.5
    half_h = height * 0.5
    return {
        "ver": "1.0.27",
        "importer": "image",
        "imported": True,
        "uuid": image_uuid,
        "files": [".json", ".png"],
        "subMetas": {
            "6c48a": {
                "importer": "texture",
                "uuid": f"{image_uuid}@6c48a",
                "displayName": name,
                "id": "6c48a",
                "name": "texture",
                "userData": {
                    "wrapModeS": "clamp-to-edge",
                    "wrapModeT": "clamp-to-edge",
                    "imageUuidOrDatabaseUri": image_uuid,
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
                "uuid": f"{image_uuid}@f9941",
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
                    "width": width,
                    "height": height,
                    "rawWidth": width,
                    "rawHeight": height,
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
                    "imageUuidOrDatabaseUri": f"{image_uuid}@6c48a",
                    "atlasUuid": "",
                    "trimType": "none",
                    "vertices": {
                        "rawPosition": [
                            -half_w,
                            -half_h,
                            0,
                            half_w,
                            -half_h,
                            0,
                            -half_w,
                            half_h,
                            0,
                            half_w,
                            half_h,
                            0,
                        ],
                        "indexes": [0, 1, 2, 2, 1, 3],
                        "uv": [0, height, width, height, 0, 0, width, 0],
                        "nuv": [0, 0, 1, 0, 0, 1, 1, 1],
                        "minPos": [-half_w, -half_h, 0],
                        "maxPos": [half_w, half_h, 0],
                    },
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
            "redirect": f"{image_uuid}@6c48a",
        },
    }


def write_sprite(path: Path, image: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)
    meta_path = path.with_suffix(path.suffix + ".meta")
    image_uuid = str(uuid.uuid4())
    if meta_path.exists():
        image_uuid = json.loads(meta_path.read_text(encoding="utf-8"))["uuid"]
    meta_path.write_text(
        json.dumps(sprite_meta(path, image_uuid, image.width, image.height), indent=2),
        encoding="utf-8",
    )
    print(f"wrote {path.relative_to(ROOT).as_posix()} {image.size}")


def remove_magenta(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            dominance = min(r, b) - g
            if r > 210 and b > 190 and g < 90:
                pixels[x, y] = (r, g, b, 0)
            elif dominance > 70 and r > 150 and b > 140:
                alpha = max(0, min(255, int(255 * (1 - (dominance - 70) / 120))))
                pixels[x, y] = (min(r, g + 50), g, min(b, g + 50), min(a, alpha))
    return image


def crop_alpha(image: Image.Image, padding: int = 8) -> Image.Image:
    bbox = image.getbbox()
    if bbox is None:
        return image
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(image.width, bbox[2] + padding)
    bottom = min(image.height, bbox[3] + padding)
    return image.crop((left, top, right, bottom))


def keep_largest_component(image: Image.Image, alpha_threshold: int = 20) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A")
    width, height = image.size
    seen = bytearray(width * height)
    components: list[list[int]] = []

    for start in range(width * height):
        if seen[start] or alpha.getpixel((start % width, start // width)) <= alpha_threshold:
            continue
        queue = deque([start])
        seen[start] = 1
        component: list[int] = []
        while queue:
            index = queue.popleft()
            component.append(index)
            x = index % width
            y = index // width
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if nx < 0 or nx >= width or ny < 0 or ny >= height:
                    continue
                neighbor = ny * width + nx
                if seen[neighbor] or alpha.getpixel((nx, ny)) <= alpha_threshold:
                    continue
                seen[neighbor] = 1
                queue.append(neighbor)
        components.append(component)

    if not components:
        return image

    keep = set(max(components, key=len))
    pixels = image.load()
    for index in range(width * height):
        if index not in keep:
            x = index % width
            y = index // width
            r, g, b, _ = pixels[x, y]
            pixels[x, y] = (r, g, b, 0)
    return image


def split_atlas(image: Image.Image, columns: int, rows: int) -> list[Image.Image]:
    cell_w = image.width // columns
    cell_h = image.height // rows
    return [
        image.crop(
            (
                column * cell_w,
                row * cell_h,
                (column + 1) * cell_w,
                (row + 1) * cell_h,
            )
        )
        for row in range(rows)
        for column in range(columns)
    ]


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    directory_meta(ROOT / "assets" / "resources")
    directory_meta(OUTPUT)

    furniture = Image.open(FURNITURE_ATLAS).convert("RGBA")
    for name, cell in zip(FURNITURE_NAMES, split_atlas(furniture, 4, 3), strict=True):
        cleaned = remove_magenta(cell)
        if name in {"bed", "potion_cabinet", "fireplace", "plant", "rug_red", "rug_teal", "door", "window", "bookshelf", "firewood"}:
            cleaned = keep_largest_component(cleaned)
        cleaned = crop_alpha(cleaned, padding=10)
        write_sprite(OUTPUT / f"{name}.png", cleaned)

    tiles = Image.open(TILE_ATLAS).convert("RGB")
    for name, cell in zip(TILE_NAMES, split_atlas(tiles, 4, 2), strict=True):
        tile = cell.resize((256, 256), Image.Resampling.LANCZOS).convert("RGBA")
        write_sprite(OUTPUT / f"{name}.png", tile)


if __name__ == "__main__":
    main()
