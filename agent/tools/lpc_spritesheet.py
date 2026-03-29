#!/usr/bin/env python3
import argparse
import sys
import os
from PIL import Image

def composite_layers(layer_paths, output_path):
    """
    Composites multiple PNG images (layers) on top of each other.
    The order of layer_paths determines the z-index (first is bottom-most).
    """
    if not layer_paths:
        print("Error: No layers provided.")
        sys.exit(1)

    # Open first layer as the base
    try:
        base_layer = Image.open(layer_paths[0]).convert("RGBA")
    except Exception as e:
        print(f"Error loading base layer {layer_paths[0]}: {e}")
        sys.exit(1)

    result = Image.new("RGBA", base_layer.size, (0, 0, 0, 0))
    result.paste(base_layer, (0, 0), base_layer)

    # Paste subsequent layers on top
    for path in layer_paths[1:]:
        print(f"Applying layer: {path}")
        try:
            layer = Image.open(path).convert("RGBA")
            if layer.size != base_layer.size:
                print(f"Warning: Size mismatch. Scaling {path} from {layer.size} to {base_layer.size}")
                layer = layer.resize(base_layer.size, Image.NEAREST)
            result.paste(layer, (0, 0), layer)
        except Exception as e:
            print(f"Error applying layer {path}: {e}")
            sys.exit(1)

    # Save output
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    try:
        result.save(output_path, "PNG")
        print(f"Successfully generated composed spritesheet: {output_path}")
    except Exception as e:
        print(f"Error saving output to {output_path}: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="LPC Spritesheet Compositor Tool for Godot-Claude")
    parser.add_argument("--layers", nargs="+", 
                        help="Paths to layer PNGs, ordered from bottom to top (e.g. body.png shirt.png armor.png)")
    parser.add_argument("--out", help="Path to save the composited PNG")
    parser.add_argument("--test", action="store_true", help="Run a quick internal test")
    
    args = parser.parse_args()

    if not args.test and (not args.layers or not args.out):
        parser.error("--layers and --out are required unless --test is set")

    if args.test:
        print("Running internal test for LPC compositor...")
        try:
            # Create dummy images
            img1 = Image.new("RGBA", (64, 64), (255, 0, 0, 255))
            img2 = Image.new("RGBA", (64, 64), (0, 255, 0, 128))
            os.makedirs("/tmp/lpc_test", exist_ok=True)
            img1.save("/tmp/lpc_test/layer1.png")
            img2.save("/tmp/lpc_test/layer2.png")
            
            composite_layers(["/tmp/lpc_test/layer1.png", "/tmp/lpc_test/layer2.png"], "/tmp/lpc_test/output.png")
            print("Test passed. Output created at /tmp/lpc_test/output.png")
            sys.exit(0)
        except Exception as e:
            print(f"Test failed: {e}")
            sys.exit(1)

    for path in args.layers:
        if not os.path.exists(path):
            print(f"Error: Layer file not found -> {path}")
            sys.exit(1)

    composite_layers(args.layers, args.out)

if __name__ == "__main__":
    main()
