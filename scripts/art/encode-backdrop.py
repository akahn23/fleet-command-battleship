#!/usr/bin/env python3

import argparse
from pathlib import Path

from PIL import Image


OUTPUT_WIDTHS = (1920, 960)
AVIF_QUALITY = {1920: 52, 960: 50}
WEBP_QUALITY = 72


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("master_png")
    master_path = Path(parser.parse_args().master_png)

    with Image.open(master_path) as master:
        master = master.convert("RGB")
        output_dir = Path(__file__).resolve().parents[2] / "src/assets/backdrop"
        output_dir.mkdir(parents=True, exist_ok=True)

        for width in OUTPUT_WIDTHS:
            height = round(master.height * width / master.width)
            resized = master.resize((width, height), Image.Resampling.LANCZOS)
            assets = (
                (
                    "avif",
                    "AVIF",
                    {"quality": AVIF_QUALITY[width], "speed": 2},
                ),
                ("webp", "WEBP", {"quality": WEBP_QUALITY, "method": 6}),
            )
            for extension, image_format, options in assets:
                output_path = output_dir / f"harbour-{width}.{extension}"
                resized.save(output_path, format=image_format, **options)
                print(f"{output_path.name}: {output_path.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
