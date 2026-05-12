"""
OpenAI 이미지 생성 스크립트 (gpt-image-2)
"""
import argparse
import base64
import os
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI


def _find_dotenv() -> Path | None:
    """현재 파일 위치에서 tools 디렉토리까지 올라가며 .env 탐색"""
    current = Path(__file__).resolve().parent
    while True:
        candidate = current / ".env"
        if candidate.exists():
            return candidate
        if current.name == "tools" or current.parent == current:
            return None
        current = current.parent


def main():
    parser = argparse.ArgumentParser(
        description="Generate images using OpenAI gpt-image-2 model",
        epilog="""
Examples:
  python generate_image.py --prompt "아침 바다를 걷는 여성"
  python generate_image.py --prompt-file prompt.txt --output-dir ./images
  python generate_image.py --prompt "sunset beach" --output-dir ./results --output-name beach_sunset
        """,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    prompt_group = parser.add_mutually_exclusive_group(required=True)
    prompt_group.add_argument(
        "--prompt",
        type=str,
        help="Prompt text for image generation"
    )
    prompt_group.add_argument(
        "--prompt-file",
        type=str,
        help="Path to file containing the prompt text"
    )

    parser.add_argument(
        "--output-dir",
        type=str,
        default=".",
        help="Directory where the generated image is saved (default: current directory)"
    )
    parser.add_argument(
        "--output-name",
        type=str,
        default="generated_image",
        help="Output filename without extension (default: generated_image)"
    )
    parser.add_argument(
        "--api-key",
        type=str,
        help="OpenAI API key (overrides .env file)"
    )

    args = parser.parse_args()

    # Load API key
    if args.api_key:
        api_key = args.api_key
    else:
        load_dotenv(_find_dotenv())
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            parser.error("OPENAI_API_KEY not found in .env. Use --api-key to provide it.")

    # Get prompt
    if args.prompt:
        prompt = args.prompt
    else:
        with open(args.prompt_file, "r", encoding="utf-8") as f:
            prompt = f.read().strip()

    # Create output directory if needed
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Generate image
    client = OpenAI(api_key=api_key)

    result = client.images.generate(
        model="gpt-image-2-2026-04-21",
        prompt=prompt,
    )

    image_bytes = base64.b64decode(result.data[0].b64_json)

    output_path = output_dir / f"{args.output_name}.png"
    with open(output_path, "wb") as f:
        f.write(image_bytes)
    print(f"Image saved: {output_path} ({len(image_bytes)} bytes)")


if __name__ == "__main__":
    main()
