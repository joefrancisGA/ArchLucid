#!/usr/bin/env python3
"""Download a shields.io SVG badge for merged line %% (from Cobertura root line-rate)."""
from __future__ import annotations

import argparse
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from coverage_cobertura import parse_cobertura


def _main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Fetch shields.io SVG for merged Cobertura line %%.")
    parser.add_argument(
        "cobertura",
        type=Path,
        help="Path to Cobertura.xml",
    )
    parser.add_argument(
        "svg_out",
        type=Path,
        help="Output path for SVG (parent dirs created).",
    )
    args = parser.parse_args(argv)

    summary = parse_cobertura(args.cobertura)
    if summary is None or summary.root_line_pct is None:
        print(f"Could not read merged line %% from {args.cobertura!r}.", file=sys.stderr)
        return 2

    pct = summary.root_line_pct
    msg = f"{pct:.2f}%"
    color = _color_for_pct(pct)
    # https://img.shields.io/badge/<LABEL>-<MESSAGE>-<COLOR>
    label_enc = urllib.parse.quote("coverage", safe="")
    message_enc = urllib.parse.quote(msg, safe="")
    color_enc = urllib.parse.quote(color, safe="")
    url = f"https://img.shields.io/badge/{label_enc}-{message_enc}-{color_enc}"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "ArchLucid-ci-coverage-badge/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read()
    except urllib.error.HTTPError as e:
        print(f"shields.io HTTP error: {e}", file=sys.stderr)
        return 2
    except urllib.error.URLError as e:
        print(f"shields.io fetch failed: {e}", file=sys.stderr)
        return 2

    args.svg_out.parent.mkdir(parents=True, exist_ok=True)
    args.svg_out.write_bytes(body)
    print(f"Wrote {args.svg_out} ({len(body)} bytes) for merged line {pct:.2f}%.")
    return 0


def _color_for_pct(line_pct: float) -> str:
    """shields.io named color token (bands aligned with approximate CI posture)."""

    if line_pct + 1e-9 >= 95.0:
        return "brightgreen"

    if line_pct + 1e-9 >= 79.0:
        return "green"

    if line_pct + 1e-9 >= 75.0:
        return "yellowgreen"

    return "yellow"


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
